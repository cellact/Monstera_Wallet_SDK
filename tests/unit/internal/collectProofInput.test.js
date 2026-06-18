/**
 * Unit tests for {@link collectProofInput}.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { collectProofInput } from '../../../src/internal/auth/authenticators/collectProofInput.js';
import {
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  dualFactorAuthenticator
} from '../../../src/internal/auth/authenticators/registry.js';

const PASSWORD_BYTES = toUtf8Bytes('secret');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);
const WRONG_PASSWORD_BYTES = toUtf8Bytes('wrongpassword');
const WRONG_PASSWORD_HASH = keccak256(WRONG_PASSWORD_BYTES);

describe('collectProofInput', () => {
  test('password uses authProof.password over top-level options.password', () => {
    const result = collectProofInput(passwordAuthenticator, {
      password: toUtf8Bytes('ignored'),
      authProof: { password: PASSWORD_BYTES }
    });
    expect(result.password).toBe(PASSWORD_BYTES);
  });

  test('minuteSignature derives passwordHash from authProof.password', () => {
    const result = collectProofInput(passwordMinuteSignatureAuthenticator, {
      authProof: { password: WRONG_PASSWORD_BYTES }
    });
    expect(result.passwordHash).toBe(WRONG_PASSWORD_HASH);
  });

  test('minuteSignature prefers explicit passwordHash over password', () => {
    const customHash = '0x' + 'cd'.repeat(32);
    const result = collectProofInput(passwordMinuteSignatureAuthenticator, {
      authProof: { passwordHash: customHash, password: WRONG_PASSWORD_BYTES }
    });
    expect(result.passwordHash).toBe(customHash);
  });

  test('minuteSignature derives passwordHash from top-level options.password', () => {
    const result = collectProofInput(passwordMinuteSignatureAuthenticator, {
      password: WRONG_PASSWORD_BYTES
    });
    expect(result.passwordHash).toBe(WRONG_PASSWORD_HASH);
  });

  test('minuteSignature leaves passwordHash undefined when omitted', () => {
    const result = collectProofInput(passwordMinuteSignatureAuthenticator, {});
    expect(result.passwordHash).toBeUndefined();
  });

  test('dualFactor derives passwordHash from authProof.password', () => {
    const result = collectProofInput(dualFactorAuthenticator, {
      authProof: { password: WRONG_PASSWORD_BYTES }
    });
    expect(result.passwordHash).toBe(WRONG_PASSWORD_HASH);
  });

  test('explicit passwordHash is not overridden by session path', () => {
    const result = collectProofInput(passwordMinuteSignatureAuthenticator, {
      authProof: { passwordHash: PASSWORD_HASH }
    });
    expect(result.passwordHash).toBe(PASSWORD_HASH);
  });
});
