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
import { generateMnemonic, deriveSeed } from '../../../src/internal/crypto/mnemonic.js';
import { createAuthProofWalletSignature } from '../../../src/internal/auth/proof/builders/walletSignature.js';
import { createAuthProofMinuteSignature } from '../../../src/internal/auth/proof/builders/minuteSignature.js';
import { createAuthProofDualFactor } from '../../../src/internal/auth/proof/builders/dualFactor.js';
import {
  createWalletSigAuthConfig,
  createDualFactorAuthConfig
} from '../../../src/internal/auth/config/bytes.js';
import { computeParamsHash } from '../../../src/internal/auth/context/actionContext.js';
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
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;

      const config = getTestConfig();

      const provider = new JsonRpcProvider(DEFAULT_TESTNET_RPC_URL);
      const signer = new Wallet(config.signerPrivateKey, provider);

      const authProof = await createAuthProofWalletSignature({
        signer,
        chainId,
        authenticatorAddr,
        deadline,
        keyVaultAddr,
        actionHash
      });
      expect(authProof).toBeDefined();
      expect(typeof authProof).toBe('string');
      expect(authProof.startsWith('0x')).toBe(true);
    });

    test('accepts a signer that only implements signTypedData', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;
      const signature = '0x' + 'ab'.repeat(65);
      const signer = {
        signTypedData: async () => signature
      };

      const authProof = await createAuthProofWalletSignature({
        signer,
        chainId,
        authenticatorAddr,
        deadline,
        keyVaultAddr,
        actionHash
      });
      const decoded = defaultAbiCoder.decode(['uint256', 'bytes'], authProof);
      expect(decoded[0]).toBe(BigInt(deadline));
      expect(decoded[1]).toBe(signature);
    });

    test('should throw an error if the signer does not provide signTypedData', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: null,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('signer is required and must provide signTypedData');
      await expect(
        createAuthProofWalletSignature({
          signer: undefined,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('signer is required and must provide signTypedData');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ (123),
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('signer is required and must provide signTypedData');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ ('invalid'),
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('signer is required and must provide signTypedData');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ (randomAddress()),
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('signer is required and must provide signTypedData');
    });

    test('should throw an error if the chainId is missing or not a valid chain id', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: null,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('chainId is required and must be a chain id');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: undefined,
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('chainId is required and must be a chain id');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: /** @type {any} */ ({ chainId }),
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow(
        'chainId must be a finite chain id (number, bigint, decimal string, or hex string)'
      );
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: /** @type {any} */ ([]),
          authenticatorAddr,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow(
        'chainId must be a finite chain id (number, bigint, decimal string, or hex string)'
      );
    });

    test('should throw an error if the authenticatorAddr is not a valid address', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: null,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: undefined,
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: /** @type {any} */ (123),
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: /** @type {any} */ ({ address: authenticatorAddr }),
          deadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');
    });

    test('should throw an error if the keyVaultAddr is not a valid address', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: null
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: undefined
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: /** @type {any} */ (123)
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: /** @type {any} */ ({ address: keyVaultAddr })
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a non-empty string');
    });

    test('should throw an error if the deadline is not a number or is not an integer', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: null,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('deadline is required');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: undefined,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('deadline is required');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: 123.5,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('deadline must be an integer');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: /** @type {any} */ ({ deadline }),
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('deadline is required and must be a number or BigInt');
    });

    test('should throw an error if the deadline is in the past', async () => {
      const { chainId, authenticatorAddr, keyVaultAddr, actionHash } = defaultParams;
      const pastDeadline = nowUnixTimestampSeconds() - 1000;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: pastDeadline,
          keyVaultAddr,
          actionHash
        })
      ).rejects.toThrow('deadline must be in the future');
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
          passwordHash
        })
      ).rejects.toThrow('provider must expose getBlock');

      await expect(
        createAuthProofMinuteSignature({
          provider: /** @type {any} */ ({ getBlock: null }),
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: '23295',
          passwordHash
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
          passwordHash
        })
      ).rejects.toThrow('keyVaultAddr must be a valid Ethereum address');

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: null,
          chainId: '23295',
          passwordHash
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a non-empty string');

      await expect(
        createAuthProofMinuteSignature({
          provider,
          keyVaultAddr: VALID_TEST_ADDRESS,
          authenticatorAddr: VALID_TEST_ADDRESS,
          chainId: /** @type {any} */ ({}),
          passwordHash
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
          passwordHash: '0x1234'
        })
      ).rejects.toThrow('passwordHash must be a 32-byte hex string value');
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

    test('should throw if signer does not provide signTypedData', async () => {
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
      ).rejects.toThrow('signer is required and must provide signTypedData');
    });

    test('should throw if passwordHash is invalid', async () => {
      const actionHash = mockActionHash(createDefaultAuthProofParams());

      await expect(
        createAuthProofDualFactor({
          provider: mockProvider(1735689625),
          keyVaultAddr: VALID_TEST_ADDRESS,
          passwordHash: /** @type {any} */ ('0x'),
          signer: new Wallet(TEST_SIGNER),
          authenticatorAddr: VALID_TEST_ADDRESS,
          deadline: createDefaultAuthProofParams().deadline,
          chainId: '23295',
          actionHash
        })
      ).rejects.toThrow('passwordHash must be a 32-byte hex string value');
    });
  });
});
