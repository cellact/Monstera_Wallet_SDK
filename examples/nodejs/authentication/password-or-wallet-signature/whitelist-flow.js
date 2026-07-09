/**
 * Whitelist management for PasswordOrWalletSignatureAuthenticator
 *
 * Run: node examples/nodejs/authentication/password-or-wallet-signature/whitelist-flow.js
 *
 * ── What this demonstrates ────────────────────────────────────────────────
 *
 * PasswordOrWalletSignatureAuthenticator supports whitelist administration
 * with either password OR wallet-signature proofs. It also supports linking a
 * new wallet via addToWhitelistWithProof (LinkWallet EIP-712 signature).
 *
 * This script:
 *   1. Adds an address to the whitelist using the password path
 *   2. Signs with the newly added wallet
 *   3. Links another wallet via addToPasswordOrWalletSignatureWhitelistWithProof
 *   4. Removes an address using a whitelisted wallet signature
 *
 * ── Prerequisite ──────────────────────────────────────────────────────────
 *
 * Create a compatible wallet first:
 *   node examples/nodejs/authentication/password-or-wallet-signature/create-wallet.js
 *
 * ── Required env vars ─────────────────────────────────────────────────────
 *
 *   SIGNER_PRIVATE_KEY=0x...
 *   WALLET_ADDRESS=0x...        # from create-wallet.js
 *   PASSWORD=mysecretpassword123
 *   ALLOWED_1_KEY=0x...         # initial whitelisted signer
 *
 * ── Optional env vars ─────────────────────────────────────────────────────
 *
 *   KEYVAULT_ADDRESS=0x...      # skip wallet lookup when set
 *   ALLOWED_2_KEY=0x...         # second whitelisted signer; generated if omitted
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { Wallet } from '../../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { verifyMessage } from '../../../../src/adapters/ethers/signing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const KEYVAULT_ADDRESS = process.env.KEYVAULT_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY;
const ALLOWED_2_KEY = process.env.ALLOWED_2_KEY;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'info'
});

async function main() {
  console.log('='.repeat(60));
  console.log('PasswordOrWalletSignatureAuthenticator — whitelist flow');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD || !ALLOWED_1_KEY || (!WALLET_ADDRESS && !KEYVAULT_ADDRESS)) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY, PASSWORD, ALLOWED_1_KEY, and WALLET_ADDRESS (or KEYVAULT_ADDRESS)');
    process.exit(1);
  }

  const addresses = sdk.addresses;
  const allowed1Signer = new Wallet(ALLOWED_1_KEY, sdk.readProvider);
  const allowed2Signer = ALLOWED_2_KEY
    ? new Wallet(ALLOWED_2_KEY, sdk.readProvider)
    : Wallet.createRandom().connect(sdk.readProvider);
  const linkTargetSigner = Wallet.createRandom().connect(sdk.readProvider);

  console.log('\n📋 Accounts:');
  console.log(`   Admin (allowed #1): ${allowed1Signer.address}`);
  console.log(`   Allowed #2:         ${allowed2Signer.address}`);
  console.log(`   Link target:        ${linkTargetSigner.address}`);

  // ============ STEP 1: Resolve KeyVault and verify authenticator ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Resolve KeyVault and verify authenticator type');
  console.log('='.repeat(60));

  const keyVaultAddr = KEYVAULT_ADDRESS
    ?? await sdk.getKeyVaultAddr({ walletAddr: WALLET_ADDRESS });
  console.log('KeyVault:', keyVaultAddr);

  const vaultAuthenticator = await sdk.getAuthenticatorAddr({ keyVaultAddr });
  console.log('Vault authenticator:', vaultAuthenticator);
  console.log('Expected:             ', addresses.passwordOrWalletSigAuth);

  if (vaultAuthenticator.toLowerCase() !== addresses.passwordOrWalletSigAuth.toLowerCase()) {
    console.error('\n❌ This KeyVault does not use PasswordOrWalletSignatureAuthenticator.');
    console.error('   Create a wallet with password-or-wallet-signature/create-wallet.js first.');
    process.exit(1);
  }

  const isConfigured = await sdk.isPasswordOrWalletSignatureConfigured({ keyVaultAddr });
  console.log('Configured:', isConfigured ? '✅ Yes' : '❌ No');
  if (!isConfigured) {
    process.exit(1);
  }

  let whitelist = await sdk.getPasswordOrWalletSignatureWhitelist({ keyVaultAddr });
  console.log('Current whitelist:', whitelist.length, 'address(es)');
  for (const addr of whitelist) {
    console.log(`   • ${addr}`);
  }

  // ============ STEP 2: Add allowed #2 via password path ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Add address via password auth');
  console.log('='.repeat(60));

  const alreadyWhitelisted2 = await sdk.isPasswordOrWalletSignatureWhitelisted({
    keyVaultAddr,
    addressToCheck: allowed2Signer.address
  });

  if (alreadyWhitelisted2) {
    console.log(`   ✅ ${allowed2Signer.address} is already whitelisted — skipping add`);
  } else {
    const addResult = await sdk.addToPasswordOrWalletSignatureWhitelist({
      keyVaultAddr,
      password: toUtf8Bytes(PASSWORD),
      addressToAdd: allowed2Signer.address
    });
    console.log('   Transaction:', addResult.transactionHash);
    console.log('   Added:      ', addResult.added);
    console.log('   Gas used:   ', addResult.gasUsed);
  }

  // ============ STEP 3: Sign with newly added wallet ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Sign with newly whitelisted wallet');
  console.log('='.repeat(60));

  const message = 'Signed by allowed #2 via wallet-signature path!';
  const signature = await sdk.signMessage({
    keyVaultAddr,
    authProof: { signer: allowed2Signer },
    index: 0,
    message: toUtf8Bytes(message)
  });

  const expectedAddr = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
  const recovered = verifyMessage(message, signature);
  const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
  console.log(`   Message: "${message}"`);
  console.log(`   Recovered: ${recovered}`);
  console.log(`   ${match ? '✅ Signature valid!' : '❌ Signature invalid!'}`);

  // ============ STEP 4: Link a new wallet via LinkWallet proof ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Link a new wallet (addToWhitelistWithProof)');
  console.log('='.repeat(60));

  const linkAlreadyWhitelisted = await sdk.isPasswordOrWalletSignatureWhitelisted({
    keyVaultAddr,
    addressToCheck: linkTargetSigner.address
  });

  if (linkAlreadyWhitelisted) {
    console.log(`   ✅ ${linkTargetSigner.address} is already whitelisted — skipping link`);
  } else {
    const linkActionHash = await sdk.computePasswordOrWalletSignatureLinkActionHash({
      keyVaultAddr,
      addressToAdd: linkTargetSigner.address
    });
    console.log('   Link action hash:', linkActionHash.slice(0, 20) + '...');

    const linkResult = await sdk.addToPasswordOrWalletSignatureWhitelistWithProof({
      keyVaultAddr,
      password: toUtf8Bytes(PASSWORD),
      addressToAdd: linkTargetSigner.address,
      linkSigner: linkTargetSigner
    });
    console.log('   Transaction:  ', linkResult.transactionHash);
    console.log('   Linked wallet:', linkResult.linkedWallet);
    console.log('   Nonce:        ', linkResult.nonce);
    console.log('   Gas used:     ', linkResult.gasUsed);

    const nonceUsed = await sdk.isPasswordOrWalletSignatureLinkNonceUsed({
      keyVaultAddr,
      nonce: linkResult.nonce
    });
    console.log('   Nonce consumed:', nonceUsed ? '✅ Yes' : '❌ No');
  }

  // ============ STEP 5: Remove allowed #2 via wallet-signature path ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Remove address via wallet-signature auth');
  console.log('='.repeat(60));

  const stillWhitelisted2 = await sdk.isPasswordOrWalletSignatureWhitelisted({
    keyVaultAddr,
    addressToCheck: allowed2Signer.address
  });

  if (!stillWhitelisted2) {
    console.log(`   ${allowed2Signer.address} is not whitelisted — skipping remove`);
  } else {
    const removeResult = await sdk.removeFromPasswordOrWalletSignatureWhitelist({
      keyVaultAddr,
      signer: allowed1Signer,
      addressToRemove: allowed2Signer.address
    });
    console.log('   Transaction:', removeResult.transactionHash);
    console.log('   Removed:    ', removeResult.removed);
    console.log('   Gas used:   ', removeResult.gasUsed);

    const removedCheck = await sdk.isPasswordOrWalletSignatureWhitelisted({
      keyVaultAddr,
      addressToCheck: allowed2Signer.address
    });
    console.log('   Still whitelisted:', removedCheck ? '❌ Yes (unexpected)' : '✅ No');
  }

  // ============ SUMMARY ============
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`   KeyVault: ${keyVaultAddr}`);

  whitelist = await sdk.getPasswordOrWalletSignatureWhitelist({ keyVaultAddr });
  console.log(`   Final whitelist (${whitelist.length}):`);
  for (const addr of whitelist) {
    console.log(`      • ${addr}`);
  }

  if (!ALLOWED_2_KEY) {
    console.log(`\n   Generated ALLOWED_2_KEY for this run (save if you need it later):`);
    console.log(`   ALLOWED_2_KEY=${allowed2Signer.privateKey}`);
  }

  console.log(`\n   Link target private key (now whitelisted via LinkWallet):`);
  console.log(`   LINK_TARGET_KEY=${linkTargetSigner.privateKey}`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
