/**
 * Step 1.3: Create a HD wallet core (no logic wrapper)
 * 
 * Run: node examples/nodejs/1.3_createWalletCore.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 * 
 * This creates:
 *   - WalletStorage (holds private keys, locked to KeyVault)
 *   - KeyVault (KeyVault is the wallet)
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1.3: Create HD wallet core");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY and PASSWORD env vars");
    process.exit(1);
  }

  // ============ STEP 1: Prepare auth config ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Prepare auth config");
  console.log("=".repeat(60));
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 2: Create wallet stack ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Create wallet stack");
  console.log("=".repeat(60));
  console.log("   This deploys: WalletStorage + KeyVault");
  const result = await sdk.createWalletCore({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash },
  });
  console.log("   Transaction:", result.transactionHash);

  console.log("\n" + "=".repeat(60));
  console.log("WALLET CREATED!");
  console.log("=".repeat(60));
  console.log(`\nMNEMONIC="${result.mnemonic}"`);
  console.log(`WALLET_ADDRESS=${result.wallet}`);
  console.log(`KEYVAULT_ADDRESS=${result.keyVault}`);
  console.log(`STORAGE_ADDRESS=${result.storage}`);
  console.log(`AUTHENTICATOR_ADDRESS=${result.authenticator}`);
  console.log(`PASSWORD="${PASSWORD}"`);
  
  console.log("\n" + "=".repeat(60));
  console.log("Architecture created:");
  console.log(`
  KeyVault (core wallet — wallet === keyVault)
  ${result.keyVault}
      │
      ├──► PasswordAuthenticator (verifies your password)
      │
      └──► WalletStorage (holds keys, locked to KeyVault)
          ${result.storage}
  `);
  console.log("⚠️  IMPORTANT: Save the mnemonic phrase securely!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
