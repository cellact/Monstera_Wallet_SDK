/**
 * Step X: WalletSignatureAuthenticator method examples
 * 
 * Run: node examples/nodejs/walletSigAuth.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   ALLOWED_1_KEY=0x... (your private key for the first allowed address)
 *   ALLOWED_2_KEY=0x... (your private key for the second allowed address)
 * 
 * Tests:
 * 1. create a wallet with a whitelist
 * 2. check if a wallet is configured
 * 3. get the EIP-712 domain separator
 * 4. configure the wallet signature authenticator
 * 5. verify a signature
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers, Wallet } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

// Private keys for test accounts
const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY || "";
const ALLOWED_2_KEY = process.env.ALLOWED_2_KEY || "";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step X: WalletSignatureAuthenticator Test Suite");
  console.log("=".repeat(70));

  if (!ALLOWED_1_KEY || !ALLOWED_2_KEY) {
    console.error("ERROR: Set ALLOWED_1_KEY and ALLOWED_2_KEY env vars");
    console.error("These should be private keys for accounts that are whitelisted");
    process.exit(1);
  }

  // Create signers from private keys
  const allowed1Signer = new Wallet(ALLOWED_1_KEY,  sdk.readProvider);
  const allowed2Signer = new Wallet(ALLOWED_2_KEY,  sdk.readProvider);

  console.log("\n📋 Test Accounts:");
  console.log(`   ✅ Allowed #1:     ${allowed1Signer.address}`);
  console.log(`   ✅ Allowed #2:     ${allowed2Signer.address}`);

  // ============ STEP 1: Create Wallet with Whitelist ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Create Wallet with Whitelist");
  console.log("=".repeat(70));

  // Encode whitelist config (only allowed1 and allowed2)
  const whitelist = [allowed1Signer.address, allowed2Signer.address];
  const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
  console.log(`   Initial Whitelist: ${whitelist.length} addresses`);

  // Create wallet
  const result = await sdk.createWallet({
    authenticatorAddr: sdk.addresses.walletSignatureAuth,
    authConfig: authConfig,
  });
  
  console.log(`   Wallet: ${result.wallet}`);
  console.log(`   KeyVault: ${result.keyVault}`);

  // ============ STEP 2: Check if a wallet is configured ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Check if a wallet is configured");
  console.log("=".repeat(70));

  const isConfigured = await sdk.isWalletSignatureConfigured({
    keyVaultAddr: result.keyVault
  });
  console.log(`   ✅ isConfigured: ${isConfigured ? "✅ Yes" : "❌ No"}`);
  if (!isConfigured) {
    console.error("❌ ERROR: Wallet is not configured");
    process.exit(1);
  }

  // ============ STEP 3: Get the EIP-712 domain separator ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Get the EIP-712 domain separator");
  console.log("=".repeat(70));

  const domainSeparator = await sdk.getDomainSeparator();
  console.log(`   ✅ domainSeparator: ${domainSeparator}`);
  if (!domainSeparator) {
    console.error("❌ ERROR: Failed to get domain separator");
    process.exit(1);
  }

  // ============ STEP 4: Configure the wallet signature authenticator ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Configure the wallet signature authenticator");
  console.log("=".repeat(70));

  const configResult = await sdk.configureWalletSignature({
    keyVaultAddr: result.keyVault,
    authConfig: authConfig
  });
  console.log(`   ✅ result: ${configResult}`);
  if (!configResult) {
    console.error("❌ ERROR: Failed to configure wallet signature authenticator");
    process.exit(1);
  }

  // ============ STEP 5: Verify a signature ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: Verify a signature");
  console.log("=".repeat(70));

  // create auth proof
  const authProof = await sdk.createAuthProof({
    signer: allowed1Signer,
    chainId: sdk.chainId,
    authenticatorAddr: sdk.addresses.walletSignatureAuth,
    deadline: Date.now() + 1000,
    keyVaultAddr: result.keyVault
  });

  const isValid = await sdk.verifyWalletSignature({
    keyVaultAddr: result.keyVault,
    authProof: authProof
  });

  console.log(`   Full result: ${isValid}`);
  console.log(`   ✅ isValid: ${isValid ? "✅ Yes" : "❌ No"}`);
  if (!isValid) {
    console.error("❌ ERROR: Failed to verify signature");
    process.exit(1);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`   Wallet: ${result.wallet}`);
  console.log(`   KeyVault: ${result.keyVault}`);
  console.log(`   Mnemonic: ${result.mnemonic}`);
  console.log(`   isConfigured: ${isConfigured ? "✅ Yes" : "❌ No"}`);
  console.log(`   domainSeparator: ${domainSeparator}`);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
