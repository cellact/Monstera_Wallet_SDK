/**
 * Create Wallet Example - New SDK
 * 
 * Demonstrates how to create a wallet using the new SapphireWalletSDK
 * with network switching and clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');

async function createWalletExample() {
  console.log('=== Create Wallet Example (New SDK) ===\n');

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
    console.log('Creating wallet...');
    console.log('Network:', sdk.network);
    console.log('Factory:', sdk.addresses.factory);
    console.log();

    // Create wallet with password
    // Note: mnemonic is generated automatically, but not returned by default for security
    const result = await sdk.wallets.createWallet({
      password: 'my-secure-password-123',
      returnMnemonic: true // Set to true if you need the mnemonic (not recommended for production)
    });

    console.log('✅ Wallet created successfully!');
    console.log('Wallet Address:', result.wallet);
    console.log('Authenticator:', result.authenticator);
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Block Number:', result.blockNumber);
    console.log('Gas Used:', result.gasUsed);
    
    if (result.mnemonic) {
      console.log('⚠️  Mnemonic:', result.mnemonic);
      console.log('⚠️  WARNING: Store this mnemonic securely!');
    }

  } catch (error) {
    console.error('❌ Error creating wallet:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
createWalletExample().catch(console.error);

