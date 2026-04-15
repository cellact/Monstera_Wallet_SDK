/**
 * Step 1.4: Create a HD wallet with a custom logic contract
 * 
 * Run: node examples/nodejs/1.4_createWalletCustom.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 *   CUSTOM_LOGIC_IMPL=0x... (your custom wallet logic implementation contract address)
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
const CUSTOM_LOGIC_IMPL = process.env.CUSTOM_LOGIC_IMPL || ""; // your custom wallet logic implementationcontract address; (must implement IWalletLogic)

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 1.4: Create HD wallet with custom logic");
  console.log("=".repeat(60));

  // ============ STEP 1: Prepare auth config ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Prepare auth config");
  console.log("=".repeat(60));
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(PASSWORD));
  console.log("   Password hash:", passwordHash.slice(0, 20) + "...");

  // ============ STEP 2: Prepare logic data ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Prepare logic data");
  console.log("=".repeat(60));
  const logicData = ethers.toUtf8Bytes("some data");
  console.log("   Logic data:", logicData.slice(0, 20) + "...");

  // ============ STEP 3: Create wallet stack ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Create wallet stack");
  console.log("=".repeat(60));
  console.log("   This deploys: WalletStorage + KeyVault + CustomLogicProxy");
  const result = await sdk.createWalletWithCustomLogic({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash },
    customLogicImplAddr: CUSTOM_LOGIC_IMPL,
    logicData: logicData
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
