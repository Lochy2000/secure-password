import argon2 from 'argon2-browser';
// import type { CryptoKeys } from '../types';

/**
 * Cryptographic utilities for the password manager
 * All encryption is done client-side using Web Crypto API and Argon2id
 */

const ARGON2_CONFIG = {
  time: 3,        // iterations
  mem: 65536,     // memory in KB (64MB)
  parallelism: 4, // threads
  type: argon2.ArgonType.Argon2id,
  hashLen: 32,    // output length in bytes
};

// const AES_CONFIG = {
//   name: 'AES-GCM',
//   length: 256,
//   iv: new Uint8Array(12), // 96-bit IV for GCM
// };

/**
 * Derives a key from master password using Argon2id
 */
export async function deriveMasterKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const result = await argon2.hash({
    pass: masterPassword,
    salt: salt,
    ...ARGON2_CONFIG,
  });

  // Import the hash as a CryptoKey for use with Web Crypto API
  return await crypto.subtle.importKey(
    'raw',
    result.hash,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
}

/**
 * Generates a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Generates a random vault key
 */
export async function generateVaultKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives the vault key from master key
 */
export async function deriveVaultKey(masterKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ encryptedData: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    encryptedData: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
  const data = base64ToArrayBuffer(encryptedData);
  const ivArray = base64ToArrayBuffer(iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivArray,
    },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Generates a random password
 */
export function generatePassword(length: number = 16, includeSymbols: boolean = true): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % charset.length;
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Utility functions for base64 encoding/decoding
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts ArrayBuffer to Uint8Array for storage
 */
export function arrayBufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Converts Uint8Array back to ArrayBuffer
 */
export function uint8ArrayToArrayBuffer(array: Uint8Array): ArrayBuffer {
  return array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength);
}

/**
 * Securely clears sensitive data from memory (best effort)
 */
export function clearSensitiveData(data: any): void {
  if (typeof data === 'string') {
    // In JavaScript, we can't truly clear strings from memory,
    // but we can overwrite variables
    data = '';
  } else if (data instanceof Uint8Array) {
    data.fill(0);
  }
  // Note: This is best effort - JavaScript doesn't provide guaranteed memory clearing
}