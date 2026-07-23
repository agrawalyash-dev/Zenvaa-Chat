/**
 * End-to-end encryption for Zenvaa Chat.
 *
 * - Each device generates its own ECDH (P-256) keypair.
 * - The private key is stored as a NON-EXTRACTABLE CryptoKey in IndexedDB —
 *   it can be *used* by WebCrypto but never read out as raw bytes, by this
 *   code or anything else running on the page.
 * - Only the public key ever leaves the device (uploaded to the backend).
 * - To message user B, A derives a shared AES-GCM key from
 *   (A's private key, B's public key) via ECDH. B derives the *same* key
 *   from (B's private key, A's public key). Neither side transmits the
 *   shared secret.
 * - Because the shared secret is symmetric, the sender can also decrypt
 *   their own outgoing messages using the same derivation.
 *
 * Scope / tradeoff: this is single-device by design (see README). The
 * private key is non-extractable and stored in IndexedDB only. If the
 * user clears site data or switches browsers, a new keypair is generated
 * and messages encrypted under the old key become permanently unreadable.
 */

const DB_NAME = "zenvaa-keys";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "ecdh-private-key";
const PUBLIC_KEY_ID = "ecdh-public-key";

const ECDH_PARAMS: EcKeyAlgorithm = {
  name: "ECDH",
  namedCurve: "P-256",
} as EcKeyAlgorithm;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function bufToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Checks IndexedDB for an existing keypair on this device. If none exists,
 * generates one (private key non-extractable), stores it, and returns the
 * public key so the caller can upload it. If one already exists, this is
 * a no-op and just returns the existing public key.
 */
export async function ensureKeyPair(): Promise<{
  publicKeyBase64: string;
  isNew: boolean;
}> {
  const existingPrivate = await idbGet<CryptoKey>(PRIVATE_KEY_ID);
  const existingPublic = await idbGet<CryptoKey>(PUBLIC_KEY_ID);

  if (existingPrivate && existingPublic) {
    const raw = await crypto.subtle.exportKey("raw", existingPublic);
    return { publicKeyBase64: bufToBase64(raw), isNew: false };
  }

  const keyPair = await crypto.subtle.generateKey(ECDH_PARAMS, false, [
    "deriveKey",
    "deriveBits",
  ]) as CryptoKeyPair;

  await idbSet(PRIVATE_KEY_ID, keyPair.privateKey);
  await idbSet(PUBLIC_KEY_ID, keyPair.publicKey);

  const raw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  return { publicKeyBase64: bufToBase64(raw), isNew: true };
}

export async function hasLocalKeyPair(): Promise<boolean> {
  const key = await idbGet<CryptoKey>(PRIVATE_KEY_ID);
  return !!key;
}

async function getPrivateKey(): Promise<CryptoKey> {
  const key = await idbGet<CryptoKey>(PRIVATE_KEY_ID);
  if (!key) {
    throw new Error(
      "No local private key found — call ensureKeyPair() before encrypting/decrypting",
    );
  }
  return key;
}

async function importPeerPublicKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuf(base64);
  return crypto.subtle.importKey("raw", raw, ECDH_PARAMS, false, []);
}

async function deriveSharedAesKey(
  peerPublicKeyBase64: string,
): Promise<CryptoKey> {
  const privateKey = await getPrivateKey();
  const peerPublicKey = await importPeerPublicKey(peerPublicKeyBase64);
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts plaintext for the peer identified by their base64 raw public key.
 * Returns a single base64 string: [12-byte IV][ciphertext]. This is what
 * gets stored/transmitted as `ciphertext` — the backend never needs to know
 * about the IV, it's just an opaque blob to it.
 */
export async function encryptMessage(
  peerPublicKeyBase64: string,
  plaintext: string,
): Promise<string> {
  const aesKey = await deriveSharedAesKey(peerPublicKeyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded,
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bufToBase64(combined.buffer);
}

/**
 * Reverses encryptMessage. Throws if the payload can't be decrypted with
 * the shared key derived from peerPublicKeyBase64 (wrong key, corrupted
 * data, etc.) — callers should catch this and show a fallback.
 */
export async function decryptMessage(
  peerPublicKeyBase64: string,
  payloadBase64: string,
): Promise<string> {
  const aesKey = await deriveSharedAesKey(peerPublicKeyBase64);
  const combined = new Uint8Array(base64ToBuf(payloadBase64));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext,
  );
  return new TextDecoder().decode(plaintextBuf);
}
