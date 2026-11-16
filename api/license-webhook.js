/**
 * NativeLingo Automated License Key Generator Webhook (Vercel / Node 18+ Serverless)
 *
 * Generates offline Ed25519 cryptographic `NL1-...` keys matching `electron/licenseVerifier.cjs`.
 * Compatible with Lemon Squeezy License Key Generation webhooks and Stripe Checkout webhooks.
 *
 * Required Environment Variables:
 *   - NL_ED25519_PRIVATE_KEY : PEM-encoded PKCS8 Ed25519 private key matching MASTER_PUBLIC_KEY
 *   - WEBHOOK_SECRET         : Lemon Squeezy or Stripe webhook signing secret
 */

import crypto from 'crypto';

/**
 * Generates an Ed25519-signed `NL1-` license token compatible with `electron/licenseVerifier.cjs`.
 * @param {{ org: string, plan: string, seats: number, expiresAt: string, orderId?: string }} opts
 * @returns {string}
 */
export function generateSignedLicenseKey({ org, plan, seats = 1, expiresAt, orderId }) {
  const privateKeyPem = process.env.NL_ED25519_PRIVATE_KEY;
  if (!privateKeyPem) {
    throw new Error('Missing NL_ED25519_PRIVATE_KEY environment variable');
  }

  const payload = {
    id: orderId || `NL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    org: org || 'Commercial Pro User',
    plan: plan || 'commercial_pro', // 'commercial_pro' | 'commercial_perpetual' | 'commercial_team'
    seats: Number(seats) || 1,
    issuedAt: new Date().toISOString().split('T')[0],
    expiresAt: expiresAt || 'never'
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.sign(null, Buffer.from(payloadBase64, 'utf8'), privateKeyPem.replace(/\\n/g, '\n'));
  const signatureBase64 = signature.toString('base64url');

  return `NL1-${payloadBase64}.${signatureBase64}`;
}

/**
 * Verifies Lemon Squeezy X-Signature HMAC-SHA256 header using timing-safe comparison.
 */
function verifyHmacSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(hmac, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Serverless HTTP handler (Vercel / Node.js req, res).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const secret = process.env.WEBHOOK_SECRET;
    const lemonSig = req.headers['x-signature'];

    if (secret && lemonSig && !verifyHmacSignature(rawBody, lemonSig, secret)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const attrs = event?.data?.attributes || {};
    const custom = event?.meta?.custom_data || {};

    const plan = custom.plan || 'commercial_pro';
    const seats = Number(custom.seats || attrs.quantity || 1);
    const org = custom.org || attrs.user_name || attrs.customer_email || 'Commercial Pro User';

    let expiresAt = 'never';
    if (plan !== 'commercial_perpetual') {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      expiresAt = nextYear.toISOString().split('T')[0];
    }

    const licenseKey = generateSignedLicenseKey({
      org,
      plan,
      seats,
      expiresAt,
      orderId: event?.data?.id ? `NL-${event.data.id}` : undefined
    });

    return res.status(200).json({
      success: true,
      licenseKey,
      plan,
      seats,
      expiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
