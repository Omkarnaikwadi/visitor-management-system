const twilio = require('twilio');
const fs = require('fs');
const { generateGatePassPDF } = require('./gatepass');

const getClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error('Twilio credentials not configured');
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

const formatE164 = (phone) => {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('91') ? digits : `91${digits}`;
  return `+${normalized}`;
};

const sendGatePass = async (phone, visitData) => {
  const client = getClient();
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
  const to = `whatsapp:${formatE164(phone)}`;

  const { filepath, filename } = await generateGatePassPDF(visitData);
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const mediaUrl = `${backendUrl}/uploads/gatepasses/${filename}`;

  await client.messages.create({
    from,
    to,
    body: `✅ *Your Gate Pass is ready!*\n\nWelcome, *${visitData.visitor_name}*.\nBadge: *${visitData.badge_number}*\n\nPlease find your gate pass PDF attached. Show it at the exit gate during check-out.`,
    mediaUrl: [mediaUrl]
  });

  setTimeout(() => fs.unlink(filepath, () => {}), 5 * 60 * 1000);
};

module.exports = { sendGatePass };
