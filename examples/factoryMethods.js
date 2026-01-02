/**
 * Test WalletFactory methods
 * 
 * Run: node examples/factoryMethods.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 * 
 * Tests:
 * 1. Check if an address is a wallet created by this factory
 * 2. Get current WalletLogic implementation.
 * 3. Get beacon address.
 * 4. Get storage contract address for a wallet.
 * 
 */

import 'dotenv/config';
import { Monstera } from '../src/index.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

async function main() {
  console.log("=".repeat(70));
  console.log("WalletFactory - Full Test Suite");
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = Monstera.connect({
    network: 'testnet', // or 'mainnet'
    signer: SIGNER_PRIVATE_KEY
  });

  console.log("\n📋 Configuration:");
  console.log(`   Network: ${sdk.network}`);

  // ============ STEP 1: Check if an address is a wallet created by this factory ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Check if an address is a wallet created by this factory");
  console.log("=".repeat(70));

  try {
    // Check if an address is a wallet created by this factory
    const result = await sdk.factory.isWallet({
        walletAddress:WALLET_ADDRESS
    });

    console.log(`   ✅ Address ${WALLET_ADDRESS} is ${result ? 'a' : 'not a'} wallet created by this factory`);

  } catch (error) {
    console.error(`   ❌ FAILED to check if address is a wallet created by this factory: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 2: Get current WalletLogic implementation. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Get current WalletLogic implementation.");
  console.log("=".repeat(70));

  try {
    // Get current WalletLogic contract address
    const result = await sdk.factory.getWalletLogicImplAddr();

    console.log(`   ✅ Current WalletLogic implementation: ${result}`);
    
  } catch (error) {
    console.error(`   ❌ FAILED to get current WalletLogic implementation: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 3: Get beacon address. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Get beacon address.");
  console.log("=".repeat(70));

  try {
    // Get beacon address
    const result = await sdk.factory.getBeaconAddr();

    console.log(`   ✅ Beacon address: ${result}`);

  } catch (error) {
    console.error(`   ❌ FAILED to get beacon address: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }

  // ============ STEP 4: Get storage contract address for a wallet. ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Get storage contract address for a wallet.");
  console.log("=".repeat(70));

  try {
    // Get storage contract address for a wallet
    const result = await sdk.factory.getStorageAddr({
      walletAddress: WALLET_ADDRESS
    });
    console.log(`   ✅ Storage contract address: ${result}`);

  } catch (error) {
    console.error(`   ❌ FAILED to get storage contract address for a wallet: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run example
main()
  .then(() => {
    console.log("\n✅ Test suite completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:");
    console.error(error);
    process.exit(1);
  });
