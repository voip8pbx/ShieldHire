/**
 * Safe runtime shims for running inside Expo Go or environments without bare native binaries.
 * In a native bare build (such as the Google Play Store release AAB), all native modules
 * are registered in the binary, so these fallbacks are completely bypassed.
 */
global.RN$TurboInterop = true;
import { NativeModules, TurboModuleRegistry } from 'react-native';

// ── 1. TurboModule fallback proxy (RNBootSplash, RNGoogleSignin, etc.) ─────────
if (TurboModuleRegistry && typeof TurboModuleRegistry.getEnforcing === 'function') {
  const originalGetEnforcing = TurboModuleRegistry.getEnforcing;
  TurboModuleRegistry.getEnforcing = function (name) {
    try {
      const mod = originalGetEnforcing(name);
      if (mod) return mod;
    } catch (e) {
      // Missing in Expo Go — return a safe proxy
      return new Proxy({}, {
        get: (_target, prop) => {
          if (prop === '__isMock') return true;
          if (prop === 'getConstants') return () => ({ darkModeEnabled: true });
          if (prop === 'hide') return async () => {};
          if (prop === 'isVisible') return () => false;
          if (prop === 'configure') return async () => {};
          if (prop === 'signIn') return async () => ({ type: 'cancelled' });
          if (prop === 'hasPlayServices') return async () => false;
          if (prop === 'playServicesAvailable') return async () => false;
          if (prop === 'signOut') return async () => {};
          if (prop === 'install') return () => null;
          return (..._args) => Promise.resolve(null);
        },
      });
    }
  };
}

// ── 2. NitroModules fallback (react-native-nitro-inspire-face) ─────────────────
if (!global.NitroModulesProxy) {
  const dummyHybrid = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'launch') return () => {};
      if (prop === 'getCachedModel') return () => null;
      if (prop === 'downloadModel') return async () => '';
      return (..._args) => null;
    },
  });

  global.NitroModulesProxy = {
    version: '0.36.5',
    createHybridObject: () => dummyHybrid,
    hasHybridObject: () => false,
    getAllHybridObjectNames: () => [],
    box: (val) => val,
    unbox: (val) => val,
    registerSharedObject: () => {},
    unregisterSharedObject: () => {},
  };
}

// ── 3. CameraDevices for react-native-vision-camera ────────────────────────────
if (!NativeModules.CameraDevices) {
  NativeModules.CameraDevices = {
    getConstants: () => ({
      availableCameraDevices: [],
      userPreferredCameraDevice: undefined,
    }),
    addListener: () => {},
    removeListeners: () => {},
  };
}

if (!NativeModules.CameraView) {
  NativeModules.CameraView = {
    getConstants: () => ({}),
    addListener: () => {},
    removeListeners: () => {},
  };
}

// ── 4. NotifeeApiModule for @notifee/react-native ──────────────────────────────
if (!NativeModules.NotifeeApiModule) {
  NativeModules.NotifeeApiModule = {
    addListener: () => {},
    removeListeners: () => {},
    requestPermission: async () => ({ authorizationStatus: 1 }),
    createChannel: async () => 'bookings',
    createChannelGroup: async () => 'default',
    displayNotification: async () => 'mock_notification_id',
    cancelNotification: async () => {},
    cancelAllNotifications: async () => {},
    getInitialNotification: async () => null,
    onForegroundEvent: () => () => {},
    onBackgroundEvent: () => {},
    getChannels: async () => [],
    getChannel: async () => null,
    deleteChannel: async () => {},
  };
}

// ── 5. RNFusedLocation for react-native-geolocation-service ────────────────────
if (!NativeModules.RNFusedLocation) {
  NativeModules.RNFusedLocation = {
    addListener: () => {},
    removeListeners: () => {},
    getCurrentPosition: (_options, success) => {
      success?.({
        coords: {
          latitude: 28.6139,
          longitude: 77.209,
          altitude: 0,
          accuracy: 10,
          altitudeAccuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });
    },
    startObserving: () => {},
    stopObserving: () => {},
    requestAuthorization: async () => 'granted',
  };
}

// ── 6. Firebase modules (@react-native-firebase/app, auth, messaging) ─────────
if (!NativeModules.RNFBAppModule) {
  NativeModules.RNFBAppModule = {
    NATIVE_FIREBASE_APPS: [
      {
        appConfig: { name: '[DEFAULT]', automaticDataCollectionEnabled: true },
        options: {
          appId: '1:123456789:web:mock',
          projectId: 'shieldhire-mock',
          apiKey: 'mock-key',
        },
      },
    ],
    FIREBASE_RAW_JSON: '{}',
    initializeApp: async () => {},
    deleteApp: async () => {},
    setLogLevel: () => {},
    metaGetAll: async () => ({}),
    jsonGetAll: async () => ({}),
    preferencesClearAll: async () => {},
    preferencesGetAll: async () => ({}),
    preferencesSetBool: async () => {},
    preferencesSetString: async () => {},
    setAutomaticDataCollectionEnabled: () => {},
    eventsNotifyReady: () => {},
    eventsAddListener: () => {},
    eventsRemoveListener: () => {},
    addListener: () => {},
    removeListeners: () => {},
  };
}

if (!NativeModules.RNFBAuthModule) {
  NativeModules.RNFBAuthModule = {
    APP_LANGUAGE: {},
    APP_USER: {},
    addAuthStateListener: () => {},
    removeAuthStateListener: () => {},
    addIdTokenListener: () => {},
    removeIdTokenListener: () => {},
    useEmulator: () => {},
    signOut: async () => {},
    addListener: () => {},
    removeListeners: () => {},
  };
}

if (!NativeModules.RNFBMessagingModule) {
  NativeModules.RNFBMessagingModule = {
    getToken: async () => 'mock-expo-fcm-token',
    deleteToken: async () => {},
    hasPermission: async () => 1,
    requestPermission: async () => 1,
    registerForRemoteNotifications: async () => {},
    isAutoInitEnabled: true,
    setAutoInitEnabled: async () => {},
    getInitialNotification: async () => null,
    subscribeToTopic: async () => {},
    unsubscribeFromTopic: async () => {},
    addListener: () => {},
    removeListeners: () => {},
  };
}

export const isExpoGoEnvironment = !NativeModules.RNBootSplash && (!TurboModuleRegistry?.get?.('RNBootSplash'));
