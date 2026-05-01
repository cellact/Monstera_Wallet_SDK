/**
 * Integration tests for SDK initialization and configuration
 * 
 * These tests verify that SDK components are properly wired together
 * and that initialization works correctly with various configurations.
 */

import { describe, test, expect } from '@jest/globals';
import { Monstera } from '../../src/index.js';
import { JsonRpcProvider } from '../../src/adapters/ethers/provider.js';
import { expectValidAddress } from '../utils/assertions.js';
import { 
  TEST_SIGNER, 
  VALID_TEST_ADDRESS, 
  CUSTOM_RPC_URL, 
  DEFAULT_TESTNET_CHAIN_ID, 
  DEFAULT_MAINNET_CHAIN_ID,
  DEFAULT_TESTNET_RPC_URL
} from '../utils/fixtures.js';

describe('SDK Integration', () => {
  describe('Monstera.connect', () => {
    test('should create SDK instance with signer for testnet', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-testnet');
      expect(sdk.chainId).toBe(parseInt(DEFAULT_TESTNET_CHAIN_ID, 16));
      expect(sdk.hasWriteAccess()).toBe(true);
    });

    test('should create SDK instance with signer for mainnet', () => {
      const sdk = Monstera.connect({ mainnet: true, signer: TEST_SIGNER });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-mainnet');
      expect(sdk.chainId).toBe(parseInt(DEFAULT_MAINNET_CHAIN_ID, 16));
      expect(sdk.hasWriteAccess()).toBe(true);
    });

    test('should initialize all clients', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });
      
      expect(sdk.factory).toBeDefined();
      expect(sdk.logic).toBeDefined();
      expect(sdk.keyVault).toBeDefined();
      expect(sdk.auth).toBeDefined();
    });

    test('should use custom RPC URL', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER, rpcUrl: CUSTOM_RPC_URL });
      
      expect(sdk.rpcUrl).toBe(CUSTOM_RPC_URL);
    });

    test('should use custom addresses', () => {
      const customAddresses = {
        factory: VALID_TEST_ADDRESS
      };
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER, addresses: customAddresses });
      
      expect(sdk.addresses.factory).toBe(VALID_TEST_ADDRESS);
      // Should still have defaults for other addresses
      expect(sdk.addresses.passwordAuth).toBeDefined();
      expect(sdk.addresses.walletSignatureAuth).toBeDefined();
      expect(sdk.addresses.dualFactorAuth).toBeDefined();
      expect(sdk.addresses.passwordMinuteSignatureAuth).toBeDefined();
    });

    test('should create read-only SDK when signer is omitted', () => {
      const sdk = Monstera.connect({ mainnet: false });
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('should accept checkVersion false (version check is opt-in via checkVersion true)', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER, checkVersion: false });
      
      expect(sdk).toBeDefined();
    });
  });

  describe('Monstera.connect (read-only)', () => {
    test('should create read-only SDK instance for testnet', () => {
      const sdk = Monstera.connect({ mainnet: false });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-testnet');
      expect(sdk.chainId).toBe(parseInt(DEFAULT_TESTNET_CHAIN_ID, 16));
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('should create read-only SDK instance for mainnet', () => {
      const sdk = Monstera.connect({ mainnet: true });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-mainnet');
      expect(sdk.chainId).toBe(parseInt(DEFAULT_MAINNET_CHAIN_ID, 16));
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('should initialize all clients (read-only)', () => {
      const sdk = Monstera.connect({ mainnet: false });
      
      expect(sdk.factory).toBeDefined();
      expect(sdk.logic).toBeDefined();
      expect(sdk.keyVault).toBeDefined();
      expect(sdk.auth).toBeDefined();
    });

    test('should accept custom provider', () => {
      const provider = new JsonRpcProvider(DEFAULT_TESTNET_RPC_URL);
      const sdk = Monstera.connect({ mainnet: false, provider });
      
      expect(sdk.provider).toBe(provider);
    });

    test('should use custom RPC URL', () => {
      const sdk = Monstera.connect({ mainnet: false, rpcUrl: CUSTOM_RPC_URL });
      
      expect(sdk.rpcUrl).toBe(CUSTOM_RPC_URL);
    });
  });

  describe('SDK Instance Properties', () => {
    test('should expose network properties', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });

      expect(sdk.network).toBe('sapphire-testnet');
      expect(sdk.chainId).toBe(parseInt(DEFAULT_TESTNET_CHAIN_ID, 16));
      expect(sdk.rpcUrl).toBeDefined();
      expect(sdk.addresses).toBeDefined();
      // connect() does not set config.provider; reads use internal readProvider from rpcUrl
      expect(sdk.provider).toBeNull();
    });

    test('should expose static network presets', () => {
      expect(Monstera.networks).toBeDefined();
      expect(Monstera.networks.testnet).toBeDefined();
      expect(Monstera.networks.mainnet).toBeDefined();
    });

    test('should expose static default addresses', () => {
      expect(Monstera.defaultAddresses).toBeDefined();
      expect(Monstera.defaultAddresses.testnet).toBeDefined();
      expect(Monstera.defaultAddresses.mainnet).toBeDefined();
    });

    test('should expose static required addresses', () => {
      expect(Monstera.requiredAddresses).toBeDefined();
      expect(Array.isArray(Monstera.requiredAddresses)).toBe(true);
    });
  });

  describe('SDK Utility Methods', () => {
    test('hasWriteAccess should return true for connect()', async () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });
      
      expect(sdk.hasWriteAccess()).toBe(true);
    });

    test('hasWriteAccess should return false for connect() without signer', () => {
      const sdk = Monstera.connect({ mainnet: false });
      
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('getSignerAddr should return address for connect()', async () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });
      
      const address = await sdk.getSignerAddr();
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expectValidAddress(address);
    });

    test('getSignerAddr should return null for connect() without signer', async () => {
      const sdk = Monstera.connect({ mainnet: false });
      
      const address = await sdk.getSignerAddr();
      expect(address).toBeNull();
    });

    test('getAuthClient should return password auth client', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });
      const passwordAuth = sdk.getAuthClient('password');
      expect(passwordAuth).toBeDefined();
    });

    test('getAvailableAuthTypes should return array of auth types', () => {
      const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER });
      const authTypes = sdk.getAvailableAuthTypes();
      expect(authTypes).toBeDefined();
      expect(Array.isArray(authTypes)).toBe(true);
      expect(authTypes.length).toBeGreaterThan(0);

      // optionally check if specific auth types are present
      expect(authTypes).toContain('password');
      expect(authTypes).toContain('walletSignature');
    });
  });
});