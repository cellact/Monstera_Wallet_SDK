/**
 * Integration tests for wallet-signature authenticator (whitelist, domain separator,
 * {@link Monstera#createAuthProofWalletSignature}, and EIP-712 domain separator reads).
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { defaultAbiCoder } from '../../../src/adapters/ethers/encoding.js';
import { ValidationError } from '../../../src/errors/index.js';
import { registerSdkTeardown } from '../../utils/teardown.js';
import { loadAuthenticationFixtures } from './shared.js';
import { randomAddress, calculateDeadline } from '../../utils/fixtures.js';
import { expectTransactionResult, expectValidTxHash, expectValidHex } from '../../utils/assertions.js';
import { nowUnixTimestampSeconds } from '../../../src/internal/utils/time.js';
import {
  testMissingParam,
  testInvalidAddress,
  testReadonlySDK
} from '../../utils/validation-helpers.js';

describe('Authentication — wallet signature', () => {
  let sdk;
  let passwordHash;
  let keyVaultAddr;
  let testWallet;
  let testWalletAddr;

  beforeAll(async () => {
    ({
      sdk,
      passwordHash,
      keyVaultAddr,
      testWallet,
      testWalletAddr
    } = await loadAuthenticationFixtures());
  }, 30000);

  registerSdkTeardown(afterAll, () => sdk);

  describe('configureWalletSignature', () => {
    test('should successfully configure wallet signature authenticator', async () => {
      const newWallet = await sdk.createWallet({
        authConfig: { passwordHash }
      });

      const result = await sdk.configureWalletSignature({
        keyVaultAddr: newWallet.keyVault,
        initialWhitelist: [testWalletAddr]
      });

      expectTransactionResult(result);

      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.configureWalletSignature.bind(sdk),
        { initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
    });

    test('should fail with missing initialWhitelist', async () => {
      await testMissingParam(
        sdk.configureWalletSignature.bind(sdk),
        { keyVaultAddr },
        'initialWhitelist',
        'whitelist'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.configureWalletSignature.bind(sdk),
        { keyVaultAddr, initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      await testReadonlySDK(
        sdk.configureWalletSignature,
        {
          keyVaultAddr,
          initialWhitelist: [testWalletAddr]
        }
      );
    });
  });

  describe('isWalletSignatureConfigured', () => {
    test('should return true for configured wallet', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should return false for unconfigured wallet', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: { passwordHash }
      });

      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isWalletSignatureConfigured.bind(sdk),
        {},
        'keyVaultAddr'
      );
    });
  });

  describe('isWalletSignatureValid', () => {
    test('should return true for valid signature', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should return false for invalid signature', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const otherWallet = Wallet.createRandom();

      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        signer: otherWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isWalletSignatureValid.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider)
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.isWalletSignatureValid.bind(sdk),
        { keyVaultAddr },
        'signer'
      );
    });
  });

  describe('isWhitelisted', () => {
    test('should return true for whitelisted address', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: testWalletAddr
      });
      expect(isWhitelisted).toBe(true);
    }, 30000);

    test('should return false for non-whitelisted address', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const otherAddr = randomAddress();
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: otherAddr
      });
      expect(isWhitelisted).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isWhitelisted.bind(sdk),
        { addressToCheck: testWalletAddr },
        'keyVaultAddr'
      );
    });

    test('should fail with missing addressToCheck', async () => {
      await testMissingParam(
        sdk.isWhitelisted.bind(sdk),
        { keyVaultAddr },
        'addressToCheck'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.isWhitelisted.bind(sdk),
        {
          keyVaultAddr,
          addressToCheck: testWalletAddr
        },
        'keyVaultAddr'
      );
    });
  });

  describe('getWhitelist', () => {
    test('should return whitelist addresses', async () => {
      const whitelist = [testWalletAddr, randomAddress()];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const result = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      const resultLower = result.map(addr => addr.toLowerCase());
      expect(resultLower).toContain(testWalletAddr.toLowerCase());
    }, 30000);

    test('should fail to remove last address from whitelist (prevents empty whitelist)', async () => {
      const initialWhitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist }
      });

      const initialResult = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });
      expect(initialResult.length).toBe(1);

      await expect(
        sdk.removeFromWhitelist({
          keyVaultAddr: newWallet.keyVault,
          signer: testWallet.connect(sdk.provider),
          addressToRemove: testWalletAddr
        })
      ).rejects.toThrow();

      const result = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].toLowerCase()).toBe(testWalletAddr.toLowerCase());
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.getWhitelist.bind(sdk),
        {},
        'keyVaultAddr'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.getWhitelist.bind(sdk),
        { keyVaultAddr },
        'keyVaultAddr'
      );
    });
  });

  describe('addToWhitelist', () => {
    test('should successfully add address to whitelist', async () => {
      const initialWhitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist }
      });

      const newAddr = randomAddress();
      const result = await sdk.addToWhitelist({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider),
        addressToAdd: newAddr
      });

      expectTransactionResult(result);

      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: newAddr
      });
      expect(isWhitelisted).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider),
          addressToAdd: testWalletAddr
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          addressToAdd: testWalletAddr
        },
        'signer'
      );
    });

    test('should fail with missing addressToAdd', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider)
        },
        'addressToAdd'
      );
    });

    test('should fail when signer is not on the whitelist', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const otherWallet = Wallet.createRandom();

      await expect(
        sdk.addToWhitelist({
          keyVaultAddr: newWallet.keyVault,
          signer: otherWallet.connect(sdk.provider),
          addressToAdd: randomAddress()
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('removeFromWhitelist', () => {
    test('should successfully remove address from whitelist', async () => {
      const initialWhitelist = [testWalletAddr, randomAddress()];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist }
      });

      const addrToRemove = initialWhitelist[1];
      const result = await sdk.removeFromWhitelist({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider),
        addressToRemove: addrToRemove
      });

      expectTransactionResult(result);

      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: addrToRemove
      });
      expect(isWhitelisted).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider),
          addressToRemove: testWalletAddr
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          addressToRemove: testWalletAddr
        },
        'signer'
      );
    });

    test('should fail with missing addressToRemove', async () => {
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider)
        },
        'addressToRemove'
      );
    });
  });

  describe('getDomainSeparator', () => {
    test('should return domain separator', async () => {
      const domainSeparator = await sdk.getDomainSeparator();

      expect(domainSeparator).toBeDefined();
      expect(typeof domainSeparator).toBe('string');
      expectValidTxHash(domainSeparator);
    });

    test('should return same domain separator for same network', async () => {
      const domainSeparator1 = await sdk.getDomainSeparator();
      const domainSeparator2 = await sdk.getDomainSeparator();

      expect(domainSeparator1).toBe(domainSeparator2);
    });
  });

  describe('createAuthProofWalletSignature', () => {
    async function walletWithWalletSig() {
      return sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: [testWalletAddr] }
      });
    }

    test('should build an auth proof that the contract accepts', async () => {
      const newWallet = await walletWithWalletSig();

      const authProof = await sdk.createAuthProofWalletSignature({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider)
      });

      expectValidHex(authProof);

      const ok = await sdk.auth.walletSignature.verify({
        keyVaultAddr: newWallet.keyVault,
        authProof
      });
      expect(ok).toBe(true);
    }, 30000);

    test('should default authenticatorAddr and deadline when omitted', async () => {
      const newWallet = await walletWithWalletSig();

      const authProof = await sdk.createAuthProofWalletSignature({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider)
      });

      const decoded = defaultAbiCoder.decode(
        ['uint256', 'bytes'],
        authProof
      );
      const deadlineBn = decoded[0];
      const deadlineSec =
        typeof deadlineBn === 'bigint' ? Number(deadlineBn) : Number(deadlineBn);
      expect(deadlineSec).toBeGreaterThan(nowUnixTimestampSeconds());

      const ok = await sdk.auth.walletSignature.verify({
        keyVaultAddr: newWallet.keyVault,
        authProof
      });
      expect(ok).toBe(true);
    }, 30000);

    test('should accept explicit authenticatorAddr matching the configured authenticator', async () => {
      const newWallet = await walletWithWalletSig();

      const authProof = await sdk.createAuthProofWalletSignature({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider),
        authenticatorAddr: sdk.addresses.walletSignatureAuth
      });

      const ok = await sdk.auth.walletSignature.verify({
        keyVaultAddr: newWallet.keyVault,
        authProof
      });
      expect(ok).toBe(true);
    }, 30000);

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          keyVaultAddr,
          deadline: calculateDeadline()
        },
        'signer'
      );
    });

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider),
          deadline: calculateDeadline()
        },
        'keyVaultAddr'
      );
    });

    test('should fail with deadline in the past', async () => {
      const pastDeadline = nowUnixTimestampSeconds() - 3600;

      await expect(
        sdk.createAuthProofWalletSignature({
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr,
          deadline: pastDeadline
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr,
          deadline: calculateDeadline()
        },
        'keyVaultAddr'
      );
    });

    test('should fail with invalid authenticatorAddr', async () => {
      await testInvalidAddress(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr,
          authenticatorAddr: sdk.addresses.walletSignatureAuth,
          deadline: calculateDeadline()
        },
        'authenticatorAddr'
      );
    });
  });
});
