let admin = null;

const getAdmin = () => {
  if (admin) return admin;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT not configured');
    return null;
  }
  try {
    const firebaseAdmin = require('firebase-admin');
    if (!firebaseAdmin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) });
    }
    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    console.error('[FCM] Init error:', err.message);
    return null;
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  const a = getAdmin();
  if (!a || !fcmToken) return;
  try {
    const result = await a.messaging().send({ token: fcmToken, notification: { title, body }, data, android: { priority: 'high' }, apns: { payload: { aps: { sound: 'default' } } } });
    console.log('[FCM] Push sent:', result);
  } catch (err) {
    console.error('[FCM] Push error:', err.message);
  }
};

module.exports = { sendPushNotification };
