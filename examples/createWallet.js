/**
 * Step 1: Create a wallet using the factory
 * Run: node examples/createWallet.js
 * 
 * Required env vars:
 *   export SIGNER_PRIVATE_KEY=0x...
 * 
 * This creates:
 *   - WalletStorage (holds private keys, locked to KeyVault)
 *   - KeyVault (auth + signing, user-upgradeable)
 *   - Wallet (BeaconProxy to WalletLogic, admin-upgradeable)
 */
require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers, Wallet } = require('ethers');

// ============ CONFIGURATION ============
const PASSWORD = process.env.PASSWORD || "mysecretpassword123";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1: Create a Wallet");
  console.log("=".repeat(60));

  // Prepare auth config (password hash for PasswordAuthenticator)
  console.log("\n2. Preparing auth config...");
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // Create wallet
  console.log("\n3. Creating wallet stack...");
  console.log("   This deploys: WalletStorage + KeyVault + WalletProxy");
  const result = await sdk.wallets.createWallet({
    authConfig: passwordHash,
    authenticator: sdk.addresses.passwordAuth
  });
  console.log("   Transaction:", result.transactionHash);

  console.log("\n" + "=".repeat(60));
  console.log("WALLET CREATED!");
  console.log("=".repeat(60));
  console.log(`\nMNEMONIC="${result.mnemonic}"`);
  console.log(`WALLET_ADDRESS=${result.wallet}`);
  console.log(`KEYVAULT_ADDRESS=${result.keyVault}`);
  console.log(`STORAGE_ADDRESS=${result.storage}`);
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
