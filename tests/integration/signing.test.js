/**
 * Integration tests for signing functionality
 * 
 * These tests verify that the SDK can sign transactions, messages, and hashes correctly.
 * Tests both success and failure scenarios.
 * 
 * Note: These tests require either:
 * - Environment variables: SIGNER_PRIVATE_KEY, WALLET_ADDRESS, PASSWORD
 * - Or will create a new wallet (requires network access and funds)
 */
import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { registerSdkTeardown } from '../utils/teardown.js';
import { Transaction, parseEther, parseUnits, Wallet } from '../../src/adapters/ethers/index.js';
import { getAddress } from '../../src/adapters/ethers/addresses.js';
import { getBytes, hexlify, keccak256, randomBytes, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';
import { recoverAddress, verifyMessage } from '../../src/adapters/ethers/signing.js';
import { 
  createTestSDK, 
  getTestConfig, 
  setupTestWallet 
} from '../utils/setup.js';
import { 
  createPasswordAuthProof,
  ZERO_ADDRESS
} from '../utils/fixtures.js';
import { 
  expectValidHex,
  expectValidAddress,
  expectTransactionResult
} from '../utils/assertions.js';

/** @see WalletStorageV2.CurveType — secp256k1 */
const CURVE_SECP256K1 = 0;
/** @see WalletStorageV2.ChainType — Ethereum address derived from key */
const CHAIN_ETHEREUM = 0;
/** @see WalletStorageV2.ChainType — Solana (ed25519) HD base keys */
const CHAIN_SOLANA = 1;

describe('Signing Integration Tests', () => {
  let sdk;
  let walletAddr;
  let keyVaultAddr;
  let password;
  let authProof;
  let accountIndex;

  beforeAll(async () => {
    const config = getTestConfig();
    password = config.password;
    const passwordHash = config.passwordHash;
    accountIndex = 0;

    sdk = createTestSDK();

    // Setup test wallet (uses existing from env or creates new)
    const walletData = await setupTestWallet(sdk, passwordHash);
    walletAddr = walletData.wallet;
    keyVaultAddr = walletData.keyVault;

    authProof = { password: createPasswordAuthProof(password) };
  });

  registerSdkTeardown(afterAll, () => sdk);

  describe('signMessage', () => {
    test('should successfully sign a message', async () => {
      const message = 'Hello, Monstera!';
      const messageBytes = toUtf8Bytes(message);

      const signature = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        message: messageBytes
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expectValidHex(signature);

      // Verify the signature
      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr,
        index: accountIndex
      });
      const recovered = verifyMessage(message, signature);
      expect(recovered.toLowerCase()).toBe(accountAddr.toLowerCase());
    });

    test('should sign empty message', async () => {
      const messageBytes = toUtf8Bytes('');

      const signature = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        message: messageBytes
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expectValidHex(signature);

      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr,
        index: accountIndex
      });
      const recovered = verifyMessage('', signature);
      expect(recovered.toLowerCase()).toBe(accountAddr.toLowerCase());
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };
      const messageBytes = toUtf8Bytes('test message');

      await expect(
        sdk.signMessage({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          message: messageBytes
        })
      ).rejects.toThrow();
    });

    test('should fail with negative index', async () => {
      const messageBytes = toUtf8Bytes('test');

      await expect(
        sdk.signMessage({
          keyVaultAddr,
          authProof,
          index: -1,
          message: messageBytes
        })
      ).rejects.toThrow();
    });
  });

  describe('sign (hash signing)', () => {
    test('should successfully sign a hash', async () => {
      const data = 'Some data to hash';
      const hash = keccak256(toUtf8Bytes(data));

      const signature = await sdk.sign({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        hash
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expectValidHex(signature);

      // Verify the signature
      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr,
        index: accountIndex
      });
      const recovered = recoverAddress(hash, signature);
      expect(recovered.toLowerCase()).toBe(accountAddr.toLowerCase());
    });

    test('should sign different hashes with different signatures', async () => {
      const hash1 = keccak256(toUtf8Bytes('data1'));
      const hash2 = keccak256(toUtf8Bytes('data2'));

      const sig1 = await sdk.sign({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        hash: hash1
      });

      const sig2 = await sdk.sign({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        hash: hash2
      });

      expect(sig1).not.toBe(sig2);
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };
      const hash = keccak256(toUtf8Bytes('test'));

      await expect(
        sdk.sign({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          hash
        })
      ).rejects.toThrow();
    });

    test('should fail with invalid hash length', async () => {
      const invalidHash = '0x1234'; // Too short

      await expect(
        sdk.sign({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          hash: invalidHash
        })
      ).rejects.toThrow();
    });
  });

  describe('signTransaction', () => {
    // TODO: fix this test
    // test('should successfully sign a transaction', async () => {
    //   const to = '0x0000000000000000000000000000000000000000';
    //   const value = parseEther('0.001');
    //   const nonce = 0;
    //   const gasPrice = parseUnits('30', 'gwei');
    //   const gasLimit = 21000n;
    //   const txData = '0x';
    //   const chainId = sdk.chainId;

    //   const signedTx = await sdk.signTransaction({
    //     keyVaultAddr,
    //     authProof,
    //     index: accountIndex,
    //     nonce,
    //     gasPrice,
    //     gasLimit,
    //     to,
    //     value,
    //     txData,
    //     chainId
    //   });

    //   expect(signedTx).toBeDefined();
    //   expect(typeof signedTx).toBe('string');
    //   expect(signedTx).toMatch(/^0x[a-fA-F0-9]+$/);

    //   // Parse and verify the transaction
    //   const tx = Transaction.from(signedTx);
    //   expect(tx.to?.toLowerCase()).toBe(to.toLowerCase());
    //   expect(tx.value).toBe(value);
    //   expect(tx.nonce).toBe(nonce);
    // });

    test('should sign transaction with data', async () => {
      const to = ZERO_ADDRESS;
      const value = 0n;
      const nonce = 0;
      const gasPrice = parseUnits('30', 'gwei');
      const gasLimit = 100000n;
      const txData = toUtf8Bytes('test data');
      const chainId = sdk.chainId;

      const signedTx = await sdk.signTransaction({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        txData,
        chainId
      });

      expect(signedTx).toBeDefined();
      expectValidHex(signedTx);
      const tx = Transaction.from(signedTx);
      expect(tx.data).toBeDefined();
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };
      const to = ZERO_ADDRESS;
      const value = parseEther('0.001');
      const nonce = 0;
      const gasPrice = parseUnits('30', 'gwei');
      const gasLimit = 21000n;
      const txData = '0x';
      const chainId = sdk.chainId;

      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          nonce,
          gasPrice,
          gasLimit,
          to,
          value,
          txData,
          chainId
        })
      ).rejects.toThrow();
    });

    test('should fail with negative values', async () => {
      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          nonce: -1,
          gasPrice: parseUnits('30', 'gwei'),
          gasLimit: 21000n,
          to: ZERO_ADDRESS,
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow();
    });
  });

  describe('Cross-account signing', () => {
    test('should sign with different account indices', async () => {
      const messageBytes = toUtf8Bytes('test message');

      // Sign with account 0
      const sig0 = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: 0,
        message: messageBytes
      });

      // Sign with account 1
      const sig1 = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: 1,
        message: messageBytes
      });

      expect(sig0).toBeDefined();
      expect(sig1).toBeDefined();
      expect(sig0).not.toBe(sig1); // Different accounts should produce different signatures

      // Verify both signatures
      const addr0 = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
      const addr1 = await sdk.getAccountAddr({ keyVaultAddr, index: 1 });
      expectValidAddress(addr0);
      expectValidAddress(addr1);
      expect(addr0).not.toBe(addr1);

      const recovered0 = verifyMessage('test message', sig0);
      const recovered1 = verifyMessage('test message', sig1);
      expect(recovered0.toLowerCase()).toBe(addr0.toLowerCase());
      expect(recovered1.toLowerCase()).toBe(addr1.toLowerCase());
    });
  });

  describe('signSolana', () => {
    test('should fail with wrong password', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };

      await expect(
        sdk.signSolana({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          message: toUtf8Bytes('x')
        })
      ).rejects.toThrow();
    });

    describe('fresh wallet without Solana chain base keys', () => {
      let freshSdk;
      let freshKeyVault;
      let freshAuthProof;

      beforeAll(async () => {
        const cfg = getTestConfig();
        const passwordHash = keccak256(toUtf8Bytes(cfg.password));
        freshSdk = createTestSDK();
        const created = await freshSdk.createWallet({
          authenticatorAddr: freshSdk.addresses.passwordAuth,
          authConfig: { passwordHash }
        });
        expectTransactionResult(created);
        freshKeyVault = created.keyVault;
        freshAuthProof = { password: createPasswordAuthProof(cfg.password) };
      }, 180000);

      registerSdkTeardown(afterAll, () => freshSdk);

      test('should revert signSolana with ChainNotConfigured', async () => {
        await expect(
          freshSdk.signSolana({
            keyVaultAddr: freshKeyVault,
            authProof: freshAuthProof,
            index: 0,
            message: toUtf8Bytes('Hello, Monstera!')
          })
        ).rejects.toMatchObject({
          code: 'TX_REVERTED',
          context: expect.objectContaining({ revertReason: 'ChainNotConfigured' })
        });
      }, 30000);

      test('should revert getSolanaAddr with ChainNotConfigured', async () => {
        await expect(
          freshSdk.getSolanaAddr({ keyVaultAddr: freshKeyVault, index: 0 })
        ).rejects.toMatchObject({
          code: 'TX_REVERTED',
          context: expect.objectContaining({ revertReason: 'ChainNotConfigured' })
        });
      }, 30000);
    });

    describe('fresh wallet with Solana configured via setChainBaseKeys', () => {
      let solSdk;
      let solKeyVault;
      let solAuthProof;

      beforeAll(async () => {
        const cfg = getTestConfig();
        const passwordHash = keccak256(toUtf8Bytes(cfg.password));
        solSdk = createTestSDK();
        const created = await solSdk.createWallet({
          authenticatorAddr: solSdk.addresses.passwordAuth,
          authConfig: { passwordHash }
        });
        expectTransactionResult(created);
        solKeyVault = created.keyVault;
        solAuthProof = { password: createPasswordAuthProof(cfg.password) };

        const basePrivateKey = hexlify(randomBytes(32));
        const baseChainCode = hexlify(randomBytes(32));
        const setKeys = await solSdk.setChainBaseKeys({
          keyVaultAddr: solKeyVault,
          authProof: solAuthProof,
          chain: CHAIN_SOLANA,
          basePrivateKey,
          baseChainCode
        });
        expectTransactionResult(setKeys);
      }, 180000);

      registerSdkTeardown(afterAll, () => solSdk);

      test('should expose a Solana pubkey via getSolanaAddr', async () => {
        const pk = await solSdk.getSolanaAddr({ keyVaultAddr: solKeyVault, index: 0 });
        expectValidHex(pk);
        expect(getBytes(pk).length).toBe(32);
      }, 30000);

      test('should return a 64-byte ed25519 signature for the message', async () => {
        const messageBytes = toUtf8Bytes('Hello, Monstera!');

        const signature = await solSdk.signSolana({
          keyVaultAddr: solKeyVault,
          authProof: solAuthProof,
          index: 0,
          message: messageBytes
        });

        expectValidHex(signature);
        expect(getBytes(signature).length).toBe(64);
      }, 30000);

      test('should produce different signatures for different messages', async () => {
        const sigA = await solSdk.signSolana({
          keyVaultAddr: solKeyVault,
          authProof: solAuthProof,
          index: 0,
          message: toUtf8Bytes('msg-a')
        });
        const sigB = await solSdk.signSolana({
          keyVaultAddr: solKeyVault,
          authProof: solAuthProof,
          index: 0,
          message: toUtf8Bytes('msg-b')
        });

        expect(sigA).not.toBe(sigB);
      }, 30000);
    });
  });

  describe('signWithImportedKey', () => {
    let importedKeyId;
    let importedSigningWallet;

    beforeAll(async () => {
      importedSigningWallet = Wallet.createRandom();
      importedKeyId = keccak256(
        toUtf8Bytes(`wallet-sdk-signing-import-${Date.now()}-${Math.random()}`)
      );

      const importResult = await sdk.importKey({
        keyVaultAddr,
        authProof,
        keyId: importedKeyId,
        privateKey: getBytes(importedSigningWallet.privateKey),
        curve: CURVE_SECP256K1,
        chain: CHAIN_ETHEREUM,
        label: 'integration-signing-imported-ecdsa'
      });

      expectTransactionResult(importResult);
      expect(await sdk.keyExists({ keyVaultAddr, keyId: importedKeyId })).toBe(true);
    }, 120000);

    test('should sign a digest and recover the imported Ethereum address', async () => {
      const digest = keccak256(toUtf8Bytes('signWithImportedKey integration'));

      const signature = await sdk.signWithImportedKey({
        keyVaultAddr,
        authProof,
        keyId: importedKeyId,
        digest
      });

      expectValidHex(signature);

      const recovered = recoverAddress(digest, signature);
      expect(recovered.toLowerCase()).toBe(importedSigningWallet.address.toLowerCase());

      const importedAddrBytes = await sdk.getImportedKeyAddr({
        keyVaultAddr,
        keyId: importedKeyId
      });

      expectValidHex(importedAddrBytes);
      const importedAddr = getAddress(hexlify(importedAddrBytes));
      expect(importedAddr.toLowerCase()).toBe(importedSigningWallet.address.toLowerCase());
    }, 30000);

    test('should fail with wrong password', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };

      await expect(
        sdk.signWithImportedKey({
          keyVaultAddr,
          authProof: wrongAuthProof,
          keyId: importedKeyId,
          digest: keccak256(toUtf8Bytes('x'))
        })
      ).rejects.toThrow();
    });
  });
});