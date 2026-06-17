/**
 * Unit tests for monsteraConnect builder helpers.
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import Monstera from '../../../src/sdk/Monstera.js';
import {
  connectAdmin,
  connectUser,
  connectFull,
  connectLegacy
} from '../../../src/sdk/connect/index.js';
import { ValidationError } from '../../../src/errors/index.js';

const TEST_SIGNER = Wallet.createRandom().privateKey;

describe('monsteraConnect', () => {
  test('connectAdmin builds admin profile config', () => {
    const sdk = connectAdmin(
      { mainnet: false, signer: TEST_SIGNER, checkVersion: false },
      Monstera
    );
    expect(sdk.getConnectProfile()).toBe('admin');
  });

  test('connectUser builds user profile config', () => {
    const sdk = connectUser(
      {
        mainnet: false,
        checkVersion: false,
        credentials: { username: 'bob', password: 'pw' }
      },
      Monstera
    );
    expect(sdk.getConnectProfile()).toBe('user');
  });

  test('connectFull builds full profile config', () => {
    const sdk = connectFull(
      {
        mainnet: false,
        checkVersion: false,
        signer: TEST_SIGNER,
        credentials: { username: 'bob', password: 'pw' }
      },
      Monstera
    );
    expect(sdk.getConnectProfile()).toBe('full');
  });

  test('connectLegacy readonly rejects signer and credentials together with neither', () => {
    const sdk = connectLegacy({ mainnet: false, checkVersion: false }, Monstera);
    expect(sdk.getConnectProfile()).toBe('readonly');
  });

  test('connectLegacy throws when mixing invalid full connect inputs', () => {
    expect(() =>
      connectFull({ mainnet: false, signer: TEST_SIGNER, checkVersion: false }, Monstera)
    ).toThrow(ValidationError);
  });
});
