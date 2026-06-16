/**
 * Step 4: Get an account address from the wallet
 * 
 * Run: node examples/nodejs/4_getAddress.js
 * 
 * Required env vars:
 *   WALLET_ADDRESS=0x... (wallet proxy address)
 *   SIGNER_PRIVATE_KEY=0x... (for SDK)
 * 
 * Optional: INDEX=0 (account index, defaults to 0)
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';

// ============ CONFIGURATION ============
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const INDEX = Number.parseInt(process.env.INDEX || '0', 10);
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 4: Get Account Address");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS || !SIGNER_PRIVATE_KEY) {
    console.error("ERROR: Set WALLET_ADDRESS and SIGNER_PRIVATE_KEY env vars");
    process.exit(1);
  }

  if (!Number.isInteger(INDEX) || INDEX < 0) {
    console.error("ERROR: INDEX must be a non-negative integer");
    process.exit(1);
  }
  
  // Get KeyVault info
  const keyVault = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });
  const authenticator = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVault
  });
  
  // Get account address
  const addr = await sdk.getAccountAddr({
    keyVaultAddr: keyVault,
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
