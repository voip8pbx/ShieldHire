/**
 * Safe runtime shims for running inside Expo Go or environments without bare native binaries.
 * In a native bare build (such as the Google Play Store release AAB), all native modules
 * are registered in the binary, so these fallbacks are completely bypassed.
 */
global.RN$TurboInterop = true;
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// ── Ensure EXPO_OS is defined so Platform.ts doesn't warn ───────────────────────
if (typeof process !== 'undefined') {
  if (!process.env) process.env = {};
  if (!process.env.EXPO_OS) {
    try {
      const { Platform } = require('react-native');
      process.env.EXPO_OS = Platform?.OS || 'android';
    } catch (_) {
      process.env.EXPO_OS = 'android';
    }
  }
}

// ── Suppress benign React Native 0.77 internal feature flag warnings in Expo Go ──
if (typeof console !== 'undefined') {
  const isBenignLog = (str) =>
    typeof str === 'string' &&
    (str.includes('disableEventLoopOnBridgeless') ||
     str.includes('EXNativeModulesProxy') ||
     str.includes('ReactNativeVersionCheck') ||
     str.includes('React Native version mismatch'));

  const origWarn = console.warn;
  console.warn = (...args) => {
    if (isBenignLog(args[0])) return;
    origWarn.apply(console, args);
  };
  const origError = console.error;
  console.error = (...args) => {
    if (isBenignLog(args[0])) return;
    origError.apply(console, args);
  };
  if (typeof console.debug === 'function') {
    const origDebug = console.debug;
    console.debug = (...args) => {
      if (isBenignLog(args[0])) return;
      origDebug.apply(console, args);
    };
  }
}

// ── Early Expo Go detection ────────────────────────────────────────────────────
let earlyExpoGo = false;
try {
  const Constants = require('expo-constants').default || require('expo-constants');
  earlyExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
} catch (_) {}
if (typeof globalThis !== 'undefined') {
  globalThis.__IS_EXPO_GO__ = earlyExpoGo;
}

// ── Global Error Trace Logger ──────────────────────────────────────────────────
if (typeof global !== 'undefined' && global.ErrorUtils) {
  const origHandler = global.ErrorUtils.getGlobalHandler?.();
  global.ErrorUtils.setGlobalHandler((err, isFatal) => {
    console.error('>>> [RUNTIME CRASH CAPTURED]:', err?.message || err);
    if (err?.stack) {
      console.error('>>> [CRASH STACK]:\n', err.stack);
    }
    if (origHandler) origHandler(err, isFatal);
  });
}

// ── Ensure global.expo.modules exists for Expo modules only in Expo Go ─────────
import { NativeModules, TurboModuleRegistry } from 'react-native';

if (earlyExpoGo) {
  if (!global.expo) {
    global.expo = { modules: {} };
  }
  if (!global.expo.modules) {
    global.expo.modules = {};
  }

  // ── Ensure legacy NativeUnimoduleProxy exists on NativeModules for expo-modules-core in Expo Go ──
  if (NativeModules && !NativeModules.NativeUnimoduleProxy) {
    try {
      NativeModules.NativeUnimoduleProxy = {
        modulesConstants: {},
        exportedMethods: {},
        viewManagersMetadata: {},
        callMethod: () => Promise.resolve(null),
      };
    } catch (_) {}
  }
}

// ── ImagePicker bridge using expo-image-picker for Expo Go ────────────────────
const DEMO_BASE64_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const bridgeLaunchImageLibrary = async (options, callback) => {
  try {
    let ImagePicker = null;
    try {
      ImagePicker = require('expo-image-picker');
    } catch (_) {}

    if (ImagePicker && typeof ImagePicker.launchImageLibraryAsync === 'function') {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (_) {}

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: typeof options?.quality === 'number' ? options.quality : 0.8,
        base64: true,
      });

      if (result.canceled) {
        callback?.({ didCancel: true });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        let base64 = pickedAsset.base64;
        if (!base64 && pickedAsset.uri) {
          try {
            const FileSystem = require('expo-file-system');
            base64 = await FileSystem.readAsStringAsync(pickedAsset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (_) {}
        }

        callback?.({
          assets: [
            {
              uri: pickedAsset.uri,
              fileName: pickedAsset.fileName || 'picked_document.jpg',
              fileSize: pickedAsset.fileSize || 50000,
              width: pickedAsset.width || 800,
              height: pickedAsset.height || 600,
              type: pickedAsset.mimeType || 'image/jpeg',
              base64: base64 || DEMO_BASE64_IMAGE,
            },
          ],
        });
        return;
      }
    }
  } catch (err) {
    console.warn('[ImagePicker] Expo Go Image Picker error:', err);
  }

  // Fallback demo document image for Expo Go if picker was dismissed or failed
  callback?.({
    assets: [
      {
        uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
        fileName: 'identity_doc_demo.jpg',
        fileSize: 102400,
        width: 800,
        height: 600,
        type: 'image/jpeg',
        base64: DEMO_BASE64_IMAGE,
      },
    ],
  });
};

