const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const QR_SECRET = process.env.JWT_SECRET || 'vms-qr-secret';

const generateQRCode = async (data) => {
  try {
    // Sign QR payload with JWT — no expiry at generation, invalidated by DB status on scan
    const token = jwt.sign({ ...data, type: 'visit_qr' }, QR_SECRET);
    return await QRCode.toDataURL(token);
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
};

const verifyQRToken = (token) => {
  try {
    return jwt.verify(token, QR_SECRET);
  } catch {
    return null;
  }
};

module.exports = { generateQRCode, verifyQRToken };
