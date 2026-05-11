/**
 * Single import boundary for the third-party {@code ethers} package.
 *
 * The rest of the SDK MUST import every {@code ethers} symbol via this module (or one of the
 * sibling files in {@code src/adapters/ethers/}). This makes the dependency surface explicit,
 * lets us swap implementations in tests, and keeps {@code ethers} versions easy to upgrade.
 *
 * Re-exports:
 * - {@link ./encoding.js | encoding} — {@code AbiCoder}, {@code Interface}, {@code defaultAbiCoder}
 * - {@link ./signing.js | signing} — {@code verifyMessage}, {@code recoverAddress}, EIP-7702 helpers
 * - {@link ./hashing.js | hashing} — {@code keccak256}, {@code solidityPacked}, byte/utf8 helpers
 * - {@link ./addresses.js | addresses} — address validation and zero-value constants
 * - {@link ./provider.js | provider} — {@code JsonRpcProvider} and {@code createProvider}
 *
 * Plus the wallet/contract/value primitives from {@code ethers} listed below.
 *
 * @module adapters/ethers
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
