/**
 * Use the wallet example (get addresses, sign messages)
 * 
 * Run: node examples/useWallet.js

 * Demonstrates how to use a wallet using the SapphireWalletSDK
 * with clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require('ethers');

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";
const PASSWORD = process.env.TEST_PASSWORD || "";

async function main() {
  console.log("=".repeat(70));
  console.log('=== Use Wallet Example ===\n');
  console.log("=".repeat(70));

  // Initialize SDK
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    signerOrProvider: SIGNER_PRIVATE_KEY // Private key for signing transactions
  });

  // Show architecture info
  const keyVaultAddr = await sdk.wallets.getKeyVault({ 
    walletAddress: WALLET_ADDRESS 
  });
  const authAddr = await sdk.wallets.getAuthenticator({ 
    walletAddress: WALLET_ADDRESS 
  });
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVaultAddr}`);
  console.log(`      └── Auth:   ${authAddr}`);

  // Prepare auth proof (raw password bytes)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  try {
    console.log("\n1. Getting account addresses...");
    // console.log('Network:', sdk.network);

    // Get account address
    const result = await sdk.wallets.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: 0
    });

    console.log('✅ Account address retrieved successfully!');
    console.log('Account Address:', result);
    console.log();

  } catch (error) {
    console.error('❌ Error getting account address:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  // ============ AUTHENTICATED FUNCTIONS ============
  console.log("\n" + "=".repeat(60));
  console.log("AUTHENTICATED FUNCTIONS (need password)");
  console.log("=".repeat(60));

  // sign message (EIP-191 personal message)
  try {
    console.log("\n3. Signing a message...");

    const message = 'Hello from Monstera!';
    const bytesMessage = ethers.toUtf8Bytes(message);

    const result = await sdk.wallets.signMessage({
      walletAddress: WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      message: bytesMessage
    });

    console.log('Message:', message);
    console.log('Signature:', result.signature);

    // verify signature 
    const expectedAddr = await sdk.wallets.getAccountAddress({
        walletAddress: WALLET_ADDRESS,
        index: 0
    });
    const recovered = ethers.verifyMessage(message, result.signature);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.error('❌ Error signing message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  // sign a hash
  try {
    console.log("\n4. Signing a raw hash...");

    const hash = ethers.keccak256(ethers.toUtf8Bytes("Some data to hash"));

    const result = await sdk.wallets.sign({
      walletAddress: WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      hash: hash
    });

    console.log('Signature:', result.signature);

    // verify signature 
    const expectedAddr = await sdk.wallets.getAccountAddress({
        walletAddress: WALLET_ADDRESS,
        index: 0
    });
    const recovered = ethers.recoverAddress(hash, result.signature);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.error('❌ Error signing hash:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
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
