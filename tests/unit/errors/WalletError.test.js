/**
 * Unit tests for WalletError and all error subclasses
 */

import { describe, test, expect } from '@jest/globals';
import { expectValidTxHash } from '../../utils/assertions.js';
import { TEST_TX_HASH } from '../../utils/fixtures.js';
import {
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  SapphireRequiredError,
  WriteRequiresSignerError,
  EventParseError
} from '../../../src/errors/index.js';

describe('WalletError', () => {
  describe('Base WalletError', () => {
    test('should create a new WalletError with message', () => {
      const error = new WalletError('Test error message');
      expect(error).toBeDefined();
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('WalletError');
    });

    test('should create WalletError with message and code', () => {
      const error = new WalletError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('WalletError');
    });

    test('should create WalletError with message, code, and context', () => {
      const context = { function: 'test', parameter: 'testParam' };
      const error = new WalletError('Test error', 'TEST_CODE', context);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual(context);
    });

    test('should have empty context by default', () => {
      const error = new WalletError('Test error', 'TEST_CODE');
      expect(error.context).toEqual({});
    });

    test('should be instance of Error', () => {
      const error = new WalletError('Test error');
      expect(error instanceof Error).toBe(true);
    });

    test('should be instance of WalletError', () => {
      const error = new WalletError('Test error');
      expect(error instanceof WalletError).toBe(true);
    });

    test('toJSON should return error details', () => {
      const context = { function: 'test', parameter: 'testParam' };
      const error = new WalletError('Test error', 'TEST_CODE', context);
      const json = error.toJSON();
      
      expect(json.name).toBe('WalletError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.context).toEqual(context);
      expect(json.stack).toBeDefined();
    });

    test('toString should return formatted error message', () => {
      const error = new WalletError('Test error', 'TEST_CODE', {
        function: 'testFunction',
        parameter: 'testParam'
      });
      const str = error.toString();
      
      expect(str).toContain('WalletError: Test error');
      expect(str).toContain('Code: TEST_CODE');
      expect(str).toContain('Function: testFunction');
      expect(str).toContain('Parameter: testParam');
    });

    test('toString should work without code', () => {
      const error = new WalletError('Test error');
      const str = error.toString();
      expect(str).toBe('WalletError: Test error');
    });

    test('toString should work without context', () => {
      const error = new WalletError('Test error', 'TEST_CODE');
      const str = error.toString();
      expect(str).toBe('WalletError: Test error (Code: TEST_CODE)');
    });
  });

  describe('ValidationError', () => {
    test('should create ValidationError with message and parameter', () => {
      const error = new ValidationError('Invalid address', 'address');
      expect(error.message).toBe('Invalid address');
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('INVALID_ARGUMENT');
      expect(error.context.parameter).toBe('address');
      expect(error.context.value).toBeNull();
    });

    test('should create ValidationError with value', () => {
      const error = new ValidationError('Invalid address', 'address', '0x123');
      expect(error.context.parameter).toBe('address');
      expect(error.context.value).toBe('0x123');
    });

    test('should redact sensitive parameter values in context', () => {
      const secret = 'word '.repeat(12).trim();
      const error = new ValidationError('bad mnemonic', 'mnemonic', secret);
      expect(error.context.parameter).toBe('mnemonic');
      expect(error.context.value).toEqual({
        redacted: true,
        valueKind: 'string',
        valueLength: secret.length
      });
    });

    test('should be instance of WalletError', () => {
      const error = new ValidationError('Test', 'param');
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new ValidationError('Test', 'param');
      expect(error.context.function).toBe('validation');
    });
  });

  describe('ConfigError', () => {
    test('should create ConfigError with message', () => {
      const error = new ConfigError('Missing configuration');
      expect(error.message).toBe('Missing configuration');
      expect(error.name).toBe('ConfigError');
      expect(error.code).toBe('MISSING_CONFIG');
    });

    test('should create ConfigError with missingField', () => {
      const error = new ConfigError('Missing configuration', 'rpcUrl');
      expect(error.context.missingField).toBe('rpcUrl');
    });

    test('should be instance of WalletError', () => {
      const error = new ConfigError('Test');
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof ConfigError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new ConfigError('Test');
      expect(error.context.function).toBe('configuration');
    });
  });

  describe('NetworkError', () => {
    test('should create NetworkError with message', () => {
      const error = new NetworkError('Network error');
      expect(error.message).toBe('Network error');
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('RPC_ERROR');
    });

    test('should create NetworkError with rpcUrl', () => {
      const error = new NetworkError('Network error', 'https://rpc.example.com');
      expect(error.context.rpcUrl).toBe('https://rpc.example.com');
    });

    test('should create NetworkError with originalError', () => {
      const originalError = new Error('Original error');
      const error = new NetworkError('Network error', null, originalError);
      expect(error.originalError).toBe(originalError);
      expect(error.context.originalError).toBe('Original error');
    });

    test('should handle null originalError', () => {
      const error = new NetworkError('Network error', null, null);
      expect(error.originalError).toBeNull();
      expect(error.context.originalError).toBeNull();
    });

    test('should be instance of WalletError', () => {
      const error = new NetworkError('Test');
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof NetworkError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new NetworkError('Test');
      expect(error.context.function).toBe('network');
    });
  });

  describe('ContractRevertError', () => {
    test('should create ContractRevertError with message', () => {
      const error = new ContractRevertError('Transaction reverted');
      expect(error.message).toBe('Transaction reverted');
      expect(error.name).toBe('ContractRevertError');
      expect(error.code).toBe('TX_REVERTED');
    });

    test('should create ContractRevertError with transactionHash', () => {
      const error = new ContractRevertError('Transaction reverted', null, null, TEST_TX_HASH);
      expect(error.context.transactionHash).toBe(TEST_TX_HASH);
      expectValidTxHash(error.context.transactionHash);
    });

    test('should create ContractRevertError with receipt', () => {
      const receipt = { status: 0, gasUsed: '100000' };
      const error = new ContractRevertError('Transaction reverted', null, null, null, receipt);
      expect(error.context.receipt).toBe(receipt);
    });

    test('should be instance of WalletError', () => {
      const error = new ContractRevertError('Test');
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof ContractRevertError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new ContractRevertError('Test');
      expect(error.context.function).toBe('transaction');
    });

    test('should merge optional extra context (e.g. revertArgs)', () => {
      const error = new ContractRevertError(
        'Transaction reverted: CustomError',
        '0xabcd',
        'CustomError',
        TEST_TX_HASH,
        null,
        { revertArgs: [1n, '0x1234'] }
      );
      expect(error.context.revertArgs).toEqual([1n, '0x1234']);
    });
  });

  describe('EventNotFoundError', () => {
    test('should create EventNotFoundError with eventName', () => {
      const error = new EventNotFoundError('WalletCreated');
      expect(error.message).toBe('WalletCreated event not found in transaction receipt');
      expect(error.name).toBe('EventNotFoundError');
      expect(error.code).toBe('EVENT_NOT_FOUND');
      expect(error.context.eventName).toBe('WalletCreated');
    });

    test('should create EventNotFoundError with transactionHash', () => {
      const error = new EventNotFoundError('WalletCreated', TEST_TX_HASH);
      expect(error.context.transactionHash).toBe(TEST_TX_HASH);
      expectValidTxHash(error.context.transactionHash);
    });

    test('should be instance of WalletError', () => {
      const error = new EventNotFoundError('Test');
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof EventNotFoundError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new EventNotFoundError('Test');
      expect(error.context.function).toBe('event_parsing');
    });
  });

  describe('SapphireRequiredError', () => {
    test('should create SapphireRequiredError with default message', () => {
      const error = new SapphireRequiredError();
      expect(error.message).toBe('Sapphire signer is required for this operation');
      expect(error.name).toBe('SapphireRequiredError');
      expect(error.code).toBe('SAPPHIRE_REQUIRED');
    });

    test('should create SapphireRequiredError with custom message', () => {
      const error = new SapphireRequiredError('Custom message');
      expect(error.message).toBe('Custom message');
    });

    test('should be instance of WalletError', () => {
      const error = new SapphireRequiredError();
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof SapphireRequiredError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new SapphireRequiredError();
      expect(error.context.function).toBe('sapphire_check');
    });
  });

  describe('WriteRequiresSignerError', () => {
    test('should create WriteRequiresSignerError with default operation', () => {
      const error = new WriteRequiresSignerError();
      expect(error.message).toBe(
        'Signer is required for operation. Use Monstera.connectAdmin({ signer, ... }) or Monstera.connect({ signer, credentials, ... })'
      );
      expect(error.name).toBe('WriteRequiresSignerError');
      expect(error.code).toBe('WRITE_REQUIRES_SIGNER');
      expect(error.context.operation).toBe('operation');
    });

    test('should create WriteRequiresSignerError with custom operation', () => {
      const error = new WriteRequiresSignerError('createWallet');
      expect(error.message).toBe(
        'Signer is required for createWallet. Use Monstera.connectAdmin({ signer, ... }) or Monstera.connect({ signer, credentials, ... })'
      );
      expect(error.context.operation).toBe('createWallet');
    });

    test('should be instance of WalletError', () => {
      const error = new WriteRequiresSignerError();
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof WriteRequiresSignerError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new WriteRequiresSignerError();
      expect(error.context.function).toBe('signer_check');
    });
  });

  describe('EventParseError', () => {
    test('should create EventParseError with eventName', () => {
      const error = new EventParseError('WalletCreated');
      expect(error.message).toContain('Failed to parse WalletCreated event');
      expect(error.name).toBe('EventParseError');
      expect(error.code).toBe('EVENT_PARSE_ERROR');
      expect(error.context.eventName).toBe('WalletCreated');
    });

    test('should create EventParseError with transactionHash', () => {
      const error = new EventParseError('WalletCreated', TEST_TX_HASH);
      expect(error.context.transactionHash).toBe(TEST_TX_HASH);
      expectValidTxHash(error.context.transactionHash);
    });

    test('should create EventParseError with originalError', () => {
      const originalError = new Error('Parse failed');
      const error = new EventParseError('WalletCreated', null, originalError);
      expect(error.originalError).toBe(originalError);
      expect(error.context.originalError).toBe('Parse failed');
      expect(error.message).toContain('Parse failed');
    });

    test('should handle null originalError', () => {
      const error = new EventParseError('WalletCreated', null, null);
      expect(error.originalError).toBeNull();
      expect(error.context.originalError).toBeNull();
      expect(error.message).toContain('Unknown parsing error');
    });

    test('should be instance of WalletError', () => {
      const error = new EventParseError('Test');
      expect(error instanceof WalletError).toBe(true);
      expect(error instanceof EventParseError).toBe(true);
    });

    test('should have correct context function', () => {
      const error = new EventParseError('Test');
      expect(error.context.function).toBe('event_parsing');
    });
  });
});
