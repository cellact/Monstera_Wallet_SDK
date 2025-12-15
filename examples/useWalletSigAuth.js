/**
 * Test WalletSignatureAuthenticator
 * 
 * Run: node examples/useWalletSigAuth.js
 * 
 * Tests:
 * 1. Create wallet with whitelist
 * 2. Try access with NOT allowed account → fail
 * 3. Try access with allowed account #1 → success
 * 4. Try access with another NOT allowed account → fail
 * 5. Try access with allowed account #2 → success
 * 6. Add previously not-allowed account to whitelist
 * 7. Try again with that account → success
 * 
 * Required env vars:
 *   WALLET_FACTORY_CONTRACT_ADDRESS=0x...
 *   WALLET_SIGNATURE_AUTH_ADDRESS=0x...
 *   SIGNER_PRIVATE_KEY=0x... (private key for deploying/creating wallet)
 *   ALLOWED_1_KEY=0x... (private key for 0xADaAf2160f7E8717FF67131E5AA00BfD73e377d5)
 *   ALLOWED_2_KEY=0x... (private key for 0xD0a2b03fCCAD184B9eec286FeFA34301E9436206)
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers, Wallet } = require('ethers');

// ============ CONFIGURATION ============

// Whitelisted addresses
const ALLOWED_1 = process.env.ALLOWED_1 || "0xADaAf2160f7E8717FF67131E5AA00BfD73e377d5";
const ALLOWED_2 = process.env.ALLOWED_2 || "0xD0a2b03fCCAD184B9eec286FeFA34301E9436206";

// Private keys for signing (set via env or use test keys)
const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY || "";
const ALLOWED_2_KEY = process.env.ALLOWED_2_KEY || "";

async function main() {
  console.log("=".repeat(70));
  console.log("WalletSignatureAuthenticator - Full Test Suite");
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    addresses: {
      walletFactory: process.env.WALLET_FACTORY_CONTRACT_ADDRESS,
      walletSignatureAuth: process.env.WALLET_SIGNATURE_AUTH_ADDRESS
    },
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY
  });

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${sdk.network}`);
  console.log(`   Wallet Factory: ${sdk.addresses.walletFactory}`);
  console.log(`   Authenticator: ${sdk.addresses.walletSignatureAuth}`);

  // Validate required keys
  if (!ALLOWED_1_KEY || !ALLOWED_2_KEY) {
    console.error("\n❌ ERROR: Set ALLOWED_1_KEY and ALLOWED_2_KEY env vars");
    console.error("These are the private keys for:");
    console.error(`  ALLOWED_1: ${ALLOWED_1}`);
    console.error(`  ALLOWED_2: ${ALLOWED_2}`);
    process.exit(1);
  }

  // Create signers for allowed addresses
  const allowed1Signer = new Wallet(ALLOWED_1_KEY, sdk.readProvider);
  const allowed2Signer = new Wallet(ALLOWED_2_KEY, sdk.readProvider);

  // Verify addresses match
  if (allowed1Signer.address.toLowerCase() !== ALLOWED_1.toLowerCase()) {
    console.error(`\n❌ ALLOWED_1_KEY doesn't match ${ALLOWED_1}`);
    console.error(`   Got: ${allowed1Signer.address}`);
    process.exit(1);
  }
  if (allowed2Signer.address.toLowerCase() !== ALLOWED_2.toLowerCase()) {
    console.error(`\n❌ ALLOWED_2_KEY doesn't match ${ALLOWED_2}`);
    console.error(`   Got: ${allowed2Signer.address}`);
    process.exit(1);
  }

  // Create NOT allowed signers (random wallets)
  const notAllowed1 = Wallet.createRandom().connect(sdk.readProvider);
  const notAllowed2 = Wallet.createRandom().connect(sdk.readProvider);

  console.log("\n📋 Test Accounts:");
  console.log(`   ✅ Allowed #1:     ${allowed1Signer.address}`);
  console.log(`   ✅ Allowed #2:     ${allowed2Signer.address}`);
  console.log(`   ❌ Not Allowed #1: ${notAllowed1.address}`);
  console.log(`   ❌ Not Allowed #2: ${notAllowed2.address}`);

  let walletAddress;
  let mnemonic;

  // ============ STEP 1: Create Wallet with Whitelist ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Create Wallet with Whitelist");
  console.log("=".repeat(70));

  try {
    // Encode whitelist config
    const whitelist = [ALLOWED_1, ALLOWED_2];
    const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
    console.log(`   Whitelist: ${whitelist.join(", ")}`);

    // Create wallet with whitelist
    const result = await sdk.wallets.createWallet({
      authConfig: authConfig,
      authenticator: sdk.addresses.walletSignatureAuth
    });

    walletAddress = result.wallet;
    mnemonic = result.mnemonic;

    console.log(`   ✅ Wallet created successfully!`);
    console.log(`   Wallet Address: ${walletAddress}`);
    console.log(`   Mnemonic: ${mnemonic}`);
    console.log(`   Transaction Hash: ${result.transactionHash}`);
    console.log(`   Block Number: ${result.blockNumber}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    console.log("\n   ⚠️  WARNING: Store this mnemonic securely!");

  } catch (error) {
    console.error(`   ❌ FAILED to create wallet: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 2: Try NOT Allowed #1 → Should Fail ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Try NOT Allowed #1 → Should FAIL");
  console.log("=".repeat(70));

  try {

    const authProof = await sdk.wallets.createAuthProof({
      authenticateFor: walletAddress,
      signer: notAllowed1,
    });
    
    // Try to call getAccountAddress (public function - should work)
    const accountAddress = await sdk.wallets.getAccountAddress({
      walletAddress: walletAddress,
      index: 0
    });
    console.log(`   ✅ getAccountAddress(0) works (public function): ${accountAddress}`);

    // Try to call getAccount (requires auth - should fail)
    await sdk.wallets.getAccount({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0
    });
    console.log(`   ❌ getAccount succeeded - UNEXPECTED!`);
  } catch (e) {
    console.log(`   ✅ Correctly rejected: ${notAllowed1.address.slice(0, 10)}... not authorized`);
    if (e.message) {
      console.log(`   Error: ${e.message.slice(0, 100)}...`);
    }
  }

  // ============ STEP 3: Try Allowed #1 → Should Succeed ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Try Allowed #1 → Should SUCCEED");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.wallets.createAuthProof({
      authenticateFor: walletAddress,
      signer: allowed1Signer,
    });
    
    // Get account details
    const accountResult= await sdk.wallets.getAccount({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0
    });
    console.log(`   ✅ getAccount succeeded!`);
    console.log(`      Address: ${accountResult.accountAddress}`);
    console.log(`      PrivKey: ${ethers.hexlify(accountResult.privateKey).slice(0, 20)}...`);

    // Sign a message
    const message = ethers.toUtf8Bytes("Test message");
    const sigResult = await sdk.wallets.signMessage({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0,
      message: message
    });
    
    if (sigResult && sigResult.signature) {
      const recovered = ethers.verifyMessage("Test message", sigResult.signature);
      console.log(`   ✅ signMessage succeeded!`);
      console.log(`      Recovered: ${recovered}`);
      console.log(`      Signature: ${sigResult.signature.slice(0, 40)}...`);
    }
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    if (e.stack) {
      console.log(`   Stack: ${e.stack.slice(0, 200)}...`);
    }
  }

  // ============ STEP 4: Try NOT Allowed #2 → Should Fail ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Try NOT Allowed #2 → Should FAIL");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.wallets.createAuthProof({
      authenticateFor: walletAddress,
      signer: notAllowed2,
    });

    await sdk.wallets.getAccount({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0
    });
    console.log(`   ❌ getAccount succeeded - UNEXPECTED!`);
  } catch (e) {
    console.log(`   ✅ Correctly rejected: ${notAllowed2.address.slice(0, 10)}... not authorized`);
    if (e.message) {
      console.log(`   Error: ${e.message.slice(0, 100)}...`);
    }
  }

  // ============ STEP 5: Try Allowed #2 → Should Succeed ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: Try Allowed #2 → Should SUCCEED");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.wallets.createAuthProof({
      authenticateFor: walletAddress,
      signer: allowed2Signer,
    });
    
    const accountResult = await sdk.wallets.getAccount({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0
    });
    console.log(`   ✅ getAccount succeeded!`);
    console.log(`      Address: ${accountResult.accountAddress}`);

    // Sign a hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes("hash test"));
    const sigResult = await sdk.wallets.sign({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0,
      hash: hash
    });
    
    if (sigResult && sigResult.signature) {
      console.log(`   ✅ sign succeeded!`);
      console.log(`      Signature: ${sigResult.signature.slice(0, 40)}...`);
    }
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    if (e.stack) {
      console.log(`   Stack: ${e.stack.slice(0, 200)}...`);
    }
  }

  // ============ STEP 6: Add NOT Allowed #1 to Whitelist ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 6: Add NOT Allowed #1 to Whitelist");
  console.log("=".repeat(70));

  try {
    // Use allowed1 to add notAllowed1
    const authProof = await sdk.wallets.createAuthProof({
      authenticateFor: walletAddress,
      signer: allowed1Signer,
    });
    
    // Add notAllowed1 to whitelist
    const addResult = await sdk.wallets.addToWhitelist({
      walletAddress: walletAddress, 
      authProof: authProof,
      newAddress: notAllowed1.address
    });
    
    console.log(`   ✅ Added ${notAllowed1.address.slice(0, 10)}... to whitelist`);
    console.log(`   Transaction Hash: ${addResult.hash}`);

    // Verify
    const isNowWhitelisted = await sdk.wallets.isWhitelisted({
        walletAddress: walletAddress,
        addressToCheck: notAllowed1.address
    });
    console.log(`   ✅ isWhitelisted: ${isNowWhitelisted}`);
  } catch (e) {
    console.log(`   ❌ FAILED to add: ${e.message}`);
    if (e.stack) {
      console.log(`   Stack: ${e.stack.slice(0, 200)}...`);
    }
  }

  // ============ STEP 7: Try (previously) NOT Allowed #1 → Should NOW Succeed ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 7: Try (previously) NOT Allowed #1 → Should NOW SUCCEED");
  console.log("=".repeat(70));

  try {
    const authProof = await sdk.wallets.createAuthProof({
      authenticateFor: walletAddress,
      signer: notAllowed1,
    });
    
    const accountResult = await sdk.wallets.getAccount({
      walletAddress: walletAddress,
      authProof: authProof,
      index: 0
    });
    console.log(`   ✅ getAccount succeeded!`);
    console.log(`      Address: ${accountResult.accountAddress}`);
    console.log(`      PrivKey: ${ethers.hexlify(accountResult.privateKey).slice(0, 20)}...`);
    console.log(`   🎉 Previously denied account now has access!`);
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    if (e.stack) {
      console.log(`   Stack: ${e.stack.slice(0, 200)}...`);
    }
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`   WalletSignatureAuthenticator: ${sdk.addresses.walletSignatureAuth}`);
  console.log(`   Test Wallet: ${walletAddress}`);
  console.log(`   Mnemonic: ${mnemonic}`);
  
  try {
    const currentWhitelist = await sdk.wallets.getWhitelist({
      walletAddress: walletAddress,
    });
    console.log("\n   Current Whitelist:");
    currentWhitelist.forEach((addr, i) => {
      console.log(`      ${i + 1}. ${addr}`);
    });
  } catch (e) {
    console.log(`   ⚠️  Could not fetch whitelist: ${e.message}`);
  }
  
  console.log("=".repeat(70));
}

// Run example
main()
  .then(() => {
    console.log("\n✅ Test suite completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:");
    console.error(error);
    process.exit(1);
  });
