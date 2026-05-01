/**
 * Unit tests for ethers → SDK error translation
 */

import { describe, test, expect } from '@jest/globals';
import { Interface } from '../../../src/adapters/ethers/encoding.js';
import {
  toWalletError,
  applySdkContext,
  decodeCustomError,
  rethrowExecuteError,
  ContractRevertError,
  NetworkError,
  WalletError
} from '../../../src/errors/index.js';

describe('ethersErrorTranslator', () => {
  test('CALL_EXCEPTION without receipt becomes ContractRevertError when revert is present', () => {
    const err = new Error('execution reverted');
    err.code = 'CALL_EXCEPTION';
    err.action = 'call';
    err.reason = 'AuthenticationFailed()';
    err.data = '0x5e3c6325';
    err.revert = { name: 'AuthenticationFailed', signature: 'AuthenticationFailed()', args: [] };

    const w = toWalletError(err, {
      methodName: 'execute with auth',
      rpcUrl: 'https://testnet.sapphire.oasis.dev',
      sdkContext: { client: 'KeyVaultClient', keyVaultAddr: '0x42f0c7932dA41a4f9063230145EEbD35f827179a' }
    });

    expect(w).toBeInstanceOf(ContractRevertError);
    expect(w.code).toBe('TX_REVERTED');
    expect(w.message).toContain('Call reverted');
    expect(w.context.revertReason).toBe('AuthenticationFailed');
    expect(w.context.client).toBe('KeyVaultClient');
    expect(w.context.keyVaultAddr).toBe('0x42f0c7932dA41a4f9063230145EEbD35f827179a');
    expect(w.context.transactionHash == null).toBe(true);
  });

  test('CALL_EXCEPTION without revert payload stays NetworkError', () => {
    const err = new Error('missing trie node');
    err.code = 'CALL_EXCEPTION';
    err.action = 'call';

    const w = toWalletError(err, {
      methodName: 'some read',
      rpcUrl: 'https://rpc.example',
      sdkContext: { client: 'TestClient' }
    });

    expect(w).toBeInstanceOf(NetworkError);
    expect(w.code).toBe('RPC_ERROR');
    expect(w.context.client).toBe('TestClient');
  });

  test('rethrowExecuteError merges context on WalletError and uses toWalletError otherwise', () => {
    const w = new WalletError('inner', 'UNKNOWN_ERROR', {});
    try {
      rethrowExecuteError(w, {
        methodName: 'op',
        rpcUrl: null,
        sdkContext: { client: 'X' }
      });
    } catch (e) {
      expect(e).toBe(w);
      expect(w.context.client).toBe('X');
    }

    const raw = new Error('fail');
    raw.code = 'CALL_EXCEPTION';
    raw.action = 'call';
    raw.reason = 'Bad()';
    expect(() =>
      rethrowExecuteError(raw, {
        methodName: 'op',
        rpcUrl: null,
        sdkContext: {}
      })
    ).toThrow(ContractRevertError);
  });

  test('applySdkContext merges onto existing WalletError', () => {
    const err = new WalletError('x', 'UNKNOWN_ERROR', { function: 'test' });
    applySdkContext(err, { client: 'C', methodName: 'm' });
    expect(err.context.client).toBe('C');
    expect(err.context.methodName).toBe('m');
    expect(err.context.function).toBe('test');
  });

  test('MISSING_ARGUMENT maps to WalletError ABI_ENCODER_ERROR', () => {
    const err = new Error('missing argument: types/values length mismatch');
    err.code = 'MISSING_ARGUMENT';
    /** @type {any} */ (err).count = 5;
    /** @type {any} */ (err).expectedCount = 6;

    const w = toWalletError(err, {
      methodName: 'encode call',
      rpcUrl: null,
      sdkContext: { client: 'ExampleClient' }
    });

    expect(w).toBeInstanceOf(WalletError);
    expect(w.code).toBe('ABI_ENCODER_ERROR');
    expect(w.message).toContain('ABI encoding failed');
    expect(w.context.argumentCount).toBe(5);
    expect(w.context.expectedArgumentCount).toBe(6);
    expect(w.context.client).toBe('ExampleClient');
  });

  test('UNKNOWN_ERROR sanitizes sensitive sdkContext keys', () => {
    const err = new Error('something broke');
    err.code = 'SOME_UNKNOWN_CODE';

    const w = toWalletError(err, {
      methodName: 'op',
      rpcUrl: 'https://example.com',
      sdkContext: {
        client: 'KeyVaultClient',
        authProof: '0xdeadbeef',
        keyVaultAddr: '0x42f0c7932dA41a4f9063230145EEbD35f827179a'
      }
    });

    expect(w).toBeInstanceOf(WalletError);
    expect(w.context.client).toBe('KeyVaultClient');
    expect(w.context.keyVaultAddr).toBe('0x42f0c7932dA41a4f9063230145EEbD35f827179a');
    expect(w.context.authProof).toEqual({
      redacted: true,
      valueKind: 'string',
      valueLength: 10
    });
  });

  test('decodeCustomError uses Interface.parseError', () => {
    const iface = new Interface(['error AlreadyConfigured()', 'error AuthenticationFailed()']);
    const out = decodeCustomError(iface, '0x11b61b6a');
    expect(out.revertReason).toBe('AlreadyConfigured');
    expect(out.revertArgs).toBeNull();
    expect(out.revertSignature).toBe('AlreadyConfigured()');
  });
});
