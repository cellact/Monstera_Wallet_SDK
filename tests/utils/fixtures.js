import { Wallet } from '../../src/adapters/ethers/index.js';
import { ZeroAddress } from '../../src/adapters/ethers/addresses.js';
import { defaultAbiCoder } from '../../src/adapters/ethers/encoding.js';
import { toUtf8Bytes, keccak256 } from '../../src/adapters/ethers/hashing.js';
import { computeParamsHash } from '../../src/internal/auth/context/createAuthContext.js';
import {
  buildSignMessageAction,
  buildChangeAuthenticatorAction
} from '../../src/internal/vault/actions/keyVault.js';
import { getSelector } from '../../src/internal/vault/getSelector.js';
import { KEYVAULT_ABI } from '../../src/contracts/abi/core/keyVault.js';
import { nowUnixTimestampSeconds } from '../../src/internal/utils/time.js';

/**
 * UTF-8 password bytes for APIs that expect raw bytes (e.g. {@code currentPassword} on password helpers).
 * @param {string} password
 * @returns {Uint8Array}
 */
export function createPasswordAuthProof(password) {
  return toUtf8Bytes(password);
}

/**
 * Structured password auth proof input for {@link AuthProofBuilder}.
 *
 * @param {string} password
 * @param {import('../../src/types/index.js').AuthActionInput} action
 */
export function createPasswordAuthProofInput(password, action) {
  return {
    password: createPasswordAuthProof(password),
    action
  };
}

/**
 * Creates a wallet signature auth config from whitelist
 * @param {string[]} whitelist - Array of whitelisted addresses
 * @returns {string} Encoded auth config
 */
export function createWalletSigAuthConfig(whitelist) {
  return defaultAbiCoder.encode(["address[]"], [whitelist]);
}

/**
 * Calculates a deadline timestamp (default: 1 hour from now)
 * @param {number} hoursFromNow - Hours to add (default: 1)
 * @returns {number} Unix timestamp
 */
export function calculateDeadline(hoursFromNow = 1) {
  return nowUnixTimestampSeconds() + (hoursFromNow * 3600);
}

/**
 * Creates a wallet signature auth proof
 * @param {Object} options - Auth proof options
 * @param {Monstera} options.sdk - SDK instance
 * @param {string} options.keyVaultAddr - KeyVault address
 * @param {Wallet} options.signerWallet - Wallet to sign with
 * @param {number} options.deadline - Deadline timestamp (optional)
 * @returns {Promise<string>} Auth proof signature
 */
export async function createWalletSigAuthProof({ sdk, keyVaultAddr, signerWallet, deadline, action }) {
  if (!deadline) {
    deadline = calculateDeadline();
  }
  
  return await sdk.createAuthProofWalletSignature({
    keyVaultAddr,
    signer: signerWallet,
    deadline,
    action
  });
}

/**
 * Valid test address
 */
export const VALID_TEST_ADDRESS = '0x1234567890123456789012345678901234567890';

/**
 * Invalid test address 
 */
export const INVALID_TEST_ADDRESS_NO_PREFIX = '12345678901234567890123456789012345678901'; // Missing 0x prefix

/**
 * Invalid address for validation testing
 */
export const INVALID_ADDRESS = '0x123'; // Too short

/**
 * Zero address for testing
 */
export const ZERO_ADDRESS = ZeroAddress;

/**
 * Test signer private key for testing (well-known test key)
 */
export const TEST_SIGNER = '0x0000000000000000000000000000000000000000000000000000000000000001';

/**
 * Test transaction hash for testing
 */
export const TEST_TX_HASH = '0x1234567890123456789012345678901234567890123456789012345678901234';

/**
 * Creates a random address for testing
 * @returns {string} Random Ethereum address
 */
export function randomAddress() {
  return Wallet.createRandom().address;
}

/**
 * Custom RPC URL for testing
 */
export const CUSTOM_RPC_URL = 'https://custom-rpc-endpoint.com';

/**
 * Default testnet RPC URL
 */
export const DEFAULT_TESTNET_RPC_URL = 'https://testnet.sapphire.oasis.dev';

/**
 * Default testnet chain ID
 */
export const DEFAULT_TESTNET_CHAIN_ID = '0x5aff';

/**
 * Default mainnet chain ID
 */
export const DEFAULT_MAINNET_CHAIN_ID = '0x5afe';

/**
 * Creates default auth proof test parameters
 * @param {Object} overrides - Optional parameter overrides
 * @returns {Object} Default auth proof parameters
 */
export function createDefaultAuthProofParams(overrides = {}) {
  return {
    chainId: DEFAULT_TESTNET_CHAIN_ID,
    authenticatorAddr: VALID_TEST_ADDRESS,
    keyVaultAddr: VALID_TEST_ADDRESS,
    deadline: calculateDeadline(1),
    actionHash: keccak256(toUtf8Bytes('default-auth-proof-action-hash')),
    ...overrides
  };
}

/**
 * Build a deterministic KeyVault {@code sign} action input for dual-factor proof tests.
 *
 * @param {Object} [params={}]
 * @param {number} [params.index=0]
 * @param {string} [params.digest] - 32-byte hex digest (defaults to zero)
 * @returns {import('../../src/types/index.js').AuthActionInput}
 */
export function createTestVaultSignAction({ index = 0, digest = `0x${'00'.repeat(32)}` } = {}) {
  return {
    selector: getSelector(KEYVAULT_ABI, 'sign'),
    paramsHash: computeParamsHash(['uint32', 'bytes32'], [index, digest])
  };
}

/**
 * @param {number} index
 * @param {Uint8Array} messageBytes
 * @returns {import('../../src/types/index.js').AuthActionInput}
 */
export function createVaultSignMessageAction(index, messageBytes) {
  return buildSignMessageAction({ index, message: messageBytes });
}

/**
 * @param {string} newAuthenticatorAddr
 * @param {string} newAuthConfigHex
 * @returns {import('../../src/types/index.js').AuthActionInput}
 */
export function createChangeAuthenticatorAction(newAuthenticatorAddr, newAuthConfigHex) {
  return buildChangeAuthenticatorAction({
    newAuthenticatorAddr,
    newAuthConfig: newAuthConfigHex
  });
}

/**
 * @param {string} functionName
 * @param {string[]} types
 * @param {unknown[]} values
 * @returns {import('../../src/types/index.js').AuthActionInput}
 */
export function createVaultAction(functionName, types, values) {
  return {
    selector: getSelector(KEYVAULT_ABI, functionName),
    paramsHash: computeParamsHash(types, values)
  };
}