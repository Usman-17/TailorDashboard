/**
 * Offline Authentication & Cryptographic Session Vault
 *
 * Utilizes the browser's native Web Cryptography API (crypto.subtle)
 * to securely verify offline logins without ever storing plain text passwords.
 */

const OFFLINE_AUTH_VAULT_KEY = "tailor_offline_auth_vault";
const ACTIVE_OFFLINE_SESSION_KEY = "tailor_active_offline_session";

// Default offline validity: 30 days
const OFFLINE_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Converts an ArrayBuffer to a hex string
 */
const bufferToHex = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
};

/**
 * Generates a cryptographically random salt (16 bytes) in hex
 */
const generateSaltHex = () => {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bufferToHex(salt);
};

/**
 * Computes a salted SHA-256 hash using the browser's native Web Crypto API
 *
 * @param {string} saltHex - Hex salt string
 * @param {string} password - User's password
 * @returns {Promise<string>} Hex digest
 */
const hashPasswordWithSalt = async (saltHex, password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${saltHex}:${password}`);
  const digestBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digestBuffer);
};

/**
 * Normalizes email or mobile identifiers for reliable indexing
 */
const normalizeIdentifier = (val) => {
  if (!val) return "";
  return String(val).trim().toLowerCase().replace(/\s+/g, "");
};

/**
 * Retrieves the local offline auth vault (map of identifier -> credentials record)
 */
const getVault = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_AUTH_VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

/**
 * Saves a new or updated offline session after successful online authentication.
 *
 * @param {object} user - Sanitized user object from backend
 * @param {string} password - Password used during online login
 * @returns {Promise<void>}
 */
export const saveOfflineAuthSession = async (user, password) => {
  try {
    if (!user || !password) return;

    const saltHex = generateSaltHex();
    const verifierHex = await hashPasswordWithSalt(saltHex, password);
    const now = Date.now();
    const expiresAt = now + OFFLINE_VALIDITY_MS;

    // Minimal sanitized user profile needed by UI
    const minimalUser = {
      _id: user._id,
      fullName: user.fullName || "",
      email: user.email || "",
      mobile: user.mobile || "",
      role: user.role || "owner",
      shop: user.shop || null,
      isActive: user.isActive !== undefined ? user.isActive : true,
      isImpersonating: !!user.isImpersonating,
      impersonator: user.impersonator || null,
    };

    const record = {
      userId: user._id,
      email: normalizeIdentifier(user.email),
      mobile: normalizeIdentifier(user.mobile),
      saltHex,
      verifierHex,
      user: minimalUser,
      lastOnlineLoginAt: new Date(now).toISOString(),
      offlineSessionExpiresAt: expiresAt,
    };

    const vault = getVault();

    // Index by normalized email and mobile if available
    if (user.email) {
      vault[normalizeIdentifier(user.email)] = record;
    }
    if (user.mobile) {
      vault[normalizeIdentifier(user.mobile)] = record;
    }

    localStorage.setItem(OFFLINE_AUTH_VAULT_KEY, JSON.stringify(vault));

    // Save as active offline session
    localStorage.setItem(
      ACTIVE_OFFLINE_SESSION_KEY,
      JSON.stringify({
        user: minimalUser,
        lastOnlineLoginAt: record.lastOnlineLoginAt,
        offlineSessionExpiresAt: expiresAt,
      }),
    );
  } catch (error) {
    console.warn("[OfflineAuth] Failed to save offline auth session:", error);
  }
};

/**
 * Verifies credentials against local offline session record when offline.
 *
 * @param {string} identifier - Email or mobile number
 * @param {string} password - Password entered by the user
 * @returns {Promise<{ success: boolean, user?: object, reason?: string, message?: string }>}
 */
export const verifyOfflineCredentials = async (identifier, password) => {
  try {
    const norm = normalizeIdentifier(identifier);
    if (!norm || !password) {
      return {
        success: false,
        reason: "MISSING_FIELDS",
        message: "Email/phone and password are required",
      };
    }

    const vault = getVault();
    const record = vault[norm];

    if (!record) {
      return {
        success: false,
        reason: "NOT_FOUND",
        message:
          "No previous offline session found for this account. Please connect to the internet to log in for the first time.",
      };
    }

    // Check offline session expiry (30-day window)
    if (Date.now() > record.offlineSessionExpiresAt) {
      return {
        success: false,
        reason: "EXPIRED",
        message:
          "Offline session expired. Please connect to the internet and login again.",
      };
    }

    // Verify cryptographic salted hash
    const computedHash = await hashPasswordWithSalt(record.saltHex, password);
    if (computedHash !== record.verifierHex) {
      return {
        success: false,
        reason: "INVALID_CREDENTIALS",
        message: "Invalid email/phone or password",
      };
    }

    // Set active offline session
    const offlineUser = {
      ...record.user,
      isOfflineSession: true,
    };

    localStorage.setItem(
      ACTIVE_OFFLINE_SESSION_KEY,
      JSON.stringify({
        user: offlineUser,
        lastOnlineLoginAt: record.lastOnlineLoginAt,
        offlineSessionExpiresAt: record.offlineSessionExpiresAt,
      }),
    );

    return {
      success: true,
      user: offlineUser,
    };
  } catch (error) {
    console.error("[OfflineAuth] Verification error:", error);
    return {
      success: false,
      reason: "ERROR",
      message: "An error occurred during offline login verification.",
    };
  }
};

/**
 * Gets the current active offline session if valid and not expired.
 *
 * @returns {object|null} Active user profile or null
 */
export const getActiveOfflineSession = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_OFFLINE_SESSION_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.user || !data.offlineSessionExpiresAt) return null;

    if (Date.now() > data.offlineSessionExpiresAt) {
      // Session expired, clean up active session
      localStorage.removeItem(ACTIVE_OFFLINE_SESSION_KEY);
      return null;
    }

    return {
      ...data.user,
      isOfflineSession: true,
      offlineExpiresAt: data.offlineSessionExpiresAt,
      lastOnlineLoginAt: data.lastOnlineLoginAt,
    };
  } catch (_) {
    return null;
  }
};

/**
 * Clears active session and offline device authorization upon explicit logout.
 */
export const clearOfflineAuthSession = () => {
  try {
    localStorage.removeItem(ACTIVE_OFFLINE_SESSION_KEY);
    localStorage.removeItem(OFFLINE_AUTH_VAULT_KEY);
  } catch (_) {
    // ignore
  }
};

export default {
  saveOfflineAuthSession,
  verifyOfflineCredentials,
  getActiveOfflineSession,
  clearOfflineAuthSession,
};
