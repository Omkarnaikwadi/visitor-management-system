const axios = require('axios');

const sendOTP = async (phone, otp) => {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('91') ? digits.slice(2) : digits;

  if (!process.env.FAST2SMS_API_KEY) throw new Error('FAST2SMS_API_KEY not configured');

  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      message: `Your VMS verification code is ${otp}. Valid for 10 minutes. Do not share it.`,
      language: 'english',
      flash: 0,
      numbers: number,
    }, {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    console.log('Fast2SMS response:', JSON.stringify(response.data));

    if (!response.data.return) {
      throw new Error(response.data.message || 'Fast2SMS failed to send OTP');
    }
  } catch (err) {
    if (err.response) {
      console.error('Fast2SMS error:', JSON.stringify(err.response.data));
      throw new Error(err.response.data?.message || `Fast2SMS error: ${err.response.status}`);
    }
    throw err;
  }
};

module.exports = { sendOTP };
