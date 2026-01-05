/**
 * Step 1.2: Create a new HD wallet with a post-creation hook
 * Run: node examples/nodejs/1.2_createWalletWithHook.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 *   HOOK_ADDRESS=0x...
 * 
 * This creates:
 *   - WalletStorage (holds private keys, locked to KeyVault)
 *   - KeyVault (auth + signing, user-upgradeable)
 *   - Wallet (BeaconProxy to WalletLogic, admin-upgradeable)
 *   - Post-creation hook (called after wallet is created)
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;
const HOOK_ADDRESS = process.env.HOOK_ADDRESS || ""; // your hook contract address; hook Contract implementing IWalletCreationHook (or address(0) to skip)

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1: Create a HD Wallet");
  console.log("=".repeat(60));

  // Prepare auth config (password hash for PasswordAuthenticator)
  console.log("\n2. Preparing auth config...");
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // Prepare hook data (data for the hook)
  console.log("\n2. Preparing hook data...");
  const hookData = ethers.toUtf8Bytes("some data");
  console.log("   Hook data:", hookData.slice(0, 20) + "...");

  // Create wallet
  console.log("\n3. Creating wallet stack...");
  console.log("   This deploys: WalletStorage + KeyVault + WalletProxy");
  const result = await sdk.createWalletWithHook({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: passwordHash,
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
      └──► KeyVault (auth + signing, YOU control upgrades)
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
