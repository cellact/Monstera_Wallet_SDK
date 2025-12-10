/**
 * Arnacon Wallet SDK
 * 
 * JavaScript SDK for wallet operations through smart contract interactions.
 * 
 * Main exports:
 * - Wallet: Main wallet class for creating and managing wallets
 * - ContractClient: Low-level contract interaction client
 */

const Wallet = require('./core/Wallet');
const ContractClient = require('./core/contracts/ContractClient');

// Contract ABIs and helpers
const { WALLET_CONTRACT_ABI, registerWalletContract } = require('./contracts/WalletContract');

module.exports = {
  Wallet,
  ContractClient,
  // Contract helpers
  WALLET_CONTRACT_ABI,
  registerWalletContract
};
