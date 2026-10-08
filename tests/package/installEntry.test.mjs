/**
 * Loads the package the way an app does. Node resolves `@monstera_protocol/sdk`
 * through `package.json` `exports` to `dist/monstera.mjs`.
 *
 * Jest unit tests import `src/` and do not open that file. Run this after
 * `npm run build`: `npm run test:bundle`.
 */

import assert from 'assert/strict';
import { existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');
const bundlePath = new URL('../../dist/monstera.mjs', import.meta.url);

if (!existsSync(bundlePath)) {
  console.error('dist/monstera.mjs is missing. Run npm run build, then npm run test:bundle.');
  process.exit(1);
}

const sdk = await import('@monstera_protocol/sdk');
const { Monstera, ValidationError } = sdk;

assert.equal(typeof Monstera.connect, 'function');
assert.equal(sdk.default, Monstera);
assert.equal(Monstera.version, version);
assert.equal(typeof ValidationError, 'function');

const sdkInstance = Monstera.connect({ mainnet: false, checkVersion: false });
assert.equal(typeof sdkInstance.signMessage, 'function');
assert.equal(sdkInstance.version, version);

const error = new ValidationError('bad input', 'field', 'value');
assert.equal(error instanceof ValidationError, true);
assert.equal(error.code, 'INVALID_ARGUMENT');

console.log('install entry ok');
