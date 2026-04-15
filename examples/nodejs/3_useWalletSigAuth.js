/**
 * Step 3: Test WalletSignatureAuthenticator
 * 
 * Run: node examples/nodejs/3_useWalletSigAuth.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (private key for deploying/creating wallet)
 *   ALLOWED_1_KEY=0x... (private key for first allowed address)
 *   ALLOWED_2_KEY=0x... (private key for second allowed address)
 * 
 * Steps:
 * 1. Create wallet with whitelist of allowed signers
 * 2. Try with NOT allowed account → fail
 * 3. Try with allowed account #1 → success
 * 4. Try with allowed account #2 → success
 * 5. Add previously NOT allowed account to whitelist
 * 6. Try with newly allowed account → success
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers, Wallet } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY;
const ALLOWED_2_KEY = process.env.ALLOWED_2_KEY;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 3: Test WalletSignatureAuthenticator");
  console.log("=".repeat(60));

  if (!ALLOWED_1_KEY || !ALLOWED_2_KEY) {
    console.error("ERROR: Set ALLOWED_1_KEY and ALLOWED_2_KEY env vars");
    console.error("These should be private keys for accounts that will be whitelisted");
    process.exit(1);
  }

  // Create signers from private keys
  const allowed1Signer = new Wallet(ALLOWED_1_KEY,  sdk.readProvider);
  const allowed2Signer = new Wallet(ALLOWED_2_KEY,  sdk.readProvider);
  const notAllowedSigner = Wallet.createRandom().connect(sdk.readProvider);

  console.log("\n📋 Test Accounts:");
  console.log(`   ✅ Allowed #1:     ${allowed1Signer.address}`);
  console.log(`   ✅ Allowed #2:     ${allowed2Signer.address}`);
  console.log(`   ❌ Not Allowed:    ${notAllowedSigner.address}`);

  // ============ STEP 1: Create Wallet with Whitelist ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Create Wallet with Whitelist");
  console.log("=".repeat(60));

  const whitelist = [allowed1Signer.address, allowed2Signer.address];
  console.log(`   Initial Whitelist: ${whitelist.length} addresses`);

  const result = await sdk.createWallet({
    authenticatorAddr: sdk.addresses.walletSignatureAuth,
    authConfig: { initialWhitelist: whitelist },
  });
  
  console.log(`   Wallet: ${result.wallet}`);
  console.log(`   KeyVault: ${result.keyVault}`);

  // const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  // ============ STEP 2: Try NOT Allowed → Should Fail ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Try NOT Allowed Account → Should FAIL");
  console.log("=".repeat(60));

  try {
    // Public function works for anyone
    const addr = await sdk.getAccountAddr({
      keyVaultAddr: result.keyVault,
      index: 0
    });
    console.log(`   ✅ getAccountAddr(0) works: ${addr.slice(0, 20)}...`);
    
    // // Authenticated function should fail
    await sdk.signMessage({
      keyVaultAddr: result.keyVault,
      signer: notAllowedSigner,
      index: 0,
      message: ethers.toUtf8Bytes("test")
    });
    console.log(`   ❌ signMessage succeeded - UNEXPECTED!`);
  } catch {
    console.log(`   ✅ Correctly rejected unauthorized signer`);
  }

  // ============ STEP 3: Try Allowed #1 → Should Succeed ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Try Allowed #1 → Should SUCCEED");
  console.log("=".repeat(60));

  try {
    // Sign a message
    const message = "Hello from WalletSigAuth test!";
    const sig = await sdk.signMessage({
      keyVaultAddr: result.keyVault,
      signer: allowed1Signer,
      index: 0,
      message: ethers.toUtf8Bytes(message)
    });
    console.log(`   ✅ signMessage succeeded!`);
    
    // Verify signature
    const accountAddr = await sdk.getAccountAddr({
      keyVaultAddr: result.keyVault,
      index: 0
    });
    const recovered = ethers.verifyMessage(message, sig);
    const match = recovered.toLowerCase() === accountAddr.toLowerCase();
    console.log(`   ✅ Signature valid: ${match}`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }

  // ============ STEP 4: Try Allowed #2 → Should Succeed ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Try Allowed #2 → Should SUCCEED");
  console.log("=".repeat(60));

  try {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
    const sig = await sdk.sign({
      keyVaultAddr: result.keyVault,
      signer: allowed2Signer,
      index: 0,
      hash: hash
    });
    console.log(`   ✅ sign(hash) succeeded!`);
    console.log(`   Signature: ${sig.slice(0, 40)}...`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }

  // ============ STEP 5: Add NOT Allowed to Whitelist ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Add Previously NOT Allowed to Whitelist");
  console.log("=".repeat(60));

  try {
    // Use allowed1 to add the notAllowed signer
    const addResult = await sdk.addToWhitelist({
      keyVaultAddr: result.keyVault,
      signer: allowed1Signer,
      addressToAdd: notAllowedSigner.address
    });
    console.log(`   ✅ Added ${addResult.added} to whitelist for wallet ${addResult.wallet}`);
    console.log(`   Transaction hash: ${addResult.transactionHash}`);
    console.log(`   Block number: ${addResult.blockNumber}`);
    console.log(`   Gas used: ${addResult.gasUsed}`);

    // Verify whitelist
    const isNowWhitelisted = await sdk.isWhitelisted({
      keyVaultAddr: result.keyVault,
      addressToCheck: notAllowedSigner.address
    });
    console.log(`   ✅ isWhitelisted: ${isNowWhitelisted}`);
  } catch (error) {
    console.log(`   ❌ FAILED to add: ${error.message}`);
  }

  // ============ STEP 6: Try Newly Allowed → Should NOW Succeed ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 6: Try Newly Allowed → Should NOW SUCCEED");
  console.log("=".repeat(60));

  try {
    const sig = await sdk.signMessage({
      keyVaultAddr: result.keyVault,
      signer: notAllowedSigner,
      index: 0,
      message: ethers.toUtf8Bytes("I'm now allowed!")
    });
    console.log(`   Signature: ${sig.slice(0, 40)}...`);
    console.log(`   ✅ signMessage succeeded!`);
    console.log(`   🎉 Previously denied account now has access!`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`   WalletSignatureAuthenticator: ${sdk.addresses.walletSignatureAuth}`);
  console.log(`   Wallet: ${result.wallet}`);
  console.log(`   KeyVault: ${result.keyVault}`);
  console.log(`   Mnemonic: ${result.mnemonic}`);
  console.log("\n   Current Whitelist:");
  const currentWhitelist = await sdk.getWhitelist({
    keyVaultAddr: result.keyVault
  });
  currentWhitelist.forEach((addr, i) => {
    console.log(`      ${i + 1}. ${addr}`);
  });
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
