/**
 * Update password
 * 
 * Run: node examples/nodejs/updatePassword.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 *   NEW_PASSWORD=mynewpassword123
 * 
 * This demonstrates that the password can be updated!
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';
import { verifyMessage } from '../../src/adapters/ethers/signing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const NEW_PASSWORD = process.env.NEW_PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Update password");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !PASSWORD || !NEW_PASSWORD) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, PASSWORD, and NEW_PASSWORD env vars");
    process.exit(1);
  }
  console.log("Updating password for wallet:", WALLET_ADDRESS);

  // ============ STEP 1: Check if wallet is configured ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Check if wallet is configured");
  console.log("=".repeat(60));

  // Get KeyVault info
  const keyVault = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });
  console.log("KeyVault:", keyVault);

  const isConfigured = await sdk.isPasswordConfigured({
    keyVaultAddr: keyVault
  });
  console.log("Is Configured:", isConfigured ? "✅ Yes" : "❌ No");
  if (!isConfigured) {
    console.error("❌ ERROR: Wallet is not configured");
    process.exit(1);
  }

  // Prepare auth proof
  const authProof = toUtf8Bytes(PASSWORD);

  // ============ STEP 2: Update password ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Update password");
  console.log("=".repeat(60));

  // Prepare new password hash
  const newPasswordHash = keccak256(toUtf8Bytes(NEW_PASSWORD));

  const result = await sdk.updatePassword({
    keyVaultAddr: keyVault,
    currentPassword: authProof,
    newPasswordHash: newPasswordHash
  });
  console.log("   Transaction:", result.transactionHash);
  console.log("   Wallet Address (KeyVault address):", result.wallet);
  console.log("   Gas Used:", result.gasUsed);
  console.log("   Block Number:", result.blockNumber);
  console.log("=".repeat(60));

  // ============ STEP 3: Verify wallet still works ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Verify wallet can be used with new password");
  console.log("=".repeat(60));

  // Prepare auth proof
  const newAuthProof = toUtf8Bytes(NEW_PASSWORD);

  // Sign a message
  console.log("Signing a message...");
  const message = "Hello from TheWallet!";
  try {
    const signature = await sdk.signMessage({
      keyVaultAddr: keyVault,
      authProof: { password: newAuthProof },
      index: 0,
      message: toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${signature}`);

    // Verify
    const expectedAddr = await sdk.getAccountAddr({
      keyVaultAddr: keyVault,
      index: 0
    });
    const recovered = verifyMessage(message, signature);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Password Updated for Wallet Address: ${WALLET_ADDRESS}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
