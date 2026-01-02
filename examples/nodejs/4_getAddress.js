/**
 * Step 4: Get an account address from the wallet
 * 
 * Run: node examples/nodejs/4_getAddress.js
 * 
 * Env vars:
 *   WALLET_ADDRESS=0x... (required)
 *   INDEX=0 (optional, defaults to 0)
 *   SIGNER_PRIVATE_KEY=0x... (required)
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const INDEX = parseInt(process.env.INDEX || "0");
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 4: Get Account Address");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS) {
    console.error("ERROR: Set WALLET_ADDRESS env var");
    process.exit(1);
  }
  
  // Get KeyVault info
  const keyVault = await sdk.logic.getKeyVault({
    walletAddress: WALLET_ADDRESS
  });
  const authenticator = await sdk.logic.getAuthenticator({
    walletAddress: WALLET_ADDRESS
  });
  
  // Get account address
  const addr = await sdk.logic.getAccountAddress({
    walletAddress: WALLET_ADDRESS,
    index: INDEX
  });
  
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVault}`);
  console.log(`      └── Auth:   ${authenticator}`);
  
  console.log("\n" + "=".repeat(60));
  console.log(`Account Index: ${INDEX}`);
  console.log(`Address: ${addr}`);
  console.log("=".repeat(60));
  console.log("\n👆 Send testnet tokens to this address!");
  console.log("   Amoy faucet: https://faucet.polygon.technology/");
  console.log("   Sepolia faucet: https://sepoliafaucet.com/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
