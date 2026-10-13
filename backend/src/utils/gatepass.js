const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const LETTERHEAD = path.join(__dirname, '../../uploads/letterhead.png');
const GATE_PASSES_DIR = path.join(__dirname, '../../uploads/gatepasses');

if (!fs.existsSync(GATE_PASSES_DIR)) fs.mkdirSync(GATE_PASSES_DIR, { recursive: true });

const formatDate = (date) =>
  new Date(date).toLocaleString('en-IN', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

const generateGatePassPDF = (visitData) => {
  return new Promise((resolve, reject) => {
    const {
      visitor_name, visitor_phone, visitor_email, company,
      host_name, department, purpose, badge_number,
      check_in, id_type, id_number, photo_url, qr_code, parking_slot
    } = visitData;

    const filename = `gatepass_${badge_number}.pdf`;
    const filepath = path.join(GATE_PASSES_DIR, filename);

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const W = 595.28; // A4 width in points
    const MARGIN = 40;
    const CONTENT_W = W - MARGIN * 2;

    // ── Letterhead (full width, top ~180pt) ──────────────────────────────
    if (fs.existsSync(LETTERHEAD)) {
      doc.image(LETTERHEAD, 0, 0, { width: W });
    }

    let y = 195; // start content below letterhead

    // ── Title bar ────────────────────────────────────────────────────────
    doc.rect(MARGIN, y, CONTENT_W, 28).fill('#1e3a5f');
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
      .text('VISITOR GATE PASS', MARGIN, y + 7, { width: CONTENT_W, align: 'center' });
    y += 38;

    // ── Badge + Date row ─────────────────────────────────────────────────
    doc.fillColor('#555555').fontSize(9).font('Helvetica')
      .text(`Badge No: ${badge_number}`, MARGIN, y)
      .text(`Date: ${formatDate(check_in)}`, MARGIN, y, { width: CONTENT_W, align: 'right' });
    y += 18;

    // ── Divider ──────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    y += 12;

    // ── Visitor photo (right side) ───────────────────────────────────────
    const PHOTO_SIZE = 80;
    const PHOTO_X = W - MARGIN - PHOTO_SIZE;
    const PHOTO_Y = y;

    if (photo_url) {
      const absPhoto = path.join(__dirname, '../../', photo_url);
      if (fs.existsSync(absPhoto)) {
        doc.save()
          .roundedRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, 4)
          .clip()
          .image(absPhoto, PHOTO_X, PHOTO_Y, { width: PHOTO_SIZE, height: PHOTO_SIZE, cover: [PHOTO_SIZE, PHOTO_SIZE] })
          .restore();
        doc.roundedRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, 4)
          .strokeColor('#1e3a5f').lineWidth(1).stroke();
      }
    }

    // ── Visitor details (left side) ──────────────────────────────────────
    const COL_W = CONTENT_W - PHOTO_SIZE - 15;

    const field = (label, value, yPos) => {
      if (!value) return yPos;
      doc.fillColor('#888888').fontSize(8).font('Helvetica').text(label.toUpperCase(), MARGIN, yPos);
      doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica-Bold').text(value, MARGIN, yPos + 10, { width: COL_W });
      return yPos + 26;
    };

    y = field('Visitor Name', visitor_name, y);
    y = field('Mobile Number', visitor_phone, y);
    if (visitor_email) y = field('Email', visitor_email, y);
    if (company) y = field('Company / Organisation', company, y);
    y += 4;

    // ── Divider ──────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    y += 12;

    // ── Visit details ────────────────────────────────────────────────────
    doc.fillColor('#1e3a5f').fontSize(10).font('Helvetica-Bold').text('VISIT DETAILS', MARGIN, y);
    y += 16;

    y = field('Purpose of Visit', purpose, y);
    y = field('Host / Meeting With', host_name, y);
    y = field('Department', department, y);
    if (id_type && id_number) y = field(`ID Proof (${id_type.toUpperCase()})`, id_number, y);
    if (parking_slot) y = field('Parking Slot', `🅿️  ${parking_slot}`, y);
    y += 4;

    // ── Divider ──────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    y += 12;

    // ── QR Code + instructions ───────────────────────────────────────────
    const QR_SIZE = 90;
    const QR_X = W - MARGIN - QR_SIZE;

    doc.fillColor('#1e3a5f').fontSize(10).font('Helvetica-Bold').text('CHECK-OUT INSTRUCTIONS', MARGIN, y);
    y += 14;
    doc.fillColor('#444444').fontSize(9).font('Helvetica')
      .text('• Present this gate pass at the exit gate for check-out.', MARGIN, y, { width: CONTENT_W - QR_SIZE - 10 });
    y += 12;
    doc.text('• This pass is valid for the date of issue only.', MARGIN, y, { width: CONTENT_W - QR_SIZE - 10 });
    y += 12;
    doc.text('• Do not share this pass with others.', MARGIN, y, { width: CONTENT_W - QR_SIZE - 10 });

    // QR code (base64 data URL → buffer)
    if (qr_code && qr_code.startsWith('data:image')) {
      const qrBuffer = Buffer.from(qr_code.split(',')[1], 'base64');
      const qrY = y - 26;
      doc.image(qrBuffer, QR_X, qrY, { width: QR_SIZE, height: QR_SIZE });
      doc.fillColor('#888888').fontSize(7).font('Helvetica')
        .text('Scan for check-out', QR_X, qrY + QR_SIZE + 2, { width: QR_SIZE, align: 'center' });
    }

    y += 30;

    // ── Footer ───────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).strokeColor('#1e3a5f').lineWidth(1).stroke();
    y += 8;
    doc.fillColor('#888888').fontSize(8).font('Helvetica')
      .text('This is a system-generated gate pass. For assistance, contact the reception desk.', MARGIN, y, {
        width: CONTENT_W, align: 'center'
      });

    doc.end();

    stream.on('finish', () => resolve({ filepath, filename }));
    stream.on('error', reject);
  });
};

module.exports = { generateGatePassPDF };
