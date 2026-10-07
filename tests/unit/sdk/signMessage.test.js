/**
 * signMessage builds the vault action. The caller does not pass selector or paramsHash.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { defaultAbiCoder } from '../../../src/adapters/ethers/encoding.js';
import { buildNetworkConfig } from '../../../src/config/networks.js';
import { AuthProofEncoder } from '../../../src/internal/auth/proof/AuthProofEncoder.js';
import { KeyVaultAuthPipeline } from '../../../src/internal/auth/pipelines/KeyVaultAuthPipeline.js';
import { computeParamsHash } from '../../../src/internal/auth/context/actionContext.js';
import { getSelector } from '../../../src/internal/vault/getSelector.js';
import { KEYVAULT_ABI } from '../../../src/contracts/abi/core/keyVault.js';
import { monsteraSigningMethods } from '../../../src/sdk/domains/MonsteraSigning.js';
import { setSdkInternals } from '../../../src/sdk/sdkInternals.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

describe('Monstera.signMessage', () => {
  test('builds the signMessage action for a signTypedData stub and does not require selector', async () => {
    const network = buildNetworkConfig({ network: 'testnet' });
    const message = toUtf8Bytes('Hello from TheWallet!');
    const signature = '0x' + 'ab'.repeat(65);
    const actionHash = keccak256(toUtf8Bytes('sign-message-action-hash'));
    const caller = {
      keyVaultAddr: VALID_TEST_ADDRESS,
      index: 0,
      message,
      authProof: {
        signer: { signTypedData: async () => signature }
      }
    };

    const encoder = new AuthProofEncoder({
      config: network,
      readProvider: { call: async () => actionHash },
      getAuthenticatorAddr: async () => network.addresses.walletSignatureAuth
    });
    const pipeline = new KeyVaultAuthPipeline({
      connectSession: null,
      authProofEncoder: encoder
    });

    /** @type {{ selector?: string, paramsHash?: string }} */
    let builtAction;
    const invokeWithAuthProof = pipeline.invokeWithAuthProof.bind(pipeline);
    pipeline.invokeWithAuthProof = async (options, buildAction, invoke) => {
      expect(options.selector).toBeUndefined();
      expect(options.paramsHash).toBeUndefined();
      expect(options.authProof.selector).toBeUndefined();
      expect(options.authProof.paramsHash).toBeUndefined();
      builtAction = buildAction(options);
      return invokeWithAuthProof(options, buildAction, invoke);
    };

    /** @type {Record<string, unknown>} */
    let sentToVault;
    const sdk = {
      ...monsteraSigningMethods,
      keyVault: {
        signMessage: async (encoded) => {
          sentToVault = encoded;
          return '0xvaultsignature';
        }
      }
    };
    setSdkInternals(sdk, { keyVaultAuthPipeline: pipeline });

    const result = await sdk.signMessage(caller);

    expect(result).toBe('0xvaultsignature');
    expect(builtAction.selector).toBe(getSelector(KEYVAULT_ABI, 'signMessage'));
    expect(builtAction.paramsHash).toBe(
      computeParamsHash(['uint32', 'bytes32'], [0, keccak256(message)])
    );
    expect(sentToVault.selector).toBeUndefined();
    expect(sentToVault.paramsHash).toBeUndefined();

    const decoded = defaultAbiCoder.decode(['uint256', 'bytes'], sentToVault.authProof);
    expect(decoded[1]).toBe(signature);
  });
});
