/**
 * Step 1.2: Create a new HD wallet with a post-creation hook
 * 
 * Run: node examples/nodejs/wallet/create-with-hook.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 *   HOOK_ADDRESS=0x...
 * 
 * This creates:
 *   - WalletStorage (holds private keys, locked to KeyVault)
 *   - KeyVault (auth + signing, user-updateable)
 *   - Wallet (BeaconProxy to WalletLogic, admin-updateable)
 *   - Post-creation hook (called after wallet is created)
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ZeroAddress } from '../../../src/adapters/ethers/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;
const HOOK_ADDRESS = process.env.HOOK_ADDRESS || ZeroAddress;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1.2: Create HD wallet with hook");
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

  // ============ STEP 2: Prepare hook data ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Prepare hook data");
  console.log("=".repeat(60));
  const hookData = toUtf8Bytes("some data");
  console.log("   Hook data:", hookData.slice(0, 20) + "...");

  // ============ STEP 3: Create wallet stack ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Create wallet stack");
  console.log("=".repeat(60));
  console.log("   This deploys: WalletStorage + KeyVault + WalletProxy");
  const result = await sdk.createWalletWithHook({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash },
    hookAddr: HOOK_ADDRESS,
    hookData: hookData
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
