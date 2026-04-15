import { ethers, Wallet } from 'ethers';

/**
 * UTF-8 password bytes for APIs that expect raw bytes (e.g. {@code currentPassword} on password helpers).
 * @param {string} password
 * @returns {Uint8Array}
 */
export function createPasswordAuthProof(password) {
  return ethers.toUtf8Bytes(password);
}

/**
 * Creates a wallet signature auth config from whitelist
 * @param {string[]} whitelist - Array of whitelisted addresses
 * @returns {string} Encoded auth config
 */
export function createWalletSigAuthConfig(whitelist) {
  return ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
}

/**
 * Calculates a deadline timestamp (default: 1 hour from now)
 * @param {number} hoursFromNow - Hours to add (default: 1)
 * @returns {number} Unix timestamp
 */
export function calculateDeadline(hoursFromNow = 1) {
  return Math.floor(Date.now() / 1000) + (hoursFromNow * 3600);
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
export async function createWalletSigAuthProof({ sdk, keyVaultAddr, signerWallet, deadline }) {
  if (!deadline) {
    deadline = calculateDeadline();
  }
  
  return await sdk.createAuthProofWalletSignature({
    keyVaultAddr,
    signer: signerWallet,
    deadline
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
export const ZERO_ADDRESS = ethers.ZeroAddress;

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
    ...overrides
  };
}