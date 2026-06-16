/**
 * Step 6.2: Get Account Addresses for Funding
 * 
 * Run: node examples/nodejs/accounts/list-accounts.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 * 
 * Shows the first 3 account addresses so you can fund them on Amoy.
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';

// ============ CONFIGURATION ============
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 6.2: Get Account Addresses for Funding");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY and WALLET_ADDRESS env vars");
    process.exit(1);
  }

  // Get wallet info
  const keyVault = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });
  const auth = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVault
  });
  
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVault}`);
  console.log(`      └── Auth:   ${auth}`);

  console.log("\n" + "=".repeat(60));
  console.log("ACCOUNT ADDRESSES (fund these on Amoy)");
  console.log("=".repeat(60));

  for (let i = 0; i < 3; i++) {
    const addr = await sdk.getAccountAddr({
      keyVaultAddr: keyVault,
      index: i
    });
    console.log(`\n   Account ${i}: ${addr}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("FAUCETS");
  console.log("=".repeat(60));
  console.log("   Polygon Amoy: https://faucet.polygon.technology/");
  console.log("   Alchemy Amoy: https://www.alchemy.com/faucets/polygon-amoy");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

