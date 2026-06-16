/**
 * Transfer Admin Ownership
 * 
 * Demonstrates transferring admin ownership of the WalletFactory contract.
 * This is an admin-only operation.
 * 
 * Run: node examples/nodejs/factory/transfer-admin.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key - must be current admin)
 *   NEW_ADMIN_ADDRESS=0x... (address to transfer admin ownership to)
 * 
 * Optional env vars:
 *   WALLET_ADDRESS=0x... (wallet address to verify still works after transfer)
 * 
 * What this demonstrates:
 * 1. Verify caller is the current admin
 * 2. Transfer admin ownership to a new address
 * 3. Verify the transfer was successful
 * 4. (Optional) Verify existing wallets still work after admin transfer
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const NEW_ADMIN_ADDRESS = process.env.NEW_ADMIN_ADDRESS;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

const monstera = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Transfer Admin Ownership");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !NEW_ADMIN_ADDRESS) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY and NEW_ADMIN_ADDRESS env vars");
    process.exit(1);
  }

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${monstera.network}`);
  console.log(`   New Admin Address: ${NEW_ADMIN_ADDRESS}`);

  // ============ STEP 1: Verify caller is admin ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Verify caller is admin");
  console.log("=".repeat(60));

  try {
    const currentAdmin = await monstera.getAdmin();
    const signerAddr = await monstera.getSignerAddr();
    
    console.log(`   Current Admin: ${currentAdmin}`);
    console.log(`   Your Address: ${signerAddr}`);

    if (currentAdmin.toLowerCase() !== signerAddr.toLowerCase()) {
      console.error(`\n   ❌ ERROR: You are not the admin!`);
      console.error(`   Current Admin: ${currentAdmin}`);
      console.error(`   Your Address:  ${signerAddr}`);
      process.exit(1);
    }

    console.log(`   ✅ Confirmed: You are the admin`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 2: Transfer admin ownership ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Transfer admin ownership to new address");
  console.log("=".repeat(60));
  console.log("\n   This transfers admin control of the WalletFactory contract.\n");

  try {
    const result = await monstera.transferAdmin({
      newAdminAddr: NEW_ADMIN_ADDRESS
    });

    console.log(`   ✅ Admin transfer successful!`);
    console.log(`   Transaction: ${result.transactionHash}`);
    console.log(`   New Admin: ${result.newAdmin}`);
    if (result.gasUsed) {
      console.log(`   Gas Used: ${result.gasUsed}`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 3: Verify the transfer ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Verify the transfer was successful");
  console.log("=".repeat(60));

  try {
    const newAdmin = await monstera.getAdmin();
    const isCorrect = newAdmin.toLowerCase() === NEW_ADMIN_ADDRESS.toLowerCase();
    
    console.log(`   Current Admin: ${newAdmin}`);
    console.log(`   Expected:      ${NEW_ADMIN_ADDRESS}`);
    console.log(`   ✅ Transfer Verified: ${isCorrect ? "Yes" : "No"}`);

    if (!isCorrect) {
      console.error(`   ❌ ERROR: Admin transfer verification failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 4: Verify existing wallets still work (optional) ============
  if (WALLET_ADDRESS) {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 4: Verify existing wallets still work");
    console.log("=".repeat(60));
    console.log("\n   Admin transfer does not affect existing wallets.\n");

    try {
      const keyVaultAddr = await monstera.getKeyVaultAddr({
        walletAddr: WALLET_ADDRESS
      });
      console.log(`   Wallet: ${WALLET_ADDRESS}`);
      console.log(`   KeyVault: ${keyVaultAddr}`);

      const accountAddr = await monstera.getAccountAddr({
        keyVaultAddr: keyVaultAddr,
        index: 0
      });
      console.log(`   Account 0: ${accountAddr}`);
      console.log(`   ✅ Wallet still works correctly`);
    } catch (error) {
      console.log(`   ⚠️  Could not verify wallet: ${error.message}`);
    }
  } else {
    console.log("\n   ℹ️  Set WALLET_ADDRESS env var to verify existing wallets");
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("   ✅ Verified caller is admin");
  console.log("   ✅ Transferred admin ownership");
  console.log("   ✅ Verified transfer was successful");
  if (WALLET_ADDRESS) {
    console.log("   ✅ Verified existing wallets still work");
  }
  console.log("\n   ⚠️  IMPORTANT: The new admin now has control over");
  console.log("      WalletFactory updates and admin transfers.");
  console.log("=".repeat(60));
}

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