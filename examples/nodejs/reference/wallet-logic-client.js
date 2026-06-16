/**
 * Reference: WalletLogic client methods
 * Folder: reference
 * Prerequisites: WALLET_ADDRESS, NEW_KEYVAULT_ADDRESS
 * 
 * Demonstrates WalletLogic client methods, primarily initializeWalletLogic.
 * 
 * Run: node examples/nodejs/reference/wallet-logic-client.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   NEW_KEYVAULT_ADDRESS=0x... (your new key vault address)
 * 
 * What this demonstrates:
 * 1. Accessing WalletLogic client methods directly
 * 2. Initialize a wallet logic contract with a new key vault
 * 
 * Note: Most WalletLogic methods delegate to KeyVault methods through
 * the WalletLogic contract. For better performance, use KeyVaultClient
 * methods directly (e.g., monstera.getKeyVaultAddr() instead of monstera.logic.getKeyVaultAddr()).
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const NEW_KEYVAULT_ADDRESS = process.env.NEW_KEYVAULT_ADDRESS;

const monstera = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("WalletLogic Client Methods");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !NEW_KEYVAULT_ADDRESS) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, and NEW_KEYVAULT_ADDRESS env vars");
    process.exit(1);
  }

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${monstera.network}`);

  // ============ STEP 1: Access WalletLogic client methods directly ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Access WalletLogic client methods directly");
  console.log("=".repeat(60));
  console.log("\n   Note: You can access WalletLogic client methods via monstera.logic");
  console.log("   However, most read methods are also available via KeyVaultClient");
  console.log("   and that's the preferred way to call them.\n");

  try {
    // Example: Get keyVault address via WalletLogic client
    // Note: This is also available as monstera.getKeyVaultAddr() which is preferred
    const keyVaultAddr = await monstera.logic.getKeyVaultAddr({
      walletAddr: WALLET_ADDRESS
    });
    console.log(`   ✅ KeyVault address (via monstera.logic): ${keyVaultAddr}`);
    console.log(`   💡 Tip: Use monstera.getKeyVaultAddr() instead (preferred method)`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 2: Initialize wallet logic with new key vault ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Initialize wallet logic with new key vault");
  console.log("=".repeat(60));
  console.log("\n   This is the main WalletLogic write method.");
  console.log("   It connects a wallet proxy to a new KeyVault contract.\n");

  try {
    const result = await monstera.initializeWalletLogic({
      walletAddr: WALLET_ADDRESS,
      keyVaultAddr: NEW_KEYVAULT_ADDRESS
    });

    console.log(`   ✅ Wallet logic initialized successfully!`);
    console.log(`   Transaction: ${result.transactionHash}`);
    if (result.gasUsed) {
      console.log(`   Gas Used: ${result.gasUsed}`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("   ✅ Demonstrated accessing WalletLogic client directly");
  console.log("   ✅ Initialized wallet logic with new key vault");
  console.log("\n   💡 Remember: Most read methods are available via");
  console.log("      KeyVaultClient (monstera.getKeyVaultAddr(), etc.)");
  console.log("      and that's the preferred way to use them.");
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