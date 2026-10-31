import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privateBytes = privateKey.export({ type: 'pkcs8', format: 'der' });
const publicBytes = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
process.stdout.write(`KRAFTINK_SITE_SIGNING_PRIVATE_KEY=${privateBytes.toString('base64')}\n`);
process.stdout.write(`KRAFTINK_SITE_SIGNING_PUBLIC_KEY=${publicBytes.toString('base64')}\n`);
