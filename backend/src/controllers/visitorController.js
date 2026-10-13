const pool = require('../config/db');
const { generateQRCode, verifyQRToken } = require('../utils/qrcode');
const { notifyHost, sendGatePassEmail } = require('../utils/email');
const { notifyVisitorArrival, notifyVisitorCheckout, notifyStatsUpdate } = require('../config/socket');
const { cache } = require('../config/redis');
const { sendPushNotification } = require('../utils/fcm');

// Assign next available parking slot
const assignParkingSlot = async (client) => {
  const result = await client.query(
    `SELECT id, slot_number FROM parking_slots WHERE is_occupied = false ORDER BY slot_number LIMIT 1`
  );
  return result.rows[0] || null;
};

const checkIn = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, email, phone, company, host_id, purpose, id_type, id_number, photo_base64, pre_registration_id, skip_otp } = req.body;

    // OTP check — skip if fast-track approved
    if (!skip_otp) {
      const otpResult = await client.query('SELECT verified FROM otp_verifications WHERE phone = $1', [email]);
      if (otpResult.rows.length === 0 || !otpResult.rows[0].verified) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Email not verified. Please complete OTP verification.' });
      }
    }

    const photoUrl = photo_base64 || null;

    // Create or update visitor
    let visitorResult = await client.query('SELECT id FROM visitors WHERE phone = $1', [phone]);
    let visitorId;
    if (visitorResult.rows.length === 0) {
      visitorResult = await client.query(
        'INSERT INTO visitors (name, email, phone, company, id_type, id_number, photo_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [name, email, phone, company, id_type, id_number, photoUrl]
      );
      visitorId = visitorResult.rows[0].id;
    } else {
      visitorId = visitorResult.rows[0].id;
      await client.query(
        'UPDATE visitors SET name=$1, email=$2, company=$3, photo_url=COALESCE($4, photo_url) WHERE id=$5',
        [name, email, company, photoUrl, visitorId]
      );
    }

    const badgeNumber = `VIS-${Date.now().toString(36).toUpperCase()}`;

    // Assign parking slot
    const slot = await assignParkingSlot(client);

    // Create visit
    const visitResult = await client.query(
      `INSERT INTO visits (visitor_id, host_id, purpose, badge_number, status, parking_slot, created_by)
       VALUES ($1,$2,$3,$4,'checked_in',$5,$6) RETURNING *`,
      [visitorId, host_id, purpose, badgeNumber, slot?.slot_number || null, req.user.id]
    );
    const visit = visitResult.rows[0];

    // Mark slot occupied
    if (slot) {
      await client.query(
        'UPDATE parking_slots SET is_occupied=true, visit_id=$1 WHERE id=$2',
        [visit.id, slot.id]
      );
    }

    // Generate JWT-signed QR
    const qrCode = await generateQRCode({ visitId: visit.id, visitorId, badge: badgeNumber });
    const qrToken = require('jsonwebtoken').sign(
      { visitId: visit.id, visitorId, badge: badgeNumber, type: 'visit_qr' },
      process.env.JWT_SECRET || 'vms-qr-secret'
    );
    await client.query('UPDATE visits SET qr_code=$1, qr_token=$2 WHERE id=$3', [qrCode, qrToken, visit.id]);

    if (pre_registration_id) {
      await client.query("UPDATE pre_registrations SET status='completed' WHERE id=$1", [pre_registration_id]);
    }

    const hostResult = await client.query('SELECT email, name, department, fcm_token FROM hosts WHERE id=$1', [host_id]);
    const host = hostResult.rows[0];
    console.log('[CheckIn] Host found:', host?.name);
    console.log('[CheckIn] Host fcm_token present:', !!host?.fcm_token);

    await client.query('COMMIT');

    await cache.del('dashboard_stats');
    await cache.del('active_visits');

    const responseData = {
      ...visit, qr_code: qrCode, visitor_name: name, visitor_phone: phone,
      visitor_email: email, company, photo_url: photoUrl,
      host_name: host?.name, department: host?.department,
      parking_slot: slot?.slot_number || null, id_type, id_number
    };

    notifyVisitorArrival(host_id, responseData);
    notifyStatsUpdate();

    // FCM push to host
    if (host?.fcm_token) {
      sendPushNotification(
        host.fcm_token,
        '🔔 New Visitor Arrived',
        `${name} is here to meet you. Purpose: ${purpose}`,
        { visitId: String(visit.id) }
      );
    }

    // Email notification to host
    if (host?.email) notifyHost(host.email, name, purpose);

    // Gate pass PDF → email + WhatsApp
    const { generateGatePassPDF } = require('../utils/gatepass');
    const { sendGatePass: sendWhatsAppGatePass } = require('../utils/whatsapp');
    generateGatePassPDF(responseData)
      .then(async ({ filepath }) => {
        const tasks = [];
        if (email) tasks.push(sendGatePassEmail(email, responseData, filepath).catch(e => console.error('[GatePass] Email error:', e.message)));
        if (phone) tasks.push(sendWhatsAppGatePass(phone, responseData).catch(e => console.error('[GatePass] WhatsApp error:', e.message)));
        await Promise.all(tasks);
      })
      .catch(err => console.error('[GatePass] PDF error:', err.message));

    res.status(201).json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

const checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE visits SET check_out=CURRENT_TIMESTAMP, status='checked_out' WHERE id=$1 RETURNING *`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });

    // Release parking slot
    await pool.query('UPDATE parking_slots SET is_occupied=false, visit_id=NULL WHERE visit_id=$1', [id]);

    await cache.del('dashboard_stats');
    await cache.del('active_visits');
    notifyVisitorCheckout(id, result.rows[0]);
    notifyStatsUpdate();

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if visitor is returning (visited in last 30 days) → fast-track
const checkReturningVisitor = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const result = await pool.query(`
      SELECT vis.*, v.check_in, v.host_id, v.purpose
      FROM visitors vis
      JOIN visits v ON v.visitor_id = vis.id
      WHERE vis.email = $1
        AND v.status = 'checked_out'
        AND v.check_in > NOW() - INTERVAL '30 days'
      ORDER BY v.check_in DESC LIMIT 1
    `, [email]);

    if (result.rows.length > 0) {
      res.json({ returning: true, visitor: result.rows[0] });
    } else {
      res.json({ returning: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify JWT-signed QR on scan
const scanQRCode = async (req, res) => {
  try {
    const { qr_data } = req.body;
    let parsed;

    // Try JWT first (new dynamic QR)
    const verified = verifyQRToken(qr_data);
    if (verified?.visitId) {
      parsed = verified;
    } else {
      // Fallback: old plain JSON QR
      try { parsed = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data; } catch {
        return res.status(400).json({ error: 'Invalid QR code' });
      }
    }

    if (parsed.visitId) {
      const result = await pool.query(`
        SELECT v.*, vis.name as visitor_name, vis.phone as visitor_phone, vis.company, vis.photo_url,
               h.name as host_name, h.department
        FROM visits v
        JOIN visitors vis ON v.visitor_id = vis.id
        JOIN hosts h ON v.host_id = h.id
        WHERE v.id = $1
      `, [parsed.visitId]);

      if (result.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });

      const visit = result.rows[0];
      // Dynamic QR validity check — reject if already checked out
      if (visit.status === 'checked_out') {
        return res.status(400).json({ error: 'This gate pass has already been used for check-out.', type: 'expired' });
      }

      res.json({ type: 'visit', data: visit });
    } else if (parsed.visitorId) {
      const result = await pool.query('SELECT * FROM visitors WHERE id=$1', [parsed.visitorId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
      res.json({ type: 'visitor', data: result.rows[0] });
    } else {
      res.status(400).json({ error: 'Invalid QR code format' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getActiveVisits = async (req, res) => {
  try {
    const cached = await cache.get('active_visits');
    if (cached) return res.json(cached);
    const result = await pool.query(`
      SELECT v.*, vis.name as visitor_name, vis.phone as visitor_phone, vis.company, vis.photo_url,
             h.name as host_name, h.department
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN hosts h ON v.host_id = h.id
      WHERE v.status = 'checked_in'
      ORDER BY v.check_in DESC
    `);
    await cache.set('active_visits', result.rows, 30);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllVisits = async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;
    let query = `
      SELECT v.*, vis.name as visitor_name, vis.phone as visitor_phone, vis.company, vis.photo_url,
             h.name as host_name, h.department
      FROM visits v JOIN visitors vis ON v.visitor_id = vis.id JOIN hosts h ON v.host_id = h.id WHERE 1=1
    `;
    const params = [];
    if (start_date) { params.push(start_date); query += ` AND v.check_in >= $${params.length}`; }
    if (end_date) { params.push(end_date); query += ` AND v.check_in <= $${params.length}`; }
    if (status) { params.push(status); query += ` AND v.status = $${params.length}`; }
    query += ' ORDER BY v.check_in DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVisitById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, vis.name as visitor_name, vis.phone as visitor_phone, vis.email as visitor_email,
             vis.company, vis.photo_url, h.name as host_name, h.department, h.email as host_email
      FROM visits v JOIN visitors vis ON v.visitor_id = vis.id JOIN hosts h ON v.host_id = h.id
      WHERE v.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkIn, checkOut, getActiveVisits, getAllVisits, getVisitById, scanQRCode, checkReturningVisitor };