const bridgeLaunchCamera = async (options, callback) => {
  try {
    let ImagePicker = null;
    try {
      ImagePicker = require('expo-image-picker');
    } catch (_) {}

    if (ImagePicker && typeof ImagePicker.launchCameraAsync === 'function') {
      try {
        await ImagePicker.requestCameraPermissionsAsync();
      } catch (_) {}

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: typeof options?.quality === 'number' ? options.quality : 0.8,
        base64: true,
      });

      if (result.canceled) {
        callback?.({ didCancel: true });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        let base64 = pickedAsset.base64;
        if (!base64 && pickedAsset.uri) {
          try {
            const FileSystem = require('expo-file-system');
            base64 = await FileSystem.readAsStringAsync(pickedAsset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (_) {}
        }

        callback?.({
          assets: [
            {
              uri: pickedAsset.uri,
              fileName: pickedAsset.fileName || 'camera_photo.jpg',
              fileSize: pickedAsset.fileSize || 50000,
              width: pickedAsset.width || 800,
              height: pickedAsset.height || 600,
              type: pickedAsset.mimeType || 'image/jpeg',
              base64: base64 || DEMO_BASE64_IMAGE,
            },
          ],
        });
        return;
      }
    }
  } catch (err) {
    console.warn('[ImagePicker] Expo Go Camera error:', err);
  }

  callback?.({ didCancel: true });
};

// ── 1. TurboModule fallback proxy (RNBootSplash, RNGoogleSignin, etc.) ─────────
if (earlyExpoGo && TurboModuleRegistry && typeof TurboModuleRegistry.getEnforcing === 'function') {
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
          if (prop === 'getConstants') {
            return () => ({
              darkModeEnabled: true,
              BUTTON_SIZE_ICON: 0,
              BUTTON_SIZE_STANDARD: 1,
              BUTTON_SIZE_WIDE: 2,
              SIGN_IN_CANCELLED: '12501',
              IN_PROGRESS: '12502',
              PLAY_SERVICES_NOT_AVAILABLE: '12500',
              SIGN_IN_REQUIRED: '12503',
              SCOPES_ALREADY_GRANTED: '12504',
            });
          }
          if (prop === 'hide') return async () => {};
          if (prop === 'isVisible') return () => false;
          if (prop === 'configure') return async () => {};
          if (prop === 'signIn') {
            return async () => ({
              type: 'success',
              data: {
                idToken: 'mock_expo_google_id_token',
                user: {
                  id: 'expo_google_user_123',
                  name: 'Rishi (Demo User)',
                  email: 'rishi076@gmail.com',
                  photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                  familyName: 'User',
                  givenName: 'Rishi',
                },
              },
            });
          }
          if (prop === 'hasPlayServices') return async () => false;
          if (prop === 'playServicesAvailable') return async () => false;
          if (prop === 'signOut') return async () => {};
          if (prop === 'install') return () => null;
          if (prop === 'launchCamera') return (options, callback) => bridgeLaunchCamera(options, callback);
          if (prop === 'launchImageLibrary') return (options, callback) => bridgeLaunchImageLibrary(options, callback);
          return (..._args) => Promise.resolve(null);
        },
      });
    }
  };

  if (typeof TurboModuleRegistry.get === 'function') {
    const originalGet = TurboModuleRegistry.get;
    TurboModuleRegistry.get = function (name) {
      try {
        const mod = originalGet(name);
        if (mod) return mod;
      } catch (e) {}
      if (NativeModules && NativeModules[name]) {
        return NativeModules[name];
      }
      if (name === 'ImagePicker') {
        return {
          launchCamera: (options, callback) => bridgeLaunchCamera(options, callback),
          launchImageLibrary: (options, callback) => bridgeLaunchImageLibrary(options, callback),
          addListener: () => {},
          removeListeners: () => {},
        };
      }
      if (name === 'NativeReactNativeFeatureFlagsCxx') {
        return new Proxy({}, {
          get: () => () => false,
        });
      }
      return null;
    };
  }
}

