const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

function encrypt(plaintext, masterKey) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = deriveKey(masterKey, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext, masterKey) {
  const buf = Buffer.from(ciphertext, 'base64');
  const salt = buf.subarray(0, SALT_LENGTH);
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const derivedKey = deriveKey(masterKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

module.exports = { encrypt, decrypt };
