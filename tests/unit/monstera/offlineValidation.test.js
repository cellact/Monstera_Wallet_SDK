/**
 * Offline validation tests for Monstera public methods (no on-chain setup).
 *
 * These mirror former integration "missing param / invalid address / readonly" checks so the
 * integration suite does not need a funded wallet or RPC just to assert ValidationError order.
 */

import { describe, test, beforeAll, afterAll } from '@jest/globals';
import { Wallet, parseUnits } from '../../../src/adapters/ethers/index.js';
import { Interface } from '../../../src/adapters/ethers/encoding.js';
import { ZeroHash } from '../../../src/adapters/ethers/addresses.js';
import { hexlify, keccak256, randomBytes, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import {
  createTestSDK,
  createTestWallet
} from '../../utils/setup.js';
import { registerSdkTeardown } from '../../utils/teardown.js';
import {
  VALID_TEST_ADDRESS,
  ZERO_ADDRESS,
  INVALID_ADDRESS,
  createPasswordAuthProof,
  calculateDeadline,
  randomAddress,
  createTestVaultSignAction
} from '../../utils/fixtures.js';
import { CredentialsRequiredError, WriteRequiresSignerError } from '../../../src/errors/index.js';
import { attachTestConnectSession } from '../../utils/credentials.js';
import {
  testMissingParam,
  testInvalidAddress,
  testReadonlySDK
} from '../../utils/validation-helpers.js';

describe('Monstera offline validation', () => {
  let adminSdk;
  let readonlySdk;
  let userSdk;
  let fullSdk;
  let passwordHash;
  let keyVaultAddr;
  let walletAddr;
  let storageAddr;
  let authenticatorAddr;
  let testWalletAddr;
  const testMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const opaqueAuthProof = '0x12345678';
  const accountIndex = 0;

  beforeAll(async () => {
    adminSdk = createTestSDK();
    readonlySdk = createTestSDK({ readonly: true });
    userSdk = createTestSDK({ readonly: true });
    attachTestConnectSession(userSdk);
    fullSdk = createTestSDK();
    attachTestConnectSession(fullSdk);
    passwordHash = keccak256(toUtf8Bytes('offline-validation-suite'));
    keyVaultAddr = VALID_TEST_ADDRESS;
    walletAddr = VALID_TEST_ADDRESS;
    storageAddr = VALID_TEST_ADDRESS;
    authenticatorAddr = adminSdk.addresses.passwordAuth;
    testWalletAddr = createTestWallet().address;
  });

  registerSdkTeardown(afterAll, () => adminSdk);
  registerSdkTeardown(afterAll, () => readonlySdk);
  registerSdkTeardown(afterAll, () => userSdk);
  registerSdkTeardown(afterAll, () => fullSdk);

  describe('password authenticator', () => {
    test('configurePassword validation', async () => {
      await expect(
        adminSdk.configurePassword({ passwordHash })
      ).rejects.toMatchObject({ name: 'CredentialsRequiredError' });
      await testMissingParam(
        adminSdk.configurePassword.bind(adminSdk),
        { keyVaultAddr, passwordHash },
        'passwordHash'
      );
      await testInvalidAddress(
        adminSdk.configurePassword.bind(adminSdk),
        { keyVaultAddr, passwordHash },
        'keyVaultAddr'
      );
      await testReadonlySDK(readonlySdk.configurePassword, {
        keyVaultAddr,
        passwordHash
      });
    });

    test('updatePassword validation', async () => {
      const currentPasswordBytes = createPasswordAuthProof('offline-password');
      const newPasswordHash = keccak256(toUtf8Bytes('new-offline'));
      await testMissingParam(
        fullSdk.updatePassword.bind(fullSdk),
        { keyVaultAddr, currentPassword: currentPasswordBytes },
        'newPasswordHash'
      );
    });

    test('isPasswordConfigured / isPasswordValid validation', async () => {
      await testInvalidAddress(
        userSdk.isPasswordConfigured.bind(userSdk),
        { keyVaultAddr },
        'keyVaultAddr'
      );
      await testInvalidAddress(
        userSdk.isPasswordValid.bind(userSdk),
        {
          keyVaultAddr,
          currentPassword: createPasswordAuthProof('x')
        },
        'keyVaultAddr'
      );
      await expect(readonlySdk.isPasswordConfigured({})).rejects.toThrow(
        CredentialsRequiredError
      );
    });
  });

  describe('wallet creation', () => {
    test('createWallet / createWalletFromMnemonic / core / hook / customLogic validation', async () => {
      await testMissingParam(adminSdk.createWallet.bind(adminSdk), {}, 'authConfig');
      await testReadonlySDK(readonlySdk.createWallet, { authConfig: { passwordHash } });

      await testMissingParam(
        adminSdk.createWalletFromMnemonic.bind(adminSdk),
        { authConfig: { passwordHash } },
        'mnemonic'
      );
      await testMissingParam(
        adminSdk.createWalletFromMnemonic.bind(adminSdk),
        { mnemonic: testMnemonic },
        'authConfig'
      );

      await testMissingParam(adminSdk.createWalletCore.bind(adminSdk), {}, 'authConfig');

      await testMissingParam(
        adminSdk.createWalletWithHook.bind(adminSdk),
        {
          authConfig: { passwordHash },
          hookData: toUtf8Bytes('test')
        },
        'hookAddr'
      );
      await testMissingParam(
        adminSdk.createWalletWithHook.bind(adminSdk),
        {
          authConfig: { passwordHash },
          hookAddr: ZERO_ADDRESS
        },
        'hookData'
      );
      await testInvalidAddress(
        adminSdk.createWalletWithHook.bind(adminSdk),
        {
          authConfig: { passwordHash },
          hookAddr: ZERO_ADDRESS,
          hookData: toUtf8Bytes('test')
        },
        'hookAddr'
      );
      await testMissingParam(
        adminSdk.createWalletWithHook.bind(adminSdk),
        {
          hookAddr: ZERO_ADDRESS,
          hookData: toUtf8Bytes('test')
        },
        'authConfig'
      );

      await testMissingParam(
        adminSdk.createWalletWithCustomLogic.bind(adminSdk),
        {
          authConfig: { passwordHash },
          logicData: toUtf8Bytes('test')
        },
        'customLogicImplAddr'
      );
      await testMissingParam(
        adminSdk.createWalletWithCustomLogic.bind(adminSdk),
        {
          authConfig: { passwordHash },
          customLogicImplAddr: ZERO_ADDRESS
        },
        'logicData'
      );
      await testInvalidAddress(
        adminSdk.createWalletWithCustomLogic.bind(adminSdk),
        {
          authConfig: { passwordHash },
          customLogicImplAddr: ZERO_ADDRESS,
          logicData: toUtf8Bytes('test')
        },
        'customLogicImplAddr'
      );
      await testMissingParam(
        adminSdk.createWalletWithCustomLogic.bind(adminSdk),
        {
          customLogicImplAddr: ZERO_ADDRESS,
          logicData: toUtf8Bytes('test')
        },
        'authConfig'
      );
    });
  });

  describe('wallet management', () => {
    test('initializeWalletLogic', async () => {
      await testMissingParam(
        adminSdk.initializeWalletLogic.bind(adminSdk),
        { keyVaultAddr },
        'walletAddr'
      );
      await expect(
        adminSdk.initializeWalletLogic({ walletAddr })
      ).rejects.toMatchObject({ name: 'CredentialsRequiredError' });
      await expect(
        adminSdk.initializeWalletLogic({})
      ).rejects.toMatchObject({ name: 'CredentialsRequiredError' });
      await testInvalidAddress(
        adminSdk.initializeWalletLogic.bind(adminSdk),
        { walletAddr, keyVaultAddr },
        'walletAddr'
      );
      await testReadonlySDK(readonlySdk.initializeWalletLogic, { walletAddr, keyVaultAddr });
    });

    test('updateAuthenticatorAddr', async () => {
      const newAuthConfig = '0x01';
      await testMissingParam(
        fullSdk.updateAuthenticatorAddr.bind(fullSdk),
        { keyVaultAddr, authProof: opaqueAuthProof, newAuthConfig },
        'newAuthenticatorAddr'
      );
      await testMissingParam(
        fullSdk.updateAuthenticatorAddr.bind(fullSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          newAuthenticatorAddr: adminSdk.addresses.walletSignatureAuth
        },
        'newAuthConfig'
      );
      await testInvalidAddress(
        fullSdk.updateAuthenticatorAddr.bind(fullSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          newAuthenticatorAddr: adminSdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'newAuthenticatorAddr'
      );
    });

    test('updateKeyVaultImplAddr', async () => {
      const newImplAddr = ZERO_ADDRESS;
      await testMissingParam(
        fullSdk.updateKeyVaultImplAddr.bind(fullSdk),
        { keyVaultAddr, authProof: opaqueAuthProof },
        'newImplAddr'
      );
      await testInvalidAddress(
        fullSdk.updateKeyVaultImplAddr.bind(fullSdk),
        { keyVaultAddr, authProof: opaqueAuthProof, newImplAddr: ZERO_ADDRESS },
        'newImplAddr'
      );
      await expect(
        userSdk.updateKeyVaultImplAddr({
          keyVaultAddr,
          authProof: opaqueAuthProof,
          newImplAddr
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });

    test('updateWalletLogicImplAddr / transferAdmin', async () => {
      await testMissingParam(adminSdk.updateWalletLogicImplAddr.bind(adminSdk), {}, 'newLogicAddr');
      await testInvalidAddress(
        adminSdk.updateWalletLogicImplAddr.bind(adminSdk),
        { newLogicAddr: ZERO_ADDRESS },
        'newLogicAddr'
      );
      await testReadonlySDK(readonlySdk.updateWalletLogicImplAddr, { newLogicAddr: ZERO_ADDRESS });

      await testMissingParam(adminSdk.transferAdmin.bind(adminSdk), {}, 'newAdminAddr');
      await testInvalidAddress(
        adminSdk.transferAdmin.bind(adminSdk),
        { newAdminAddr: randomAddress() },
        'newAdminAddr'
      );
      await testReadonlySDK(readonlySdk.transferAdmin, { newAdminAddr: randomAddress() });
    });

    test('executeWithAuth', async () => {
      const keyVaultImplInterface = new Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      const implCall = keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ZeroHash,
        ZeroHash,
        0
      ]);
      await testMissingParam(
        userSdk.executeWithAuth.bind(userSdk),
        { keyVaultAddr, authProof: opaqueAuthProof },
        'implCall'
      );
      await testInvalidAddress(
        userSdk.executeWithAuth.bind(userSdk),
        { keyVaultAddr: INVALID_ADDRESS, authProof: opaqueAuthProof, implCall },
        'keyVaultAddr'
      );
    });

    test('initialize (KeyVault)', async () => {
      const accessToken = hexlify(randomBytes(32));
      const authConfig = createPasswordAuthProof('init');
      await expect(
        adminSdk.initialize({
          storageAddr,
          authenticatorAddr,
          accessToken,
          authConfig
        })
      ).rejects.toMatchObject({ name: 'CredentialsRequiredError' });
      await testMissingParam(
        adminSdk.initialize.bind(adminSdk),
        {
          keyVaultAddr,
          authenticatorAddr,
          accessToken,
          authConfig
        },
        'storageAddr'
      );
      await testMissingParam(
        adminSdk.initialize.bind(adminSdk),
        {
          keyVaultAddr,
          storageAddr,
          accessToken,
          authConfig
        },
        'authenticatorAddr'
      );
      await testMissingParam(
        adminSdk.initialize.bind(adminSdk),
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr,
          authConfig
        },
        'accessToken'
      );
      await testMissingParam(
        adminSdk.initialize.bind(adminSdk),
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr,
          accessToken
        },
        'authConfig'
      );
      await testInvalidAddress(
        adminSdk.initialize.bind(adminSdk),
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr,
          accessToken,
          authConfig
        },
        'keyVaultAddr'
      );
      await testReadonlySDK(readonlySdk.initialize, {
        keyVaultAddr,
        storageAddr,
        authenticatorAddr,
        accessToken,
        authConfig
      });
    });
  });

  describe('signing', () => {
    const messageBytes = () => toUtf8Bytes('test');
    const baseTxParams = () => ({
      index: accountIndex,
      nonce: 0,
      gasPrice: parseUnits('30', 'gwei'),
      gasLimit: 21000n,
      to: ZERO_ADDRESS,
      value: 0n,
      txData: '0x',
      chainId: adminSdk.chainId
    });

    test('signMessage', async () => {
      await testMissingParam(
        userSdk.signMessage.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex
        },
        'message'
      );
      await testInvalidAddress(
        userSdk.signMessage.bind(userSdk),
        {
          keyVaultAddr: INVALID_ADDRESS,
          authProof: opaqueAuthProof,
          index: accountIndex,
          message: messageBytes()
        },
        'keyVaultAddr'
      );
    });

    test('sign (hash)', async () => {
      await testMissingParam(
        userSdk.sign.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex
        },
        'hash'
      );
    });

    test('signTransaction', async () => {
      const baseParams = baseTxParams();
      await testMissingParam(
        userSdk.signTransaction.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          ...baseParams
        },
        'nonce'
      );
      await testMissingParam(
        userSdk.signTransaction.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          ...baseParams
        },
        'to'
      );
      await testInvalidAddress(
        userSdk.signTransaction.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          ...baseParams
        },
        'to'
      );
    });

    test('signSolana', async () => {
      await testMissingParam(
        userSdk.signSolana.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex
        },
        'message'
      );
    });

    test('signWithImportedKey', async () => {
      const keyId = keccak256(toUtf8Bytes('offline-imported-key'));
      const digest = keccak256(toUtf8Bytes('digest'));
      await testMissingParam(
        userSdk.signWithImportedKey.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          keyId
        },
        'digest'
      );
      await testMissingParam(
        userSdk.signWithImportedKey.bind(userSdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          digest
        },
        'keyId'
      );
    });
  });

  describe('wallet signature authenticator', () => {
    const signer = () => Wallet.createRandom();

    test('configure / query whitelist helpers', async () => {
      await expect(
        adminSdk.configureWalletSignature({ initialWhitelist: [testWalletAddr] })
      ).rejects.toMatchObject({ name: 'CredentialsRequiredError' });
      await testMissingParam(
        adminSdk.configureWalletSignature.bind(adminSdk),
        { keyVaultAddr, initialWhitelist: [testWalletAddr] },
        'initialWhitelist',
        'whitelist'
      );
      await testInvalidAddress(
        adminSdk.configureWalletSignature.bind(adminSdk),
        { keyVaultAddr, initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
      await testReadonlySDK(readonlySdk.configureWalletSignature, {
        keyVaultAddr,
        initialWhitelist: [testWalletAddr]
      });

      await testMissingParam(
        userSdk.isWalletSignatureValid.bind(userSdk),
        { keyVaultAddr, action: createTestVaultSignAction() },
        'signer'
      );

      await testMissingParam(
        userSdk.isWhitelisted.bind(userSdk),
        { keyVaultAddr },
        'addressToCheck'
      );
      await testInvalidAddress(
        userSdk.isWhitelisted.bind(userSdk),
        { keyVaultAddr, addressToCheck: testWalletAddr },
        'keyVaultAddr'
      );

      await testInvalidAddress(userSdk.getWhitelist.bind(userSdk), { keyVaultAddr }, 'keyVaultAddr');
    });

    test('addToWhitelist / removeFromWhitelist', async () => {
      await testMissingParam(
        fullSdk.addToWhitelist.bind(fullSdk),
        {
          keyVaultAddr,
          addressToAdd: testWalletAddr
        },
        'signer'
      );
      await testMissingParam(
        fullSdk.addToWhitelist.bind(fullSdk),
        {
          keyVaultAddr,
          signer: signer()
        },
        'addressToAdd'
      );

      await testMissingParam(
        fullSdk.removeFromWhitelist.bind(fullSdk),
        {
          keyVaultAddr,
          addressToRemove: testWalletAddr
        },
        'signer'
      );
      await testMissingParam(
        fullSdk.removeFromWhitelist.bind(fullSdk),
        {
          keyVaultAddr,
          signer: signer()
        },
        'addressToRemove'
      );
    });

    test('createAuthProofWalletSignature', async () => {
      const action = createTestVaultSignAction();

      await testMissingParam(
        userSdk.createAuthProofWalletSignature.bind(userSdk),
        {
          keyVaultAddr,
          deadline: calculateDeadline(),
          action
        },
        'signer'
      );
      await testInvalidAddress(
        userSdk.createAuthProofWalletSignature.bind(userSdk),
        {
          signer: signer(),
          keyVaultAddr,
          deadline: calculateDeadline(),
          action
        },
        'keyVaultAddr'
      );
      await testInvalidAddress(
        userSdk.createAuthProofWalletSignature.bind(userSdk),
        {
          signer: signer(),
          keyVaultAddr,
          authenticatorAddr: adminSdk.addresses.walletSignatureAuth,
          deadline: calculateDeadline(),
          actionHash: keccak256(toUtf8Bytes('offline-wallet-signature-action-hash'))
        },
        'authenticatorAddr'
      );
    });
  });
});
