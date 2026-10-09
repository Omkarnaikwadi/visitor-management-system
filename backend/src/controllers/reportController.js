const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

const getVisitsData = async (filters) => {
  let query = `
    SELECT v.id, v.check_in, v.check_out, v.badge_number, v.purpose, v.status,
           vis.name as visitor_name, vis.phone as visitor_phone, vis.email as visitor_email, vis.company,
           h.name as host_name, h.department, h.email as host_email
    FROM visits v
    JOIN visitors vis ON v.visitor_id = vis.id
    JOIN hosts h ON v.host_id = h.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.start_date) {
    params.push(filters.start_date);
    query += ` AND v.check_in >= $${params.length}`;
  }
  if (filters.end_date) {
    params.push(filters.end_date + ' 23:59:59');
    query += ` AND v.check_in <= $${params.length}`;
  }
  if (filters.status) {
    params.push(filters.status);
    query += ` AND v.status = $${params.length}`;
  }
  if (filters.department) {
    params.push(filters.department);
    query += ` AND h.department = $${params.length}`;
  }
  if (filters.host_id) {
    params.push(filters.host_id);
    query += ` AND v.host_id = $${params.length}`;
  }

  query += ' ORDER BY v.check_in DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

const exportCSV = async (req, res) => {
  try {
    const visits = await getVisitsData(req.query);
    
    const fields = [
      { label: 'Visit ID', value: 'id' },
      { label: 'Visitor Name', value: 'visitor_name' },
      { label: 'Visitor Phone', value: 'visitor_phone' },
      { label: 'Visitor Email', value: 'visitor_email' },
      { label: 'Company', value: 'company' },
      { label: 'Host Name', value: 'host_name' },
      { label: 'Department', value: 'department' },
      { label: 'Purpose', value: 'purpose' },
      { label: 'Badge Number', value: 'badge_number' },
      { label: 'Check In', value: 'check_in' },
      { label: 'Check Out', value: 'check_out' },
      { label: 'Status', value: 'status' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(visits);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=visits_report_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportPDF = async (req, res) => {
  try {
    const visits = await getVisitsData(req.query);
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=visits_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Visitor Management System', { align: 'center' });
    doc.fontSize(14).text('Visits Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Filters info
    if (req.query.start_date || req.query.end_date) {
      doc.fontSize(10).text(`Period: ${req.query.start_date || 'Start'} to ${req.query.end_date || 'Now'}`);
    }
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    const colWidths = [120, 80, 100, 100, 80, 100, 80];
    const headers = ['Visitor', 'Phone', 'Host', 'Purpose', 'Badge', 'Check In', 'Status'];
    
    doc.fontSize(9).font('Helvetica-Bold');
    let xPos = 30;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
      xPos += colWidths[i];
    });

    // Draw header line
    doc.moveTo(30, tableTop + 15).lineTo(780, tableTop + 15).stroke();

    // Table rows
    doc.font('Helvetica').fontSize(8);
    let yPos = tableTop + 25;

    visits.forEach((visit, index) => {
      if (yPos > 520) {
        doc.addPage();
        yPos = 50;
      }

      xPos = 30;
      const rowData = [
        visit.visitor_name,
        visit.visitor_phone,
        `${visit.host_name}\n${visit.department}`,
        visit.purpose?.substring(0, 30) || '',
        visit.badge_number,
        new Date(visit.check_in).toLocaleString(),
        visit.status.replace('_', ' ')
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell || '-', xPos, yPos, { width: colWidths[i], align: 'left' });
        xPos += colWidths[i];
      });

      yPos += 30;
    });

    // Summary
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Total Visits: ${visits.length}`, 30);
    doc.text(`Checked In: ${visits.filter(v => v.status === 'checked_in').length}`);
    doc.text(`Checked Out: ${visits.filter(v => v.status === 'checked_out').length}`);

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDepartments = async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT department FROM hosts WHERE department IS NOT NULL ORDER BY department');
    res.json(result.rows.map(r => r.department));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { exportCSV, exportPDF, getDepartments };