// ── 2. NitroModules fallback (react-native-nitro-inspire-face) ─────────────────
if (earlyExpoGo && !global.NitroModulesProxy) {
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

function registerMockNativeModule(name, mockObj) {
  if (!earlyExpoGo) return; // Completely bypass in bare native builds
  try {
    if (!NativeModules || !NativeModules[name]) {
      NativeModules[name] = mockObj;
    }
  } catch (_e) {
    try {
      Object.defineProperty(NativeModules, name, {
        value: mockObj,
        configurable: true,
        writable: true,
      });
    } catch (_e2) {}
  }
}

// ── NativeUnimoduleProxy for legacy Expo packages ──────────────────────────────
registerMockNativeModule('NativeUnimoduleProxy', {
  modulesConstants: {},
  exportedMethods: {},
  viewManagersMetadata: {},
  callMethod: () => Promise.resolve(null),
});

// ── RNFSManager for react-native-fs ────────────────────────────────────────────
registerMockNativeModule('RNFSManager', {
  RNFSFileTypeRegular: 0,
  RNFSFileTypeDirectory: 1,
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
  addListener: () => {},
  removeListeners: () => {},
});

// ── BVLinearGradient for react-native-linear-gradient ──────────────────────────
registerMockNativeModule('BVLinearGradient', {
  addListener: () => {},
  removeListeners: () => {},
});


// ── 3. CameraDevices for react-native-vision-camera ────────────────────────────
registerMockNativeModule('CameraDevices', {
  getConstants: () => ({
    availableCameraDevices: [],
    userPreferredCameraDevice: undefined,
  }),
  addListener: () => {},
  removeListeners: () => {},
});

registerMockNativeModule('CameraView', {
  getConstants: () => ({}),
  addListener: () => {},
  removeListeners: () => {},
});

registerMockNativeModule('ImagePicker', {
  launchCamera: (options, callback) => bridgeLaunchCamera(options, callback),
  launchImageLibrary: (options, callback) => bridgeLaunchImageLibrary(options, callback),
  addListener: () => {},
  removeListeners: () => {},
});

// ── 4. NotifeeApiModule for @notifee/react-native ──────────────────────────────
registerMockNativeModule('NotifeeApiModule', {
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
});

// ── 5. RNFusedLocation for react-native-geolocation-service ────────────────────
registerMockNativeModule('RNFusedLocation', {
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
});

// ── 6. Firebase modules (@react-native-firebase/app, auth, messaging) ─────────
registerMockNativeModule('RNFBAppModule', {
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
});

const authMethods = [
  'APP_LANGUAGE', 'APP_USER', 'configureAuthDomain', 'addAuthStateListener', 'removeAuthStateListener',
  'addIdTokenListener', 'removeIdTokenListener', 'useEmulator', 'signOut', 'getCustomAuthDomain',
  'signInWithCredential', 'signInWithCustomToken', 'signInAnonymously', 'signInWithEmailAndPassword',
  'createUserWithEmailAndPassword', 'getIdToken', 'getIdTokenResult', 'setLanguageCode', 'setTenantId',
  'verifyPhoneNumber', 'sendPasswordResetEmail', 'sendSignInLinkToEmail', 'isSignInWithEmailLink',
  'fetchSignInMethodsForEmail', 'applyActionCode', 'checkActionCode', 'verifyPasswordResetCode',
  'useUserAccessGroup', 'revokeToken', 'addListener', 'removeListeners', 'getSession',
  'finalizeMultiFactorEnrollment', 'finalizeTotpEnrollment', 'unenrollMultiFactor',
  'assertionForSignIn', 'generateTotpSecret', 'getMultiFactorResolver',
  'forceRecaptchaFlowForTesting', 'setAppVerificationDisabledForTesting',
  'setAutoRetrievedSmsCodeForPhoneNumber', 'generateQrCodeUrl', 'openInOtpApp',
];

const authTarget = {
  APP_LANGUAGE: { '[DEFAULT]': 'en' },
  APP_USER: {},
  configureAuthDomain: () => {},
  addAuthStateListener: () => {},
  removeAuthStateListener: () => {},
  addIdTokenListener: () => {},
  removeIdTokenListener: () => {},
  useEmulator: () => {},
  signOut: async () => {},
  getCustomAuthDomain: async () => null,
  addListener: () => {},
  removeListeners: () => {},
};

registerMockNativeModule('RNFBAuthModule', new Proxy(authTarget, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (prop === 'APP_LANGUAGE') return { '[DEFAULT]': 'en' };
    if (prop === 'APP_USER') return {};
    return async (..._args) => null;
  },
  ownKeys() {
    return authMethods;
  },
  getOwnPropertyDescriptor(target, prop) {
    return {
      value: this.get(target, prop),
      writable: true,
      enumerable: true,
      configurable: true,
    };
  },
}));

registerMockNativeModule('RNFBMessagingModule', {
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
});

let isExpoGo = earlyExpoGo;
if (!isExpoGo) {
  try {
    isExpoGo = !NativeModules?.RNBootSplash && (!TurboModuleRegistry?.get?.('RNBootSplash'));
  } catch (_e) {
    isExpoGo = true;
  }
}
export const isExpoGoEnvironment = isExpoGo;
if (typeof globalThis !== 'undefined') {
  globalThis.__IS_EXPO_GO__ = isExpoGo;
}

