/**
 * Create Wallet Example - New SDK
 * 
 * Demonstrates how to create a wallet using the new SapphireWalletSDK
 * with network switching and clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');

async function useWalletExample() {
  console.log('=== Use Wallet Example (New SDK) ===\n');

  // Option 1: Using testnet with environment variables
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    addresses: {
      factory: process.env.FACTORY_CONTRACT_ADDRESS, // Set in .env
      passwordAuth: process.env.PASSWORD_AUTH_ADDRESS // Set in .env
    },
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY // Private key for signing transactions
  });

  try {
    console.log('Getting account address...');
    console.log('Network:', sdk.network);
    console.log();

    // Get account address
    const result = await sdk.wallets.getAccountAddress({
      walletAddress: process.env.TEST_WALLET_ADDRESS,
      index: 0
    });

    console.log('✅ Account address retrieved successfully!');
    console.log('Account Address:', result);

  } catch (error) {
    console.error('❌ Error getting account address:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
useWalletExample().catch(console.error);

