/**
 * Zero-Knowledge Client-Side Vault Encryption
 * Uses Web Crypto API:
 * - PBKDF2 with SHA-256 (100,000 rounds) for key derivation from user password
 * - AES-GCM (256-bit) with random 12-byte IV for authenticated encryption
 * No plaintext keys ever touch any server.
 */

export interface EncryptedVaultPayload {
  version: number;
  ciphertext: string; // Base64
  iv: string;         // Base64
  salt: string;       // Base64
  createdAt: number;
}

// Convert BufferSource to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Derive a 256-bit AES-GCM key from password and salt using PBKDF2
async function deriveCryptoKey(password: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt arbitrary data object using AES-GCM-256
 */
export async function encryptVaultData(
  data: Record<string, any>,
  password: string
): Promise<EncryptedVaultPayload> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveCryptoKey(password, saltBytes);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    key,
    plaintext
  );

  return {
    version: 1,
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(ivBytes.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(saltBytes.buffer as ArrayBuffer),
    createdAt: Date.now(),
  };
}

/**
 * Decrypt vault payload using password
 */
export async function decryptVaultData<T = Record<string, any>>(
  payload: EncryptedVaultPayload,
  password: string
): Promise<T> {
  const saltBytes = base64ToUint8Array(payload.salt);
  const ivBytes = base64ToUint8Array(payload.iv);
  const ciphertextBytes = base64ToUint8Array(payload.ciphertext);

  const key = await deriveCryptoKey(password, saltBytes);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes as BufferSource,
    },
    key,
    ciphertextBytes as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}

/**
 * Pack vault payload into a portable single-string token for QR code or direct copy
 */
export function packSyncToken(payload: EncryptedVaultPayload): string {
  return btoa(JSON.stringify(payload));
}

/**
 * Unpack vault payload from a single-string token
 */
export function unpackSyncToken(token: string): EncryptedVaultPayload {
  const jsonString = atob(token.trim());
  return JSON.parse(jsonString);
}
