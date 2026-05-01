/**
 * Step 1.5: Create HD wallet from mnemonic
 * 
 * Run: node examples/nodejs/1.5_createWalletWithMnemonic.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 * 
 * This creates:
 *   - WalletStorage (holds private keys, locked to KeyVault)
 *   - KeyVault (auth + signing, user-updateable)
 *   - Wallet (BeaconProxy to WalletLogic, admin-updateable)
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;
// Example: Use a valid BIP39 mnemonic (12 words from the BIP39 wordlist)
// This is a well-known test mnemonic - in production, use a secure randomly generated one
const MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1.5: Create HD wallet from mnemonic");
  console.log("=".repeat(60));

  // ============ STEP 1: Get signer address ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get signer address");
  console.log("=".repeat(60));
  const signerAddress = await sdk.getSignerAddr();
  console.log(`   Signer address: ${signerAddress}`);
  if (!signerAddress) {
    console.error("❌ ERROR: Failed to get signer address");
    process.exit(1);
  }

  // ============ STEP 2: Prepare auth config ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Prepare auth config");
  console.log("=".repeat(60));
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 3: Create wallet stack ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Create wallet stack");
  console.log("=".repeat(60));
  console.log("   This deploys: WalletStorage + KeyVault + WalletProxy");
  const result = await sdk.createWalletFromMnemonic({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash },
    mnemonic: MNEMONIC
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
  Wallet (BeaconProxy) ──► WalletLogic (orchestration)
  ${result.wallet}
      │
      └──► KeyVault (auth + signing, YOU control updates)
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
