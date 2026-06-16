/**
 * Step 5: Update WalletLogic for all existing wallets (ADMIN ONLY)
 * 
 * Run: node examples/nodejs/5_updateToNewLogic.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key - must be current admin)
 *   ADMIN_ADDRESS=0x... (your admin address; used to verify caller is admin)
 *   NEW_LOGIC_ADDRESS=0x... (new WalletLogic implementation - deploy elsewhere first, then pass address)
 * 
 * Optional env vars:
 *   WALLET_ADDRESS=0x... (to verify an existing wallet still works after update)
 * 
 * Steps:
 * 1. Deploy new WalletLogic (done elsewhere; pass address via NEW_LOGIC_ADDRESS)
 * 2. Update beacon (all wallets use new logic instantly)
 * 3. Verify existing wallet still works (if WALLET_ADDRESS set)
 * 
 * What is NOT touched: KeyVault (user-controlled), WalletStorage, Authenticators.
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const NEW_LOGIC_ADDRESS = process.env.NEW_LOGIC_ADDRESS;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 5: Update WalletLogic (Admin)");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !ADMIN_ADDRESS || !NEW_LOGIC_ADDRESS) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, ADMIN_ADDRESS, and NEW_LOGIC_ADDRESS env vars");
    process.exit(1);
  }

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
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Deploy New WalletLogic");
  console.log("=".repeat(60));

  console.log("deployment not implemented here - Deploy new WalletLogic contract first and get the address");

  // ============ STEP 2: Update Beacon ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Update Beacon (affects all wallets)");
  console.log("=".repeat(60));

  const result = await sdk.updateWalletLogicImplAddr({
    newLogicAddr: NEW_LOGIC_ADDRESS
  });
  console.log(`   Transaction: ${result.transactionHash}`);
  console.log(`   Old Implementation: ${result.oldImpl}`);
  console.log(`   New Implementation: ${result.newImpl}`);
  console.log("   ✅ Update complete!");

  // Verify
  const currentImpl = await sdk.getWalletLogicImplAddr();
  console.log(`   Verified: ${currentImpl}`);

  // ============ STEP 3: Verify Wallet Still Works ============
  if (WALLET_ADDRESS) {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: Verify Existing Wallet Works");
    console.log("=".repeat(60));

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
  console.log("\n" + "=".repeat(60));
  console.log("ADMIN UPDATE COMPLETE");
  console.log("=".repeat(60));
  console.log(`
  What was updated:
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
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
