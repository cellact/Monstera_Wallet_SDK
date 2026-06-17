/**
 * Unit tests for {@link applySessionAuthProofDefaults}.
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError } from '../../../src/errors/index.js';
import { applySessionAuthProofDefaults } from '../../../src/internal/auth/proof/sessionAuthProofDefaults.js';

const PASSWORD_BYTES = toUtf8Bytes('secret');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);
const SIGNER = Wallet.createRandom();

function mockSession() {
  return {
    getPasswordBytes: () => PASSWORD_BYTES,
    getPasswordHash: () => PASSWORD_HASH
  };
}

describe('applySessionAuthProofDefaults', () => {
  test('passwordAuth fills password from session', () => {
    expect(
      applySessionAuthProofDefaults({
        authenticatorId: 'passwordAuth',
        session: mockSession(),
        authProof: undefined
      })
    ).toEqual({ password: PASSWORD_BYTES });
  });

  test('passwordMinuteSignatureAuth fills passwordHash from session', () => {
    expect(
      applySessionAuthProofDefaults({
        authenticatorId: 'passwordMinuteSignatureAuth',
        session: mockSession(),
        authProof: undefined
      })
    ).toEqual({ passwordHash: PASSWORD_HASH });
  });

  test('dualFactorAuth fills passwordHash but requires signer', () => {
    expect(
      applySessionAuthProofDefaults({
        authenticatorId: 'dualFactorAuth',
        session: mockSession(),
        authProof: { signer: SIGNER }
      })
    ).toEqual({ passwordHash: PASSWORD_HASH, signer: SIGNER });
  });

  test('walletSignatureAuth requires explicit signer', () => {
    expect(() =>
      applySessionAuthProofDefaults({
        authenticatorId: 'walletSignatureAuth',
        session: mockSession(),
        authProof: undefined
      })
    ).toThrow(ValidationError);
  });

  test('passwordAuth requires session when password omitted', () => {
    expect(() =>
      applySessionAuthProofDefaults({
        authenticatorId: 'passwordAuth',
        session: null,
        authProof: undefined
      })
    ).toThrow(/authProof\.password is required/);
  });

  test('does not override explicit authProof fields', () => {
    const customHash = '0x' + 'cd'.repeat(32);
    expect(
      applySessionAuthProofDefaults({
        authenticatorId: 'dualFactorAuth',
        session: mockSession(),
        authProof: { passwordHash: customHash, signer: SIGNER }
      })
    ).toEqual({ passwordHash: customHash, signer: SIGNER });
  });
});
