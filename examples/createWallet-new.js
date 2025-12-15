/**
 * Create Wallet Example
 * 
 * Demonstrates how to create a wallet using the SapphireWalletSDK
 * with network switching and clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require('ethers');

async function main() {
  console.log("=".repeat(70));
  console.log('=== Create Wallet Example ===\n');
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    // addresses are optional - will defaults from config/networks.js if not provided
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY // Private key for signing transactions
  });

  try {
    console.log('Creating wallet...');
    console.log('Network:', sdk.network);
    console.log();

    // prepare password hash
    const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(process.env.TEST_PASSWORD));

    // Create wallet with password hash
    const result = await sdk.wallets.createWallet({
      authConfig: passwordHash,
      authenticator: sdk.addresses.passwordAuth
    });

    console.log('✅ Wallet created successfully!');
    console.log('Wallet Address:', result.wallet);
    console.log('Mnemonic:', result.mnemonic);
    console.log('Authenticator:', result.authenticator);
    console.log('KeyVault:', result.keyVault);
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
main()
  .then(() => {
    console.log("\n✅ Test suite completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:");
    console.error(error);
    process.exit(1);
  });
