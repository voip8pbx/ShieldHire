/**
 * Supabase Edge Function — send-push-notification
 * ─────────────────────────────────────────────────────────────────────────────
 * Project:  ShieldHire (shieldhire-9a30d)
 * Service:  fcm-service@shieldhire-9a30d.iam.gserviceaccount.com
 *
 * Deploy:
 *   supabase functions deploy send-push-notification
 *
 * Set secrets (run once — values from serviceAccountKey.json):
 *   supabase secrets set FIREBASE_PROJECT_ID="shieldhire-9a30d"
 *   supabase secrets set FIREBASE_CLIENT_EMAIL="fcm-service@shieldhire-9a30d.iam.gserviceaccount.com"
 *   supabase secrets set FIREBASE_PRIVATE_KEY="$(cat path/to/serviceAccountKey.json | jq -r .private_key)"
 *
 * OR on Windows PowerShell:
 *   $key = (Get-Content shieldhire-9a30d-1e8a482bdf93.json | ConvertFrom-Json).private_key
 *   supabase secrets set FIREBASE_PRIVATE_KEY="$key"
 *
 * Example call:
 *   curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/send-push-notification \
 *     -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *           "userId":    "<USER_UUID>",
 *           "title":     "New Hire Request! 🛡️",
 *           "body":      "John Doe wants to hire you.",
 *           "data":      { "type": "BOOKING_REQUEST", "bookingId": "abc123" }
 *         }'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Google OAuth2: Service Account JWT → Access Token ───────────────────────

async function getGoogleAccessToken(): Promise<string> {
  const rawKey  = Deno.env.get('FIREBASE_PRIVATE_KEY')!;
  const privateKey   = rawKey.replace(/\\n/g, '\n');
  const clientEmail  = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;

  const now     = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:  clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:  'https://oauth2.googleapis.com/token',
    iat:  now,
    exp:  now + 3600,
  };

  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  // Strip PEM header/footer and decode
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`[FCM] Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token as string;
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    // ── Parse request body ──────────────────────────────────────────────────
    const { userId, title, body, data = {} } = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'userId, title, and body are required' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── Fetch FCM token from Supabase users table ───────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // bypasses RLS
    );

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('fcm_token, email')
      .eq('id', userId)
      .single();

    if (dbError) {
      console.error('[FCM] DB error:', dbError.message);
      return new Response(
        JSON.stringify({ error: 'DB lookup failed', details: dbError.message }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    if (!userData?.fcm_token) {
      return new Response(
        JSON.stringify({ error: 'No FCM token registered for this user', userId }),
        { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── Build FCM HTTP v1 message ───────────────────────────────────────────
    const projectId  = Deno.env.get('FIREBASE_PROJECT_ID')!; // shieldhire-9a30d
    const accessToken = await getGoogleAccessToken();

    const message = {
      message: {
        token: userData.fcm_token,

        // Shown by the OS in background / killed state
        notification: { title, body },

        // Custom key-value pairs — all values must be strings
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        ),

        android: {
          priority: 'HIGH',
          ttl: '86400s',
          notification: {
            channel_id: 'fcm_default', // Must match channel in fcmService.ts
            sound:      'default',
          },
        },
      },
    };

    // ── Send via FCM HTTP v1 API ────────────────────────────────────────────
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      },
    );

    const fcmData = await fcmRes.json();

    if (!fcmRes.ok) {
      console.error('[FCM] Send error:', JSON.stringify(fcmData));

      // Clean up stale token
      if (fcmData?.error?.status === 'NOT_FOUND') {
        await supabase
          .from('users')
          .update({ fcm_token: null, fcm_updated_at: new Date().toISOString() })
          .eq('id', userId);
        console.warn('[FCM] Stale token cleared for user:', userId);
      }

      return new Response(
        JSON.stringify({ error: 'FCM send failed', details: fcmData }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[FCM] Message sent successfully. ID:', fcmData.name, '| User:', userData.email);

    return new Response(
      JSON.stringify({ success: true, messageId: fcmData.name }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[FCM] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
