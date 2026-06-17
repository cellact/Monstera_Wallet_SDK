/**
 * Unit tests for MonsteraConfig.resolveConnectConfig.
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import MonsteraConfig from '../../../src/config/monstera.js';
import Monstera from '../../../src/sdk/Monstera.js';

const TEST_SIGNER = Wallet.createRandom().privateKey;

describe('MonsteraConfig.resolveConnectConfig', () => {
  test('omits signer and credentials when not provided', () => {
    const config = MonsteraConfig.resolveConnectConfig({ mainnet: false, checkVersion: false });
    expect(config.signer).toBeUndefined();
    expect(config.credentials).toBeUndefined();
  });

  test('Monstera.connect builds instance with optional signer and credentials', () => {
    const sdk = Monstera.connect({
      mainnet: false,
      checkVersion: false,
      signer: TEST_SIGNER,
      credentials: { username: 'bob', password: 'pw' }
    });
    expect(sdk.hasWriteAccess()).toBe(true);
    expect(sdk.hasCredentials()).toBe(true);
  });

  test('Monstera.connect readonly without signer or credentials', () => {
    const sdk = Monstera.connect({ mainnet: false, checkVersion: false });
    expect(sdk.hasWriteAccess()).toBe(false);
    expect(sdk.hasCredentials()).toBe(false);
  });
});
