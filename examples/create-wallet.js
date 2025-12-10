/**
 * Create Wallet Example
 * 
 * Demonstrates how to create a wallet by calling the createUser contract method
 */

require('dotenv').config();
const { Wallet } = require('../src');
const { registerWalletContract } = require('../src/contracts/WalletContract');

async function createWalletExample() {
  console.log('=== Create Wallet via Contract ===\n');

  // Default RPC URL for Oasis Sapphire Testnet
  const DEFAULT_RPC_URL = 'https://testnet.sapphire.oasis.io';
  const DEFAULT_NETWORK = 'oasis-testnet';

  // Configuration
  const config = {
    username: 'Jane',
    secret: 'my-secret-password-123',
    contractAddress: process.env.INTERACTOR_CONTRACT_ADDRESS, // Your wallet contract address; replace with your own contract address from .env file
    rpcUrl: DEFAULT_RPC_URL, // Or your RPC endpoint
    network: DEFAULT_NETWORK,
    signerPrivateKey: process.env.CONTRACT_OWNER_PRIVATE_KEY, // Private key of contract owner; replace with your own private key
    useSapphireWrapper: true // Enable Sapphire wrapper for TEE-encrypted contract calls (required for createUser on Oasis Sapphire)
  };

  try {
    console.log('Creating wallet via contract...');
    console.log('Username:', config.username);
    console.log('Contract:', config.contractAddress);
    console.log();

    // Create wallet - this calls the createUser contract method
    const wallet = await Wallet.create(config);

    // console.log('wallet', wallet);

    console.log('✅ Wallet created successfully!');
    // console.log('User Address:', wallet.getAddress());
    // console.log('Public Key:', wallet.getPublicKey());
    // console.log('Username:', wallet.getUsername());
    console.log();

    // The wallet is now ready to use
    console.log('Wallet configuration:');
    console.log(JSON.stringify(wallet.getConfig(), null, 2));

  } catch (error) {
    console.error('❌ Error creating wallet:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
  }
}

// Run example
createWalletExample().catch(console.error);

