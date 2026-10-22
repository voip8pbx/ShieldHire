/**
 * @format
 * Application entry point.
 *
 * Firebase background message handler MUST be registered here (outside
 * any React component) so it runs even in the killed / background state.
 */

import './src/utils/expoGoShims';
import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';
import { name as appName } from './app.json';

// ─── FCM Background / Killed-state message handler ───────────────────────────
try {
  const messaging = require('@react-native-firebase/messaging').default;
  if (messaging) {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
    });
  }
} catch (e) {
  // Gracefully handled when running in Expo Go or environments without native Firebase
  console.log('[FCM] Background messaging not active in current environment');
}

// ─── Register tap handler for background-state notifications ─────────────────
try {
  const { registerBackgroundNotificationOpenedHandler } = require('./src/services/fcmService');
  registerBackgroundNotificationOpenedHandler();
} catch (e) {
  console.log('[FCM] registerBackgroundNotificationOpenedHandler:', e?.message || e);
}

// ─── Register the React Native / Expo app ────────────────────────────────────
registerRootComponent(App);

