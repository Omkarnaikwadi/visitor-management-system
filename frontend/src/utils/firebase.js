import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging = null;

const getFirebaseMessaging = () => {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return null;
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
};

export const requestFCMToken = async () => {
  try {
    const m = getFirebaseMessaging();
    if (!m) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { console.log('[FCM] Permission denied'); return null; }
    const token = await getToken(m, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    console.log('[FCM] Token obtained');
    return token;
  } catch (err) {
    console.error('[FCM] Token error:', err.message);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  const m = getFirebaseMessaging();
  if (!m) return () => {};
  return onMessage(m, callback);
};
