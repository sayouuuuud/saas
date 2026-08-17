import crypto from 'node:crypto';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const secret = process.argv[2];
if (!secret) process.exit(2);
let bits = 0;
let value = 0;
const bytes = [];
for (const character of secret.replace(/=+$/, '').toUpperCase()) {
  const index = alphabet.indexOf(character);
  if (index < 0) process.exit(3);
  value = (value << 5) | index;
  bits += 5;
  if (bits >= 8) {
    bytes.push((value >>> (bits - 8)) & 255);
    bits -= 8;
  }
}
const counter = Math.floor(Date.now() / 1000 / 30);
const message = Buffer.from(counter.toString(16).padStart(16, '0'), 'hex');
const digest = crypto.createHmac('sha1', Buffer.from(bytes)).update(message).digest();
const offset = digest[digest.length - 1] & 15;
const number = ((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) | ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255);
process.stdout.write(String(number % 1000000).padStart(6, '0'));
