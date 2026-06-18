/**
 * Unit tests for Monstera SDK Configuration
 */

import { describe, test, expect } from '@jest/globals';
import { expectValidAddress } from '../../utils/assertions.js';
import { 
    VALID_TEST_ADDRESS, 
    INVALID_TEST_ADDRESS_NO_PREFIX,
    INVALID_ADDRESS,
    CUSTOM_RPC_URL
} from '../../utils/fixtures.js';
import MonsteraConfig from '../../../src/config/monstera.js';
import { ConfigError, ValidationError } from '../../../src/errors/index.js';
import { assertValidResolvedConfig } from '../../../src/internal/validators/networkConfig.js';

describe('MonsteraConfig', () => {
    describe('Static Getters', () => {
        describe('version', () => {
            test('should return a string', () => {
                expect(typeof MonsteraConfig.version).toBe('string');
            });

            test('should return a valid version string or "unknown"', () => {
                const version = MonsteraConfig.version;
                expect(version).toBeDefined();
                // Version should be either a semantic version or "unknown"
                expect(version === 'unknown' || /^\d+\.\d+\.\d+/.test(version)).toBe(true);
            });
        });

        describe('networks', () => {
            test('should return network presets object', () => {
                const networks = MonsteraConfig.networks;
                expect(typeof networks).toBe('object');
                expect(networks).toBeDefined();
            });

            test('should have testnet and mainnet properties', () => {
                const networks = MonsteraConfig.networks;
                expect(networks.testnet).toBeDefined();
                expect(networks.mainnet).toBeDefined();
            });

            test('testnet should have correct structure', () => {
                const testnet = MonsteraConfig.networks.testnet;
                expect(testnet.name).toBe('sapphire-testnet');
                expect(testnet.chainId).toBe(23295); // 0x5aff
                expect(typeof testnet.rpcUrl).toBe('string');
                expect(typeof testnet.explorerUrl).toBe('string');
            });

            test('mainnet should have correct structure', () => {
                const mainnet = MonsteraConfig.networks.mainnet;
                expect(mainnet.name).toBe('sapphire-mainnet');
                expect(mainnet.chainId).toBe(23294); // 0x5afe
                expect(typeof mainnet.rpcUrl).toBe('string');
                expect(typeof mainnet.explorerUrl).toBe('string');
            });
        });

        describe('defaultAddresses', () => {
            test('should return default addresses object', () => {
                const addresses = MonsteraConfig.defaultAddresses;
                expect(typeof addresses).toBe('object');
                expect(addresses).toBeDefined();
            });

            test('should have testnet and mainnet properties', () => {
                const addresses = MonsteraConfig.defaultAddresses;
                expect(addresses.testnet).toBeDefined();
                expect(addresses.mainnet).toBeDefined();
            });

            test('testnet addresses should be valid', () => {
                const testnet = MonsteraConfig.defaultAddresses.testnet;
                expect(testnet.factory).toBeDefined();
                expect(testnet.passwordAuth).toBeDefined();
                expect(testnet.walletSignatureAuth).toBeDefined();
                expect(testnet.dualFactorAuth).toBeDefined();
                expect(testnet.passwordMinuteSignatureAuth).toBeDefined();
                
                expectValidAddress(testnet.factory);
                expectValidAddress(testnet.passwordAuth);
                expectValidAddress(testnet.walletSignatureAuth);
                expectValidAddress(testnet.dualFactorAuth);
                expectValidAddress(testnet.passwordMinuteSignatureAuth);
            });

            test('mainnet addresses should match built-in Sapphire mainnet defaults', () => {
                const mainnet = MonsteraConfig.defaultAddresses.mainnet;
                expectValidAddress(mainnet.factory);
                expectValidAddress(mainnet.passwordAuth);
                expectValidAddress(mainnet.walletSignatureAuth);
                expectValidAddress(mainnet.dualFactorAuth);
                expectValidAddress(mainnet.passwordMinuteSignatureAuth);
            });
        });

        describe('requiredAddresses', () => {
            test('should return an array', () => {
                const required = MonsteraConfig.requiredAddresses;
                expect(Array.isArray(required)).toBe(true);
            });

            test('should contain factory, passwordAuth, walletSignatureAuth, dualFactorAuth, passwordMinuteSignatureAuth', () => {
                const required = MonsteraConfig.requiredAddresses;
                expect(required).toContain('factory');
                expect(required).toContain('passwordAuth');
                expect(required).toContain('walletSignatureAuth');
                expect(required).toContain('dualFactorAuth');
                expect(required).toContain('passwordMinuteSignatureAuth');
            });

            test('should have exactly 5 required addresses', () => {
                const required = MonsteraConfig.requiredAddresses;
                expect(required.length).toBe(5);
            });
        });

        describe('SENSITIVE_PARAMS', () => {
            test('should return an array', () => {
                const sensitive = MonsteraConfig.SENSITIVE_PARAMS;
                expect(Array.isArray(sensitive)).toBe(true);
            });

            test('should contain expected sensitive parameters', () => {
                const sensitive = MonsteraConfig.SENSITIVE_PARAMS;
                expect(sensitive).toContain('authConfig');
                expect(sensitive).toContain('authProof');
                expect(sensitive).toContain('currentPassword');
                expect(sensitive).toContain('newPasswordHash');
                expect(sensitive).toContain('mnemonic');
                expect(sensitive).toContain('seed');
                expect(sensitive).toContain('hookData');
                expect(sensitive).toContain('implCall');
                expect(sensitive).toContain('newAuthConfig');
                expect(sensitive).toContain('accessToken');
                expect(sensitive).toContain('logicData');
                expect(sensitive).toContain('txData');
                expect(sensitive).toContain('data');
                expect(sensitive).toContain('message');
                expect(sensitive).toContain('hash');
                expect(sensitive).toContain('privateKey');
                expect(sensitive).toContain('password');
            });

            test('should not be empty', () => {
                const sensitive = MonsteraConfig.SENSITIVE_PARAMS;
                expect(sensitive.length).toBeGreaterThan(0);
            });
        });
    });

    describe('resolveBaseConfig', () => {
        describe('Testnet Configuration', () => {
            test('should resolve testnet config with defaults', () => {
                const config = MonsteraConfig.resolveBaseConfig({ mainnet: false });
                
                expect(config).toBeDefined();
                expect(config.network).toBe('sapphire-testnet');
                expect(config.chainId).toBe(23295); // 0x5aff
                expect(typeof config.rpcUrl).toBe('string');
                expect(typeof config.explorerUrl).toBe('string');
                expect(config.addresses).toBeDefined();
                
                // All addresses should be valid for testnet
                expectValidAddress(config.addresses.factory);
                expectValidAddress(config.addresses.passwordAuth);
                expectValidAddress(config.addresses.walletSignatureAuth);
                expectValidAddress(config.addresses.dualFactorAuth);
                expectValidAddress(config.addresses.passwordMinuteSignatureAuth);
            });

            test('should resolve testnet config with custom RPC URL', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: false, 
                    rpcUrl: CUSTOM_RPC_URL 
                });
                
                expect(config.network).toBe('sapphire-testnet');
                expect(config.rpcUrl).toBe(CUSTOM_RPC_URL);
                expect(config.addresses.factory).toBeDefined();
                expectValidAddress(config.addresses.dualFactorAuth);
                expectValidAddress(config.addresses.passwordMinuteSignatureAuth);
                expectValidAddress(config.addresses.dualFactorAuth);
                expectValidAddress(config.addresses.passwordMinuteSignatureAuth);
            });

            test('should resolve testnet config with partial address override', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: false,
                    addresses: { factory: VALID_TEST_ADDRESS }
                });
                
                expect(config.addresses.factory).toBe(VALID_TEST_ADDRESS);
                expectValidAddress(config.addresses.passwordAuth);
                expectValidAddress(config.addresses.walletSignatureAuth);
                expectValidAddress(config.addresses.dualFactorAuth);
                expectValidAddress(config.addresses.passwordMinuteSignatureAuth);
            });

            test('should resolve testnet config with all addresses override', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: false,
                    addresses: { 
                        factory: VALID_TEST_ADDRESS,
                        passwordAuth: VALID_TEST_ADDRESS,
                        walletSignatureAuth: VALID_TEST_ADDRESS,
                        dualFactorAuth: VALID_TEST_ADDRESS,
                        passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
                    }
                });
                
                expect(config.addresses.factory).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.walletSignatureAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.dualFactorAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordMinuteSignatureAuth).toBe(VALID_TEST_ADDRESS);
            });
        });

        describe('Mainnet Configuration', () => {
            test('should resolve mainnet config with all addresses provided', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: true,
                    addresses: {
                        factory: VALID_TEST_ADDRESS,
                        passwordAuth: VALID_TEST_ADDRESS,
                        walletSignatureAuth: VALID_TEST_ADDRESS,
                        dualFactorAuth: VALID_TEST_ADDRESS,
                        passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
                    }
                });
                
                expect(config).toBeDefined();
                expect(config.network).toBe('sapphire-mainnet');
                expect(config.chainId).toBe(23294); // 0x5afe
                expect(typeof config.rpcUrl).toBe('string');
                expect(typeof config.explorerUrl).toBe('string');
                
                expect(config.addresses.factory).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.walletSignatureAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.dualFactorAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordMinuteSignatureAuth).toBe(VALID_TEST_ADDRESS);
            });

            test('should resolve mainnet config with custom RPC URL', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: true,
                    rpcUrl: CUSTOM_RPC_URL,
                    addresses: {
                        factory: VALID_TEST_ADDRESS,
                        passwordAuth: VALID_TEST_ADDRESS,
                        walletSignatureAuth: VALID_TEST_ADDRESS,
                        dualFactorAuth: VALID_TEST_ADDRESS,
                        passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
                    }
                });
                
                expect(config.network).toBe('sapphire-mainnet');
                expect(config.rpcUrl).toBe(CUSTOM_RPC_URL);
                expect(config.addresses.factory).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.walletSignatureAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.dualFactorAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordMinuteSignatureAuth).toBe(VALID_TEST_ADDRESS);
            });

            test('should resolve mainnet config with partial address override', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: true,
                    addresses: { 
                        factory: VALID_TEST_ADDRESS,
                        passwordAuth: VALID_TEST_ADDRESS,
                        walletSignatureAuth: VALID_TEST_ADDRESS
                    }
                });
                
                expect(config.addresses.factory).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.passwordAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.walletSignatureAuth).toBe(VALID_TEST_ADDRESS);
                expect(config.addresses.dualFactorAuth).toBeDefined();
                expect(config.addresses.passwordMinuteSignatureAuth).toBeDefined();
            });
        });

        describe('Error Cases', () => {
            test('should throw ValidationError if mainnet is missing', () => {
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({});
                }).toThrow(ValidationError);
            });

            test('should throw ValidationError if mainnet is not a boolean', () => {
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ mainnet: 'testnet' });
                }).toThrow(ValidationError);
                
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ mainnet: 1 });
                }).toThrow(ValidationError);
                
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ mainnet: null });
                }).toThrow(ValidationError);
            });

            test('should throw ConfigError if required address is missing (testnet)', () => {
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ 
                        mainnet: false,
                        addresses: { factory: null }
                    });
                }).toThrow(ConfigError);
            });

            test('should throw ConfigError if required address is missing (mainnet)', () => {
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ 
                        mainnet: true,
                        addresses: { factory: null }
                    });
                }).toThrow(ConfigError);
            });

            test('should throw ValidationError if address format is invalid', () => {
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ 
                        mainnet: false,
                        addresses: { factory: INVALID_TEST_ADDRESS_NO_PREFIX }
                    });
                }).toThrow(ValidationError);
                
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ 
                        mainnet: false,
                        addresses: { factory: INVALID_ADDRESS }
                    });
                }).toThrow(ValidationError);
            });

            test('should throw ConfigError if multiple required addresses are missing', () => {
                expect(() => {
                    MonsteraConfig.resolveBaseConfig({ 
                        mainnet: false,
                        addresses: { 
                            factory: null,
                            passwordAuth: null
                        }
                    });
                }).toThrow(ConfigError);
            });

            test('should resolve mainnet with built-in default addresses when none passed', () => {
                const config = MonsteraConfig.resolveBaseConfig({ mainnet: true });
                expect(config.network).toBe('sapphire-mainnet');
                expectValidAddress(config.addresses.factory);
                expectValidAddress(config.addresses.passwordAuth);
                expectValidAddress(config.addresses.walletSignatureAuth);
                expectValidAddress(config.addresses.dualFactorAuth);
                expectValidAddress(config.addresses.passwordMinuteSignatureAuth);
            });
        });

        describe('Address Merging', () => {
            test('should merge partial address overrides with defaults (testnet)', () => {
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: false,
                    addresses: { factory: VALID_TEST_ADDRESS }
                });
                
                expect(config.addresses.factory).toBe(VALID_TEST_ADDRESS);
                // Other addresses should come from defaults
                expect(config.addresses.passwordAuth).toBeDefined();
                expect(config.addresses.walletSignatureAuth).toBeDefined();
                expect(config.addresses.dualFactorAuth).toBeDefined();
                expect(config.addresses.passwordMinuteSignatureAuth).toBeDefined();
            });

            test('should allow overriding all addresses', () => {
                const customAddresses = {
                    factory: VALID_TEST_ADDRESS,
                    passwordAuth: VALID_TEST_ADDRESS,
                    walletSignatureAuth: VALID_TEST_ADDRESS,
                    dualFactorAuth: VALID_TEST_ADDRESS,
                    passwordMinuteSignatureAuth: VALID_TEST_ADDRESS
                };
                
                const config = MonsteraConfig.resolveBaseConfig({ 
                    mainnet: false,
                    addresses: customAddresses
                });
                
                expect(config.addresses).toEqual({
                    ...MonsteraConfig.defaultAddresses.testnet,
                    ...customAddresses
                });
            });
        });
    });

    describe('assertValidResolvedConfig', () => {
        test('throws ConfigError for empty object', () => {
            expect(() => assertValidResolvedConfig({})).toThrow(ConfigError); 
        });

        test('accepts output of resolveBaseConfig', () => {
            const config = MonsteraConfig.resolveBaseConfig({ mainnet: false });
            expect(() => assertValidResolvedConfig(config)).not.toThrow();
        });

        test('throws ConfigError when rpcUrl is blank', () => {
            const config = MonsteraConfig.resolveBaseConfig({ mainnet: false });
            expect(() =>
                assertValidResolvedConfig({ ...config, rpcUrl: '   ' })
            ).toThrow(ConfigError);
        });

        test('throws ConfigError when chainId is missing', () => {
            const config = MonsteraConfig.resolveBaseConfig({ mainnet: false });
            expect(() =>
                assertValidResolvedConfig({ ...config, chainId: undefined })
            ).toThrow('chainId is required');
        });

        test('throws ConfigError when chainId is invalid', () => {
            const config = MonsteraConfig.resolveBaseConfig({ mainnet: false });
            expect(() =>
                assertValidResolvedConfig({ ...config, chainId: 'not-a-chain-id' })
            ).toThrow('chainId must be a valid chain id');
        });
    });
});
