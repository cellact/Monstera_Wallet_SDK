/**
 * Step 5: Upgrade WalletLogic for all existing wallets (ADMIN ONLY)
 * 
 * This demonstrates ADMIN-controlled upgrades:
 * - Deploys new WalletLogic contract (needs to be done eslewhere first and get the address)
 * - Updates the beacon (all wallets use new logic instantly)
 * - Keys in WalletStorage remain untouched
 * - KeyVault (auth layer) remains untouched
 * 
 * Note: This does NOT upgrade KeyVault (that's user-controlled)
 * 
 * Run: node examples/5_ugradeToNewLogic.js
 */
require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require("ethers");

// ============ CONFIGURATION ============
const TEST_WALLET = process.env.TEST_WALLET_ADDRESS || ""; // Optional: to verify upgrade
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const NEW_LOGIC_ADDRESS = process.env.NEW_LOGIC_ADDRESS || "";

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step 5: Upgrade WalletLogic (Admin)");
  console.log("=".repeat(70));

  // TODO: verify caller is admin

  // Check current implementation
  const oldImpl = await sdk.wallets.implementation();
  console.log("\nCurrent WalletLogic:", oldImpl);

  // ============ STEP 1: Deploy New WalletLogic ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Deploy New WalletLogic");
  console.log("=".repeat(70));

  console.log("deployment not implemented here - Deploy new WalletLogic contract first and get the address");

  // ============ STEP 2: Upgrade Beacon ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Upgrade Beacon (affects all wallets)");
  console.log("=".repeat(70));

  const result = await sdk.wallets.upgradeLogic({
    walletAddress: TEST_WALLET,
    newLogicAddress: NEW_LOGIC_ADDRESS
  });
  console.log(`   Transaction: ${result.transactionHash}`);
  console.log(`   Old Implementation: ${result.oldImpl}`);
  console.log(`   New Implementation: ${result.newLogic}`);
  console.log("   ✅ Upgrade complete!");

  // Verify
  const currentImpl = await sdk.wallets.implementation();
  console.log(`   Verified: ${currentImpl}`);

  // ============ STEP 3: Verify Wallet Still Works ============
  if (TEST_WALLET) {
    console.log("\n" + "=".repeat(70));
    console.log("STEP 3: Verify Existing Wallet Works");
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
  console.log("ADMIN UPGRADE COMPLETE");
  console.log("=".repeat(70));
  console.log(`
  What was upgraded:
  ─────────────────
  ✅ WalletLogic (orchestration layer)
     Old: ${result.oldImpl}
     New: ${result.newLogic}
  
  What was NOT touched:
  ────────────────────
  ✅ KeyVault (user controls this)
  ✅ WalletStorage (immutable keys)
  ✅ Authenticators (per-wallet)
  
  All ${await sdk.wallets.walletCount()} wallets now use the new logic!
  `);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
