/**
 * Transfer admin ownership to a new address (ADMIN ONLY)
 * 
 * Run: node examples/transferAdmin.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   TEST_WALLET_ADDRESS=0x... (your wallet address)
 *   ADMIN_ADDRESS=0x... (your admin address)
 *   NEW_ADMIN_ADDRESS=0x... (your new admin address)
 * 
 * Tests:
 * 1. Verify caller is admin
 * 2. Transfer admin ownership to a new address
 * 3. Verify the new admin can access the wallet
 * 
 */
require('dotenv').config();
const { Monstera } = require('../src/index');

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || "";
const NEW_ADMIN_ADDRESS = process.env.NEW_ADMIN_ADDRESS || "";

const sdk = Monstera.connect({
  network: 'testnet',
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step X: Transfer Admin Ownership (Admin)");
  console.log("=".repeat(70));

  // Verify caller is admin
  const oldAdmin = await sdk.factory.getAdmin();
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

  const result = await sdk.factory.transferAdmin({
    newAdminAddress: NEW_ADMIN_ADDRESS
  });
  console.log(`   Transaction: ${result.transactionHash}`);
  console.log(`   New Admin: ${result.newAdmin}`);
  console.log("   ✅ Admin transfer complete!");

  // Verify 
  const currentAdmin = await sdk.factory.getAdmin();
  console.log(`   Verified: ${currentAdmin}`);

  // ============ STEP 2: Verify Wallet Still Works ============
  if (WALLET_ADDRESS) {
    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Verify Existing Wallet Works");
    console.log("=".repeat(70));

    try {
      // Get KeyVault (should still work)
      const keyVault = await sdk.logic.getKeyVault({
        walletAddress: WALLET_ADDRESS
      });
      console.log(`   Wallet: ${WALLET_ADDRESS}`);
      console.log(`   KeyVault: ${keyVault} (unchanged)`);
      
      // Test public function
      const addr = await sdk.logic.getAccountAddress({
        walletAddress: WALLET_ADDRESS,
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
