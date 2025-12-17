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
 * 5. change the authenticator contract address
 * 6. get the account address from the keyVault contract
 * 7. get multiple account addresses from the keyVault contract
 * 8. sign a 32-byte hash with the keyVault contract
 * 9. sign an EIP-191 message with the keyVault contract
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
const PASSWORD = process.env.TEST_PASSWORD || "";

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

//   // ============ STEP 5: Change the authenticator contract address ============
//   console.log("\n" + "=".repeat(70));
//   console.log("STEP 5: Change the authenticator contract address");
//   console.log("=".repeat(70));

//   const newAuthenticatorAddr = await sdk.wallets.changeAuthenticatorKeyVault({
//     keyVaultAddress: keyVaultAddr,
//     authProof: authProof
//   });
//   console.log(`   New Authenticator: ${newAuthenticatorAddr}`);
//   if (!newAuthenticatorAddr) {
//     console.error("❌ ERROR: Failed to change authenticator address");
//     process.exit(1);
//   }

  // ============ STEP 6: Get the account address from the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 6: Get the account address (index 0) from the keyVault contract");
  console.log("=".repeat(70));

  const accountAddress = await sdk.wallets.getAccountAddressKeyVault({
    keyVaultAddress: keyVaultAddr,
    index: 0
  });
  console.log(`   Account Address (index 0): ${accountAddress}`);
  if (!accountAddress) {
    console.error("❌ ERROR: Failed to get account address");
    process.exit(1);
  }

  // ============ STEP 7: Get multiple account addresses from the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 7: Get multiple account addresses (indexes 0-4) from the keyVault contract");
  console.log("=".repeat(70));

  const accountAddresses = await sdk.wallets.getAccountAddressesKeyVault({
    keyVaultAddress: keyVaultAddr,
    fromIndex: 0,
    count: 5
  });
  // log each account address with index
  for (let i = 0; i < accountAddresses.length; i++) {
    console.log(`   Account Address (index ${i}): ${accountAddresses[i]}`);
  }
  if (!accountAddresses) {
    console.error("❌ ERROR: Failed to get account addresses");
    process.exit(1);
  }

  // ============ STEP 8: Sign a 32-byte hash with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 8: Sign a 32-byte hash");
  console.log("=".repeat(70));

  // Prepare auth proof (raw password bytes)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  const hash = ethers.keccak256(ethers.toUtf8Bytes("Hello from TheWallet!"));

  const signedHash = await sdk.wallets.signKeyVault({
    keyVaultAddress: keyVaultAddr,
    authProof: authProof,
    index: 0,
    hash: hash
  });
  console.log(`   Signature (signed hash): ${signedHash}`);
  if (!signedHash) {
    console.error("❌ ERROR: Failed to sign hash");
    process.exit(1);
  }

  // ============ STEP 9: Sign an EIP-191 message with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 9: Sign an EIP-191 message with the keyVault contract");
  console.log("=".repeat(70));

  const message = "Hello from TheWallet!";

  const signature = await sdk.wallets.signMessageKeyVault({
    keyVaultAddress: keyVaultAddr,
    authProof: authProof,
    index: 0,
    message: ethers.toUtf8Bytes(message)
  });
  console.log(`   Signatur (signed message): ${signature}`);
  if (!signature) {
    console.error("❌ ERROR: Failed to sign message");
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
  console.log(`   Account Address (index 0): ${accountAddress}`);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
