/**
 * Unit tests for spec {@link collectProofInput} methods.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import {
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  dualFactorAuthenticator
} from '../../../src/internal/auth/specs/registry.js';

const PASSWORD_BYTES = toUtf8Bytes('secret');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);
const WRONG_PASSWORD_BYTES = toUtf8Bytes('wrongpassword');
const WRONG_PASSWORD_HASH = keccak256(WRONG_PASSWORD_BYTES);

describe('spec.collectProofInput', () => {
  test('password uses authProof.password over top-level options.password', () => {
    const result = passwordAuthenticator.collectProofInput({
      password: toUtf8Bytes('ignored'),
      authProof: { password: PASSWORD_BYTES }
    });
    expect(result.password).toBe(PASSWORD_BYTES);
  });

  test('minuteSignature derives passwordHash from authProof.password', () => {
    const result = passwordMinuteSignatureAuthenticator.collectProofInput({
      authProof: { password: WRONG_PASSWORD_BYTES }
    });
    expect(result.passwordHash).toBe(WRONG_PASSWORD_HASH);
  });

  test('minuteSignature prefers explicit passwordHash over password', () => {
    const customHash = '0x' + 'cd'.repeat(32);
    const result = passwordMinuteSignatureAuthenticator.collectProofInput({
      authProof: { passwordHash: customHash, password: WRONG_PASSWORD_BYTES }
    });
    expect(result.passwordHash).toBe(customHash);
  });

  test('minuteSignature derives passwordHash from top-level options.password', () => {
    const result = passwordMinuteSignatureAuthenticator.collectProofInput({
      password: WRONG_PASSWORD_BYTES
    });
    expect(result.passwordHash).toBe(WRONG_PASSWORD_HASH);
  });

  test('minuteSignature leaves passwordHash undefined when omitted', () => {
    const result = passwordMinuteSignatureAuthenticator.collectProofInput({});
    expect(result.passwordHash).toBeUndefined();
  });

  test('dualFactor derives passwordHash from authProof.password', () => {
    const result = dualFactorAuthenticator.collectProofInput({
      authProof: { password: WRONG_PASSWORD_BYTES }
    });
    expect(result.passwordHash).toBe(WRONG_PASSWORD_HASH);
  });

  test('explicit passwordHash is not overridden by session path', () => {
    const result = passwordMinuteSignatureAuthenticator.collectProofInput({
      authProof: { passwordHash: PASSWORD_HASH }
    });
    expect(result.passwordHash).toBe(PASSWORD_HASH);
  });
});
