importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDpxHyshozLw-uS9E2NhpLwTfHJGDw3WTY',
  authDomain: 'vms-system-6960c.firebaseapp.com',
  projectId: 'vms-system-6960c',
  storageBucket: 'vms-system-6960c.firebasestorage.app',
  messagingSenderId: '387631446189',
  appId: '1:387631446189:web:3a9228c3a9320fc32aee24',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = 'VMS Notification', body = '' } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    icon: '/vite.svg',
  });
});
