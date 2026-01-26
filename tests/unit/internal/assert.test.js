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
  requirePositiveInteger
} from '../../../src/internal/assert.js';
import { ethers } from 'ethers';

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
    });

    describe('requireAddress', () => {
        test('does not throw error for valid address string', () => {
            expectValidAddress(VALID_TEST_ADDRESS); // Validate test data
            expect(() => requireAddress(VALID_TEST_ADDRESS)).not.toThrow();
        });

        test('throws error for undefined address', () => {
            expect(() => requireAddress(undefined)).toThrow('address is required and must be a string');
        });

        test('throws error for null address', () => {
            expect(() => requireAddress(null)).toThrow('address is required and must be a string');
        });

        test('throws error for non string address', () => {
            const address = { address: VALID_TEST_ADDRESS };
            expect(() => requireAddress(address)).toThrow('address is required and must be a string');
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
            expect(() => requireString(string)).toThrow('string is required and must be a string');
        });
    });

    describe('requireMnemonic', () => {
        test('does not throw error for valid mnemonic string 12 words', () => {
            // Generate a valid 12-word mnemonic using 128 bits of entropy
            const entropy = ethers.randomBytes(16); // 16 bytes = 128 bits
            const mnemonic = ethers.Mnemonic.fromEntropy(entropy).phrase;
            expect(() => requireMnemonic(mnemonic)).not.toThrow();
        });

        test('does not throw error for valid mnemonic string 24 words', () => {
            // Generate a valid 24-word mnemonic using 256 bits of entropy
            const entropy = ethers.randomBytes(32); // 32 bytes = 256 bits
            const mnemonic = ethers.Mnemonic.fromEntropy(entropy).phrase;
            expect(() => requireMnemonic(mnemonic)).not.toThrow();
        });

        test('throws error for undefined mnemonic', () => {
            expect(() => requireMnemonic(undefined)).toThrow('mnemonic is required and must be a string');
        });

        test('throws error for null mnemonic', () => {
            expect(() => requireMnemonic(null)).toThrow('mnemonic is required and must be a string');
        });

        test('throws error for non string mnemonic', () => {
            const mnemonic = { mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' };
            expect(() => requireMnemonic(mnemonic)).toThrow('mnemonic is required and must be a string');
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
});