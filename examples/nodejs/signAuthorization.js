/**
 * Sign authorization (using executeWithAuth KeyVault method)
 * 
 * Run: node examples/nodejs/signAuthorization.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 * 
 * Optional env vars:
 *   DELEGATE_CONTRACT=0x... (default)
 *   ACCOUNT_INDEX=0 (default)
 * 
 * Steps:
 * 1. Create auth proof & get keyVault address
 * 2. Sign authorization
 * 3. Summary
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const ACCOUNT_INDEX = 0;
const DELEGATE_CONTRACT = process.env.DELEGATE_CONTRACT || "0x32Dc962615b0f27cf616CB83Ee33D0D6Cb2B7E5b";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("STEP 1: Create auth proof & get keyVault address");
  console.log("=".repeat(60));

  // Prepare auth proof (raw password bytes)
  const authProof = toUtf8Bytes(PASSWORD);

  // Get keyVault address for a wallet
  const keyVaultAddr = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });
  console.log(`   KeyVault: ${keyVaultAddr}`);
  if (!keyVaultAddr) {
    console.error("❌ ERROR: Failed to get key vault address");
    process.exit(1);
  }

  // ============ STEP 2: Sign authorization ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Sign authorization");
  console.log("=".repeat(60));

  const signedAuthorization = await sdk.signAuthorization({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    delegateAddr: DELEGATE_CONTRACT,
    index: ACCOUNT_INDEX,
  });

  if (!signedAuthorization) {
    console.error("❌ ERROR: Failed to sign authorization");
    process.exit(1);
  }

  console.log(`✅ SUCCESS: Authorization signed!`);
  console.log(`   Delegate Contract: ${signedAuthorization.address}`);
  console.log(`   Nonce: ${signedAuthorization.nonce}`);
  console.log(`   Chain ID: ${signedAuthorization.chainId}`);
  console.log(`   Signature (r, s, yParity): ${signedAuthorization.signature.r}, ${signedAuthorization.signature.s}, ${signedAuthorization.signature.yParity}`);

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Wallet: ${WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Delegate Contract: ${DELEGATE_CONTRACT}`);
  console.log(`   Account Index: ${ACCOUNT_INDEX}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
