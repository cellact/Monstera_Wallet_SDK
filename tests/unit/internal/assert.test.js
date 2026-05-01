/**
 * Unit tests for assertion utilities
 */

import { describe, test, expect } from '@jest/globals';
import { expectValidAddress, expectValidHex } from '../../utils/assertions.js';
import { VALID_TEST_ADDRESS, INVALID_TEST_ADDRESS_NO_PREFIX } from '../../utils/fixtures.js';
import {
  isAddress,
  requireAddress,
  requireBytes,
  requireString,
  requireMnemonic,
  requireNumber,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireArray,
  requireBytes32,
  requireWalletOrHdNode,
  requireStringOrNumber,
  requireChainId,
  requireBigInt,
  isInFuture,
  requireObject
} from '../../../src/internal/assert.js';
import { normalizeBigInt, normalizeChainId } from '../../../src/internal/utils/normalize.js';
import { HDNodeWallet, Mnemonic, Wallet } from '../../../src/adapters/ethers/index.js';
import { keccak256, randomBytes, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';

describe('Assert Utilities', () => {
    describe('isAddress', () => {
        test('returns true for valid address string', () => {
            expectValidAddress(VALID_TEST_ADDRESS); // Validate test data
            expect(isAddress(VALID_TEST_ADDRESS)).toBe(true);
        });

        test('returns false for invalid address string', () => {
            expect(isAddress(INVALID_TEST_ADDRESS_NO_PREFIX)).toBe(false);
        });

        test('returns false for address object', () => {
            const address = { address: VALID_TEST_ADDRESS };
            expect(isAddress(address)).toBe(false);
        });

        test('returns false for undefined address', () => {
            const address = undefined;
            expect(isAddress(address)).toBe(false);
        });

        test('returns false for null address', () => {
            const address = null;
            expect(isAddress(address)).toBe(false);
        });

        test('returns true for all-lowercase hex (ethers accepts)', () => {
            expect(isAddress(VALID_TEST_ADDRESS)).toBe(true);
        });

        test('returns false for mixed-case address with invalid EIP-55 checksum', () => {
            const canonical = Wallet.createRandom().address;
            expect(isAddress(canonical)).toBe(true);
            const chars = [...canonical];
            let flipIdx = canonical.search(/[a-fA-F]/);
            if (flipIdx < 0) {
                flipIdx = canonical.length - 1;
            }
            chars[flipIdx] =
                chars[flipIdx] === chars[flipIdx].toUpperCase()
                    ? chars[flipIdx].toLowerCase()
                    : chars[flipIdx].toUpperCase();
            const corrupted = chars.join('');
            expect(corrupted).not.toBe(canonical);
            expect(isAddress(corrupted)).toBe(false);
        });
    });

    describe('requireAddress', () => {
        test('does not throw error for valid address string', () => {
            expectValidAddress(VALID_TEST_ADDRESS); // Validate test data
            expect(() => requireAddress(VALID_TEST_ADDRESS)).not.toThrow();
        });

        test('throws error for undefined address', () => {
            expect(() => requireAddress(undefined)).toThrow('address is required and must be a non-empty string');
        });

        test('throws error for null address', () => {
            expect(() => requireAddress(null)).toThrow('address is required and must be a non-empty string');
        });

        test('throws error for non string address', () => {
            const address = { address: VALID_TEST_ADDRESS };
            expect(() => requireAddress(address)).toThrow('address is required and must be a non-empty string');
        });

        test('throws error for invalid address string', () => {
            expect(() => requireAddress(INVALID_TEST_ADDRESS_NO_PREFIX)).toThrow('address must be a valid Ethereum address');
        });
       
    });

    describe('requireBytes', () => {
        test('does not throw error for valid bytes string', () => {
            expectValidHex(VALID_TEST_ADDRESS); // Validate test data (address is also valid hex)
            expect(() => requireBytes(VALID_TEST_ADDRESS)).not.toThrow();
        });

        test('does not throw error for valid bytes Uint8Array', () => {
            const bytes = new Uint8Array([1, 2, 3, 4, 5]);
            expect(() => requireBytes(bytes)).not.toThrow();
        });

        test('throws error for undefined bytes', () => {
            expect(() => requireBytes(undefined)).toThrow('bytes is required');
        });

        test('throws error for null bytes', () => {
            expect(() => requireBytes(null)).toThrow('bytes is required');
        });

        test('throws error for invalid bytes string', () => {
            expect(() => requireBytes(INVALID_TEST_ADDRESS_NO_PREFIX)).toThrow('bytes must be a valid hex string (0x...) or Uint8Array');
        });

        test('throws error for non string bytes', () => {
            const bytes = { bytes: VALID_TEST_ADDRESS };
            expect(() => requireBytes(bytes)).toThrow('must be a string (hex) or Uint8Array');
        });
    });

    describe('requireString', () => {
        test('does not throw error for valid string', () => {
            const string = 'Hello, world!';
            expect(() => requireString(string)).not.toThrow();
        });

        test('throws error for undefined string', () => {
            expect(() => requireString(undefined)).toThrow('string is required');
        });

        test('throws error for null string', () => {
            expect(() => requireString(null)).toThrow('string is required');
        });

        test('throws error for non string', () => {
            const string = { string: 'Hello, world!' };
            expect(() => requireString(string)).toThrow('string is required and must be a non-empty string');
        });

        test('throws error for empty string', () => {
            expect(() => requireString('')).toThrow('string is required and must be a non-empty string');
        });

        test('throws error for whitespace-only string', () => {
            expect(() => requireString('   \t')).toThrow('string is required and must be a non-empty string');
        });
    });

    describe('requireMnemonic', () => {
        test('does not throw error for valid mnemonic string 12 words', () => {
            // Generate a valid 12-word mnemonic using 128 bits of entropy
            const entropy = randomBytes(16); // 16 bytes = 128 bits
            const mnemonic = Mnemonic.fromEntropy(entropy).phrase;
            expect(() => requireMnemonic(mnemonic)).not.toThrow();
        });

        test('does not throw error for valid mnemonic string 24 words', () => {
            // Generate a valid 24-word mnemonic using 256 bits of entropy
            const entropy = randomBytes(32); // 32 bytes = 256 bits
            const mnemonic = Mnemonic.fromEntropy(entropy).phrase;
            expect(() => requireMnemonic(mnemonic)).not.toThrow();
        });

        test('throws error for undefined mnemonic', () => {
            expect(() => requireMnemonic(undefined)).toThrow('mnemonic is required and must be a non-empty string');
        });

        test('throws error for null mnemonic', () => {
            expect(() => requireMnemonic(null)).toThrow('mnemonic is required and must be a non-empty string');
        });

        test('throws error for non string mnemonic', () => {
            const mnemonic = { mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' };
            expect(() => requireMnemonic(mnemonic)).toThrow('mnemonic is required and must be a non-empty string');
        });
        
        test('throws error for invalid mnemonic string length', () => {
            const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            expect(() => requireMnemonic(mnemonic)).toThrow('mnemonic must be a valid BIP39 mnemonic with 12 or 24 words (got 11 words)');
        });

        test('throws error for invalid mnemonic string words', () => {
            const mnemonic = 'cat dog mouse bird fish snake tiger lion elephant giraffe zebra monkey';
            expect(() => requireMnemonic(mnemonic)).toThrow('mnemonic is not a valid BIP39 mnemonic (invalid words, length, or checksum)');
        });

        test('throws error for invalid mnemonic string checksum', () => {
            // Start with a valid 12-word mnemonic
            const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            
            // Change the last word to break the checksum
            const invalidMnemonic = validMnemonic.replace('about', 'abandon');
            expect(() => requireMnemonic(invalidMnemonic)).toThrow('mnemonic is not a valid BIP39 mnemonic (invalid words, length, or checksum)');
        });
    });

    describe('requireNumber', () => {
        test('does not throw error for valid positive number', () => {
            const number = 1234567890;
            expect(() => requireNumber(number)).not.toThrow();
        });

        test('does not throw error for valid positive BigInt', () => {
            const number = BigInt(1234567890);
            expect(() => requireNumber(number)).not.toThrow();
        });

        test('does not throw error for 0 number', () => {
            const number = 0;
            expect(() => requireNumber(number)).not.toThrow();
        });

        test('does not throw error for 0 BigInt', () => {
            const number = BigInt(0);
            expect(() => requireNumber(number)).not.toThrow();
        });

        test('throws error for undefined number', () => {
            expect(() => requireNumber(undefined)).toThrow('number is required');
        });

        test('throws error for null number', () => {
            expect(() => requireNumber(null)).toThrow('number is required');
        });

        test('throws error for non number', () => {
            const number = { number: 1234567890 };
            expect(() => requireNumber(number)).toThrow('number is required and must be a number or BigInt');
        });

        test('throws error for negative number', () => {
            const number = -1234567890;
            expect(() => requireNumber(number)).toThrow('number must be non-negative');
        });

        test('throws error for zero when allowZero is false', () => {
            expect(() => requireNumber(0, 'number', { allowZero: false })).toThrow('number must be non-zero');
        });
        
        test('allows negative number when allowNegative is true', () => {
            expect(() => requireNumber(-5, 'number', { allowNegative: true })).not.toThrow();
        });
        
        test('throws error for non-integer when requireInteger is true', () => {
            expect(() => requireNumber(1.5, 'number', { requireInteger: true })).toThrow('number must be an integer');
        });
        
        test('allows non-integer by default', () => {
            expect(() => requireNumber(1.5)).not.toThrow();
        });
        
        test('throws error for negative BigInt', () => {
            expect(() => requireNumber(BigInt(-5))).toThrow('number must be non-negative');
        });
    });

    describe('requireNonNegativeInteger', () => {
        test('does not throw error for valid positive number', () => {
            const number = 1234567890;
            expect(() => requireNonNegativeInteger(number)).not.toThrow();
        });

        test('does not throw error for valid positive BigInt', () => {
            const number = BigInt(1234567890);
            expect(() => requireNonNegativeInteger(number)).not.toThrow();
        });

        test('does not throw error for 0 number', () => {
            const number = 0;
            expect(() => requireNonNegativeInteger(number)).not.toThrow();
        });

        test('does not throw error for 0 BigInt', () => {
            const number = BigInt(0);
            expect(() => requireNonNegativeInteger(number)).not.toThrow();
        });

        test('throws error for negative number', () => {
            const number = -1234567890;
            expect(() => requireNonNegativeInteger(number)).toThrow('number must be non-negative');
        });

        test('throws error for negative BigInt', () => {
            const number = BigInt(-1234567890);
            expect(() => requireNonNegativeInteger(number)).toThrow('number must be non-negative');
        });

        test('throws error for non-integer number', () => {
            expect(() => requireNonNegativeInteger(1.5)).toThrow('number must be an integer');
        });
    });

    describe('requirePositiveInteger', () => {
        test('does not throw error for valid positive number', () => {
            const number = 1234567890;
            expect(() => requirePositiveInteger(number)).not.toThrow();
        });

        test('does not throw error for valid positive BigInt', () => {
            const number = BigInt(1234567890);
            expect(() => requirePositiveInteger(number)).not.toThrow();
        });

        test('throws error for 0 number', () => {
            const number = 0;
            expect(() => requirePositiveInteger(number)).toThrow('number must be non-zero');
        });

        test('throws error for 0 BigInt', () => {
            const number = BigInt(0);
            expect(() => requirePositiveInteger(number)).toThrow('number must be non-zero');
        });

        test('throws error for negative number', () => {
            const number = -1234567890;
            expect(() => requirePositiveInteger(number)).toThrow('number must be non-negative');
        });

        test('throws error for negative BigInt', () => {
            const number = BigInt(-1234567890);
            expect(() => requirePositiveInteger(number)).toThrow('number must be non-negative');
        });

        test('throws error for non-integer number', () => {
            expect(() => requirePositiveInteger(1.5)).toThrow('number must be an integer');
        });
    });

    describe('requireArray', () => {
        test('does not throw for non-empty array', () => {
            expect(() => requireArray([1], 'items')).not.toThrow();
            expect(() => requireArray(['a'], 'tags')).not.toThrow();
        });

        test('throws when value is not an array', () => {
            expect(() => requireArray(null, 'items')).toThrow(
                'items is required and must be an array'
            );
            expect(() => requireArray(undefined, 'items')).toThrow(
                'items is required and must be an array'
            );
            expect(() => requireArray({ 0: 'x' }, 'items')).toThrow(
                'items is required and must be an array'
            );
        });

        test('throws when array is empty', () => {
            expect(() => requireArray([], 'items')).toThrow(
                'items must be a non-empty array'
            );
        });
    });

    describe('requireBytes32', () => {
        const bytes32 = keccak256(toUtf8Bytes('bytes32-test'));

        test('does not throw for valid 32-byte hex string', () => {
            expect(() => requireBytes32(bytes32, 'hash')).not.toThrow();
        });

        test('throws when value is missing or empty string', () => {
            expect(() => requireBytes32(undefined)).toThrow(
                'bytes32 is required and must be a non-empty string'
            );
            expect(() => requireBytes32(null)).toThrow(
                'bytes32 is required and must be a non-empty string'
            );
            expect(() => requireBytes32('')).toThrow(
                'bytes32 is required and must be a non-empty string'
            );
        });

        test('throws when hex is not exactly 32 bytes', () => {
            expect(() => requireBytes32('0x1234')).toThrow(
                'bytes32 must be a 32-byte hex string value'
            );
            expect(() => requireBytes32(VALID_TEST_ADDRESS)).toThrow(
                'bytes32 must be a 32-byte hex string value'
            );
        });
    });

    describe('requireWalletOrHdNode', () => {
        test('does not throw for ethers Wallet', () => {
            const w = Wallet.createRandom();
            expect(() => requireWalletOrHdNode(w)).not.toThrow();
        });

        test('does not throw for HDNodeWallet', () => {
            const mnemonic = Mnemonic.fromEntropy(randomBytes(16)).phrase;
            const hd = HDNodeWallet.fromPhrase(mnemonic);
            expect(() => requireWalletOrHdNode(hd, 'signer')).not.toThrow();
        });

        test('throws for null, undefined, or plain objects', () => {
            expect(() => requireWalletOrHdNode(null)).toThrow(
                'signer is required and must be a Wallet or HDNodeWallet'
            );
            expect(() => requireWalletOrHdNode(undefined)).toThrow(
                'signer is required and must be a Wallet or HDNodeWallet'
            );
            const notSigner = {};
            expect(() => requireWalletOrHdNode(notSigner, 'signer')).toThrow(
                'signer is required and must be a Wallet or HDNodeWallet'
            );
        });
    });

    describe('requireStringOrNumber', () => {
        test('does not throw for non-empty string or number', () => {
            expect(() => requireStringOrNumber('23295', 'chainId')).not.toThrow();
            expect(() => requireStringOrNumber('0x5aff', 'chainId')).not.toThrow();
            expect(() => requireStringOrNumber(23295, 'chainId')).not.toThrow();
        });

        test('throws for null, undefined, objects, arrays', () => {
            expect(() => requireStringOrNumber(null)).toThrow(
                'string or number is required and must be a string or number'
            );
            expect(() => requireStringOrNumber(undefined)).toThrow(
                'string or number is required and must be a string or number'
            );
            expect(() => requireStringOrNumber(/** @type {any} */ ([]))).toThrow(
                'string or number is required and must be a string or number'
            );
        });

        test('throws for numeric 0 due to falsy check', () => {
            expect(() => requireStringOrNumber(0, 'chainId')).toThrow(
                'chainId is required and must be a string or number'
            );
        });
    });

    describe('normalizeChainId', () => {
        test('returns undefined for nullish', () => {
            expect(normalizeChainId(undefined)).toBeUndefined();
            expect(normalizeChainId(null)).toBeUndefined();
        });

        test('normalizes decimal string, hex string, number, bigint', () => {
            expect(normalizeChainId('23295')).toBe(23295);
            expect(normalizeChainId('0x5aff')).toBe(23295);
            expect(normalizeChainId(23295)).toBe(23295);
            expect(normalizeChainId(0)).toBe(0);
            expect(normalizeChainId(BigInt(23295))).toBe(23295);
        });

        test('returns undefined for unparseable values', () => {
            expect(normalizeChainId({})).toBeUndefined();
            expect(normalizeChainId(NaN)).toBeUndefined();
            expect(normalizeChainId([])).toBeUndefined();
            expect(normalizeChainId('')).toBeUndefined();
        });
    });

    describe('normalizeBigInt', () => {
        test('returns undefined for nullish', () => {
            expect(normalizeBigInt(undefined)).toBeUndefined();
            expect(normalizeBigInt(null)).toBeUndefined();
        });

        test('normalizes bigint, integer number, and decimal / hex strings', () => {
            expect(normalizeBigInt(5n)).toBe(5n);
            expect(normalizeBigInt(42)).toBe(42n);
            expect(normalizeBigInt('99')).toBe(99n);
            expect(normalizeBigInt('0x10')).toBe(16n);
        });

        test('returns undefined for unparseable values', () => {
            expect(normalizeBigInt({})).toBeUndefined();
            expect(normalizeBigInt(1.5)).toBeUndefined();
            expect(normalizeBigInt(NaN)).toBeUndefined();
            expect(normalizeBigInt('')).toBeUndefined();
            expect(normalizeBigInt('   ')).toBeUndefined();
        });
    });

    describe('requireChainId', () => {
        test('returns normalized chain id', () => {
            expect(requireChainId('0x5aff', 'chainId')).toBe(23295);
            expect(requireChainId(0, 'chainId')).toBe(0);
            expect(requireChainId('23295', 'chainId')).toBe(23295);
        });

        test('throws when missing or invalid', () => {
            expect(() => requireChainId(undefined, 'chainId')).toThrow(
                'chainId is required and must be a chain id'
            );
            expect(() => requireChainId(null, 'chainId')).toThrow(
                'chainId is required and must be a chain id'
            );
            expect(() => requireChainId({}, 'chainId')).toThrow(
                'chainId must be a finite chain id (number, bigint, decimal string, or hex string)'
            );
        });
    });

    describe('requireBigInt', () => {
        test('returns bigint for bigint, integer number, and strings', () => {
            expect(requireBigInt(5n, 'n')).toBe(5n);
            expect(requireBigInt(42, 'n')).toBe(42n);
            expect(requireBigInt('99', 'n')).toBe(99n);
            expect(requireBigInt('0x10', 'n')).toBe(16n);
        });

        test('throws when missing or not coercible', () => {
            expect(() => requireBigInt(undefined, 'nonce')).toThrow(
                'nonce is required and must be a bigint'
            );
            expect(() => requireBigInt(1.5, 'nonce')).toThrow(
                'nonce must be a bigint, finite integer number, or decimal/hex string'
            );
            expect(() => requireBigInt({}, 'nonce')).toThrow(
                'nonce must be a bigint, finite integer number, or decimal/hex string'
            );
        });

        test('rejects negative when allowNegative is false', () => {
            expect(() => requireBigInt(-1n, 'nonce', { allowNegative: false })).toThrow(
                'nonce must be non-negative'
            );
            expect(requireBigInt(0n, 'nonce', { allowNegative: false })).toBe(0n);
        });
    });

    describe('requireObject (non-empty)', () => {
        test('does not throw for object with keys', () => {
            expect(() => requireObject({ a: 1 }, 'opts')).not.toThrow();
        });

        test('throws for empty object', () => {
            expect(() => requireObject({}, 'data')).toThrow('data must be a non-empty object');
        });

        test('throws for null', () => {
            expect(() => requireObject(null, 'data')).toThrow('data is required and must be an object');
        });
    });

    describe('isInFuture', () => {
        test('does not throw when value is strictly after current unix seconds', () => {
            const future = Math.floor(Date.now() / 1000) + 86400 * 365;
            expect(() => isInFuture(future, 'deadline')).not.toThrow();
        });

        test('throws when value is before now', () => {
            const past = 946684800;
            expect(() => isInFuture(past, 'deadline')).toThrow(
                'deadline must be in the future'
            );
        });
    });
});