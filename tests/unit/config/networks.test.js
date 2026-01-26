/**
 * Unit tests for network configuration
 */

import { describe, test, expect } from '@jest/globals';
import { expectValidAddress } from '../../utils/assertions.js';
import { VALID_TEST_ADDRESS, INVALID_TEST_ADDRESS_NO_PREFIX, CUSTOM_RPC_URL } from '../../utils/fixtures.js';
import { 
  NETWORKS,
  DEFAULT_ADDRESSES,
  REQUIRED_ADDRESSES,
  resolveBaseConfig
} from '../../../src/config/networks.js';

describe('Network Configuration - shared by testnet and mainnet', () => {
    describe('Network Presets', () => {
        test('should be an object', () => {
            expect(typeof NETWORKS).toBe('object');
        });
    });

    describe('Default Addresses', () => {
        test('should be an object', () => {
            expect(typeof DEFAULT_ADDRESSES).toBe('object');
        });
    });

    describe('Required Addresses', () => {
        test('should be an array', () => {
            expect(Array.isArray(REQUIRED_ADDRESSES)).toBe(true);
        });

        test('should have factory, passwordAuth, walletSignatureAuth addresses', () => {
            expect(REQUIRED_ADDRESSES).toContain('factory');
            expect(REQUIRED_ADDRESSES).toContain('passwordAuth');
            expect(REQUIRED_ADDRESSES).toContain('walletSignatureAuth');
        });
    });
});

