const axios = require('axios');

const sendOTP = async (phone, otp) => {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('91') ? digits.slice(2) : digits;

  const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
    params: {
      authorization: process.env.FAST2SMS_API_KEY,
      variables_values: otp,
      route: 'otp',
      numbers: number,
    },
    headers: { 'cache-control': 'no-cache' }
  });

  if (!response.data.return) {
    throw new Error(response.data.message || 'Fast2SMS failed to send OTP');
  }
};

module.exports = { sendOTP };
