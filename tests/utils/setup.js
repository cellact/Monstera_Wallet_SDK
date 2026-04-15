import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers, Wallet } from 'ethers';

/**
 * Creates a configured SDK instance for testing
 * @param {Object} options - Configuration options
 * @param {boolean} options.readonly - Whether to create a readonly SDK
 * @returns {Monstera} Configured SDK instance
 */
export function createTestSDK(options = {}) {
  const { readonly = false } = options;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || '';
  
  if (readonly) {
    return Monstera.readonly({ 
      mainnet: false,
      checkVersion: false 
    });
  }
  
  return Monstera.connect({
    mainnet: false,
    signer: signerPrivateKey,
    checkVersion: false
  });
}

/**
 * Gets test configuration from environment
 * @returns {Object} Test configuration
 */
export function getTestConfig() {
  const password = process.env.PASSWORD || '';
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));
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