const crypto = require('crypto');

// Generate a persistent key and IV once.
// IMPORTANT: In a production environment, these should be securely generated and managed
// (e.g., environment variables, KMS, or a more robust key management system).
// DO NOT hardcode sensitive keys directly in code for production.
// For this task, we are generating them once to ensure persistence across app runs.

// Generate a 32-byte (256-bit) key
const ENCRYPTION_KEY = Buffer.from('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 'hex'); // Example: securely generated random 32-byte hex string
// Generate a 16-byte (128-bit) IV
const IV = Buffer.from('0123456789abcdef0123456789abcdef', 'hex'); // Example: securely generated random 16-byte hex string

// Ensure the key and IV are of the correct length
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('Encryption key must be 32 bytes (256 bits)');
}
if (IV.length !== 16) {
  throw new Error('IV must be 16 bytes (128 bits)');
}

module.exports = { ENCRYPTION_KEY, IV };
