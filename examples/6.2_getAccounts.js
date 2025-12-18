/**
 * Step 6.2: Get Account Addresses for Funding
 * 
 * Run: node examples/6.2_getAccounts.js
 * 
 * Shows the first 3 account addresses so you can fund them on Amoy.
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   TEST_WALLET_ADDRESS=0x... (your wallet address)
 * 
 */
require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');

// ============ CONFIGURATION ============
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step 6.2: Get Account Addresses for Funding");
  console.log("=".repeat(70));

  if (!WALLET_ADDRESS) {
    console.error("ERROR: Set WALLET_ADDRESS env var");
    process.exit(1);
  }

  // Get wallet info
  const keyVault = await sdk.wallets.getKeyVault({
    walletAddress: WALLET_ADDRESS
  });
  const auth = await sdk.wallets.getAuthenticator({
    walletAddress: WALLET_ADDRESS
  });
  
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVault}`);
  console.log(`      └── Auth:   ${auth}`);

  console.log("\n" + "=".repeat(70));
  console.log("ACCOUNT ADDRESSES (fund these on Amoy)");
  console.log("=".repeat(70));

  for (let i = 0; i < 3; i++) {
    const addr = await sdk.wallets.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: i
    });
    console.log(`\n   Account ${i}: ${addr}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("FAUCETS");
  console.log("=".repeat(70));
  console.log("   Polygon Amoy: https://faucet.polygon.technology/");
  console.log("   Alchemy Amoy: https://www.alchemy.com/faucets/polygon-amoy");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

