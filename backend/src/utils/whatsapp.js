const twilio = require('twilio');
const fs = require('fs');
const { generateGatePassPDF } = require('./gatepass');

const getClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error('Twilio credentials not configured');
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

const formatWhatsApp = (phone) => {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('91') ? digits : `91${digits}`;
  return `whatsapp:+${normalized}`;
};

const sendOTP = async (phone, otp) => {
  const client = getClient();
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: formatWhatsApp(phone),
    body: `Your VMS verification code is: *${otp}*\nThis code expires in 10 minutes. Do not share it with anyone.`
  });
};

const sendGatePass = async (phone, visitData) => {
  const client = getClient();
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
  const to = formatWhatsApp(phone);

  // Generate PDF
  const { filepath, filename } = await generateGatePassPDF(visitData);

  // Twilio needs a publicly accessible URL to send media.
  // We serve /uploads from the backend, so build the public URL.
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const mediaUrl = `${backendUrl}/uploads/gatepasses/${filename}`;

  await client.messages.create({
    from,
    to,
    body: `✅ *Your Gate Pass is ready!*\n\n` +
          `Welcome, *${visitData.visitor_name}*.\n` +
          `Badge: *${visitData.badge_number}*\n\n` +
          `Please find your gate pass PDF attached. Show it at the exit gate during check-out.`,
    mediaUrl: [mediaUrl]
  });

  // Clean up PDF after 5 minutes
  setTimeout(() => fs.unlink(filepath, () => {}), 5 * 60 * 1000);
};

module.exports = { sendOTP, sendGatePass };
