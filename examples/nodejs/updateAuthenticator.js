/**
 * Update the authenticator of a wallet
 *
 * Run: node examples/nodejs/updateAuthenticator.js
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 *
 * Optional env vars:
 *   NEW_AUTHENTICATOR_ADDRESS=0x... (defaults to PasswordAuthenticator on the connected network)
 *
 * Steps:
 * 1. Get current authenticator
 * 2. Update authenticator to new address
 * 3. Verify the new authenticator is used
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

const NEW_AUTHENTICATOR_ADDRESS =
  process.env.NEW_AUTHENTICATOR_ADDRESS || sdk.addresses.passwordAuth;

async function main() {
  console.log("=".repeat(60));
  console.log("Update authenticator");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !PASSWORD) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, and PASSWORD env vars");
    process.exit(1);
  }

  // ============ STEP 1: Get Current Authenticator ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get Current Authenticator");
  console.log("=".repeat(60));

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

  const isInitialized = await sdk.isInitialized({
    keyVaultAddr: keyVault
  });
  console.log("   Is Initialized:", isInitialized ? "✅ Yes" : "❌ No");
  if (!isInitialized) {
    console.error("❌ ERROR: Wallet is not initialized");
    process.exit(1);
  }

  const authProof = toUtf8Bytes(PASSWORD);

  console.log("\n2. Preparing auth config...");
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 2: Update Authenticator ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Update Authenticator");
  console.log("=".repeat(60));

  const result = await sdk.updateAuthenticatorAddr({
    keyVaultAddr: keyVault,
    authProof: { password: authProof },
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
  console.log("STEP 3: Verify the new authenticator is used");
  console.log("=".repeat(60));

  const currentAuthenticator = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVault
  });
  console.log("   Current Auth:", currentAuthenticator);

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
