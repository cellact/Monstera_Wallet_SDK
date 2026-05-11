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
  createPasswordAuthProof,
  calculateDeadline,
  randomAddress
} from '../../utils/fixtures.js';
import {
  testMissingParam,
  testInvalidAddress,
  testReadonlySDK
} from '../../utils/validation-helpers.js';

describe('Monstera offline validation', () => {
  let sdk;
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
    sdk = createTestSDK({ readonly: true });
    passwordHash = keccak256(toUtf8Bytes('offline-validation-suite'));
    keyVaultAddr = VALID_TEST_ADDRESS;
    walletAddr = VALID_TEST_ADDRESS;
    storageAddr = VALID_TEST_ADDRESS;
    authenticatorAddr = sdk.addresses.passwordAuth;
    testWalletAddr = createTestWallet().address;
  });

  registerSdkTeardown(afterAll, () => sdk);

  describe('password authenticator', () => {
    test('configurePassword validation', async () => {
      await testMissingParam(
        sdk.configurePassword.bind(sdk),
        { passwordHash },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.configurePassword.bind(sdk),
        { keyVaultAddr },
        'passwordHash',
        'authConfig'
      );
      await testInvalidAddress(
        sdk.configurePassword.bind(sdk),
        { keyVaultAddr, passwordHash },
        'keyVaultAddr'
      );
      await testReadonlySDK(sdk.configurePassword, {
        keyVaultAddr,
        passwordHash
      });
    });

    test('updatePassword validation', async () => {
      const currentPasswordBytes = createPasswordAuthProof('offline-password');
      const newPasswordHash = keccak256(toUtf8Bytes('new-offline'));
      await testMissingParam(
        sdk.updatePassword.bind(sdk),
        { currentPassword: currentPasswordBytes, newPasswordHash },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.updatePassword.bind(sdk),
        { keyVaultAddr, newPasswordHash },
        'currentPassword'
      );
      await testMissingParam(
        sdk.updatePassword.bind(sdk),
        { keyVaultAddr, currentPassword: currentPasswordBytes },
        'newPasswordHash'
      );
    });

    test('isPasswordConfigured / isPasswordValid validation', async () => {
      await testMissingParam(sdk.isPasswordConfigured.bind(sdk), {}, 'keyVaultAddr');
      await testInvalidAddress(
        sdk.isPasswordConfigured.bind(sdk),
        { keyVaultAddr },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.isPasswordValid.bind(sdk),
        { currentPassword: createPasswordAuthProof('x') },
        'keyVaultAddr'
      );
      await testMissingParam(sdk.isPasswordValid.bind(sdk), { keyVaultAddr }, 'currentPassword', 'authProof');
      await testInvalidAddress(
        sdk.isPasswordValid.bind(sdk),
        {
          keyVaultAddr,
          currentPassword: createPasswordAuthProof('x')
        },
        'keyVaultAddr'
      );
    });
  });

  describe('wallet creation', () => {
    test('createWallet / createWalletFromMnemonic / core / hook / customLogic validation', async () => {
      await testMissingParam(sdk.createWallet.bind(sdk), {}, 'authConfig');
      await testReadonlySDK(sdk.createWallet, { authConfig: { passwordHash } });

      await testMissingParam(
        sdk.createWalletFromMnemonic.bind(sdk),
        { authConfig: { passwordHash } },
        'mnemonic'
      );
      await testMissingParam(
        sdk.createWalletFromMnemonic.bind(sdk),
        { mnemonic: testMnemonic },
        'authConfig'
      );

      await testMissingParam(sdk.createWalletCore.bind(sdk), {}, 'authConfig');

      await testMissingParam(
        sdk.createWalletWithHook.bind(sdk),
        {
          authConfig: { passwordHash },
          hookData: toUtf8Bytes('test')
        },
        'hookAddr'
      );
      await testMissingParam(
        sdk.createWalletWithHook.bind(sdk),
        {
          authConfig: { passwordHash },
          hookAddr: ZERO_ADDRESS
        },
        'hookData'
      );
      await testInvalidAddress(
        sdk.createWalletWithHook.bind(sdk),
        {
          authConfig: { passwordHash },
          hookAddr: ZERO_ADDRESS,
          hookData: toUtf8Bytes('test')
        },
        'hookAddr'
      );
      await testMissingParam(
        sdk.createWalletWithHook.bind(sdk),
        {
          hookAddr: ZERO_ADDRESS,
          hookData: toUtf8Bytes('test')
        },
        'authConfig'
      );

      await testMissingParam(
        sdk.createWalletWithCustomLogic.bind(sdk),
        {
          authConfig: { passwordHash },
          logicData: toUtf8Bytes('test')
        },
        'customLogicImplAddr'
      );
      await testMissingParam(
        sdk.createWalletWithCustomLogic.bind(sdk),
        {
          authConfig: { passwordHash },
          customLogicImplAddr: ZERO_ADDRESS
        },
        'logicData'
      );
      await testInvalidAddress(
        sdk.createWalletWithCustomLogic.bind(sdk),
        {
          authConfig: { passwordHash },
          customLogicImplAddr: ZERO_ADDRESS,
          logicData: toUtf8Bytes('test')
        },
        'customLogicImplAddr'
      );
      await testMissingParam(
        sdk.createWalletWithCustomLogic.bind(sdk),
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
        sdk.initializeWalletLogic.bind(sdk),
        { keyVaultAddr },
        'walletAddr'
      );
      await testMissingParam(
        sdk.initializeWalletLogic.bind(sdk),
        { walletAddr },
        'keyVaultAddr'
      );
      await testInvalidAddress(
        sdk.initializeWalletLogic.bind(sdk),
        { walletAddr, keyVaultAddr },
        'walletAddr'
      );
      await testReadonlySDK(sdk.initializeWalletLogic, { walletAddr, keyVaultAddr });
    });

    test('updateAuthenticatorAddr', async () => {
      const newAuthConfig = '0x01';
      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          authProof: opaqueAuthProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'authProof'
      );
      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        { keyVaultAddr, authProof: opaqueAuthProof, newAuthConfig },
        'newAuthenticatorAddr'
      );
      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth
        },
        'newAuthConfig'
      );
      await testInvalidAddress(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'newAuthenticatorAddr'
      );
    });

    test('updateKeyVaultImplAddr', async () => {
      const newImplAddr = ZERO_ADDRESS;
      await testMissingParam(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        { authProof: opaqueAuthProof, newImplAddr },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        { keyVaultAddr, newImplAddr },
        'authProof'
      );
      await testMissingParam(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        { keyVaultAddr, authProof: opaqueAuthProof },
        'newImplAddr'
      );
      await testInvalidAddress(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        { keyVaultAddr, authProof: opaqueAuthProof, newImplAddr: ZERO_ADDRESS },
        'newImplAddr'
      );
      await testReadonlySDK(sdk.updateKeyVaultImplAddr, {
        keyVaultAddr,
        authProof: opaqueAuthProof,
        newImplAddr
      });
    });

    test('updateWalletLogicImplAddr / transferAdmin', async () => {
      await testMissingParam(sdk.updateWalletLogicImplAddr.bind(sdk), {}, 'newLogicAddr');
      await testInvalidAddress(
        sdk.updateWalletLogicImplAddr.bind(sdk),
        { newLogicAddr: ZERO_ADDRESS },
        'newLogicAddr'
      );
      await testReadonlySDK(sdk.updateWalletLogicImplAddr, { newLogicAddr: ZERO_ADDRESS });

      await testMissingParam(sdk.transferAdmin.bind(sdk), {}, 'newAdminAddr');
      await testInvalidAddress(
        sdk.transferAdmin.bind(sdk),
        { newAdminAddr: randomAddress() },
        'newAdminAddr'
      );
      await testReadonlySDK(sdk.transferAdmin, { newAdminAddr: randomAddress() });
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
        sdk.executeWithAuth.bind(sdk),
        { authProof: opaqueAuthProof, implCall },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.executeWithAuth.bind(sdk),
        { keyVaultAddr, implCall },
        'authProof'
      );
      await testMissingParam(
        sdk.executeWithAuth.bind(sdk),
        { keyVaultAddr, authProof: opaqueAuthProof },
        'implCall'
      );
      await testInvalidAddress(
        sdk.executeWithAuth.bind(sdk),
        { keyVaultAddr, authProof: opaqueAuthProof, implCall },
        'keyVaultAddr'
      );
    });

    test('initialize (KeyVault)', async () => {
      const accessToken = hexlify(randomBytes(32));
      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          storageAddr,
          authenticatorAddr,
          accessToken
        },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          authenticatorAddr,
          accessToken
        },
        'storageAddr'
      );
      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          storageAddr,
          accessToken
        },
        'authenticatorAddr'
      );
      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr
        },
        'accessToken'
      );
      await testInvalidAddress(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr,
          accessToken
        },
        'keyVaultAddr'
      );
      await testReadonlySDK(sdk.initialize, {
        keyVaultAddr,
        storageAddr,
        authenticatorAddr,
        accessToken
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
      chainId: sdk.chainId
    });

    test('signMessage', async () => {
      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          authProof: opaqueAuthProof,
          index: accountIndex,
          message: messageBytes()
        },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          index: accountIndex,
          message: messageBytes()
        },
        'authProof'
      );
      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          message: messageBytes()
        },
        'index'
      );
      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex
        },
        'message'
      );
      await testInvalidAddress(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex,
          message: messageBytes()
        },
        'keyVaultAddr'
      );
    });

    test('sign (hash)', async () => {
      await testMissingParam(
        sdk.sign.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex
        },
        'hash'
      );
    });

    test('signTransaction', async () => {
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          authProof: opaqueAuthProof,
          ...baseTxParams()
        },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          ...baseTxParams()
        },
        'authProof'
      );
      const baseParams = baseTxParams();
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          ...baseParams
        },
        'nonce'
      );
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          ...baseParams
        },
        'to'
      );
      await testInvalidAddress(
        sdk.signTransaction.bind(sdk),
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
        sdk.signSolana.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          index: accountIndex
        },
        'message'
      );
      await testMissingParam(
        sdk.signSolana.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          message: toUtf8Bytes('x')
        },
        'index'
      );
    });

    test('signWithImportedKey', async () => {
      const keyId = keccak256(toUtf8Bytes('offline-imported-key'));
      const digest = keccak256(toUtf8Bytes('digest'));
      await testMissingParam(
        sdk.signWithImportedKey.bind(sdk),
        {
          keyVaultAddr,
          authProof: opaqueAuthProof,
          keyId
        },
        'digest'
      );
      await testMissingParam(
        sdk.signWithImportedKey.bind(sdk),
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
      await testMissingParam(
        sdk.configureWalletSignature.bind(sdk),
        { initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.configureWalletSignature.bind(sdk),
        { keyVaultAddr },
        'initialWhitelist',
        'whitelist'
      );
      await testInvalidAddress(
        sdk.configureWalletSignature.bind(sdk),
        { keyVaultAddr, initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
      await testReadonlySDK(sdk.configureWalletSignature, {
        keyVaultAddr,
        initialWhitelist: [testWalletAddr]
      });

      await testMissingParam(sdk.isWalletSignatureConfigured.bind(sdk), {}, 'keyVaultAddr');

      await testMissingParam(
        sdk.isWalletSignatureValid.bind(sdk),
        { signer: signer() },
        'keyVaultAddr'
      );
      await testMissingParam(sdk.isWalletSignatureValid.bind(sdk), { keyVaultAddr }, 'signer');

      await testMissingParam(
        sdk.isWhitelisted.bind(sdk),
        { addressToCheck: testWalletAddr },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.isWhitelisted.bind(sdk),
        { keyVaultAddr },
        'addressToCheck'
      );
      await testInvalidAddress(
        sdk.isWhitelisted.bind(sdk),
        { keyVaultAddr, addressToCheck: testWalletAddr },
        'keyVaultAddr'
      );

      await testMissingParam(sdk.getWhitelist.bind(sdk), {}, 'keyVaultAddr');
      await testInvalidAddress(sdk.getWhitelist.bind(sdk), { keyVaultAddr }, 'keyVaultAddr');
    });

    test('addToWhitelist / removeFromWhitelist', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: signer(),
          addressToAdd: testWalletAddr
        },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          addressToAdd: testWalletAddr
        },
        'signer'
      );
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: signer()
        },
        'addressToAdd'
      );

      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: signer(),
          addressToRemove: testWalletAddr
        },
        'keyVaultAddr'
      );
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          addressToRemove: testWalletAddr
        },
        'signer'
      );
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: signer()
        },
        'addressToRemove'
      );
    });

    test('createAuthProofWalletSignature', async () => {
      await testMissingParam(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          keyVaultAddr,
          deadline: calculateDeadline()
        },
        'signer'
      );
      await testMissingParam(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          signer: signer(),
          deadline: calculateDeadline()
        },
        'keyVaultAddr'
      );
      await testInvalidAddress(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          signer: signer(),
          keyVaultAddr,
          deadline: calculateDeadline()
        },
        'keyVaultAddr'
      );
      await testInvalidAddress(
        sdk.createAuthProofWalletSignature.bind(sdk),
        {
          signer: signer(),
          keyVaultAddr,
          authenticatorAddr: sdk.addresses.walletSignatureAuth,
          deadline: calculateDeadline()
        },
        'authenticatorAddr'
      );
    });
  });
});
