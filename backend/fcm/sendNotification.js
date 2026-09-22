/**
 * FCM Sender — Node.js (firebase-admin SDK)
 * ─────────────────────────────────────────────────────────────────────────────
 * Project:  ShieldHire  (shieldhire-9a30d)
 * SA Email: fcm-service@shieldhire-9a30d.iam.gserviceaccount.com
 *
 * Setup:
 *   npm install firebase-admin
 *
 * Service account key is at: ./serviceAccountKey.json
 * (Original file: shieldhire-9a30d-1e8a482bdf93.json — DO NOT COMMIT)
 *
 * Usage:
 *   node sendNotification.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// ─── Initialise Firebase Admin ────────────────────────────────────────────────

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // project_id is read from the service account JSON automatically,
  // but databaseURL is needed if you ever use Realtime Database
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
});

// ─── Send a notification to a single device token ─────────────────────────────

/**
 * @param {string} fcmToken  — recipient device's FCM registration token
 * @param {object} options
 */
async function sendPushNotification(fcmToken, {
  title,
  body,
  data = {},
  imageUrl = null,
} = {}) {
  if (!fcmToken) throw new Error('FCM token is required');

  /**
   * Message structure:
   * - `notification` → system-managed display (shown even in background/killed)
   * - `data`         → key-value payload for your app logic / deep-link routing
   * - `android`      → Android-specific overrides (priority, TTL, channel, etc.)
   */
  const message = {
    token: fcmToken,

    // ── Visible notification payload ─────────────────────────────────────────
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },

    // ── Data payload (accessible in ALL states: foreground / background / quit)
    data: {
      // All values must be strings for FCM data payloads
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
    },

    // ── Android-specific config ──────────────────────────────────────────────
    android: {
      priority: 'high',          // Wakes the device even in Doze mode
      ttl: 86400 * 1000,         // 24 hours in milliseconds
      notification: {
        channelId: 'fcm_default',  // Must match the channel created in fcmService.ts
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK', // Optional; use for intent mapping
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM] Notification sent. Message ID:', response);
    return response;
  } catch (error) {
    console.error('[FCM] Error sending notification:', error.code, error.message);

    // Handle stale / invalid tokens
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-argument'
    ) {
      console.warn('[FCM] Stale token — remove or refresh from your database:', fcmToken);
      // TODO: Delete the token from your Supabase users table here
    }
    throw error;
  }
}

// ─── Send to multiple tokens (multicast) ─────────────────────────────────────

async function sendMulticastNotification(fcmTokens, { title, body, data = {} } = {}) {
  if (!fcmTokens?.length) throw new Error('At least one FCM token is required');

  const message = {
    tokens: fcmTokens,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    ),
    android: {
      priority: 'high',
      notification: { channelId: 'fcm_default', sound: 'default' },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  console.log(`[FCM] ${response.successCount}/${fcmTokens.length} messages sent`);

  // Log failed tokens for cleanup
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      console.error(`[FCM] Token ${idx} failed:`, resp.error?.code);
    }
  });

  return response;
}

// ─── Example: Send a "Hire Request" notification ─────────────────────────────

(async () => {
  // Replace with a real FCM token from your Supabase users table
  const TEST_TOKEN = 'REPLACE_WITH_DEVICE_FCM_TOKEN';

  await sendPushNotification(TEST_TOKEN, {
    title: 'New Hire Request! 🛡️',
    body: 'John Doe wants to hire you for tomorrow at 9PM.',
    data: {
      type: 'BOOKING_REQUEST',
      bookingId: 'booking_abc123',
      clientName: 'John Doe',
    },
  });
})();

module.exports = { sendPushNotification, sendMulticastNotification };
