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

        test('should have factory, passwordAuth, walletSignatureAuth, dualFactorAuth, passwordMinuteSignatureAuth address for testnet', () => {
            expect(DEFAULT_ADDRESSES.testnet.factory).toBeDefined();
            expect(DEFAULT_ADDRESSES.testnet.passwordAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.testnet.walletSignatureAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.testnet.dualFactorAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.testnet.passwordMinuteSignatureAuth).toBeDefined();
        });

        test('should have built-in testnet contract addresses that match networks.js', () => {
            expect(DEFAULT_ADDRESSES.testnet).toStrictEqual({
                factory: '0x8B7e2310c4582eF9A492035FE867a9f58BcfB696',
                passwordAuth: '0x34d2426BA65b6d782fE570F08658038974F840b8',
                walletSignatureAuth: '0xF283b3A7FE88932968D9278e72A27A35CEBBf5eD',
                dualFactorAuth: '0xBfd22Afcbcf514e3e352372dDDF1526b0c3464D3',
                passwordMinuteSignatureAuth: '0xBb8b2343e34A26432F59ea8A7c857F003b5e3ccc'
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

        test('should build testnet config with chainId override (hex string)', () => {
            const baseConfig = buildNetworkConfig({
                network: 'testnet',
                chainId: '0x5aff'
            });
            expect(baseConfig.chainId).toBe(23295);
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
                    walletSignatureAuth: VALID_TEST_ADDRESS,
                    dualFactorAuth: VALID_TEST_ADDRESS,
                    passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
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
                dualFactorAuth: VALID_TEST_ADDRESS,
                passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
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
            expect(baseConfig.addresses.dualFactorAuth).toBe(DEFAULT_ADDRESSES.testnet.dualFactorAuth);
            expect(baseConfig.addresses.passwordMinuteSignatureAuth).toBe(DEFAULT_ADDRESSES.testnet.passwordMinuteSignatureAuth);
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

        test('should have factory, passwordAuth, walletSignatureAuth, dualFactorAuth, passwordMinuteSignatureAuth address for mainnet', () => {
            expect(DEFAULT_ADDRESSES.mainnet.factory).toBeDefined();
            expect(DEFAULT_ADDRESSES.mainnet.passwordAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.mainnet.walletSignatureAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.mainnet.dualFactorAuth).toBeDefined();
            expect(DEFAULT_ADDRESSES.mainnet.passwordMinuteSignatureAuth).toBeDefined();
        });

        test('should have built-in mainnet contract addresses that match networks.js', () => {
            expect(DEFAULT_ADDRESSES.mainnet).toStrictEqual({
                factory: '0x19b90486eDbfdD765a2CBcd97aFCd4876A28C220',
                passwordAuth: '0x93c675336372EBb64dA38018bE28d5EA1a8cC26A',
                walletSignatureAuth: '0xC5AAFBC2e3D7D7674cE317AE0A02bF43f2eD2AA9',
                dualFactorAuth: '0xB82D5511e43723A377d6e1d9B52Ec31979e56c97',
                passwordMinuteSignatureAuth: '0x63B0A8E71a91a2Fc4116FAc57B76beAB82d559d3'
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
                    walletSignatureAuth: VALID_TEST_ADDRESS,
                    dualFactorAuth: VALID_TEST_ADDRESS,
                    passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
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
                dualFactorAuth: VALID_TEST_ADDRESS,
                passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
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
            expect(baseConfig.addresses.dualFactorAuth).toBe(DEFAULT_ADDRESSES.mainnet.dualFactorAuth);
            expect(baseConfig.addresses.passwordMinuteSignatureAuth).toBe(DEFAULT_ADDRESSES.mainnet.passwordMinuteSignatureAuth);
        });
    });
});