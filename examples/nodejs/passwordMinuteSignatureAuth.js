/**
 * Password Minute Signature Authentication test
 *
 * Run: node examples/nodejs/passwordMinuteSignatureAuth.js
 *
 * What this demonstrates:
 *
 * 1. Check if wallet is configured
 * 2. Configure the password
 * 3. Verify the password minute signature auth proof
 * 4. Verify the password minute signature auth proof with wrong password
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   KEYVAULT_ADDRESS=0x... (your KeyVault address)
 *   PASSWORD=mysecretpassword123
 *
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const KEYVAULT_ADDRESS = process.env.KEYVAULT_ADDRESS;
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

  if (!SIGNER_PRIVATE_KEY || !KEYVAULT_ADDRESS || !PASSWORD) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY, KEYVAULT_ADDRESS, and PASSWORD env vars');
    process.exit(1);
  }

  // ============ STEP 1: Prepare auth config ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Prepare auth config");
  console.log("=".repeat(60));

  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 2: Check if wallet is configured ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Check if wallet is configured");
  console.log("=".repeat(60));

  const isConfiguredBefore = await sdk.isPasswordMinuteSignatureConfigured({
    keyVaultAddr: KEYVAULT_ADDRESS
  });
  console.log("Is Configured:", isConfiguredBefore ? "✅ Yes" : "❌ No");

  if (!isConfiguredBefore) {
    console.log("Configuring wallet...");

    const result = await sdk.configurePasswordMinuteSignature({
      keyVaultAddr: KEYVAULT_ADDRESS,
      passwordHash: passwordHash,
    });
    console.log("Configuration successful!");
    console.log("Transaction:", result.transactionHash);
  } else {
    console.log("Wallet is already configured. Skipping configuration...");
  }

  const isConfiguredAfter = await sdk.isPasswordMinuteSignatureConfigured({
    keyVaultAddr: KEYVAULT_ADDRESS
  });
  console.log("Is Configured:", isConfiguredAfter ? "✅ Yes" : "❌ No");

  // ============ STEP 3: Verify auth proof ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Verify auth proof");
  console.log("=".repeat(60));

  const isValid = await sdk.isPasswordMinuteSignatureValid({
    keyVaultAddr: KEYVAULT_ADDRESS,
    passwordHash: passwordHash,
  });
  console.log("Is Valid:", isValid ? "✅ Yes" : "❌ No");
  if (!isValid) {
    console.error("Auth proof verification failed");
    process.exit(1);
  }

  // ============ STEP 4: Test with wrong password ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Test with wrong password");
  console.log("=".repeat(60));

  const wrongPassword = "wrongpassword";
  const wrongPasswordHash = keccak256(toUtf8Bytes(wrongPassword));

  const wrongIsValid = await sdk.isPasswordMinuteSignatureValid({
    keyVaultAddr: KEYVAULT_ADDRESS,
    passwordHash: wrongPasswordHash,
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
  });