describe('Network Configuration - testnet', () => {
    describe('Network Presets', () => {
        test('should have testnet network', () => {
            expect(NETWORKS.testnet).toBeDefined();
        });

        test('testnet network should have correct name, chainId, rpcUrl, and explorerUrl', () => {
            expect(NETWORKS.testnet.name).toBe('sapphire-testnet');
            expect(NETWORKS.testnet.chainId).toBe(0x5aff);
            expect(NETWORKS.testnet.rpcUrl).toBeDefined();
            expect(NETWORKS.testnet.explorerUrl).toBeDefined();
        });
    });

    describe('Default Addresses', () => {
        test('should have testnet default addresses', () => {
            expect(DEFAULT_ADDRESSES.testnet).toBeDefined();
        });

        test('should have factory, passwordAuth, walletSignatureAuth address for testnet', () => {
            expect(DEFAULT_ADDRESSES.testnet.factory).toBeDefined();
            expect(DEFAULT_ADDRESSES.testnet.passwordAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.testnet.walletSignatureAuth).toBeDefined();
        });

        test('should have factory, passwordAuth, walletSignatureAuth address for testnet that match the expected values', () => {
            expectValidAddress(DEFAULT_ADDRESSES.testnet.factory);
            expect(DEFAULT_ADDRESSES.testnet.factory).toBe('0x99a98ea83F5b62D2F26A72C85459ae6c75b44C2a');
            expectValidAddress(DEFAULT_ADDRESSES.testnet.passwordAuth);
            expect(DEFAULT_ADDRESSES.testnet.passwordAuth).toBe('0xc54aDC2B8Dc7b2AF787c8a30945e32CdB1bB2ee7');
            expectValidAddress(DEFAULT_ADDRESSES.testnet.walletSignatureAuth);
            expect(DEFAULT_ADDRESSES.testnet.walletSignatureAuth).toBe('0xe31a99416d2E3a807a5e379AFbc2e230bff2Ee9a');
            expect(DEFAULT_ADDRESSES.testnet.walletSignatureAuth).not.toBeNull();
        });
    });

    describe('Resolve Base Config', () => {
        test('should take a object with false mainnet and return a network config object for testnet (no rpcUrl or addresses override)', () => {
            const baseConfig = resolveBaseConfig({ mainnet: false });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(0x5aff);
            expect(baseConfig.rpcUrl).toBe(NETWORKS.testnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.testnet);
        });

        test('should take a object with false mainnet and return a network config object for testnet (rpcUrl override, addresses defaults)', () => {
            const baseConfig = resolveBaseConfig({ mainnet: false, rpcUrl: CUSTOM_RPC_URL });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(0x5aff);
            expect(baseConfig.rpcUrl).toBe(CUSTOM_RPC_URL);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.testnet);
        });

        test('should take a object with false mainnet and return a network config object for testnet (1 address override, rpcUrl defaults)', () => {
            const baseConfig = resolveBaseConfig({ mainnet: false, addresses: { factory: VALID_TEST_ADDRESS } });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(0x5aff);
            expect(baseConfig.rpcUrl).toBe(NETWORKS.testnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            // Should have factory from override + defaults for others
            expect(baseConfig.addresses).toStrictEqual({
                factory: VALID_TEST_ADDRESS,
                passwordAuth: DEFAULT_ADDRESSES.testnet.passwordAuth,
                walletSignatureAuth: DEFAULT_ADDRESSES.testnet.walletSignatureAuth
            });
        });

        test('should take a object with false mainnet and return a network config object for testnet (all addresses override, rpcUrl defaults)', () => {
            const baseConfig = resolveBaseConfig({ 
                mainnet: false, 
                addresses: { 
                    factory: VALID_TEST_ADDRESS, 
                    passwordAuth: VALID_TEST_ADDRESS, 
                    walletSignatureAuth: VALID_TEST_ADDRESS 
                } 
            });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(0x5aff);
            expect(baseConfig.rpcUrl).toBe(NETWORKS.testnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual({ 
                factory: VALID_TEST_ADDRESS, 
                passwordAuth: VALID_TEST_ADDRESS, 
                walletSignatureAuth: VALID_TEST_ADDRESS 
            });
        });

        test('throws error if mainnet is not a boolean', () => {
            expect(() => resolveBaseConfig({ mainnet: 'testnet' })).toThrow('mainnet is required and must be a boolean (true for mainnet, false for testnet)');
        });

        test('throws error if override addresses are missing required addresses (factory is null)', () => {
            expect(() => resolveBaseConfig({ mainnet: false, addresses: { factory: null } })).toThrow('Missing required contract addresses: factory. Please provide addresses in config or set defaults.');
        });

        test('throws error if override addresses are invalid (factory is not a valid address)', () => {
            expect(() => resolveBaseConfig({ mainnet: false, addresses: { factory: INVALID_TEST_ADDRESS_NO_PREFIX } })).toThrow(`Invalid address format for factory: ${INVALID_TEST_ADDRESS_NO_PREFIX}`);
        });
    });
});

describe('Network Configuration - mainnet', () => {
    describe('Network Presets', () => {
        test('should have mainnet network', () => {
            expect(NETWORKS.mainnet).toBeDefined();
        });

        test('mainnet network should have correct name, chainId, rpcUrl, and explorerUrl', () => {
            expect(NETWORKS.mainnet.name).toBe('sapphire-mainnet');
            expect(NETWORKS.mainnet.chainId).toBe(0x5afe);
            expect(NETWORKS.mainnet.rpcUrl).toBeDefined();
            expect(NETWORKS.mainnet.explorerUrl).toBeDefined();
        });
    });

    describe('Default Addresses', () => {
        test('should have mainnet default addresses', () => {
            expect(DEFAULT_ADDRESSES.mainnet).toBeDefined();
        });

        test('should have factory, passwordAuth, walletSignatureAuth address for mainnet', () => {
            expect(DEFAULT_ADDRESSES.mainnet.factory).toBeDefined();
            expect(DEFAULT_ADDRESSES.mainnet.passwordAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth).toBeDefined();
        });

        // TODO: Add test for mainnet default addresses that match the expected values
        // test('should have factory, passwordAuth, walletSignatureAuth address for mainnet that match the expected values', () => {
        //     expect(DEFAULT_ADDRESSES.mainnet.factory).toBe('');
        //     expect(DEFAULT_ADDRESSES.mainnet.passwordAuth).toBe('');
        //     expect(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth).toBe('');
        //     expect(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth).not.toBeNull();
        // });
    });

    describe('Resolve Base Config', () => {
        test('should take a object with true mainnet and return a network config object for mainnet (no rpcUrl or addresses override)', () => {
            const baseConfig = resolveBaseConfig({ mainnet: true });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(0x5afe);
            expect(baseConfig.rpcUrl).toBe(NETWORKS.mainnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.mainnet);
        });

        test('should take a object with true mainnet and return a network config object for mainnet (rpcUrl override, addresses defaults)', () => {
            const baseConfig = resolveBaseConfig({ mainnet: true, rpcUrl: CUSTOM_RPC_URL });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(0x5afe);
            expect(baseConfig.rpcUrl).toBe(CUSTOM_RPC_URL);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.mainnet);
        });

        test('should take a object with true mainnet and return a network config object for mainnet (1 address override, rpcUrl defaults)', () => {
            const baseConfig = resolveBaseConfig({ mainnet: true, addresses: { factory: VALID_TEST_ADDRESS } });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(0x5afe);
            expect(baseConfig.rpcUrl).toBe(NETWORKS.mainnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            // Should have factory from override + defaults for others
            expect(baseConfig.addresses).toStrictEqual({
                factory: VALID_TEST_ADDRESS,
                passwordAuth: DEFAULT_ADDRESSES.mainnet.passwordAuth,
                walletSignatureAuth: DEFAULT_ADDRESSES.mainnet.walletSignatureAuth
            });
        });

        test('should take a object with true mainnet and return a network config object for mainnet (all addresses override, rpcUrl defaults)', () => {
            const baseConfig = resolveBaseConfig({ 
                mainnet: true, 
                addresses: { 
                    factory: VALID_TEST_ADDRESS, 
                    passwordAuth: VALID_TEST_ADDRESS, 
                    walletSignatureAuth: VALID_TEST_ADDRESS 
                } 
            });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(0x5afe);
            expect(baseConfig.rpcUrl).toBe(NETWORKS.mainnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual({ 
                factory: VALID_TEST_ADDRESS, 
                passwordAuth: VALID_TEST_ADDRESS, 
                walletSignatureAuth: VALID_TEST_ADDRESS 
            });
        });

        test('throws error if mainnet is not a boolean', () => {
            expect(() => resolveBaseConfig({ mainnet: 'testnet' })).toThrow('mainnet is required and must be a boolean (true for mainnet, false for testnet)');
        });

        test('throws error if override addresses are missing required addresses (factory is null)', () => {
            expect(() => resolveBaseConfig({ mainnet: true, addresses: { factory: null } })).toThrow('Missing required contract addresses: factory. Please provide addresses in config or set defaults.');
        });

        test('throws error if override addresses are invalid (factory is not a valid address)', () => {
            expect(() => resolveBaseConfig({ mainnet: true, addresses: { factory: INVALID_TEST_ADDRESS_NO_PREFIX } })).toThrow(`Invalid address format for factory: ${INVALID_TEST_ADDRESS_NO_PREFIX}`);
        });
    });
});