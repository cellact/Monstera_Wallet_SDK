/**
 * Step X: Update the password of a wallet
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
import { ethers } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const PASSWORD = process.env.PASSWORD || "";
const NEW_PASSWORD = process.env.NEW_PASSWORD || "";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step X: Update Password");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS) {
    console.error("ERROR: Set WALLET_ADDRESS env var");
    process.exit(1);
  }
  console.log("Updating password for wallet:", WALLET_ADDRESS);

  // ============ Step 1: Check if wallet is configured ============
  console.log("\n" + "=".repeat(60));
  console.log("Step 1: Check if wallet is configured");
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
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // ============ Step 2: Update password ============
  console.log("\n" + "=".repeat(60));
  console.log("Step 2: Update password");
  console.log("=".repeat(60));

  // Prepare new password hash
  const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes(NEW_PASSWORD));

  const result = await sdk.updatePassword({
    keyVaultAddr: keyVault,
    currentPassword: authProof,
    newPasswordHash: newPasswordHash
  });
  console.log("   Transaction:", result.transactionHash);
  console.log("   Wallet Address (KeyVault address):", result.walletAddr);
  console.log("   Gas Used:", result.gasUsed);
  console.log("   Block Number:", result.blockNumber);
  console.log("=".repeat(60));

  // ============ Step 3: Verify Wallet Still Works ============
  console.log("\n" + "=".repeat(60));
  console.log("Step 3: Verify wallet can be used with new password");
  console.log("=".repeat(60));

  // Prepare auth proof
  const newAuthProof = ethers.toUtf8Bytes(NEW_PASSWORD);

  // Sign a message
  console.log("Signing a message...");
  const message = "Hello from TheWallet!";
  try {
    const signature = await sdk.signMessage({
      keyVaultAddr: keyVault,
      authProof: newAuthProof,
      index: 0,
      message: ethers.toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${signature}`);

    // Verify
    const expectedAddr = await sdk.getAccountAddr({
      keyVaultAddr: keyVault,
      index: 0
    });
    const recovered = ethers.verifyMessage(message, signature);
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
