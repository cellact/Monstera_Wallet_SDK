/**
 * Unit tests for wallet functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { defaultAbiCoder } from '../../../src/adapters/ethers/encoding.js';
import { getBytes, keccak256, solidityPacked, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { JsonRpcProvider } from '../../../src/adapters/ethers/provider.js';
import { expectValidMnemonic } from '../../utils/assertions.js';
import {
  TEST_SIGNER,
  DEFAULT_TESTNET_RPC_URL,
  createDefaultAuthProofParams,
  randomAddress,
  VALID_TEST_ADDRESS,
  INVALID_ADDRESS
} from '../../utils/fixtures.js';
import { getTestConfig } from '../../utils/setup.js';
import {
  generateMnemonic,
  deriveSeed,
  createAuthProofWalletSignature,
  createWalletSigAuthConfig,
  createDualFactorAuthConfig,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  computeParamsHash
} from '../../../src/internal/crypto/index.js';
import { createTestVaultSignAction } from '../../utils/fixtures.js';
import { floorTimestampToMinuteBucket, nowUnixTimestampSeconds } from '../../../src/internal/utils/time.js';
import { NetworkError } from '../../../src/errors/index.js';

describe('Wallet Crypto Utilities', () => {
  describe('generateMnemonic', () => {
    test('should generate a valid mnemonic with 12 words', () => {
      const mnemonic = generateMnemonic();
      expectValidMnemonic(mnemonic, 12);
    });
  });

  describe('deriveSeed', () => {
    test('should derive a seed from a mnemonic and return a buffer of 64 bytes', () => {
      const mnemonic = generateMnemonic();
      const seed = deriveSeed(mnemonic);
      expect(seed).toBeDefined();
      expect(seed instanceof Uint8Array).toBe(true);
      expect(seed.length).toBe(64);
    });
  });

  describe('createAuthProofWalletSignature', () => {
    let defaultParams;
    let testSigner;

    beforeEach(() => {
      defaultParams = createDefaultAuthProofParams();
      testSigner = new Wallet(TEST_SIGNER);
    });

    test('should create an auth proof for a signer and return a string', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      const config = getTestConfig();

      const provider = new JsonRpcProvider(DEFAULT_TESTNET_RPC_URL);
      const signer = new Wallet(config.signerPrivateKey, provider);

      const authProof = await createAuthProofWalletSignature({
        signer,
        ...defaultParams
      });
      expect(authProof).toBeDefined();
      expect(typeof authProof).toBe('string');
      expect(authProof.startsWith('0x')).toBe(true);
    });

    test('should throw an error if the signer is not a Wallet or HDNodeWallet', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: null,
          ...defaultParams
        })
      ).rejects.toThrow('signer is required and must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: undefined,
          ...defaultParams
        })
      ).rejects.toThrow('signer is required and must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ (123),
          ...defaultParams
        })
      ).rejects.toThrow('signer is required and must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ ('invalid'),
          ...defaultParams
        })
      ).rejects.toThrow('signer is required and must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ (randomAddress()),
          ...defaultParams
        })
      ).rejects.toThrow('signer is required and must be a Wallet or HDNodeWallet');
    });

    test('should throw an error if the chainId is missing or not a valid chain id', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          chainId: null
        })
      ).rejects.toThrow('chainId is required and must be a chain id');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          chainId: undefined
        })
      ).rejects.toThrow('chainId is required and must be a chain id');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          chainId: /** @type {any} */ ({ chainId })
        })
      ).rejects.toThrow(
        'chainId must be a finite chain id (number, bigint, decimal string, or hex string)'
      );
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          chainId: /** @type {any} */ ([])
        })
      ).rejects.toThrow(
        'chainId must be a finite chain id (number, bigint, decimal string, or hex string)'
      );
    });

    test('should throw an error if the authenticatorAddr is not a valid address', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          authenticatorAddr: null
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          authenticatorAddr: undefined
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          authenticatorAddr: /** @type {any} */ (123)
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          authenticatorAddr: /** @type {any} */ ({ address: authenticatorAddr })
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
    });

    test('should throw an error if the keyVaultAddr is not a valid address', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          keyVaultAddr: null
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          keyVaultAddr: undefined
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          keyVaultAddr: /** @type {any} */ (123)
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          keyVaultAddr: /** @type {any} */ ({ address: keyVaultAddr })
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
    });

    test('should throw an error if the deadline is not a number or is not an integer', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          deadline: null
        })
      ).rejects.toThrow('deadline is required');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          deadline: undefined
        })
      ).rejects.toThrow('deadline is required');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          deadline: 123.5
        })
      ).rejects.toThrow('deadline must be an integer');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          deadline: /** @type {any} */ ({ deadline })
        })
      ).rejects.toThrow('deadline is required and must be a number or BigInt');
    });

    test('should throw an error if the deadline is in the past', async () => {
      const { chainId, authenticatorAddr, keyVaultAddr } = defaultParams;
      const pastDeadline = nowUnixTimestampSeconds() - 1000;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          deadline: pastDeadline
        })
      ).rejects.toThrow('deadline must be in the future');
    });

    test('should throw if actionHash is missing', async () => {
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          ...defaultParams,
          actionHash: undefined
        })
      ).rejects.toThrow('actionHash is required and must be a non-empty string');
    });
  });

  describe('createWalletSigAuthConfig', () => {
    test('should ABI-encode address whitelist', () => {
      const whitelist = [VALID_TEST_ADDRESS, randomAddress()];
      const encoded = createWalletSigAuthConfig(whitelist);
      const expected = defaultAbiCoder.encode(['address[]'], [whitelist]);
      expect(encoded).toBe(expected);
    });

    test('should throw if whitelist is not an array', () => {
      expect(() =>
        createWalletSigAuthConfig(/** @type {any} */ (null))
      ).toThrow('whitelist is required and must be an array');
      expect(() =>
        createWalletSigAuthConfig(/** @type {any} */ ({ length: 1 }))
      ).toThrow('whitelist is required and must be an array');
    });

    test('should throw if whitelist is empty', () => {
      expect(() => createWalletSigAuthConfig([])).toThrow(
        'whitelist must be a non-empty array'
      );
    });

    test('should throw if an entry is not a valid address', () => {
      expect(() =>
        createWalletSigAuthConfig([INVALID_ADDRESS])
      ).toThrow('address must be a valid Ethereum address');
    });
  });

  describe('createDualFactorAuthConfig', () => {
    test('should ABI-encode bytes32 and guardian address', () => {
      const passwordHash = keccak256(toUtf8Bytes('pw'));
      const guardianAddr = VALID_TEST_ADDRESS;
      const encoded = createDualFactorAuthConfig(passwordHash, guardianAddr);

      const [decodedHash, decodedGuardian] = defaultAbiCoder.decode(
        ['bytes32', 'address'],
        encoded
      );

      expect(decodedHash).toBe(passwordHash);
      expect(decodedGuardian.toLowerCase()).toBe(guardianAddr.toLowerCase());
    });

    test('should throw if passwordHash is not bytes32 hex', () => {
      expect(() =>
        createDualFactorAuthConfig(/** @type {any} */ ('0xabad1dea'), VALID_TEST_ADDRESS)
      ).toThrow('passwordHash must be a 32-byte hex string value');
    });

    test('should throw if guardianAddr is not a valid address', () => {
      const hash = keccak256(toUtf8Bytes('x'));
      expect(() =>
        createDualFactorAuthConfig(hash, INVALID_ADDRESS)
      ).toThrow('guardianAddr must be a valid Ethereum address');
    });
  });

  describe('createAuthProofMinuteSignature', () => {
    const passwordHash = keccak256(toUtf8Bytes('minute-test'));
    const actionHash = keccak256(toUtf8Bytes('minute-test-action-hash'));

    function mockProvider(timestampSeconds) {
      return {
        async getBlock() {
          return { timestamp: timestampSeconds };
        }
      };
    }

    test('should return authProof, minuteBucket, and derivedAddress from mocked block', async () => {
      const timestampSeconds = 1735689625;
      const provider = mockProvider(timestampSeconds);
      const minuteBucket = floorTimestampToMinuteBucket(timestampSeconds);

      const result = await createAuthProofMinuteSignature({
        provider,
        keyVaultAddr: VALID_TEST_ADDRESS,
        authenticatorAddr: VALID_TEST_ADDRESS,
        chainId: '23295',
        passwordHash,
        actionHash
      });

      expect(result.minuteBucket).toBe(minuteBucket);

      const minuteSeed = keccak256(
        solidityPacked(['bytes32', 'uint256'], [passwordHash, BigInt(minuteBucket)])
      );
      expect(result.derivedAddress).toBe(new Wallet(minuteSeed).address);

      const [signature] = defaultAbiCoder.decode(['bytes'], result.authProof);
      expect(typeof signature).toBe('string');
      expect(signature.startsWith('0x')).toBe(true);

      const payloadHash = keccak256(
        solidityPacked(
          ['address', 'address', 'uint256', 'uint256', 'bytes32'],
          [
            VALID_TEST_ADDRESS,
            VALID_TEST_ADDRESS,
            BigInt(23295),
            BigInt(minuteBucket),
            actionHash
          ]
        )
      );

      const derivedSigner = new Wallet(minuteSeed);
      const expectedSig = await derivedSigner.signMessage(getBytes(payloadHash));
      expect(signature).toBe(expectedSig);
    });

    test('should throw if provider does not expose getBlock', async () => {
      await expect(
        createAuthProofMinuteSignature({
          provider: /** @type {any} */ ({}),
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash,
          actionHash
        })
      ).rejects.toThrow('provider must expose getBlock');

      await expect(
        createAuthProofMinuteSignature({
          provider: /** @type {any} */ ({ getBlock: null }),
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash,
          actionHash
        })
      ).rejects.toThrow('provider must expose getBlock');
    });

    test('should throw NetworkError when latest block is unavailable', async () => {
      const provider = {
        async getBlock() {
          return null;
        }
      };

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash,
          actionHash
        })
      ).rejects.toThrow(NetworkError);
    });

    test('should validate addresses and chainId', async () => {
      const provider = mockProvider(1735689625);

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: INVALID_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash,
          actionHash
        })
      ).rejects.toThrow('keyVaultAddr must be a valid Ethereum address');

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: null,
          chainId: '23295',
          passwordHash,
          actionHash
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: /** @type {any} */ ({}),
          passwordHash,
          actionHash
        })
      ).rejects.toThrow(
        'chainId must be a finite chain id (number, bigint, decimal string, or hex string)'
      );

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash: '0x1234',
          actionHash
        })
      ).rejects.toThrow('passwordHash must be a 32-byte hex string value');

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash
        })
      ).rejects.toThrow('actionHash is required and must be a non-empty string');
    });
  });

  describe('createAuthProofDualFactor', () => {
    const passwordHash = keccak256(toUtf8Bytes('dual-factor-test'));

    function mockActionHash(defaultParams) {
      const action = createTestVaultSignAction();
      return computeParamsHash(
        ['bytes32', 'uint256', 'address', 'address', 'bytes4', 'bytes32'],
        [
          keccak256(toUtf8Bytes('MONSTERA_AUTH_CONTEXT_V1')),
          BigInt(defaultParams.chainId),
          defaultParams.keyVaultAddr,
          defaultParams.keyVaultAddr,
          action.selector,
          action.paramsHash
        ]
      );
    }

    function mockProvider(timestampSeconds) {
      return {
        async getBlock() {
          return { timestamp: timestampSeconds };
        }
      };
    }

    test('should ABI-encode minute signature, deadline, and guardian EIP-712 signature', async () => {
      const defaultParams = createDefaultAuthProofParams();
      const signer = new Wallet(TEST_SIGNER);
      const deadline = defaultParams.deadline;

      const actionHash = mockActionHash(defaultParams);

      const encoded = await createAuthProofDualFactor({
        provider: mockProvider(1735689625),
        keyVaultAddr: defaultParams.keyVaultAddr,
        passwordHash,
        signer,
        authenticatorAddr: defaultParams.authenticatorAddr,
        deadline,
        chainId: defaultParams.chainId,
        actionHash
      });

      expect(encoded.startsWith('0x')).toBe(true);

      const [minutePasswordSignature, decodedDeadline, guardianSignature] =
        defaultAbiCoder.decode(['bytes', 'uint256', 'bytes'], encoded);

      expect(minutePasswordSignature.startsWith('0x')).toBe(true);
      expect(Number(decodedDeadline)).toBe(deadline);
      expect(guardianSignature.startsWith('0x')).toBe(true);

      const domain = {
        name: 'DualFactorAuthenticator',
        version: '1',
        chainId: defaultParams.chainId,
        verifyingContract: defaultParams.authenticatorAddr
      };
      const types = {
        DualFactorAuth: [
          { name: 'wallet', type: 'address' },
          { name: 'actionHash', type: 'bytes32' },
          { name: 'deadline', type: 'uint256' }
        ]
      };
      const value = {
        wallet: defaultParams.keyVaultAddr,
        actionHash,
        deadline
      };

      const expectedGuardianSig = await signer.signTypedData(domain, types, value);
      expect(guardianSignature).toBe(expectedGuardianSig);
    });

    test('should throw if deadline is in the past', async () => {
      const past = nowUnixTimestampSeconds() - 3600;
      const actionHash = mockActionHash(createDefaultAuthProofParams());

      await expect(
        createAuthProofDualFactor({
          provider: mockProvider(1735689625),
          keyVaultAddr: VALID_TEST_ADDRESS,
          passwordHash,
          signer: new Wallet(TEST_SIGNER),
          authenticatorAddr: VALID_TEST_ADDRESS,
          deadline: past,
          chainId: '23295',
          actionHash
        })
      ).rejects.toThrow('deadline must be in the future');
    });

    test('should throw if signer is not a Wallet or HDNodeWallet', async () => {
      const actionHash = mockActionHash(createDefaultAuthProofParams());

      await expect(
        createAuthProofDualFactor({
          provider: mockProvider(1735689625),
          keyVaultAddr: VALID_TEST_ADDRESS,
          passwordHash,
          signer: /** @type {any} */ (null),
          authenticatorAddr: VALID_TEST_ADDRESS,
          deadline: createDefaultAuthProofParams().deadline,
          chainId: '23295',
          actionHash
        })
      ).rejects.toThrow('signer is required and must be a Wallet or HDNodeWallet');
    });

    test('should throw if passwordHash is invalid', async () => {
      await expect(
        createAuthProofDualFactor({
          provider: mockProvider(1735689625),
          keyVaultAddr: VALID_TEST_ADDRESS,
          passwordHash: /** @type {any} */ ('0x'),
          signer: new Wallet(TEST_SIGNER),
          authenticatorAddr: VALID_TEST_ADDRESS,
          deadline: createDefaultAuthProofParams().deadline,
          chainId: '23295'
        })
      ).rejects.toThrow('passwordHash must be a 32-byte hex string value');
    });
  });
});
