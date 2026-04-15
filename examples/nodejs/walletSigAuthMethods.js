/**
 * WalletSignatureAuthenticator Client Methods
 * 
 * Demonstrates WalletSignatureAuthenticator client methods.
 * 
 * Run: node examples/nodejs/walletSigAuthMethods.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   ALLOWED_1_KEY=0x... (private key for first whitelisted address)
 * 
 * What this demonstrates:
 * 1. Create new wallet 
 * 2. Check if wallet signature authenticator is configured
 * 3. Get the EIP-712 domain separator
 * 4. Configure the wallet signature authenticator
 * 5. Verify a wallet signature
 * 
 * Note: Whitelist management methods (addToWhitelist, removeFromWhitelist,
 * getWhitelist) are demonstrated in other example files.
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers, Wallet } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY;

// Initialize SDK
const monstera = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("WalletSignatureAuthenticator Client Methods");
  console.log("=".repeat(60));

  if (!ALLOWED_1_KEY) {
    console.error("ERROR: Set ALLOWED_1_KEY env var");
    console.error("This should be a private key for a whitelisted address");
    process.exit(1);
  }
  
  console.log("\n📋 Configuration:");
  console.log(`   Network: ${monstera.network}`);

  // Create signer from private key
  const allowedSigner = new Wallet(ALLOWED_1_KEY, monstera.readProvider);
  console.log(`   Whitelisted Address: ${allowedSigner.address}`);

  // ============ STEP 1: Create new wallet ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Create new wallet");
  console.log("=".repeat(60));

  const whitelist = [allowedSigner.address];
  console.log(`   Whitelist: ${whitelist.length} address(es)`);
  
  let result;
  try {
    result = await monstera.createWallet({
      authenticatorAddr: monstera.addresses.walletSignatureAuth,
      authConfig: { initialWhitelist: whitelist }
    });

    console.log(`   Wallet: ${result.wallet}`);
    console.log(`   KeyVault: ${result.keyVault}`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 2: Check if wallet signature authenticator is configured ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Check if wallet signature authenticator is configured");
  console.log("=".repeat(60));

  let isConfigured = false;
  try {
    isConfigured = await monstera.isWalletSignatureConfigured({
      keyVaultAddr: result.keyVault
    });
    console.log(`   ✅ Is Configured: ${isConfigured ? "Yes" : "No"}`);
    
    if (!isConfigured) {
      console.log("\n   ℹ️  Wallet is not configured. Will configure in next section.");
    } else {
      console.log("\n   ℹ️  Wallet is already configured. Next section will be skipped.");
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 3: Get the EIP-712 domain separator ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Get the EIP-712 domain separator");
  console.log("=".repeat(60));

  try {
    const domainSeparator = await monstera.getDomainSeparator();
    console.log(`   ✅ Domain Separator: ${domainSeparator}`);
    console.log(`   💡 This is used for EIP-712 signature verification`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ STEP 4: Configure the wallet signature authenticator ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Configure the wallet signature authenticator");
  console.log("=".repeat(60));
  console.log("\n   This sets up the whitelist for wallet signature authentication.\n");

  // Only configure if not already configured
  if (!isConfigured) {
    try {
      const configureResult = await monstera.configureWalletSignature({
        keyVaultAddr: result.keyVault,
        initialWhitelist: whitelist
      });

      console.log(`   ✅ Configuration successful!`);
      console.log(`   Transaction: ${configureResult.transactionHash}`);
      if (configureResult.gasUsed) {
        console.log(`   Gas Used: ${configureResult.gasUsed}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`   ⏭️  Skipped: Wallet signature authenticator is already configured`);
  }

  // ============ STEP 5: Verify a wallet signature ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Verify a wallet signature");
  console.log("=".repeat(60));
  console.log("\n   Creates an auth proof and verifies it.\n");

  try {
    // Create auth proof using the whitelisted signer
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const authProof = await monstera.createAuthProof({
      signer: allowedSigner,
      keyVaultAddr: result.keyVault,
      authenticatorAddr: monstera.addresses.walletSignatureAuth,
      deadline: deadline,
      chainId: monstera.chainId
    });

    console.log(`   ✅ Auth proof created`);

    // Verify the signature
    const isValid = await monstera.isWalletSignatureValid({
      keyVaultAddr: result.keyVault,
      authProof: authProof
    });

    console.log(`   ✅ Signature Valid: ${isValid ? "Yes" : "No"}`);
    
    if (!isValid) {
      console.error("   ❌ ERROR: Signature verification failed");
      process.exit(1);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("   ✅ Checked if wallet signature authenticator is configured");
  console.log("   ✅ Retrieved EIP-712 domain separator");
  if (!isConfigured) {
    console.log("   ✅ Configured wallet signature authenticator");
  } else {
    console.log("   ⏭️  Skipped configuration (already configured)");
  }
  console.log("   ✅ Verified wallet signature");
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