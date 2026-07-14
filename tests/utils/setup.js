import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { Wallet } from '../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';
import { attachTestConnectSession } from './credentials.js';

/**
 * Creates a configured SDK instance for testing
 * @param {Object} options - Configuration options
 * @param {boolean} options.readonly - Whether to create a readonly SDK
 * @param {boolean} options.user - End-user credentials only (no signer)
 * @param {boolean} options.full - Admin signer + end-user credentials
 * @param {boolean} options.withCredentials - Attach offline credentials session (admin + mock session)
 * @returns {Monstera} Configured SDK instance
 */
export function createTestSDK(options = {}) {
  const { readonly = false, user = false, full = false, withCredentials = false } = options;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || Wallet.createRandom().privateKey;
  const password = process.env.PASSWORD || 'test-password';
  const username = process.env.USERNAME || 'test-user';

  if (readonly) {
    return Monstera.connect({
      mainnet: false,
      checkVersion: false
    });
  }

  if (user) {
    return Monstera.connect({
      mainnet: false,
      checkVersion: false,
      credentials: { username, password }
    });
  }

  if (full) {
    return Monstera.connect({
      mainnet: false,
      signer: signerPrivateKey,
      checkVersion: false,
      credentials: { username, password }
    });
  }

  const sdk = Monstera.connect({
    mainnet: false,
    signer: signerPrivateKey,
    checkVersion: false
  });

  if (withCredentials) {
    attachTestConnectSession(sdk);
  }

  return sdk;
}

/**
 * Gets test configuration from environment
 * @returns {Object} Test configuration
 */
export function getTestConfig() {
  const password = process.env.PASSWORD || '';
  const passwordHash = keccak256(toUtf8Bytes(password));
  const walletAddr = process.env.WALLET_ADDRESS || '';
  
  return {
    password,
    passwordHash,
    walletAddr,
    signerPrivateKey: process.env.SIGNER_PRIVATE_KEY || ''
  };
}

/**
 * Creates a test wallet for wallet signature authentication
 * @returns {Object} Test wallet and address
 */
export function createTestWallet() {
  const wallet = Wallet.createRandom();
  return {
    wallet,
    address: wallet.address
  };
}

/**
 * Sets up a test wallet (creates new or uses existing from env)
 * @param {Monstera} sdk - SDK instance
 * @param {string} passwordHash - Password hash for auth config
 * @returns {Promise<Object>} Wallet addresses and components
 */
export async function setupTestWallet(sdk, passwordHash) {
  const walletAddr = process.env.WALLET_ADDRESS;
  
  if (walletAddr) {
    const keyVaultAddr = await sdk.getKeyVaultAddr({ walletAddr });
    const storageAddr = await sdk.getStorageAddr({ walletAddr });
    const authenticatorAddr = await sdk.getAuthenticatorAddr({ keyVaultAddr });
    
    return {
      wallet: walletAddr,
      keyVault: keyVaultAddr,
      storage: storageAddr,
      authenticator: authenticatorAddr
    };
  }
  
  const result = await sdk.createWallet({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash }
  });
  
  return result;
}