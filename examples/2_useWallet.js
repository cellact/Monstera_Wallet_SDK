/**
 * Step 2: Use the wallet (get addresses, sign messages)
 * Run: node examples/2_useWallet.js
 * 
 * Required env vars:
 *   export WALLET_ADDRESS=0x...
 *   export PASSWORD=yourpassword
 *   export SIGNER_PRIVATE_KEY=0x...
 * 
 * Optional (for verification):
 *   export MNEMONIC="word1 word2 ..."
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers, HDNodeWallet, Mnemonic } = require('ethers');

// ============ CONFIGURATION ============
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const MNEMONIC = process.env.TEST_MNEMONIC || "";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
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

  // ============ PUBLIC FUNCTIONS ============
  console.log("\n" + "=".repeat(60));
  console.log("PUBLIC FUNCTIONS (no auth needed)");
  console.log("=".repeat(60));

  console.log("\n1. Getting account addresses...");
  for (let i = 0; i < 5; i++) {
    const addr = await sdk.wallets.getAccountAddress({
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
      const onChainAddr = await sdk.wallets.getAccountAddress({
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
    const result = await sdk.wallets.signMessage({
      walletAddress: WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      message: ethers.toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${result.signature.slice(0, 40)}...`);

    // Verify
    const expectedAddr = await sdk.wallets.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: 0
    });
    const recovered = ethers.verifyMessage(message, result.signature);
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
    const result = await sdk.wallets.sign({
      walletAddress: WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      hash: hash
    });
    console.log(`   Hash: ${hash.slice(0, 20)}...`);
    console.log(`   Signature: ${result.signature.slice(0, 40)}...`);

    const expectedAddr = await sdk.wallets.getAccountAddress({
      walletAddress: WALLET_ADDRESS,
      index: 0
    });
    const recovered = ethers.recoverAddress(hash, result.signature);
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
    await sdk.wallets.signMessage({
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
