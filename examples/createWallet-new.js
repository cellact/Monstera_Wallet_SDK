/**
 * Create Wallet Example
 * 
 * Demonstrates how to create a wallet using the SapphireWalletSDK
 * with network switching and clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require('ethers');

async function createWalletExample() {
  console.log('=== Create Wallet Example ===\n');

  // Option 1: Using testnet with environment variables
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    addresses: {
      walletFactory: process.env.WALLET_FACTORY_CONTRACT_ADDRESS, // Set in .env
      passwordAuth: process.env.PASSWORD_AUTH_ADDRESS // Set in .env
    },
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY // Private key for signing transactions
  });

  try {
    console.log('Creating wallet...');
    console.log('Network:', sdk.network);
    console.log('Wallet Factory:', sdk.addresses.walletFactory);
    console.log('Authenticator:', sdk.addresses.passwordAuth);
    console.log();

    // prepare password hash
    const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(process.env.TEST_PASSWORD));

    // Create wallet with password hash
    const result = await sdk.wallets.createWallet({
      passwordHash: passwordHash,
      authenticator: sdk.addresses.passwordAuth
    });

    console.log('✅ Wallet created successfully!');
    console.log('Wallet Address:', result.wallet);
    console.log('Mnemonic:', result.mnemonic);
    console.log('Authenticator:', result.authenticator);
    console.log('Storage:', result.storage);
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Block Number:', result.blockNumber);
    console.log('Gas Used:', result.gasUsed);
    console.log('\n⚠️  WARNING: Store this mnemonic securely!');
    
  } catch (error) {
    console.error('❌ Error creating wallet:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
createWalletExample().catch(console.error);

