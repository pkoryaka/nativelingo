/**
 * NativeLingo Embedded Cryptographic License Verifier
 * 
 * Verifies Ed25519 digital signatures on license tokens offline.
 * Zero external calls or telemetry required.
 */

const crypto = require('crypto');

// Master Ed25519 Public Key embedded into the NativeLingo desktop client
const MASTER_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAfiOXaN3+az6e+2UJpUwaPRLis4ZvXufb0KTRyidzsd4=
-----END PUBLIC KEY-----`;

/**
 * Cryptographically verifies an offline license key.
 * 
 * @param {string} tokenString - The NL1- formatted license key
 * @returns {{ valid: boolean, error?: string, payload?: object, expired?: boolean }}
 */
function verifyLicenseKey(tokenString) {
  try {
    if (!tokenString || typeof tokenString !== 'string') {
      return { valid: false, error: 'Please enter a license key.' };
    }

    const trimmed = tokenString.trim();

    // Check for modern cryptographic NL1 token
    if (trimmed.startsWith('NL1-')) {
      const body = trimmed.slice(4);
      const dotIndex = body.lastIndexOf('.');
      if (dotIndex === -1) {
        return { valid: false, error: 'Invalid license format: Missing signature separator.' };
      }

      const payloadBase64 = body.slice(0, dotIndex);
      const signatureBase64 = body.slice(dotIndex + 1);

      let signatureBuffer;
      try {
        signatureBuffer = Buffer.from(signatureBase64, 'base64url');
      } catch {
        return { valid: false, error: 'Corrupt signature encoding in license key.' };
      }

      const dataBuffer = Buffer.from(payloadBase64, 'utf8');

      const isVerified = crypto.verify(null, dataBuffer, MASTER_PUBLIC_KEY, signatureBuffer);
      if (!isVerified) {
        return { 
          valid: false, 
          error: 'Cryptographic signature is invalid. The license key has been tampered with or corrupted.' 
        };
      }

      let payload;
      try {
        const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        payload = JSON.parse(payloadJson);
      } catch {
        return { valid: false, error: 'Corrupt payload data inside license key.' };
      }

      // Verify expiration date
      if (payload.expiresAt && payload.expiresAt !== 'never') {
        const expiry = new Date(payload.expiresAt).getTime();
        if (!isNaN(expiry) && Date.now() > expiry) {
          return { 
            valid: false, 
            error: `This commercial license expired on ${payload.expiresAt}. Please contact sales to renew.`,
            payload,
            expired: true
          };
        }
      }

      return { 
        valid: true, 
        payload,
        isCryptographicallySigned: true
      };
    }

    // Backward compatibility for legacy test format: NL-PRO-XXXX-XXXX or UUID
    const isLegacyFormat = /^NL-(PRO|TEAM|PERP|COMM)-[A-Z0-9]{4,}(-[A-Z0-9]{4,})*$/i.test(trimmed) ||
                           /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    if (isLegacyFormat) {
      const isPerp = trimmed.includes('PERP') || trimmed.includes('LIFETIME');
      const isTeam = trimmed.includes('TEAM');
      return {
        valid: true,
        payload: {
          id: trimmed,
          org: isTeam ? 'Commercial Team Evaluation' : 'Commercial Pro User',
          plan: isTeam ? 'commercial_team' : (isPerp ? 'commercial_perpetual' : 'commercial_pro'),
          seats: isTeam ? 10 : 1,
          issuedAt: new Date().toISOString().split('T')[0],
          expiresAt: isPerp ? 'never' : null
        },
        isCryptographicallySigned: false
      };
    }

    return { 
      valid: false, 
      error: 'Invalid license key format. Please enter a valid NativeLingo license key.' 
    };
  } catch (err) {
    return { valid: false, error: `Verification error: ${err.message}` };
  }
}

module.exports = {
  MASTER_PUBLIC_KEY,
  verifyLicenseKey
};
