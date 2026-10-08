/**
 * A bad gas-signer private key must not appear in the thrown error.
 */

import { describe, test, expect } from '@jest/globals';
import { createWriteSigner } from '../../../src/providers/sapphire.js';
import { ValidationError } from '../../../src/errors/index.js';

const RPC_URL = 'https://testnet.sapphire.oasis.io';

describe('createWriteSigner', () => {
  test('invalid private key throws ValidationError without the key', () => {
    const privateKey = '0x' + 'zz'.repeat(32);

    expect(() => createWriteSigner(privateKey, RPC_URL)).toThrow(ValidationError);

    try {
      createWriteSigner(privateKey, RPC_URL);
    } catch (error) {
      expect(error.message).toBe('Invalid private key.');
      expect(JSON.stringify(error)).not.toContain(privateKey);
      expect(error.context.value).toEqual({
        redacted: true,
        valueKind: 'string',
        valueLength: privateKey.length
      });
    }
  });
});
