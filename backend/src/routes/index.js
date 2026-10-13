const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

const authController = require('../controllers/authController');
const visitorController = require('../controllers/visitorController');
const hostController = require('../controllers/hostController');
const preRegController = require('../controllers/preRegistrationController');
const dashboardController = require('../controllers/dashboardController');
const reportController = require('../controllers/reportController');
const otpController = require('../controllers/otpController');

// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/register', auth, adminOnly, authController.register);
router.post('/auth/register/self', authController.selfRegister);
router.get('/auth/profile', auth, authController.getProfile);
router.post('/auth/fcm-token', auth, async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return res.status(400).json({ error: 'fcm_token required' });
  const pool = require('../config/db');
  await pool.query('UPDATE users SET fcm_token=$1 WHERE id=$2', [fcm_token, req.user.id]);
  res.json({ message: 'FCM token saved' });
});

// Receptionist management (admin only)
router.get('/receptionists', auth, adminOnly, authController.getReceptionists);
router.patch('/receptionists/:id/toggle', auth, adminOnly, authController.toggleActive);
router.patch('/receptionists/:id/reset-password', auth, adminOnly, authController.resetPassword);

// TEMP: one-time migration endpoint — REMOVE AFTER USE
router.get('/run-migration', async (req, res) => {
  try {
    const pool = require('../config/db');
    await pool.query(`ALTER TABLE hosts ADD COLUMN IF NOT EXISTS fcm_token TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`);
    res.json({ message: 'Migration applied successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OTP routes (public - no auth needed)
router.post('/otp/send', otpController.sendOTPHandler);
router.post('/otp/verify', otpController.verifyOTPHandler);

// Visitor/Visit routes
router.post('/visitors/checkin', auth, visitorController.checkIn);
router.put('/visitors/checkout/:id', auth, visitorController.checkOut);
router.post('/visitors/scan-qr', auth, visitorController.scanQRCode);
router.get('/visitors/returning', auth, visitorController.checkReturningVisitor);
router.get('/visits/active', auth, visitorController.getActiveVisits);
router.get('/visits', auth, visitorController.getAllVisits);
router.get('/visits/:id', auth, visitorController.getVisitById);

// Host routes
router.get('/hosts', auth, hostController.getAll);
router.get('/hosts/:id', auth, hostController.getById);
router.post('/hosts', auth, adminOnly, hostController.create);
router.put('/hosts/:id', auth, adminOnly, hostController.update);
router.delete('/hosts/:id', auth, adminOnly, hostController.remove);
router.post('/hosts/:id/fcm-token', auth, hostController.saveFcmToken);

// Pre-registration routes
router.post('/pre-registrations', preRegController.create); // Public for self-registration
router.get('/pre-registrations', auth, preRegController.getAll);
router.put('/pre-registrations/:id', auth, preRegController.updateStatus);
router.get('/pre-registrations/phone/:phone', auth, preRegController.getByPhone);

// Dashboard routes
router.get('/dashboard/stats', auth, dashboardController.getStats);
router.get('/dashboard/recent', auth, dashboardController.getRecentVisits);
router.get('/dashboard/by-department', auth, dashboardController.getVisitsByDepartment);
router.get('/dashboard/trend', auth, dashboardController.getVisitsTrend);

// Report routes
router.get('/reports/csv', auth, reportController.exportCSV);
router.get('/reports/pdf', auth, reportController.exportPDF);
router.get('/reports/departments', auth, reportController.getDepartments);

module.exports = router;
