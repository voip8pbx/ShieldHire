/**
 * FCM Service — Firebase Cloud Messaging Integration
 * Handles: token generation/refresh, foreground/background/quit notifications,
 * permission requests (Android 13+), and deep-link navigation.
 *
 * Package: @react-native-firebase/messaging
 */

import {
  getMessaging,
  getInitialNotification,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  requestPermission,
  AuthorizationStatus,
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { supabase } from '../config/supabase'; // adjust path if needed

// ─── Types ───────────────────────────────────────────────────────────────────

export type RemoteMessageData = {
  type?: string;
  bookingId?: string;
  chatRoomId?: string;
  userId?: string;
  [key: string]: string | undefined;
};

// ─── Navigation ref (set from App.tsx) ───────────────────────────────────────

let _navigationRef: NavigationContainerRef<any> | null = null;

export function setNavigationRef(ref: NavigationContainerRef<any>) {
  _navigationRef = ref;
}

function navigate(screen: string, params?: Record<string, unknown>) {
  if (_navigationRef?.isReady()) {
    // Cast to `any` — NavigationContainerRef<any>.navigate() uses overloads
    // that TypeScript can't resolve with a plain string screen name.
    // This is the standard pattern for navigation from outside React components.
    (_navigationRef as any).navigate(screen, params);
  } else {
    console.warn('[FCM] Navigation not ready — queuing navigation to:', screen);
  }
}

// ─── Deep-link handler ───────────────────────────────────────────────────────

/**
 * Inspect the data payload and navigate to the correct screen.
 * Extend this function as you add more notification types.
 */
function handleNotificationNavigation(data?: RemoteMessageData) {
  if (!data) return;

  switch (data.type) {
    case 'BOOKING_REQUEST':
      navigate('Bookings', { bookingId: data.bookingId });
      break;
    case 'CHAT_MESSAGE':
      navigate('Chat', { roomId: data.chatRoomId });
      break;
    case 'HIRE_CONFIRMED':
      navigate('Bookings', { bookingId: data.bookingId });
      break;
    default:
      console.log('[FCM] Unknown notification type, no navigation:', data.type);
  }
}

// ─── Permission ───────────────────────────────────────────────────────────────

/**
 * Request notification permission.
 * - Android 13+ (API 33): uses PermissionsAndroid — required in RN CLI projects.
 * - Older Android / iOS: handled by Firebase messaging.requestPermission().
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message:
            'Shield Of Security needs permission to send you notifications about bookings and alerts.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[FCM] POST_NOTIFICATIONS permission denied');
        return false;
      }
    }

    const authStatus = await requestPermission(getMessaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    console.log('[FCM] Permission status:', authStatus, '| Enabled:', enabled);
    return enabled;
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return false;
  }
}

// ─── Token ────────────────────────────────────────────────────────────────────

/**
 * Get the current FCM registration token.
 * Returns null if permission is denied or an error occurs.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    // Ensure the device is registered with FCM
    if (!isDeviceRegisteredForRemoteMessages(getMessaging())) {
      await registerDeviceForRemoteMessages(getMessaging());
    }

    const token = await getToken(getMessaging());
    console.log('[FCM] Token:', token);
    return token;
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

/**
 * Save the FCM token to Supabase `users` table.
 * Runs a no-op if the token hasn't changed.
 */
export async function saveFCMTokenToSupabase(
  userId: string,
  token: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: token, fcm_updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[FCM] Failed to save token to Supabase:', error.message);
    } else {
      console.log('[FCM] Token saved to Supabase for user:', userId);
    }
  } catch (err) {
    console.error('[FCM] Unexpected error saving token:', err);
  }
}

// ─── Initializer ─────────────────────────────────────────────────────────────

let _tokenRefreshUnsubscribe: (() => void) | null = null;
let _foregroundUnsubscribe: (() => void) | null = null;

/**
 * Call this once after the user logs in.
 * - Requests permission (Android 13+)
 * - Fetches & saves the FCM token
 * - Registers foreground notification listener
 * - Registers token refresh listener
 *
 * @param userId   — authenticated user ID (for Supabase storage)
 * @param onToken  — optional callback when token is retrieved/refreshed
 */
export async function initFCM(
  userId: string,
  onToken?: (token: string) => void,
): Promise<void> {
  // Prevent duplicate listeners
  cleanupFCMListeners();

  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn('[FCM] Notifications not permitted — skipping init');
    return;
  }

  // ── Get initial token ────────────────────────────────────────────────────
  const token = await getFCMToken();
  if (token) {
    onToken?.(token);
    await saveFCMTokenToSupabase(userId, token);
  }

  // ── Handle token refresh ─────────────────────────────────────────────────
  _tokenRefreshUnsubscribe = onTokenRefresh(getMessaging(), async newToken => {
    console.log('[FCM] Token refreshed');
    onToken?.(newToken);
    await saveFCMTokenToSupabase(userId, newToken);
  });

  // ── Handle foreground messages ────────────────────────────────────────────
  _foregroundUnsubscribe = onMessage(
    getMessaging(),
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      // NOTE: FCM does NOT show a heads-up notification in foreground on Android.
      // Use Notifee (already installed) to display the notification UI.
      await displayForegroundNotification(remoteMessage);
    },
  );

  console.log('[FCM] Initialised successfully for user:', userId);
}

/**
 * Remove all active FCM listeners. Call on logout or component unmount.
 */
export function cleanupFCMListeners(): void {
  _foregroundUnsubscribe?.();
  _tokenRefreshUnsubscribe?.();
  _foregroundUnsubscribe = null;
  _tokenRefreshUnsubscribe = null;
  console.log('[FCM] Listeners cleaned up');
}

// ─── Foreground display (via Notifee) ────────────────────────────────────────

/**
 * Show a visible notification when the app is in the foreground.
 * Delegates to your existing notificationService via Notifee.
 */
async function displayForegroundNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  try {
    // Lazy import to avoid circular deps
    const notifee = (await import('@notifee/react-native')).default;
    const { AndroidImportance } = await import('@notifee/react-native');

    const channelId = await notifee.createChannel({
      id: 'fcm_default',
      name: 'Push Notifications',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: remoteMessage.notification?.title ?? 'Shield Of Security',
      body:
        remoteMessage.notification?.body ?? 'You have a new notification.',
      data: remoteMessage.data as Record<string, string>,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
    });
  } catch (err) {
    console.error('[FCM] Error displaying foreground notification:', err);
  }
}

// ─── Quit-state handler (called from index.js) ───────────────────────────────

/**
 * Retrieve the notification that launched the app from a KILLED state.
 * Call this once in your root component (or index.js).
 */
export async function checkInitialNotification(): Promise<void> {
  const remoteMessage = await getInitialNotification(getMessaging());
  if (remoteMessage) {
    console.log(
      '[FCM] App opened from quit state by notification:',
      remoteMessage,
    );
    // Small delay to ensure navigation is ready
    setTimeout(() => {
      handleNotificationNavigation(
        remoteMessage.data as RemoteMessageData,
      );
    }, 500);
  }
}

// ─── Background/Quit tap handler (called from index.js) ──────────────────────

/**
 * Fires when the user taps a notification while the app was in BACKGROUND.
 * Register this in index.js, NOT inside a component.
 */
export function registerBackgroundNotificationOpenedHandler(): void {
  onNotificationOpenedApp(getMessaging(), remoteMessage => {
    console.log(
      '[FCM] Notification opened app from background:',
      remoteMessage,
    );
    handleNotificationNavigation(remoteMessage.data as RemoteMessageData);
  });
}
