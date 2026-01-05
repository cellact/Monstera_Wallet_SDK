/**
 * Update the authenticator of a wallet
 * 
 * Run: node examples/nodejs/updateAuthenticator.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 *   NEW_AUTHENTICATOR_ADDRESS=0x... (your new authenticator address)
 * 
 * Tests:
 * 1. Get the current authenticator
 * 2. Update the authenticator to a new one
 * 3. Verify the new authenticator is used
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const PASSWORD = process.env.PASSWORD || "";
const NEW_AUTHENTICATOR_ADDRESS = process.env.NEW_AUTHENTICATOR_ADDRESS || "0x9bf630Fa31bb2Bdd1c1720bf7AcF324281e6156E";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step X: Update Authenticator");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS) {
    console.error("ERROR: Set WALLET_ADDRESS env var");
    process.exit(1);
  }

  // ============ STEP 1: Get Current Authenticator ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get Current Authenticator");
  console.log("=".repeat(60));
  
  // Get KeyVault info
  const keyVault = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });
  const oldAuthenticator = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVault
  });
  
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVault}`);
  console.log(`      └── Auth:   ${oldAuthenticator}`);

  // check if wallet is initilized 
  const isInitialized = await sdk.isInitialized({
    keyVaultAddr: keyVault
  });
  console.log("   Is Initialized:", isInitialized ? "✅ Yes" : "❌ No");
  if (!isInitialized) {
    console.error("❌ ERROR: Wallet is not initialized");
    process.exit(1);
  }

  // Prepare auth proof
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // Prepare new auth config (password hash for PasswordAuthenticator)
  console.log("\n2. Preparing auth config...");
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 2: Update Authenticator ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Update Authenticator");
  console.log("=".repeat(60));

  const result = await sdk.updateAuthenticatorAddr({
    keyVaultAddr: keyVault,
    authProof: authProof,
    newAuthenticatorAddr: NEW_AUTHENTICATOR_ADDRESS,
    newAuthConfig: passwordHash
  });

  console.log("   Transaction:", result.transactionHash);
  console.log("   Old Auth:", result.oldAuth);
  console.log("   New Auth:", result.newAuth);
  console.log("   Gas Used:", result.gasUsed);
  console.log("   Block Number:", result.blockNumber);

  // ============ STEP 3: Verify the new authenticator is used ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Update Authenticator is successful");
  console.log("=".repeat(60));

  const currentAuthenticator = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVault
  });
  console.log("   Current Auth:", currentAuthenticator);

  // Verify the new authenticator is used
  const isSame = currentAuthenticator.toLowerCase() === NEW_AUTHENTICATOR_ADDRESS.toLowerCase();
  console.log("   Is Same?:", isSame ? "✅ Yes" : "❌ No");

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("   Old Auth:", result.oldAuth);
  console.log("   New Auth:", result.newAuth);
  console.log("   Gas Used:", result.gasUsed);
  console.log("   Block Number:", result.blockNumber);
  console.log("   Is Same?:", isSame ? "✅ Yes" : "❌ No");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
