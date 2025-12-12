/**
 * Use Wallet Example
 * 
 * Demonstrates how to use a wallet using the SapphireWalletSDK
 * with clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require('ethers');

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

  // Prepare auth proof (raw password bytes - contract hashes internally)
  const PASSWORD = process.env.TEST_PASSWORD;
  const authProof = ethers.toUtf8Bytes(PASSWORD);

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
    console.log();

  } catch (error) {
    console.error('❌ Error getting account address:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  // get account private key and address
  try {
    console.log('Getting account private key and address...');
    console.log();

    const result = await sdk.wallets.getAccount({
      walletAddress: process.env.TEST_WALLET_ADDRESS,
      authProof: authProof,
      index: 0
    });

    console.log('✅ Account private key and address retrieved successfully!');
    console.log('Private Key:', result.privateKey);
    console.log('Account Address:', result.accountAddress);

  } catch (error) {
    console.error('❌ Error getting account private key and address:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

}

// Run example
useWalletExample().catch(console.error);

