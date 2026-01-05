/**
 * Step 5: Upgrade WalletLogic for all existing wallets (ADMIN ONLY)
 * 
 * Run: node examples/nodejs/5_ugradeToNewLogic.js
 * 
 * This demonstrates ADMIN-controlled upgrades:
 * - Deploys new WalletLogic contract (needs to be done eslewhere first and get the address)
 * - Updates the beacon (all wallets use new logic instantly)
 * - Keys in WalletStorage remain untouched
 * - KeyVault (auth layer) remains untouched
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   ADMIN_ADDRESS=0x... (your admin address)
 *   NEW_LOGIC_ADDRESS=0x... (your new wallet logic implementation contract address)
 * 
 * Note: This does NOT upgrade KeyVault (that's user-controlled)
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || ""; // Optional: to verify upgrade
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || "";
const NEW_LOGIC_ADDRESS = process.env.NEW_LOGIC_ADDRESS || "";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step 5: Upgrade WalletLogic (Admin)");
  console.log("=".repeat(70));

  // Verify caller is admin
  const admin = await sdk.getAdmin();
  console.log(`   Admin: ${admin}`);
  if (admin.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    console.error(`   ERROR: You are not the admin!`);
    console.error(`   Admin: ${admin}`);
    console.error(`   You:   ${ADMIN_ADDRESS}`);
    process.exit(1);
  }
  console.log("   ✅ Confirmed: You are the admin");

  // Check current implementation
  const oldImpl = await sdk.getWalletLogicImplAddr();
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

  const result = await sdk.upgradeWalletLogicImplAddr({
    newLogicAddr: NEW_LOGIC_ADDRESS
  });
  console.log(`   Transaction: ${result.transactionHash}`);
  console.log(`   Old Implementation: ${result.oldImpl}`);
  console.log(`   New Implementation: ${result.newImpl}`);
  console.log("   ✅ Upgrade complete!");

  // Verify
  const currentImpl = await sdk.getWalletLogicImplAddr();
  console.log(`   Verified: ${currentImpl}`);

  // ============ STEP 3: Verify Wallet Still Works ============
  if (WALLET_ADDRESS) {
    console.log("\n" + "=".repeat(70));
    console.log("STEP 3: Verify Existing Wallet Works");
    console.log("=".repeat(70));

    try {
      // Get KeyVault (should still work)
      const keyVault = await sdk.getKeyVaultAddr({
        walletAddr: WALLET_ADDRESS
      });
      console.log(`   Wallet: ${WALLET_ADDRESS}`);
      console.log(`   KeyVault: ${keyVault} (unchanged)`);
      
      // Test public function
      const addr = await sdk.getAccountAddr({
        keyVaultAddr: keyVault,
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
     New: ${result.newImpl}
  
  What was NOT touched:
  ────────────────────
  ✅ KeyVault (user controls this)
  ✅ WalletStorage (immutable keys)
  ✅ Authenticators (per-wallet)
  
  `);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
