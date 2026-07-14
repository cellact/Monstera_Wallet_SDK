import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { defaultAbiCoder } from '../../../src/adapters/ethers/encoding.js';
import { computeParamsHash } from '../../../src/internal/auth/context/actionContext.js';
import {
  buildSignAction,
  buildSignMessageAction,
  buildChangeAuthenticatorAction,
  buildExecuteWithAuthAction
} from '../../../src/internal/vault/actions/keyVault.js';
import { getSelector } from '../../../src/internal/vault/getSelector.js';
import { KEYVAULT_ABI } from '../../../src/contracts/abi/core/keyVault.js';

describe('keyVault action builders', () => {
  const digest = `0x${'ab'.repeat(32)}`;

  test('buildSignAction matches abi.encode(index, digest)', () => {
    const action = buildSignAction({ index: 0, digest });
    expect(action.selector).toBe(getSelector(KEYVAULT_ABI, 'sign'));
    expect(action.paramsHash).toBe(computeParamsHash(['uint32', 'bytes32'], [0, digest]));
  });

  test('buildSignMessageAction hashes message bytes', () => {
    const message = toUtf8Bytes('hello');
    const action = buildSignMessageAction({ index: 1, message });
    expect(action.selector).toBe(getSelector(KEYVAULT_ABI, 'signMessage'));
    expect(action.paramsHash).toBe(
      computeParamsHash(['uint32', 'bytes32'], [1, keccak256(message)])
    );
  });

  test('buildChangeAuthenticatorAction hashes newAuthConfig', () => {
    const newAuthConfig = defaultAbiCoder.encode(['bytes32'], [digest]);
    const newAuthenticatorAddr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const action = buildChangeAuthenticatorAction({ newAuthenticatorAddr, newAuthConfig });
    expect(action.selector).toBe(getSelector(KEYVAULT_ABI, 'changeAuthenticator'));
    expect(action.paramsHash).toBe(
      computeParamsHash(
        ['address', 'bytes32'],
        [newAuthenticatorAddr, keccak256(newAuthConfig)]
      )
    );
  });

  test('buildExecuteWithAuthAction uses keccak256(implCall) directly', () => {
    const implCall = '0x1234abcd';
    const action = buildExecuteWithAuthAction({ implCall });
    expect(action.selector).toBe(getSelector(KEYVAULT_ABI, 'executeWithAuth'));
    expect(action.paramsHash).toBe(keccak256(implCall));
  });
});
