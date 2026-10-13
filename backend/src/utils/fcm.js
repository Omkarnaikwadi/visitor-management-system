const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let initialized = false;

const getMessagingClient = () => {
  if (initialized) return getMessaging();
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT not configured');
    return null;
  }
  try {
    console.log('[FCM] Initializing Firebase Admin...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('[FCM] Service account project_id:', serviceAccount.project_id);
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    initialized = true;
    console.log('[FCM] Firebase Admin initialized successfully');
    return getMessaging();
  } catch (err) {
    console.error('[FCM] Init error:', err.message);
    return null;
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  console.log('[FCM] sendPushNotification called');
  console.log('[FCM] Token present:', !!fcmToken);
  console.log('[FCM] Title:', title);

  const messaging = getMessagingClient();
  if (!messaging) {
    console.error('[FCM] Messaging client not available — skipping push');
    return;
  }
  if (!fcmToken) {
    console.error('[FCM] No FCM token provided — skipping push');
    return;
  }
  try {
    const result = await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    console.log('[FCM] Push sent successfully:', result);
  } catch (err) {
    console.error('[FCM] Push error code:', err.code);
    console.error('[FCM] Push error message:', err.message);
  }
};

module.exports = { sendPushNotification };
