import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Initialise Firebase Admin (singleton) ────────────────────────────────────
// This file is imported once by bookingController.ts.
// firebase-admin auto-detects it has already been initialised on subsequent imports.

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    console.log('[FCM] Initializing Firebase Admin SDK via Environment Variables');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
    });
  } else {
    try {
      console.log('[FCM] Attempting to load Firebase credentials from serviceAccountKey.json');
      const serviceAccount = require(path.join(__dirname, '../../fcm/serviceAccountKey.json'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
      });
    } catch (e: any) {
      console.warn('[FCM WARNING] Firebase service account credentials could not be loaded (env vars or local JSON missing). FCM notifications will fail to send at runtime.', e.message);
      // Initialize with project ID only to avoid crashing startup
      admin.initializeApp({
        projectId: projectId || 'sheildhire',
      });
    }
  }
}

/**
 * Send a FCM push notification to a single device token.
 *
 * @param fcmToken  — recipient device FCM token
 * @param title     — notification title
 * @param body      — notification body
 * @param data      — optional key-value data payload (all values must be strings)
 */
export async function sendPushToToken(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<void> {
  if (!fcmToken) {
    console.warn('[FCM] sendPushToToken called with empty token — skipping');
    return;
  }

  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: { title, body },
    data,
    android: {
      priority: 'high',
      ttl: 86_400_000,                  // 24 hours in ms
      notification: {
        channelId: 'fcm_default',       // matches channel in fcmService.ts
        sound: 'default',
      },
    },
  };

  try {
    const messageId = await admin.messaging().send(message);
    console.log(`[FCM] Push sent ✓ | MsgID: ${messageId}`);
  } catch (err: any) {
    console.error('[FCM] Failed to send push:', err?.code, err?.message);
    // Bubble up so caller can log or clear stale token
    throw err;
  }
}
