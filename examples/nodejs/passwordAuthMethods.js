/**
 * Step X: Change the password of a wallet
 * 
 * Run: node examples/nodejs/passwordAuthMethods.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const PASSWORD = process.env.PASSWORD || "";

const sdk = Monstera.connect({
  network: 'testnet',
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step X: Configure Password");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS) {
    console.error("ERROR: Set WALLET_ADDRESS env var");
    process.exit(1);
  }
  console.log("Configuring password for wallet:", WALLET_ADDRESS);

  // ============ Step 1: Check if wallet is configured ============
  console.log("\n" + "=".repeat(60));
  console.log("Step 1: Check if wallet is configured");
  console.log("=".repeat(60));

  // Get KeyVault info
  const keyVault = await sdk.logic.getKeyVault({
    walletAddress: WALLET_ADDRESS
  });
  console.log("KeyVault:", keyVault);

  const isConfigured = await sdk.auth.password.isConfigured({
    keyVaultAddress: keyVault
  });
  console.log("Is Configured:", isConfigured ? "✅ Yes" : "❌ No");
  if (!isConfigured) {
    console.error("❌ ERROR: Wallet is not configured");
    process.exit(1);
  }

  // ============ Step 2: Configure password ============
  console.log("\n" + "=".repeat(60));
  console.log("Step 2: Configure password");
  console.log("=".repeat(60));

  // prepare password hash (keccak256 of password)
  const authConfig = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));

  const result = await sdk.auth.password.configure({
    keyVaultAddress: keyVault,
    authConfig: authConfig
  });

  console.log("   Transaction:", result.transactionHash);
  console.log("   Wallet Address (KeyVault address):", result.wallet);
  console.log("   Gas Used:", result.gasUsed);
  console.log("   Block Number:", result.blockNumber);

  // ============ Step 3: Verify password ============
  console.log("\n" + "=".repeat(60));
  console.log("Step 3: Verify password");
  console.log("=".repeat(60));

  // prepare raw password bytes (utf8 encoded string)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  const isValid = await sdk.auth.password.verify({
    keyVaultAddress: keyVault,
    authProof: authProof
  });

  console.log("Is Valid:", isValid ? "✅ Yes" : "❌ No");

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Password Configured for Wallet Address: ${WALLET_ADDRESS}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
