/**
 * Authenticator Client Methods
 * Demonstrates how to access authenticator clients through the SDK.
 * 
 * Run: node examples/nodejs/authenticator.js
 * 
 * What this demonstrates:
 * 1. Get all available authenticator types
 * 2. Get specific authenticator clients by type
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';

const monstera = Monstera.connect({
  mainnet: false
});

async function main() {
  console.log("=".repeat(60));
  console.log("Authenticator Client Methods");
  console.log("=".repeat(60));

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${monstera.network}`);

  // ============ STEP 1: Get all available authenticator types ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get all available authenticator types");
  console.log("=".repeat(60));

  try {
    const availableTypes = monstera.getAvailableAuthTypes();
    console.log(`   ✅ Found ${availableTypes.length} authenticator type(s):`);
    availableTypes.forEach((type, index) => {
      console.log(`      ${index + 1}. ${type}`);
    });
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 2: Get specific authenticator clients ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Get specific authenticator clients by type");
  console.log("=".repeat(60));

  // Get password authenticator client
  try {
    console.log("\n   Getting password authenticator client...");
    const passwordClient = monstera.getAuthClient('password');
    console.log(`   ✅ Password client retrieved: ${passwordClient.constructor.name}`);
  } catch (error) {
    console.error(`   ❌ Error getting password client: ${error.message}`);
    process.exit(1);
  }

  // Get wallet signature authenticator client
  try {
    console.log("\n   Getting wallet signature authenticator client...");
    const walletSignatureClient = monstera.getAuthClient('walletSignature');
    console.log(`   ✅ WalletSignature client retrieved: ${walletSignatureClient.constructor.name}`);
  } catch (error) {
    console.error(`   ❌ Error getting wallet signature client: ${error.message}`);
    process.exit(1);
  }

  // Test invalid type
  try {
    console.log("\n   Testing invalid authenticator type...");
    monstera.getAuthClient('invalidType');
    console.error(`   ❌ Error: Should have thrown an error for invalid type`);
    process.exit(1);
  } catch (error) {
    console.log(`   ✅ Correctly rejected invalid type: ${error.message}`);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("   ✅ Successfully retrieved all available authenticator types");
  console.log("   ✅ Successfully retrieved password authenticator client");
  console.log("   ✅ Successfully retrieved wallet signature authenticator client");
  console.log("   ✅ Correctly handled invalid authenticator type");
  console.log("=".repeat(60));
}

// Run example
main()
  .then(() => {
    console.log("\n✅ Example completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Example failed:");
    console.error(error);
    process.exit(1);
  });