import { describe, test, expect } from '@jest/globals';
import {
  AUTH_CONTEXT_TYPEHASH,
  computeAuthenticatorActionHash,
  computeParamsHash
} from '../../../src/internal/auth/actionContext.js';
import { buildDualFactorChangePasswordAction, buildRotateApiKeyAction } from '../../../src/internal/auth/actions/index.js';
import { getSelector } from '../../../src/internal/vault/getSelector.js';
import { API_KEY_SESSION_AUTHENTICATOR_ABI } from '../../../src/contracts/abi/authenticators/apiKeySessionAuthenticator.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';
import { DEFAULT_TESTNET_CHAIN_ID } from '../../utils/fixtures.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { defaultAbiCoder } from '../../../src/adapters/ethers/encoding.js';

describe('computeAuthenticatorActionHash', () => {
  test('should match DualFactorAuthenticator._buildContext formula', async () => {
    const newPasswordHash = keccak256(toUtf8Bytes('test-password'));
    const { selector, paramsHash } = buildDualFactorChangePasswordAction(
      VALID_TEST_ADDRESS,
      newPasswordHash
    );

    const actionHash = await computeAuthenticatorActionHash({
      chainId: DEFAULT_TESTNET_CHAIN_ID,
      authenticatorAddr: VALID_TEST_ADDRESS,
      keyVaultAddr: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      selector,
      paramsHash
    });

    const expected = keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'uint256', 'address', 'address', 'bytes4', 'bytes32'],
        [
          AUTH_CONTEXT_TYPEHASH,
          BigInt(DEFAULT_TESTNET_CHAIN_ID),
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          VALID_TEST_ADDRESS,
          selector,
          paramsHash
        ]
      )
    );

    expect(actionHash).toBe(expected);
  });

  test('should read chainId from provider when omitted', async () => {
    const readProvider = {
      getNetwork: async () => ({ chainId: BigInt(DEFAULT_TESTNET_CHAIN_ID) })
    };

    const { selector, paramsHash } = buildDualFactorChangePasswordAction(
      VALID_TEST_ADDRESS,
      keccak256(toUtf8Bytes('x'))
    );

    const actionHash = await computeAuthenticatorActionHash({
      readProvider,
      authenticatorAddr: VALID_TEST_ADDRESS,
      keyVaultAddr: VALID_TEST_ADDRESS,
      selector,
      paramsHash
    });

    expect(actionHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });
});

describe('buildRotateApiKeyAction', () => {
  test('builds rotateApiKey management action with newApiKeySecret params hash', () => {
    const newApiKeySecret = keccak256(toUtf8Bytes('new-api-key-material'));
    const action = buildRotateApiKeyAction(VALID_TEST_ADDRESS, newApiKeySecret);

    expect(action.target).toBe(VALID_TEST_ADDRESS);
    expect(action.selector).toBe(getSelector(API_KEY_SESSION_AUTHENTICATOR_ABI, 'rotateApiKey'));
    expect(action.paramsHash).toBe(computeParamsHash(['bytes32'], [newApiKeySecret]));
  });
});
