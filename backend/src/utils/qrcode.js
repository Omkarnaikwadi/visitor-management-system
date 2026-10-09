const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
};

module.exports = { generateQRCode };
