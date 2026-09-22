# Keep Alive System

## Why This Exists

Supabase Free Plan databases are **automatically paused after 7 days of inactivity**.
When paused, all API calls fail until the database is manually resumed via the Supabase dashboard.

The Keep Alive System prevents this by performing a minimal, read-only database ping on a scheduled interval (every 5 days) using [cron-job.org](https://cron-job.org).

---

## How It Works

```
cron-job.org (every 5 days)
    → GET /api/system/keep-alive
        → keepAliveAuth middleware (validates Bearer token)
            → keepAliveController
                → supabase.from('clients').select('id').limit(1)
                    → HTTP 200 { success: true, ... }
```

- **Read-only**: Only `SELECT id LIMIT 1` is ever executed — no inserts, updates, or deletes.
- **Minimal overhead**: Queries the `clients` table (smallest in schema) and fetches only one column.
- **Isolated**: Zero coupling to any business logic, auth, or booking systems.
- **Secure**: Protected by a static secret token via `Authorization: Bearer` header.

---

## Files

| File | Purpose |
|---|---|
| `backend/src/routes/systemRoutes.ts` | Route definition — mounts at `/api/system/keep-alive` |
| `backend/src/controllers/keepAliveController.ts` | Database ping logic |
| `backend/src/middleware/keepAliveAuth.ts` | Bearer token validation |

---

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `KEEP_ALIVE_SECRET` | ✅ **Mandatory** | Bearer token for endpoint authentication |

### Generating a Secure Secret

```bash
node -e "require('crypto').randomBytes(48).toString('hex')"
```

Copy the output and set it in:
1. Your local `.env` file
2. Vercel Environment Variables → Production
3. cron-job.org → Custom Request Headers

---

## Expected Responses

### ✅ HTTP 200 — Success

```json
{
  "success": true,
  "message": "Database is active",
  "timestamp": "2026-07-07T07:30:00.000Z",
  "responseTime": "45ms"
}
```

### ❌ HTTP 401 — Unauthorized

```json
{ "error": "Unauthorized. Authorization header is required." }
```

```json
{ "error": "Unauthorized. Invalid token." }
```

### ❌ HTTP 503 — Database Unavailable

```json
{
  "success": false,
  "message": "Database is unavailable.",
  "timestamp": "2026-07-07T07:30:00.000Z",
  "responseTime": "5002ms"
}
```

---

## Testing Locally

Start the backend server:

```bash
cd backend
npm run dev
```

Then run:

```bash
curl -H "Authorization: Bearer YOUR_KEEP_ALIVE_SECRET" \
  http://localhost:5000/api/system/keep-alive
```

Expected output:
```json
{"success":true,"message":"Database is active","timestamp":"...","responseTime":"...ms"}
```

---

## Testing Against Production (Vercel)

```bash
curl -H "Authorization: Bearer YOUR_KEEP_ALIVE_SECRET" \
  https://YOUR_VERCEL_DEPLOYMENT_URL/api/system/keep-alive
```

---

## Vercel Setup

Add `KEEP_ALIVE_SECRET` to your Vercel project:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `KEEP_ALIVE_SECRET`
   - **Value**: Your generated secret
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
3. Click **Save** and **Redeploy** the project.

---

## cron-job.org Setup Guide

### Step 1 — Create a Free Account

Visit [https://cron-job.org](https://cron-job.org) and sign up for a free account.

---

### Step 2 — Create a New Cron Job

After logging in, click **"Create Cronjob"**.

---

### Step 3 — Configure the Request

| Field | Value |
|---|---|
| **Title** | ShieldHire — Keep Alive |
| **URL** | `https://YOUR_VERCEL_DEPLOYMENT_URL/api/system/keep-alive` |
| **Request Method** | `GET` |
| **Enable HTTPS** | ✅ Yes |

---

### Step 4 — Add the Authorization Header

In the **"Request Headers"** section, add:

| Header Name | Header Value |
|---|---|
| `Authorization` | `Bearer YOUR_KEEP_ALIVE_SECRET` |

> ⚠️ Replace `YOUR_KEEP_ALIVE_SECRET` with the exact value from your `.env` / Vercel environment.

---

### Step 5 — Set the Schedule

In the **Schedule** section, choose **"Every N days"** and set it to **5 days**.

This is the recommended interval because Supabase pauses after **7 days** of inactivity — 5 days gives a safe 2-day buffer.

Alternatively, use the cron expression:
```
0 0 */5 * *
```
(Runs at midnight UTC every 5 days.)

---

### Step 6 — Configure Notifications (Recommended)

In the **Notifications** section:
- ✅ Enable **"Notify me on failed executions"**
- Enter your email address.

This ensures you are alerted if the ping ever fails.

---

### Step 7 — Save Execution Responses

In the **"Save responses"** section:
- ✅ Enable **"Save responses"**

This lets you inspect the response body from the execution history.

---

### Step 8 — Save and Run a Manual Test

1. Click **"Save"** to create the cron job.
2. Click **"Run now"** (the play button) to trigger an immediate manual test.

---

### Step 9 — Verify in Execution History

Go to **"Execution history"** and confirm:
- **Status**: `200`
- **Response Body**: `{"success":true,"message":"Database is active",...}`

If you see a `401`, double-check that the `Authorization` header value matches `KEEP_ALIVE_SECRET` exactly (no extra spaces, correct `Bearer ` prefix).

---

## Security Notes

- The `KEEP_ALIVE_SECRET` is never logged, never returned in responses, and never exposed in error messages.
- Stack traces and schema details are never returned to the caller.
- The endpoint performs no database writes — it is safe to call externally.
- Token comparison is exact string equality (constant-time comparison is not required here as this is not a user-facing auth flow, but a static server secret).
