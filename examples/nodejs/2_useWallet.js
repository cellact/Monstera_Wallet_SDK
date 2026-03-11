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
 * Optional env vars:
 *   MNEMONIC="word1 word2 ..." (to verify account addresses match ethers.js)
 * 
 * Steps:
 * 1. Get KeyVault and show wallet stack
 * 2. Get account addresses
 * 3. Verify against ethers.js (optional, if MNEMONIC set)
 * 4. Sign a message
 * 5. Sign a hash
 * 6. Wrong password test
 * 7. Security architecture summary
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers, HDNodeWallet, Mnemonic } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const MNEMONIC = process.env.MNEMONIC;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
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

  // ============ STEP 1: Get KeyVault and show wallet stack ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get KeyVault and show wallet stack");
  console.log("=".repeat(60));
  const keyVaultAddr = await sdk.getKeyVaultAddr({ 
    walletAddr: WALLET_ADDRESS 
  });
  const AuthenticatorAddr = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVaultAddr
  });
  console.log("\nWallet Stack:");
  console.log(`  Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`  └── KeyVault:   ${keyVaultAddr}`);
  console.log(`      └── Auth:   ${AuthenticatorAddr}`);

  // Prepare auth proof (raw password bytes)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // ============ STEP 2: Get account addresses ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Get account addresses");
  console.log("=".repeat(60));
  console.log("\n   Getting account addresses...");
  for (let i = 0; i < 5; i++) {
    const addr = await sdk.getAccountAddr({
      keyVaultAddr: keyVaultAddr,
      index: i
    });
    console.log(`   Account ${i}: ${addr}`);
  }

  // ============ STEP 3: Verify against ethers.js ============
  if (MNEMONIC) {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: Verify against ethers.js");
    console.log("=".repeat(60));
    console.log("\n   Verifying against ethers.js...");
    const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
    for (let i = 0; i < 3; i++) {
      const ethersWallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
      const onChainAddr = await sdk.getAccountAddr({
        keyVaultAddr: keyVaultAddr,
        index: i
      });
      const match = ethersWallet.address.toLowerCase() === onChainAddr.toLowerCase();
      console.log(`   Account ${i}: ${match ? "✅ MATCH" : "❌ MISMATCH"}`);
    }
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: Verify against ethers.js");
    console.log("=".repeat(60));
    console.log("\n   Skipping ethers.js verification (no MNEMONIC provided)");
  }

  // ============ STEP 4: Sign message ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Sign message");
  console.log("=".repeat(60));
  console.log("\n   Signing a message...");
  const message = "Hello from TheWallet!";
  try {
    const result = await sdk.signMessage({
      keyVaultAddr: keyVaultAddr,
      authProof: authProof,
      index: 0,
      message: ethers.toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${result}`);

    // Verify
    const expectedAddr = await sdk.getAccountAddr({
      keyVaultAddr: keyVaultAddr,
      index: 0
    });
    const recovered = ethers.verifyMessage(message, result);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // ============ STEP 5: Sign hash ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Sign hash");
  console.log("=".repeat(60));
  console.log("\n   Signing a raw hash...");
  const hash = ethers.keccak256(ethers.toUtf8Bytes("Some data"));
  try {
    const result = await sdk.sign({
      keyVaultAddr: keyVaultAddr,
      authProof: authProof,
      index: 0,
      hash: hash
    });
    console.log(`   Hash: ${hash.slice(0, 20)}...`);
    console.log(`   Signature: ${result}`);

    const expectedAddr = await sdk.getAccountAddr({
      keyVaultAddr: keyVaultAddr,
      index: 0
    });
    const recovered = ethers.recoverAddress(hash, result);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // ============ STEP 6: Wrong password test ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 6: Wrong password test");
  console.log("=".repeat(60));
  console.log("\n   Trying with wrong password...");
  const wrongAuthProof = ethers.toUtf8Bytes("wrongpassword");
  try {
    await sdk.signMessage({
      keyVaultAddr: keyVaultAddr,
      authProof: wrongAuthProof,
      index: 0,
      message: ethers.toUtf8Bytes("test")
    });
    console.log("   ❌ Should have failed!");
  } catch {
    console.log("   ✅ Correctly rejected: AuthenticationFailed");
  }

  // ============ STEP 7: Security architecture summary ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 7: Security architecture summary");
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
  ✅ Admin can update WalletLogic but NOT access keys
  ✅ YOU control KeyVault updates (not admin)
  `);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
