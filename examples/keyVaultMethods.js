/**
 * Step X: KeyVault method examples
 * 
 * Run: node examples/keyVaultMethods.js
 * 
 * Tests:
 * 1. get the storage contract address holding the keys
 * 2. get the authenticator contract address
 * 3. get the implementation contract address
 * 4. check if a keyVault is initialized
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (private key for deploying/creating wallet)
 *   ALLOWED_1_KEY=0x... (private key for first allowed address)
 *   ALLOWED_2_KEY=0x... (private key for second allowed address)
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers, HDNodeWallet, Wallet } = require('ethers');

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step X: KeyVault method examples");
  console.log("=".repeat(70));

  // Get keyVault address for a wallet
  const keyVaultAddr = await sdk.wallets.getKeyVault({
    walletAddress: WALLET_ADDRESS
  });
  console.log(`   KeyVault: ${keyVaultAddr}`);
  if (!keyVaultAddr) {
    console.error("❌ ERROR: Failed to get key vault address");
    process.exit(1);
  }

  // ============ STEP 1: Get storage contract holding the keys ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Get storage contract holding the keys");
  console.log("=".repeat(70));

  const storageAddr = await sdk.wallets.getStorageAddr({
    keyVaultAddress: keyVaultAddr
  });

  console.log(`   Storage: ${storageAddr}`);
  if (!storageAddr) {
    console.error("❌ ERROR: Failed to get storage address");
    process.exit(1);
  }

  // ============ STEP 2: Get authenticator contract address ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Get authenticator contract address");
  console.log("=".repeat(70));

  const authenticatorAddr = await sdk.wallets.getAuthenticatorKeyVault({
    keyVaultAddress: keyVaultAddr
  });
  console.log(`   Authenticator: ${authenticatorAddr}`);
  if (!authenticatorAddr) {
    console.error("❌ ERROR: Failed to get authenticator address");
    process.exit(1);
  }

  // ============ STEP 3: Get KeyVaultImplementation contract address ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Get KeyVaultImplementation contract address");
  console.log("=".repeat(70));

  const keyVaultImplAddr = await sdk.wallets.getKeyVaultImplAddr({
    keyVaultAddress: keyVaultAddr
  });
  console.log(`   Implementation: ${keyVaultImplAddr}`);
  if (!keyVaultImplAddr) {
    console.error("❌ ERROR: Failed to get implementation address");
    process.exit(1);
  }

  // ============ STEP 4: Check if a keyVault is initialized ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Check if a keyVault is initialized");
  console.log("=".repeat(70));

  const isInitialized = await sdk.wallets.isInitializedKeyVault({
    keyVaultAddress: keyVaultAddr
  });
  console.log(`   isInitialized: ${isInitialized ? "✅ Yes" : "❌ No"}`);
  if (!isInitialized) {
    console.error("❌ ERROR: KeyVault is not initialized");
    process.exit(1);
  }
  
  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`   Wallet: ${WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Storage: ${storageAddr}`);
  console.log(`   Authenticator: ${authenticatorAddr}`);
  console.log(`   KeyVaultImplementation: ${keyVaultImplAddr}`);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
