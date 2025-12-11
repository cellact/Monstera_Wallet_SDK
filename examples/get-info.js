/**
 * Get User Wallet Info Example
 * 
 * Demonstrates how to get a user wallet info by username
 */

require('dotenv').config();
const { Wallet } = require('../src');

async function getUserWalletInfoExample() {
  console.log('=== Get User Wallet Info Example ===\n');

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
    console.log('Getting user wallet info by username...');
    console.log('Username:', config.username);
    console.log('Contract:', config.contractAddress);
    console.log();

    // Create wallet - this calls the createUser contract method
    const result = await Wallet.getInfo(config);

    console.log('User wallet info', result);

    console.log('✅ User wallet info retrieved successfully!');
    console.log('User wallet info:', result.userAddress);
    console.log('User public key:', result.publicKey);
    console.log('User has secret:', result.hasSecret);
    console.log();

  } catch (error) {
    console.error('❌ Error getting user wallet info:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
  }
}

// Run example
getUserWalletInfoExample().catch(console.error);

