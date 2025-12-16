/**
 * Transfer admin ownership to a new address (ADMIN ONLY)
 * 
 * This demonstrates ADMIN-controlled upgrades:
 * - Transfers admin ownership to a new address
 * 
 * Run: node examples/transferAdmin.js
 */
require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require("ethers");

// ============ CONFIGURATION ============
const TEST_WALLET = process.env.TEST_WALLET_ADDRESS || ""; // Optional: to verify upgrade
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || "";
const NEW_ADMIN_ADDRESS = process.env.NEW_ADMIN_ADDRESS || "";

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step X: Transfer Admin Ownership (Admin)");
  console.log("=".repeat(70));

  // Verify caller is admin
  const oldAdmin = await sdk.wallets.getAdmin();
  console.log(`   Admin: ${oldAdmin}`);
  if (oldAdmin.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    console.error(`   ERROR: You are not the admin!`);
    console.error(`   Admin: ${oldAdmin}`);
    console.error(`   You:   ${ADMIN_ADDRESS}`);
    process.exit(1);
  }
  console.log("   ✅ Confirmed: You are the admin");

  // ============ STEP 1: Transfer Admin Ownership ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Transfer Admin Ownership");
  console.log("=".repeat(70));

  const result = await sdk.wallets.transferAdmin({
    newAdminAddress: NEW_ADMIN_ADDRESS
  });
  console.log(`   Transaction: ${result.transactionHash}`);
  console.log(`   New Admin: ${result.newAdmin}`);
  console.log("   ✅ Admin transfer complete!");

  // Verify 
  const currentAdmin = await sdk.wallets.getAdmin();
  console.log(`   Verified: ${currentAdmin}`);

  // ============ STEP 2: Verify Wallet Still Works ============
  if (TEST_WALLET) {
    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Verify Existing Wallet Works");
    console.log("=".repeat(70));

    try {
      // Get KeyVault (should still work)
      const keyVault = await sdk.wallets.getKeyVault({
        walletAddress: TEST_WALLET
      });
      console.log(`   Wallet: ${TEST_WALLET}`);
      console.log(`   KeyVault: ${keyVault} (unchanged)`);
      
      // Test public function
      const addr = await sdk.wallets.getAccountAddress({
        walletAddress: TEST_WALLET,
        index: 0
      });
      console.log(`   Account 0: ${addr}`);
      console.log("   ✅ Wallet works with new logic!");
    } catch (error) {
      console.log(`   ⚠️  Could not verify: ${error.message}`);
    }
  } else {
    console.log("\n   (Set WALLET_ADDRESS to verify a wallet)");
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("ADMIN TRANSFER COMPLETE");
  console.log("=".repeat(70));
  console.log(`
  What was transferred:
  ─────────────────
  ✅ Admin ownership
     Old: ${oldAdmin}
     New: ${result.newAdmin}
  `);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
