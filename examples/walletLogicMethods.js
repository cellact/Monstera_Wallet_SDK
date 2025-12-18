/**
 * Test WalletFactory methods
 * 
 * Run: node examples/walletLogicMethods.js
 * 
 * Tests:
 * 1. Get keyVault contract address for a wallet.
 * 2. Initialize a wallet logic contract (with new key vault).
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (private key for deploying/creating wallet)
 *   WALLET_ADDRESS=0x... (address of the wallet to check)
 *   NEW_KEYVAULT_ADDRESS=0x... (address of the new key vault to use)
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS;
const NEW_KEYVAULT_ADDRESS = process.env.NEW_KEYVAULT_ADDRESS;

async function main() {
  console.log("=".repeat(70));
  console.log("WalletFactory - Full Test Suite");
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    signerOrProvider: SIGNER_PRIVATE_KEY
  });

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${sdk.network}`);

  // ============ STEP 1: Get keyVault contract address for a wallet. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Get keyVault contract address for a wallet.");
  console.log("=".repeat(70));

  try {
    // Get total number of wallets created
    const result = await sdk.wallets.getKeyvaultAddr({
      walletAddress: WALLET_ADDRESS
    });

    console.log(`   ✅ KeyVault contract address: ${result}`);

  } catch (error) {
    console.error(`   ❌ FAILED to get keyVault contract address for a wallet: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 2: Initialize a wallet logic contract. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Initialize a wallet logic contract (with new key vault).");
  console.log("=".repeat(70));

  try {
    // Initialize a wallet logic contract
    const result = await sdk.wallets.initializeWalletLogic({
      walletAddress: WALLET_ADDRESS,
      keyVaultAddress: NEW_KEYVAULT_ADDRESS
    });

    console.log(`   ✅ Initialize wallet logic contract result: ${result}`);

  } catch (error) {
    console.error(`   ❌ FAILED to initialize wallet logic contract: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
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
