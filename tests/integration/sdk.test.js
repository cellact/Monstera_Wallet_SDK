/**
 * Integration tests for SDK initialization and configuration
 * 
 * These tests verify that SDK components are properly wired together
 * and that initialization works correctly with various configurations.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';

describe('SDK Integration', () => {
  describe('Monstera.connect', () => {
    test('should create SDK instance with signer for testnet', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-testnet');
      expect(sdk.chainId).toBe(0x5aff);
      expect(sdk.hasWriteAccess()).toBe(true);
    });

    test('should create SDK instance with signer for mainnet', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: true, signer });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-mainnet');
      expect(sdk.chainId).toBe(0x5afe);
      expect(sdk.hasWriteAccess()).toBe(true);
    });

    test('should initialize all clients', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });
      
      expect(sdk.factory).toBeDefined();
      expect(sdk.logic).toBeDefined();
      expect(sdk.keyVault).toBeDefined();
      expect(sdk.auth).toBeDefined();
    });

    test('should use custom RPC URL', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const customRpc = 'https://custom-rpc.example.com';
      const sdk = Monstera.connect({ mainnet: false, signer, rpcUrl: customRpc });
      
      expect(sdk.rpcUrl).toBe(customRpc);
    });

    test('should use custom addresses', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const customAddresses = {
        factory: '0x1234567890123456789012345678901234567890'
      };
      const sdk = Monstera.connect({ mainnet: false, signer, addresses: customAddresses });
      
      expect(sdk.addresses.factory).toBe('0x1234567890123456789012345678901234567890');
      // Should still have defaults for other addresses
      expect(sdk.addresses.passwordAuth).toBeDefined();
      expect(sdk.addresses.walletSignatureAuth).toBeDefined();
    });

    test('should throw error if signer is missing', () => {
      expect(() => Monstera.connect({ mainnet: false })).toThrow('signer is required');
    });

    test('should disable version checking when checkVersion is false', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer, checkVersion: false });
      
      expect(sdk).toBeDefined();
      // Version check should be disabled (no way to verify directly, but SDK should still work)
    });
  });

  describe('Monstera.readonly', () => {
    test('should create read-only SDK instance for testnet', () => {
      const sdk = Monstera.readonly({ mainnet: false });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-testnet');
      expect(sdk.chainId).toBe(0x5aff);
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('should create read-only SDK instance for mainnet', () => {
      const sdk = Monstera.readonly({ mainnet: true });
      
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe('sapphire-mainnet');
      expect(sdk.chainId).toBe(0x5afe);
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('should initialize all clients (read-only)', () => {
      const sdk = Monstera.readonly({ mainnet: false });
      
      expect(sdk.factory).toBeDefined();
      expect(sdk.logic).toBeDefined();
      expect(sdk.keyVault).toBeDefined();
      expect(sdk.auth).toBeDefined();
    });

    test('should accept custom provider', () => {
      const provider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
      const sdk = Monstera.readonly({ mainnet: false, provider });
      
      expect(sdk.provider).toBe(provider);
    });

    test('should use custom RPC URL', () => {
      const customRpc = 'https://custom-rpc.example.com';
      const sdk = Monstera.readonly({ mainnet: false, rpcUrl: customRpc });
      
      expect(sdk.rpcUrl).toBe(customRpc);
    });
  });

  describe('SDK Instance Properties', () => {
    test('should expose network properties', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });

      expect(sdk.network).toBe('sapphire-testnet');
      expect(sdk.chainId).toBe(0x5aff);
      expect(sdk.rpcUrl).toBeDefined();
      expect(sdk.addresses).toBeDefined();
      expect(sdk.provider).toBeDefined();
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
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });
      
      expect(sdk.hasWriteAccess()).toBe(true);
    });

    test('hasWriteAccess should return false for readonly()', () => {
      const sdk = Monstera.readonly({ mainnet: false });
      
      expect(sdk.hasWriteAccess()).toBe(false);
    });

    test('getSignerAddr should return address for connect()', async () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });
      
      const address = await sdk.getSignerAddr();
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('getSignerAddr should return null for readonly()', async () => {
      const sdk = Monstera.readonly({ mainnet: false });
      
      const address = await sdk.getSignerAddr();
      expect(address).toBeNull();
    });

    test('getAuthClient should return password auth client', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });
      const passwordAuth = sdk.getAuthClient('password');
      expect(passwordAuth).toBeDefined();
    });

    test('getAvailableAuthTypes should return array of auth types', () => {
      const signer = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const sdk = Monstera.connect({ mainnet: false, signer });
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