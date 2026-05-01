/**
 * Ethers adapter — single import boundary for the third-party `ethers` package.
 * Application code outside this folder should not import `ethers` directly.
 */

export * from './encoding.js';
export * from './signing.js';
export * from './hashing.js';
export * from './addresses.js';
export * from './provider.js';

export {
  Wallet,
  Mnemonic,
  HDNodeWallet,
  Contract,
  ContractFactory,
  Transaction,
  parseEther,
  parseUnits,
  formatUnits,
  formatEther
} from 'ethers';
