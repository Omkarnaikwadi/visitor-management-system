const pool = require('../config/db');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await pool.query(
      `INSERT INTO otp_verifications (phone, otp, expires_at, verified)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $3, verified = false, created_at = CURRENT_TIMESTAMP`,
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent to your email address' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
  }
};

const verifyOTPHandler = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    const result = await pool.query('SELECT * FROM otp_verifications WHERE phone = $1', [email]);

    if (result.rows.length === 0) return res.status(400).json({ error: 'OTP not found. Please request a new one.' });

    const record = result.rows[0];
    if (record.verified) return res.status(400).json({ error: 'OTP already used. Please request a new one.' });
    if (new Date() > new Date(record.expires_at)) return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

    await pool.query('UPDATE otp_verifications SET verified = true WHERE phone = $1', [email]);
    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendOTPHandler, verifyOTPHandler };
