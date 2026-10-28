/**
 * @format
 * Application entry point.
 *
 * Firebase background message handler MUST be registered here (outside
 * any React component) so it runs even in the killed / background state.
 */

import './src/utils/expoGoShims';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, Text, ScrollView, AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';

// ─── Safely load App component ───────────────────────────────────────────────
let RootApp = null;
try {
  RootApp = require('./App').default;
} catch (e) {
  console.error('[CRITICAL] Failed to load ./App:', e?.message || e);
  console.error('[CRITICAL] Stack trace:', e?.stack);
  RootApp = function ErrorFallback() {
    return (
      <View style={{ flex: 1, backgroundColor: '#070708', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>ShieldHire App Init</Text>
        <Text style={{ color: '#FF453A', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>{String(e?.message || e)}</Text>
        <ScrollView style={{ maxHeight: 200, width: '100%' }}>
          <Text style={{ color: '#888', fontSize: 11 }}>{String(e?.stack || '')}</Text>
        </ScrollView>
      </View>
    );
  };
}

// ─── FCM Background / Killed-state message handler ───────────────────────────
try {
  let isExpoGo = false;
  try {
    const Constants = require('expo-constants').default || require('expo-constants');
    isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
  } catch (_) {}
  if (!isExpoGo) {
    const messagingModule = require('@react-native-firebase/messaging');
    const setHandler = messagingModule.setBackgroundMessageHandler;
    const getInst = messagingModule.getMessaging || messagingModule.default;
    if (typeof setHandler === 'function' && typeof getInst === 'function') {
      setHandler(getInst(), async remoteMessage => {
        console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
      });
    }
  }
} catch (e) {
  // Gracefully handled in environments without native Firebase
}

// ─── Register tap handler for background-state notifications ─────────────────
try {
  const { registerBackgroundNotificationOpenedHandler } = require('./src/services/fcmService');
  if (typeof registerBackgroundNotificationOpenedHandler === 'function') {
    registerBackgroundNotificationOpenedHandler();
  }
} catch (e) {
  console.log('[FCM] registerBackgroundNotificationOpenedHandler:', e?.message || e);
}

// ─── Register the React Native / Expo app ────────────────────────────────────
const FinalApp = RootApp || function EmptyRoot() {
  return <View style={{ flex: 1, backgroundColor: '#070708' }} />;
};

// 1. Register for Bare Android / iOS Native Builds (Google Play / App Store)
AppRegistry.registerComponent('ShieldHire', () => FinalApp);

// 2. Register for Expo Go environments (uses "main")
try {
  registerRootComponent(FinalApp);
} catch (_) {
  AppRegistry.registerComponent('main', () => FinalApp);
}


