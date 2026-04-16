/**
 * Unit tests for network configuration
 */

import { describe, test, expect } from '@jest/globals';
import { expectValidAddress } from '../../utils/assertions.js';
import { 
    VALID_TEST_ADDRESS,
    CUSTOM_RPC_URL
} from '../../utils/fixtures.js';
import { 
  NETWORKS,
  DEFAULT_ADDRESSES,
  buildNetworkConfig
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

    describe('buildNetworkConfig', () => {
        test('should be a function', () => {
            expect(typeof buildNetworkConfig).toBe('function');
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
            expect(NETWORKS.testnet.chainId).toBe(23295); // 0x5aff
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

    describe('buildNetworkConfig', () => {
        test('should build testnet config with defaults (no rpcUrl or addresses override)', () => {
            const baseConfig = buildNetworkConfig({ network: 'testnet' });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(23295); // 0x5aff
            expect(baseConfig.rpcUrl).toBe(NETWORKS.testnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.testnet);
        });

        test('should build testnet config with rpcUrl override', () => {
            const baseConfig = buildNetworkConfig({ network: 'testnet', rpcUrl: CUSTOM_RPC_URL });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(23295); // 0x5aff
            expect(baseConfig.rpcUrl).toBe(CUSTOM_RPC_URL);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.testnet);
        });

        test('should build testnet config with partial address override', () => {
            const baseConfig = buildNetworkConfig({ network: 'testnet', addresses: { factory: VALID_TEST_ADDRESS } });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(23295); // 0x5aff
            expect(baseConfig.rpcUrl).toBe(NETWORKS.testnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            // Should have factory from override + defaults for others
            expect(baseConfig.addresses).toStrictEqual({
                factory: VALID_TEST_ADDRESS,
                passwordAuth: DEFAULT_ADDRESSES.testnet.passwordAuth,
                walletSignatureAuth: DEFAULT_ADDRESSES.testnet.walletSignatureAuth
            });
        });

        test('should build testnet config with all addresses override', () => {
            const baseConfig = buildNetworkConfig({ 
                network: 'testnet', 
                addresses: { 
                    factory: VALID_TEST_ADDRESS, 
                    passwordAuth: VALID_TEST_ADDRESS, 
                    walletSignatureAuth: VALID_TEST_ADDRESS 
                } 
            });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-testnet');
            expect(baseConfig.chainId).toBe(23295); // 0x5aff
            expect(baseConfig.rpcUrl).toBe(NETWORKS.testnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.testnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual({ 
                factory: VALID_TEST_ADDRESS, 
                passwordAuth: VALID_TEST_ADDRESS, 
                walletSignatureAuth: VALID_TEST_ADDRESS 
            });
        });

        test('should merge addresses correctly (override + defaults)', () => {
            const baseConfig = buildNetworkConfig({ 
                network: 'testnet',
                addresses: { factory: VALID_TEST_ADDRESS }
            });
            expect(baseConfig.addresses.factory).toBe(VALID_TEST_ADDRESS);
            expect(baseConfig.addresses.passwordAuth).toBe(DEFAULT_ADDRESSES.testnet.passwordAuth);
            expect(baseConfig.addresses.walletSignatureAuth).toBe(DEFAULT_ADDRESSES.testnet.walletSignatureAuth);
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
            expect(NETWORKS.mainnet.chainId).toBe(23294); // 0x5afe
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

        test('should have factory, passwordAuth, walletSignatureAuth address for mainnet that match the expected values', () => {
            expect(DEFAULT_ADDRESSES.mainnet.factory).toBe('');
            expect(DEFAULT_ADDRESSES.mainnet.passwordAuth).toBe('');
            expect(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth).toBe('');
            expect(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth).not.toBeNull();
        });
    });

    describe('buildNetworkConfig', () => {
        test('should build mainnet config with defaults (no rpcUrl or addresses override)', () => {
            const baseConfig = buildNetworkConfig({ network: 'mainnet' });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(23294); // 0x5afe
            expect(baseConfig.rpcUrl).toBe(NETWORKS.mainnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.mainnet);
        });

        test('should build mainnet config with rpcUrl override', () => {
            const baseConfig = buildNetworkConfig({ network: 'mainnet', rpcUrl: CUSTOM_RPC_URL });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(23294); // 0x5afe
            expect(baseConfig.rpcUrl).toBe(CUSTOM_RPC_URL);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual(DEFAULT_ADDRESSES.mainnet);
        });

        test('should build mainnet config with partial address override', () => {
            const baseConfig = buildNetworkConfig({ network: 'mainnet', addresses: { factory: VALID_TEST_ADDRESS } });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(23294); // 0x5afe
            expect(baseConfig.rpcUrl).toBe(NETWORKS.mainnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            // Should have factory from override + defaults for others
            expect(baseConfig.addresses).toStrictEqual({
                factory: VALID_TEST_ADDRESS,
                passwordAuth: DEFAULT_ADDRESSES.mainnet.passwordAuth,
                walletSignatureAuth: DEFAULT_ADDRESSES.mainnet.walletSignatureAuth
            });
        });

        test('should build mainnet config with all addresses override', () => {
            const baseConfig = buildNetworkConfig({ 
                network: 'mainnet', 
                addresses: { 
                    factory: VALID_TEST_ADDRESS, 
                    passwordAuth: VALID_TEST_ADDRESS, 
                    walletSignatureAuth: VALID_TEST_ADDRESS 
                } 
            });
            expect(baseConfig).toBeDefined();
            expect(baseConfig.network).toBe('sapphire-mainnet');
            expect(baseConfig.chainId).toBe(23294); // 0x5afe
            expect(baseConfig.rpcUrl).toBe(NETWORKS.mainnet.rpcUrl);
            expect(baseConfig.explorerUrl).toBe(NETWORKS.mainnet.explorerUrl);
            expect(baseConfig.addresses).toStrictEqual({ 
                factory: VALID_TEST_ADDRESS, 
                passwordAuth: VALID_TEST_ADDRESS, 
                walletSignatureAuth: VALID_TEST_ADDRESS 
            });
        });

        test('should merge addresses correctly (override + defaults)', () => {
            const baseConfig = buildNetworkConfig({ 
                network: 'mainnet',
                addresses: { factory: VALID_TEST_ADDRESS }
            });
            expect(baseConfig.addresses.factory).toBe(VALID_TEST_ADDRESS);
            expect(baseConfig.addresses.passwordAuth).toBeNull();
            expect(baseConfig.addresses.walletSignatureAuth).toBeNull();
        });
    });
});