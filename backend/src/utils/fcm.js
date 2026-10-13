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
      console.log('[FCM] Initializing Firebase Admin...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('[FCM] Service account project_id:', serviceAccount.project_id);
      firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) });
      console.log('[FCM] Firebase Admin initialized successfully');
    }
    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    console.error('[FCM] Init error:', err.message);
    console.error('[FCM] Init stack:', err.stack);
    return null;
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  console.log('[FCM] sendPushNotification called');
  console.log('[FCM] Token present:', !!fcmToken);
  console.log('[FCM] Token (first 20 chars):', fcmToken?.substring(0, 20));
  console.log('[FCM] Title:', title);
  console.log('[FCM] Body:', body);

  const a = getAdmin();
  if (!a) {
    console.error('[FCM] Firebase Admin not initialized — skipping push');
    return;
  }
  if (!fcmToken) {
    console.error('[FCM] No FCM token provided — skipping push');
    return;
  }
  try {
    const result = await a.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } }
    });
    console.log('[FCM] Push sent successfully:', result);
  } catch (err) {
    console.error('[FCM] Push error code:', err.code);
    console.error('[FCM] Push error message:', err.message);
  }
};

module.exports = { sendPushNotification };
