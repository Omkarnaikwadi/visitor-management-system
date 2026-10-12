const axios = require('axios');

const sendOTP = async (phone, otp) => {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('91') ? digits.slice(2) : digits;

  if (!process.env.FAST2SMS_API_KEY) throw new Error('FAST2SMS_API_KEY not configured');

  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        variables_values: otp,
        route: 'otp',
        numbers: number,
      },
      headers: { 'cache-control': 'no-cache' }
    });

    console.log('Fast2SMS response:', JSON.stringify(response.data));

    if (!response.data.return) {
      throw new Error(response.data.message || 'Fast2SMS failed to send OTP');
    }
  } catch (err) {
    if (err.response) {
      console.error('Fast2SMS error response:', JSON.stringify(err.response.data));
      throw new Error(err.response.data?.message || `Fast2SMS error: ${err.response.status}`);
    }
    throw err;
  }
};

module.exports = { sendOTP };
