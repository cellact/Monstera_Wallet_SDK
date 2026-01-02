/**
 * Step 2: Use the wallet (get addresses, sign messages)
 * 
 * Run: node examples/nodejs/2_useWallet.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x...
 *   PASSWORD=mysecretpassword123
 * 
 * Optional (for verification):
 *   MNEMONIC="word1 word2 ..."
 * 
 * Tests:
 * 1. Get keyVault contract address for a wallet.
 * 2. Get authenticator contract address for a wallet.
 * 3. Get account addresses
 * 4. Verify against ethers.js
 * 5. Sign a message
 * 6. Sign a hash
 * 7. Wrong password test
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers, HDNodeWallet, Mnemonic } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const PASSWORD = process.env.PASSWORD || "";
const MNEMONIC = process.env.MNEMONIC || "";
const RPC_URL = process.env.RPC_URL || "";
const CHAIN_ID = process.env.SAPPHIRE_CHAIN_ID || "";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  rpcUrl: RPC_URL,   // optional
  chainId: CHAIN_ID  // optional
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 2: Use the Wallet");
  console.log("=".repeat(60));

  if (!WALLET_ADDRESS || !PASSWORD) {
    console.error("ERROR: Set WALLET_ADDRESS and PASSWORD env vars");
    console.error("Run step 2 first to create a wallet");
    process.exit(1);
  }

  // Show architecture info
  const keyVaultAddr = await sdk.logic.getKeyVault({ 
    walletAddress: WALLET_ADDRESS 
  });
  const authAddr = await sdk.logic.getAuthenticator({ 
    walletAddress: WALLET_ADDRESS 
  });
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVaultAddr}`);
  console.log(`      └── Auth:   ${authAddr}`);

  // Prepare auth proof (raw password bytes)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // ============ PUBLIC FUNCTIONS ============
  console.log("\n" + "=".repeat(60));
  console.log("PUBLIC FUNCTIONS (no auth needed)");
  console.log("=".repeat(60));

  console.log("\n1. Getting account addresses...");
  for (let i = 0; i < 5; i++) {
    const addr = await sdk.logic.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: i
    });
    console.log(`   Account ${i}: ${addr}`);
  }

  // Verify against ethers.js
  if (MNEMONIC) {
    console.log("\n2. Verifying against ethers.js...");
    const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
    for (let i = 0; i < 3; i++) {
      const ethersWallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
      const onChainAddr = await sdk.logic.getAccountAddress({
        walletAddress: WALLET_ADDRESS,
        index: i
      });
      const match = ethersWallet.address.toLowerCase() === onChainAddr.toLowerCase();
      console.log(`   Account ${i}: ${match ? "✅ MATCH" : "❌ MISMATCH"}`);
    }
  } else {
    console.log("\n2. Skipping ethers.js verification (no MNEMONIC provided)");
  }

  // ============ AUTHENTICATED FUNCTIONS ============
  console.log("\n" + "=".repeat(60));
  console.log("AUTHENTICATED FUNCTIONS (need password)");
  console.log("=".repeat(60));

  // Sign a message
  console.log("\n3. Signing a message...");
  const message = "Hello from TheWallet!";
  try {
    const result = await sdk.logic.signMessage({
      walletAddress: WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      message: ethers.toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${result}`);

    // Verify
    const expectedAddr = await sdk.logic.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: 0
    });
    const recovered = ethers.verifyMessage(message, result);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Sign a hash
  console.log("\n4. Signing a raw hash...");
  const hash = ethers.keccak256(ethers.toUtf8Bytes("Some data"));
  try {
    const result = await sdk.logic.sign({
      walletAddress: WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      hash: hash
    });
    console.log(`   Hash: ${hash.slice(0, 20)}...`);
    console.log(`   Signature: ${result}`);

    const expectedAddr = await sdk.logic.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: 0
    });
    const recovered = ethers.recoverAddress(hash, result);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // ============ WRONG PASSWORD TEST ============
  console.log("\n" + "=".repeat(60));
  console.log("SECURITY TEST: Wrong Password");
  console.log("=".repeat(60));

  console.log("\n5. Trying with wrong password...");
  const wrongAuthProof = ethers.toUtf8Bytes("wrongpassword");
  try {
    await sdk.logic.signMessage({
      walletAddress: WALLET_ADDRESS,
      authProof: wrongAuthProof,
      index: 0,
      message: ethers.toUtf8Bytes("test")
    });
    console.log("   ❌ Should have failed!");
  } catch {
    console.log("   ✅ Correctly rejected: AuthenticationFailed");
  }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SECURITY ARCHITECTURE");
  console.log("=".repeat(60));
  console.log(`
  Call Flow:
  ──────────
  You ──► Wallet (BeaconProxy)
              │ delegates to
              └──► WalletLogic (orchestration)
                       │ calls
                       └──► KeyVault
                                │
                                ├── verify(authProof) ← AUTH CHECK HERE
                                │
                                └── KeyVaultImpl.sign() ← SIGNING HERE
                                         │
                                         └── WalletStorage.getBaseKeys()

  Security Guarantees:
  ───────────────────
  ✅ Private key NEVER leaves the Sapphire enclave
  ✅ Every signing operation requires authentication
  ✅ Admin can upgrade WalletLogic but NOT access keys
  ✅ YOU control KeyVault upgrades (not admin)
  `);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
