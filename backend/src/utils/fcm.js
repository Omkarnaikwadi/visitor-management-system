const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let initialized = false;

const getMessagingClient = () => {
  if (initialized) return getMessaging();
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    initialized = true;
    return getMessaging();
  } catch (err) {
    return null;
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  const messaging = getMessagingClient();
  if (!messaging || !fcmToken) return;
  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    // silently ignore push failures
  }
};

module.exports = { sendPushNotification };
