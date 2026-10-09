const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_USER) return; // Skip if not configured
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }
};

const notifyHost = async (hostEmail, visitorName, purpose) => {
  const subject = 'New Visitor Arrival';
  const html = `
    <h2>Visitor Notification</h2>
    <p><strong>${visitorName}</strong> has arrived to meet you.</p>
    <p><strong>Purpose:</strong> ${purpose}</p>
    <p>Please proceed to the reception area.</p>
  `;
  await sendEmail(hostEmail, subject, html);
};

module.exports = { sendEmail, notifyHost };
