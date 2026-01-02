/**
 * Step 13.2: Upgrade the keyVault implementation of a wallet
 * 
 * Run: node examples/13.2_upgradeKeyVault.js
 * 
 * This demonstrates that KeyVaultImplementation IS upgradeable!
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 *   NEW_KEYVAULT_IMPL_ADDRESS=0x... (your new keyVault implementation address)
 * 
 * Tests:
 * 1. Get the current keyVault implementation
 * 2. Deploy a new keyVault implementation (this is not implemented here)
 * 3. Upgrade the keyVault implementation to a new one
 * 4. Verify the new keyVaultImplementation contract is used
 * 
 */
import 'dotenv/config';
import { Monstera } from '../src/index.js';
import { ethers } from 'ethers';

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const PASSWORD = process.env.PASSWORD || "";
const NEW_KEYVAULT_IMPL_ADDRESS = process.env.NEW_KEYVAULT_IMPL_ADDRESS || "";

const sdk = Monstera.connect({
  network: 'testnet',
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 13.2: Upgrade KeyVaultImplementation");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS) {
    console.error("ERROR: Set WALLET_ADDRESS env var");
    process.exit(1);
  }

  // ============ STEP 1: Get Current KeyVault address ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get Current KeyVault address");
  console.log("=".repeat(60));

  // Get KeyVault contract address from wallet factory 
  const keyVaultAddr = await sdk.factory.getWalletKeyVault({
    walletAddress: WALLET_ADDRESS
  });

  // Get KeyVaultImplementation contract address from keyVault contract
  const oldkeyVaultImplAddr = await sdk.keyVault.getKeyVaultImplAddr({
    keyVaultAddress: keyVaultAddr
  });

  console.log(`\nKeyVault: ${keyVaultAddr}`);
  console.log(`Old KeyVaultImplementation address: ${oldkeyVaultImplAddr}`);
  
  // ============ STEP 2: Deploy New KeyVaultImplementation ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Deploy New KeyVaultImplementation");
  console.log("=".repeat(60));

  console.log("deployment not implemented here - Deploy new KeyVaultImplementation contract first and get the address");

  // ============ STEP 3: Upgrade KeyVaultImplementation ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Upgrade KeyVaultImplementation");
  console.log("=".repeat(60));

  // Prepare auth proof
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  try {
    // // Upgrade KeyVaultImplementation (via walletLogic contract)
    // const result = await sdk.logic.upgradeKeyVaultImpl({
    //   walletAddress: WALLET_ADDRESS,
    //   authProof: authProof,
    //   newImplAddr: NEW_KEYVAULT_IMPL_ADDRESS
    // });

    // const newImplAddr = result.newImplAddr;

    // upgrade KeyVaultImplementation (via keyVault contract)
    const result = await sdk.keyVault.upgradeKeyVaultImpl({
      keyVaultAddress: keyVaultAddr,
      authProof: authProof,
      newImplAddr: NEW_KEYVAULT_IMPL_ADDRESS
    });

    newImplAddr = result.newImpl;

    // Verify 
    const currentKeyVaultImplAddr = await sdk.keyVault.getKeyVaultImplAddr({
      keyVaultAddress: keyVaultAddr
    });
    console.log(`\nCurrent Implementation: ${currentKeyVaultImplAddr}`);
    console.log(`Match: ${currentKeyVaultImplAddr === newImplAddr}`);

  } catch (error) {
    console.error("\n❌ Upgrade failed: ", error);
    process.exit(1);
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Old Implementation: ${oldkeyVaultImplAddr}`);
  console.log(`   New Implementation: ${newImplAddr}`);
  console.log("\nSAVE THIS:");
  console.log("=".repeat(60));
  console.log(`export NEW_KEYVAULT_IMPL_ADDRESS="${newImplAddr}"`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
