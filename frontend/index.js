/**
 * @format
 * Application entry point.
 *
 * Firebase background message handler MUST be registered here (outside
 * any React component) so it runs even in the killed / background state.
 */

import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// ─── FCM Background / Killed-state message handler ───────────────────────────
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
  });
} catch (e) {
  console.warn('[FCM] setBackgroundMessageHandler failed:', e);
}

// ─── Register tap handler for background-state notifications ─────────────────
try {
  const { registerBackgroundNotificationOpenedHandler } = require('./src/services/fcmService');
  registerBackgroundNotificationOpenedHandler();
} catch (e) {
  console.warn('[FCM] registerBackgroundNotificationOpenedHandler failed:', e);
}

// ─── Register the React Native app ───────────────────────────────────────────
AppRegistry.registerComponent(appName, () => App);
