/**
 * Unit tests for built-in authenticator session input defaults.
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError } from '../../../src/errors/index.js';
import {
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator
} from '../../../src/internal/auth/authenticators/registry.js';

const PASSWORD_BYTES = toUtf8Bytes('secret');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);
const SIGNER = Wallet.createRandom();

function mockSession() {
  return {
    getPasswordBytes: () => PASSWORD_BYTES,
    getPasswordHash: () => PASSWORD_HASH
  };
}

describe('authenticator session input defaults', () => {
  test('password fills password from session', () => {
    expect(passwordAuthenticator.applySessionInput(mockSession(), {})).toEqual({
      password: PASSWORD_BYTES
    });
  });

  test('passwordMinuteSignature fills passwordHash from session', () => {
    expect(passwordMinuteSignatureAuthenticator.applySessionInput(mockSession(), {})).toEqual({
      passwordHash: PASSWORD_HASH
    });
  });

  test('dualFactor fills passwordHash but requires signer', () => {
    expect(
      dualFactorAuthenticator.applySessionInput(mockSession(), { signer: SIGNER })
    ).toEqual({ passwordHash: PASSWORD_HASH, signer: SIGNER });
  });

  test('walletSignature requires explicit signer', () => {
    expect(() => walletSignatureAuthenticator.applySessionInput(mockSession(), {})).toThrow(
      ValidationError
    );
  });

  test('password requires session when password omitted', () => {
    expect(() => passwordAuthenticator.applySessionInput(null, {})).toThrow(
      /authProof\.password is required/
    );
  });

  test('does not override explicit authProof fields', () => {
    const customHash = '0x' + 'cd'.repeat(32);
    expect(
      dualFactorAuthenticator.applySessionInput(mockSession(), {
        passwordHash: customHash,
        signer: SIGNER
      })
    ).toEqual({ passwordHash: customHash, signer: SIGNER });
  });
});
