// Run with node --no-experimental-require-module tests/firebase-runtime.cjs.
// This reproduces the hosted runtime that rejects eager require('jose').
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { generateKeyPairSync, sign, verify } = require('node:crypto');
require('firebase-admin/auth');
const fromAdmin = createRequire(require.resolve('firebase-admin/auth'));
const jwks = fromAdmin('jwks-rsa');
async function main() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'regression', alg: 'RS256', use: 'sig' };
  const options = { jwksUri: 'https://example.invalid', getKeysInterceptor: async () => [jwk] };
  const key = await jwks(options).getSigningKey('regression');
  const payload = Buffer.from('CertPro runtime regression');
  assert(verify('RSA-SHA256', payload, key.getPublicKey(), sign('RSA-SHA256', payload, privateKey)));
  const token = [Buffer.from(JSON.stringify({alg:'RS256',kid:'regression'})).toString('base64url'), Buffer.from('{}').toString('base64url'), 'signature'].join('.');
  const passportKey = await new Promise((resolve,reject) => jwks.passportJwtSecret(options)({},token,(err,key)=>err?reject(err):resolve(key)));
  assert.equal(passportKey, key.getPublicKey());
  console.log('PASS: Firebase Auth import, RSA key verification, Passport integration');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
