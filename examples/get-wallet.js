/**
 * Get Wallet Address Example
 * 
 * Demonstrates how to get a wallet address by username
 */

require('dotenv').config();
const { Wallet } = require('../src');

async function getWalletAddressExample() {
  console.log('=== Get Wallet Address Example ===\n');

  // Default RPC URL for Oasis Sapphire Testnet
  const DEFAULT_RPC_URL = 'https://testnet.sapphire.oasis.io';
  const DEFAULT_NETWORK = 'oasis-testnet';

  // Configuration
  const config = {
    username: 'Miza',
    contractAddress: process.env.INTERACTOR_CONTRACT_ADDRESS, // Your wallet contract address; replace with your own contract address from .env file
    rpcUrl: DEFAULT_RPC_URL, // Or your RPC endpoint
    network: DEFAULT_NETWORK
  };

  try {
    console.log('Getting wallet address by username...');
    console.log('Username:', config.username);
    console.log('Contract:', config.contractAddress);
    console.log();

    // Create wallet - this calls the createUser contract method
    const address = await Wallet.getAddress(config);

    console.log('User wallet address', address);

    console.log('✅ Wallet address retrieved successfully!');
    console.log();

  } catch (error) {
    console.error('❌ Error getting wallet address:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
  }
}

// Run example
getWalletAddressExample().catch(console.error);

