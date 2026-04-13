/** 
 * Password Minute Signature Authentication test
 * 
 * Run: node examples/nodejs/passwordMinuteSignatureAuth.js
 * 
 * What this demonstrates:
 * 
 * 1. Check if wallet is configured
 * 2. Configure the password
 * 3. Create a password minute signature auth proof
 * 4. Verify the password minute signature auth proof
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   KEYVAULT_ADDRESS=0x... (your keyVault address)
 *   PASSWORD=mysecretpassword123
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.KEYVAULT_ADDRESS;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("Password Minute Signature Authentication test");
  console.log("=".repeat(60));

  // ============ STEP 1: Prepare auth config ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Prepare auth config");
  console.log("=".repeat(60));

  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 2: Check if wallet is configured ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Check if wallet is configured");
  console.log("=".repeat(60));

  const isConfiguredBefore = await sdk.isPasswordMinuteSignatureConfigured({
    keyVaultAddr: WALLET_ADDRESS
  });
  console.log("Is Configured:", isConfiguredBefore ? "✅ Yes" : "❌ No");

  if (!isConfiguredBefore) {
    console.log("Configuring wallet...");

    const result = await sdk.configurePasswordMinuteSignature({
        keyVaultAddr: WALLET_ADDRESS,
        authConfig: passwordHash,
    })
    console.log("Configuration successful!");
    console.log("Transaction:", result.transactionHash);
  } else {
    console.log("Wallet is already configured. Skipping configuration...");
  }

  // check if wallet is configured after configuration
  const isConfiguredAfter = await sdk.isPasswordMinuteSignatureConfigured({
    keyVaultAddr: WALLET_ADDRESS
  });
  console.log("Is Configured:", isConfiguredAfter ? "✅ Yes" : "❌ No");

  // ============ STEP 3: Create auth proof ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Create auth proof");
  console.log("=".repeat(60));

  const proofData = await sdk.createAuthProofMinuteSignature({
    keyVaultAddr: WALLET_ADDRESS,
    passwordHash: passwordHash,
  });
  console.log("Auth Proof Data:", proofData);

  // ============ STEP 4: Verify auth proof ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Verify auth proof");
  console.log("=".repeat(60));

  const isValid = await sdk.isPasswordMinuteSignatureValid({
    keyVaultAddr: WALLET_ADDRESS,
    authProof: proofData.authProof,
  });
  console.log("Is Valid:", isValid ? "✅ Yes" : "❌ No");
  if (!isValid) {
    console.error("Auth proof verification failed");
    process.exit(1);
  }

  //  ============ STEP 5: Test with wrong password ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Test with wrong password");
  console.log("=".repeat(60));

  const wrongPassword = "wrongpassword";
  const wrongPasswordHash = ethers.keccak256(ethers.toUtf8Bytes(wrongPassword));
  const wrongProofData = await sdk.createAuthProofMinuteSignature({
    keyVaultAddr: WALLET_ADDRESS,
    passwordHash: wrongPasswordHash,
  });
  console.log("Wrong Auth Proof Data:", wrongProofData);

  const wrongIsValid = await sdk.isPasswordMinuteSignatureValid({
    keyVaultAddr: WALLET_ADDRESS,
    authProof: wrongProofData.authProof,
  });
  console.log("Wrong Auth Proof Is Valid:", wrongIsValid ? "✅ Yes" : "❌ No (expected)");
  if (wrongIsValid) {
    console.error("❌ ERROR: Auth proof verification should have failed");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }
);
