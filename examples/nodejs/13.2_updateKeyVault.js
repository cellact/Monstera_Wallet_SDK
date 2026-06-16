/**
 * Step 13.2: Update the keyVault implementation of a wallet
 * 
 * Run: node examples/nodejs/13.2_updateKeyVault.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 *   NEW_KEYVAULT_IMPL_ADDRESS=0x... (your new keyVault implementation address)
 * 
 * This demonstrates that KeyVaultImplementation IS updateable!
 * 
 * Steps:
 * 1. Get current KeyVault address and implementation
 * 2. Deploy new KeyVault implementation (deploy elsewhere; pass address via NEW_KEYVAULT_IMPL_ADDRESS)
 * 3. Update KeyVault implementation (and verify new impl is used)
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { toUtf8Bytes } from '../../src/adapters/ethers/hashing.js';

// ============ CONFIGURATION ============
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;
const NEW_KEYVAULT_IMPL_ADDRESS = process.env.NEW_KEYVAULT_IMPL_ADDRESS;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 13.2: Update KeyVaultImplementation");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !PASSWORD || !NEW_KEYVAULT_IMPL_ADDRESS) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, PASSWORD, and NEW_KEYVAULT_IMPL_ADDRESS env vars");
    process.exit(1);
  }

  // ============ STEP 1: Get Current KeyVault address ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get Current KeyVault address");
  console.log("=".repeat(60));

  // Get KeyVault contract address
  const keyVaultAddr = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });

  // Get KeyVaultImplementation contract address from keyVault contract
  const oldkeyVaultImplAddr = await sdk.getKeyVaultImplAddr({
    keyVaultAddr: keyVaultAddr
  });

  console.log(`\nKeyVault: ${keyVaultAddr}`);
  console.log(`Old KeyVaultImplementation address: ${oldkeyVaultImplAddr}`);
  
  // ============ STEP 2: Deploy New KeyVaultImplementation ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Deploy New KeyVaultImplementation");
  console.log("=".repeat(60));

  console.log("deployment not implemented here - Deploy new KeyVaultImplementation contract first and get the address");

  // ============ STEP 3: Update KeyVaultImplementation ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Update KeyVaultImplementation");
  console.log("=".repeat(60));

  // Prepare auth proof
  const authProof = toUtf8Bytes(PASSWORD);

  let newImplAddr;
  try {
    // Update KeyVaultImplementation
    const result = await sdk.updateKeyVaultImplAddr({
      keyVaultAddr: keyVaultAddr,
      authProof: { password: authProof },
      newImplAddr: NEW_KEYVAULT_IMPL_ADDRESS
    });

    newImplAddr = result.newImpl;

    // Verify 
    const currentKeyVaultImplAddr = await sdk.getKeyVaultImplAddr({
      keyVaultAddr: keyVaultAddr
    });
    console.log(`\nCurrent Implementation: ${currentKeyVaultImplAddr}`);
    console.log(`Match: ${currentKeyVaultImplAddr === newImplAddr}`);

  } catch (error) {
    console.error("\n❌ Update failed:", error.message);
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
