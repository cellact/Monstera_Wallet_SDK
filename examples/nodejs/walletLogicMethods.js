/**
 * Test WalletFactory methods
 * 
 * Run: node examples/nodejs/walletLogicMethods.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   NEW_KEYVAULT_ADDRESS=0x... (your new key vault address)
 * 
 * Tests:
 * 1. Get keyVault contract address for a wallet.
 * 2. Initialize a wallet logic contract (with new key vault).
 * 
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const NEW_KEYVAULT_ADDRESS = process.env.NEW_KEYVAULT_ADDRESS;

async function main() {
  console.log("=".repeat(70));
  console.log("WalletFactory - Full Test Suite");
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = Monstera.connect({
    mainnet: false, // or true for mainnet
    signer: SIGNER_PRIVATE_KEY
  });

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${sdk.network}`);

  // ============ STEP 1: Get keyVault contract address for a wallet. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Get keyVault contract address for a wallet.");
  console.log("=".repeat(70));

  try {
    // Get keyVault contract address for a wallet
    const result = await sdk.getKeyVaultAddr({
      walletAddr: WALLET_ADDRESS
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
    const result = await sdk.initializeWalletLogic({
      walletAddr: WALLET_ADDRESS,
      keyVaultAddr: NEW_KEYVAULT_ADDRESS
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
