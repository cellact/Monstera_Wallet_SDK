/**
 * Step 1: Create a HD wallet
 * Run: node examples/1_createHDWallet.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   TEST_PASSWORD=mysecretpassword123
 * 
 * This creates:
 *   - WalletStorage (holds private keys, locked to KeyVault)
 *   - KeyVault (auth + signing, user-upgradeable)
 *   - Wallet (BeaconProxy to WalletLogic, admin-upgradeable)
 */
require('dotenv').config();
const { Monstera } = require('../src/index');
const { ethers } = require('ethers');

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.TEST_PASSWORD;

const sdk = Monstera.connect({
  network: 'testnet',
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1: Create a HD Wallet");
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

  // Prepare auth config (password hash for PasswordAuthenticator)
  console.log("\n2. Preparing auth config...");
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // Create wallet
  console.log("\n3. Creating wallet stack...");
  console.log("   This deploys: WalletStorage + KeyVault + WalletProxy");
  const result = await sdk.factory.createWallet({
    authenticator: sdk.addresses.passwordAuth,
    authConfig: passwordHash,
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
