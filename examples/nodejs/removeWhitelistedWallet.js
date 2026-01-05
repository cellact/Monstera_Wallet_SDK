/**
 * Step X: Remove Whitelisted Wallet
 * 
 * Run: node examples/nodejs/removeWhitelistedWallet.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   ALLOWED_1_KEY=0x... (your private key for the first allowed address)
 *   ALLOWED_2_KEY=0x... (your private key for the second allowed address)
 * 
 * Tests:
 * 1. Create a wallet with a whitelist
 * 2. Try with allowed account #1 → should succeed
 * 3. Try with allowed account #2 → should succeed
 * 2. Remove previously allowed account #2 from the whitelist
 * 5. Try with removed account #2 → should fail
 * 
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
  console.log("Step X: Remove Whitelisted Wallet");
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
    authenticator: sdk.addresses.walletSignatureAuth,
    authConfig: authConfig,
  });
  
  console.log(`   Wallet: ${result.wallet}`);
  console.log(`   KeyVault: ${result.keyVault}`);

//   const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  // ============ STEP 2: Try Allowed #1 → Should Succeed ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Try Allowed #1 → Should SUCCEED");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.createAuthProof({
      signer: allowed1Signer,
      keyVault: result.keyVault
    });
    
    // Sign a message
    const message = "Hello from WalletSigAuth test!";
    const sig = await sdk.logic.signMessage({
      walletAddress: result.wallet,
      authProof: authProof,
      index: 0,
      message: ethers.toUtf8Bytes(message)
    });
    console.log(`   ✅ signMessage succeeded!`);
    
    // Verify signature
    const accountAddr = await sdk.logic.getAccountAddress({
      walletAddress: result.wallet,
      index: 0
    });
    const recovered = ethers.verifyMessage(message, sig);
    const match = recovered.toLowerCase() === accountAddr.toLowerCase();
    console.log(`   ✅ Signature valid: ${match}`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }

  // ============ STEP 3: Try Allowed #2 → Should Succeed ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Try Allowed #2 → Should SUCCEED");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.createAuthProof({
      signer: allowed2Signer,
      keyVault: result.keyVault
    });
    
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
    const sig = await sdk.logic.sign({
      walletAddress: result.wallet,
      authProof: authProof,
      index: 0,
      hash: hash
    });
    console.log(`   ✅ sign(hash) succeeded!`);
    console.log(`   Signature: ${sig.slice(0, 40)}...`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }

  // ============ STEP 4: Remove Allowed #2 from Whitelist ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Remove Allowed #2 from Whitelist");
  console.log("=".repeat(70));

  try {
    // Use allowed1 to remove allowed2 from the whitelist
    const authProof = await sdk.createAuthProof({
      signer: allowed1Signer,
      keyVault: result.keyVault
    });
    const removeResult = await sdk.removeFromWhitelist({
      keyVaultAddress: result.keyVault,
      authProof: authProof,
      addressToRemove: allowed2Signer.address
    });
    console.log(`   ✅ Removed ${allowed2Signer.address.slice(0, 10)}... from whitelist`);

    // Verify whitelist
    const isWhitelistedResult = await sdk.isWhitelisted({
      keyVaultAddress: result.keyVault,
      addressToCheck: allowed2Signer.address
    });
    // should be false as allowed2Signer is now removed from the whitelist
    console.log(`   ✅ isWhitelisted: ${isWhitelistedResult ? "❌ No" : "✅ Yes"}`);
  } catch (error) {
    console.log(`   ❌ FAILED to remove: ${error.message}`);
  }

  // ============ STEP 5: Try Newly Removed → Should NOW Fail ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: Try Removed Account → Should NOW FAIL");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.createAuthProof({
      signer: allowed2Signer,
      keyVault: result.keyVault
    });
    const sig = await sdk.logic.signMessage({
      walletAddress: result.wallet,
      authProof: authProof,
      index: 0,
      message: ethers.toUtf8Bytes("I'm now not allowed!")
    });
    console.log(`   ❌ signMessage succeeded - UNEXPECTED!`);
  } catch (error) {
    console.log(`   ✅ signMessage failed as expected`);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`   WalletSignatureAuthenticator: ${sdk.addresses.walletSignatureAuth}`);
  console.log(`   Wallet: ${result.wallet}`);
  console.log(`   KeyVault: ${result.keyVault}`);
  console.log(`   Mnemonic: ${result.mnemonic}`);
  console.log("\n   Current Whitelist:");
  const currentWhitelist = await sdk.getWhitelist({
    keyVaultAddress: result.keyVault
  });
  currentWhitelist.forEach((addr, i) => {
    console.log(`      ${i + 1}. ${addr}`);
  });
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
