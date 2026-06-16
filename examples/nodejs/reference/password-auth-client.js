/**
 * Reference: PasswordAuthenticator client methods
 * Folder: reference
 * Prerequisites: WALLET_ADDRESS, PASSWORD
 * 
 * Run: node examples/nodejs/reference/password-auth-client.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("Password authenticator methods");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !PASSWORD) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, and PASSWORD env vars");
    process.exit(1);
  }
  console.log("Configuring password for wallet:", WALLET_ADDRESS);

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
    // ============ STEP 2: Configure password ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: Configure password");
    console.log("=".repeat(60));

    const authConfig = keccak256(toUtf8Bytes(PASSWORD));

    const result = await sdk.configurePassword({
      keyVaultAddr: keyVault,
      passwordHash: authConfig
    });

    console.log("   Transaction:", result.transactionHash);
    console.log("   Wallet Address (KeyVault address):", result.wallet);
    console.log("   Gas Used:", result.gasUsed);
    console.log("   Block Number:", result.blockNumber);
  } else {
    console.log("Wallet is already configured. Skipping configuration...");
  }

  // ============ STEP 3: Verify password ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Verify password");
  console.log("=".repeat(60));

  // prepare raw password bytes (utf8 encoded string)
  const authProof = toUtf8Bytes(PASSWORD);

  const isValid = await sdk.isPasswordValid({
    keyVaultAddr: keyVault,
    currentPassword: authProof
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
