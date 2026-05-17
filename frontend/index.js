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
import { registerBackgroundNotificationOpenedHandler } from './src/services/fcmService';

// ─── FCM Background / Killed-state message handler ───────────────────────────
// This headless task runs in the background even when the app is killed.
// Do NOT do UI work here; this is for silent data processing only.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
  // You can update local state, trigger a local notification via Notifee here.
  // Example: store the incoming booking ID in AsyncStorage for later pickup.
});

// ─── Register tap handler for background-state notifications ─────────────────
// This fires when the user taps a notification while the app was in background.
registerBackgroundNotificationOpenedHandler();

// ─── Register the React Native app ───────────────────────────────────────────
AppRegistry.registerComponent(appName, () => App);
