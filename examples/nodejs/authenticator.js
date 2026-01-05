/**
 * Test Authenticator methods
 * 
 * Run: node examples/nodejs/authenticator.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 * 
 * Tests:
 * 1. Get all available authenticator types.
 * 2. Get a specific authenticator client by type.
 * 3. Get whitelist for a wallet.
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

async function main() {
  console.log("=".repeat(70));
  console.log("Authenticator - Full Test Suite");
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = Monstera.connect({
    mainnet: false, // or true for mainnet
    signer: SIGNER_PRIVATE_KEY
  });

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${sdk.network}`);


  // ============ STEP 1: Get all available authenticator types. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Get all available authenticator types");
  console.log("=".repeat(70));

  try {
    // Get all available authenticator types
    const availableTypes = sdk.getAvailableTypes();
    console.log(`   ✅ Available authenticator types: ${availableTypes.join(', ')}`);
    if (availableTypes.length === 0) {
      console.error("❌ ERROR: No authenticator types found");
      process.exit(1);
    }
  } catch (error) {
    console.error(`   ❌ FAILED to get all available authenticator types: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 2: Get a specific authenticator client by type. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Get a specific authenticator client by type");
  console.log("=".repeat(70));

  try {
    // Get a specific authenticator client by type
    const passwordClient = sdk.getClient('password');
    console.log(`   ✅ Password client: ${passwordClient}`);

    if (!passwordClient) {
      console.error("❌ ERROR: Password client not found");
      process.exit(1);
    }
  } catch (error) {
    console.error(`   ❌ FAILED to get a specific authenticator client by type: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 3: Use the fetched authenticator client. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Use the fetched authenticator client");
  console.log("=".repeat(70));

  try {
    // Get keyVault address for a wallet
    console.log("\n1. Getting keyVault address for a wallet...");
    const keyVaultAddr = await sdk.getKeyVaultAddr({
      walletAddr: WALLET_ADDRESS
    });
    console.log(`   ✅ KeyVault address: ${keyVaultAddr}`);
    if (!keyVaultAddr) {
      console.error("❌ ERROR: Failed to get key vault address");
      process.exit(1);
    }

    // Get wallet signature authenticator client
    console.log("\n2. Getting wallet signature authenticator client...");
    const walletSignatureClient = sdk.getClient('walletSignature');
    console.log(`   ✅ WalletSignature client: ${walletSignatureClient}`);
    if (!walletSignatureClient) {
      console.error("❌ ERROR: Failed to get wallet signature authenticator client");
      process.exit(1);
    }

    // Get whitelist 
    console.log("\n3. Getting whitelist for a wallet...");
    const whitelist = await walletSignatureClient.getWhitelist({
      keyVaultAddr: keyVaultAddr
    });
    console.log(`   ✅ Whitelist: ${whitelist.join(', ')}`);
    if (!whitelist) {
      console.error("❌ ERROR: Failed to get whitelist");
      process.exit(1);
    }
  } catch (error) {
    console.error(`   ❌ FAILED to use the fetched authenticator client: ${error.message}`);
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
