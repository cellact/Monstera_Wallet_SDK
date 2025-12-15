/**
 * Test WalletFactory methods
 * 
 * Run: node examples/factoryMethods.js
 * 
 * Tests:
 * 1. Get total number of wallets created
 * 
 * Required env vars:
 *   TEST_WALLET_ADDRESS=0x... (address to check if it is a wallet created by this factory)
 *   WALLET_FACTORY_CONTRACT_ADDRESS=0x...
 *   WALLET_SIGNATURE_AUTH_ADDRESS=0x...
 *   SIGNER_PRIVATE_KEY=0x... (private key for deploying/creating wallet)
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers, Wallet } = require('ethers');

// Test wallet address
const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS;

async function main() {
  console.log("=".repeat(70));
  console.log("WalletFactory - Full Test Suite");
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    // addresses are optional - will defaults from config/networks.js if not provided
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY
  });

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${sdk.network}`);

  let walletAddress;
  let mnemonic;

  // ============ STEP 1: Get total number of wallets created ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Get total number of wallets created");
  console.log("=".repeat(70));

  try {
    // Get total number of wallets created
    const result = await sdk.wallets.walletCount();

    console.log(`   ✅ Total number of wallets created: ${result}`);

  } catch (error) {
    console.error(`   ❌ FAILED to get total number of wallets created: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 2: Check if an address is a wallet created by this factory ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Check if an address is a wallet created by this factory");
  console.log("=".repeat(70));

  try {
    // Check if an address is a wallet created by this factory
    const result = await sdk.wallets.isWallet({
        walletAddress:TEST_WALLET_ADDRESS
    });

    console.log(`   ✅ Address ${TEST_WALLET_ADDRESS} is ${result ? 'a' : 'not a'} wallet created by this factory`);

  } catch (error) {
    console.error(`   ❌ FAILED to check if address is a wallet created by this factory: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  console.log("=".repeat(70));
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
