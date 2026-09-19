import fs from 'node:fs';
import admin from 'firebase-admin';

let messaging = null;

function loadServiceAccount() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    return JSON.parse(inline);
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }

  return null;
}

export function initPushNotifications() {
  if (messaging) return true;

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    console.warn(
      'FCM: Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.',
    );
    return false;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  messaging = admin.messaging();
  console.log('FCM: push notification service ready');
  return true;
}

export function isPushConfigured() {
  return messaging != null;
}

function normalizeData(data = {}) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    out[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return out;
}

export async function sendToTokens(tokens, { title, body, data = {} }) {
  if (!messaging) {
    throw new Error('FCM is not configured on the server');
  }

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const response = await messaging.sendEachForMulticast({
    tokens: uniqueTokens,
    notification: { title, body },
    data: normalizeData(data),
    android: { priority: 'high' },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    responses: response.responses.map((item, index) => ({
      token: uniqueTokens[index],
      success: item.success,
      error: item.error?.message || null,
    })),
  };
}

export async function sendToUser(user, payload) {
  if (!user?.fcmToken) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }
  return sendToTokens([user.fcmToken], payload);
}
