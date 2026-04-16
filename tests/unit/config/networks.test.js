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

        test('should have built-in testnet contract addresses that match networks.js', () => {
            expect(DEFAULT_ADDRESSES.testnet).toStrictEqual({
                factory: '0xdf5D9880d80Ee8029ce0b675d66734Cd667eEEB3',
                passwordAuth: '0xc3553935efaa9c02cF963bd551eF02b6d09CA1a5',
                walletSignatureAuth: '0xc06E821da811b0735DA5493F1732a25EB7005412',
                dualFactorAuth: '0xCAb1585C37118d066Bc3AD79919B4CAE5cd42BC2',
                passwordMinuteSignatureAuth: '0x151ed065b04583ABB0Ceb21d37C266e41AA3c7E8'
            });
            for (const addr of Object.values(DEFAULT_ADDRESSES.testnet)) {
                expectValidAddress(addr);
            }
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
                walletSignatureAuth: DEFAULT_ADDRESSES.testnet.walletSignatureAuth,
                dualFactorAuth: DEFAULT_ADDRESSES.testnet.dualFactorAuth,
                passwordMinuteSignatureAuth: DEFAULT_ADDRESSES.testnet.passwordMinuteSignatureAuth
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
                walletSignatureAuth: VALID_TEST_ADDRESS,
                dualFactorAuth: DEFAULT_ADDRESSES.testnet.dualFactorAuth,
                passwordMinuteSignatureAuth: DEFAULT_ADDRESSES.testnet.passwordMinuteSignatureAuth
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

        test('should have built-in mainnet contract addresses that match networks.js', () => {
            expect(DEFAULT_ADDRESSES.mainnet).toStrictEqual({
                factory: '0x6170CA80482C5B07FA6c829aF6E5Cd8a3FBEef53',
                passwordAuth: '0x9f79F00888DEb2DE3e6C300a8FF6884214378132',
                walletSignatureAuth: '0x4b294756bB7F9DF7f3b8ad3A546246DE68068Af5',
                dualFactorAuth: '0x5422f5b59F816A39587895e6d169d38C2fc1b2E5',
                passwordMinuteSignatureAuth: '0x61D5299c91ff789d5a636A5046576c3c08397644'
            });
            for (const addr of Object.values(DEFAULT_ADDRESSES.mainnet)) {
                expectValidAddress(addr);
            }
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
                walletSignatureAuth: DEFAULT_ADDRESSES.mainnet.walletSignatureAuth,
                dualFactorAuth: DEFAULT_ADDRESSES.mainnet.dualFactorAuth,
                passwordMinuteSignatureAuth: DEFAULT_ADDRESSES.mainnet.passwordMinuteSignatureAuth
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
                walletSignatureAuth: VALID_TEST_ADDRESS,
                dualFactorAuth: DEFAULT_ADDRESSES.mainnet.dualFactorAuth,
                passwordMinuteSignatureAuth: DEFAULT_ADDRESSES.mainnet.passwordMinuteSignatureAuth
            });
        });

        test('should merge addresses correctly (override + defaults)', () => {
            const baseConfig = buildNetworkConfig({ 
                network: 'mainnet',
                addresses: { factory: VALID_TEST_ADDRESS }
            });
            expect(baseConfig.addresses.factory).toBe(VALID_TEST_ADDRESS);
            expect(baseConfig.addresses.passwordAuth).toBe(DEFAULT_ADDRESSES.mainnet.passwordAuth);
            expect(baseConfig.addresses.walletSignatureAuth).toBe(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth);
        });
    });
});