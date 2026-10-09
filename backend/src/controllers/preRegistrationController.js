const pool = require('../config/db');
const { sendEmail } = require('../utils/email');

const create = async (req, res) => {
  try {
    const { visitor_name, visitor_email, visitor_phone, visitor_company, host_id, purpose, expected_date, expected_time } = req.body;
    
    const result = await pool.query(
      `INSERT INTO pre_registrations (visitor_name, visitor_email, visitor_phone, visitor_company, host_id, purpose, expected_date, expected_time, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [visitor_name, visitor_email, visitor_phone, visitor_company, host_id, purpose, expected_date, expected_time, req.user?.id]
    );

    // Send confirmation email to visitor
    if (visitor_email) {
      const html = `
        <h2>Visit Pre-Registration Confirmed</h2>
        <p>Your visit has been pre-registered for ${expected_date}.</p>
        <p>Please bring a valid ID for verification.</p>
      `;
      sendEmail(visitor_email, 'Visit Pre-Registration Confirmation', html);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, h.name as host_name, h.department
      FROM pre_registrations pr
      JOIN hosts h ON pr.host_id = h.id
      WHERE pr.expected_date >= CURRENT_DATE
      ORDER BY pr.expected_date, pr.expected_time
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE pre_registrations SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pre-registration not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getByPhone = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, h.name as host_name
      FROM pre_registrations pr
      JOIN hosts h ON pr.host_id = h.id
      WHERE pr.visitor_phone = $1 AND pr.status = 'pending' AND pr.expected_date = CURRENT_DATE
    `, [req.params.phone]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { create, getAll, updateStatus, getByPhone };
