/**
 * Step 1: Create a HD wallet
 * 
 * Run: node examples/nodejs/1_createHDWallet.js
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
import { ethers } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1: Create a HD Wallet");
  console.log("=".repeat(60));

  // ============ STEP 1: Verify SDK and get signer ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Verify SDK and get signer");
  console.log("=".repeat(60));
  // Access network info (static method, returns the networks for all networks)
  const networks = Monstera.networks;
  console.log(`   Networks: ${JSON.stringify(networks, null, 2)}`);

  // Access contract addresses (static method, returns the addresses for all networks)
  const contractAddresses = Monstera.defaultAddresses;
  console.log(`   Contract addresses: ${JSON.stringify(contractAddresses, null, 2)}`);

  // Access contract addresses for the SDK instance (returns only the addresses for the current network)
  const contractAddresses1 = sdk.addresses;
  console.log(`   Contract addresses 1: ${JSON.stringify(contractAddresses1, null, 2)}`);

  // Check if SDK instance can perform write operations
  const hasWriteAccess = sdk.hasWriteAccess();
  console.log(`   Can write: ${hasWriteAccess}`);
  if (!hasWriteAccess) {
    console.error("❌ ERROR: SDK instance cannot perform write operations");
    process.exit(1);
  }

  // Get the signer address
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
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 3: Create wallet stack ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Create wallet stack");
  console.log("=".repeat(60));
  console.log("   This deploys: WalletStorage + KeyVault + WalletProxy");
  const result = await sdk.createWallet({
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
