/**
 * Create a wallet with PasswordOrWalletSignatureAuthenticator
 *
 * Run: node examples/nodejs/authentication/password-or-wallet-signature/create-wallet.js
 *
 * ── What this demonstrates ────────────────────────────────────────────────
 *
 * PasswordOrWalletSignatureAuthenticator combines password AND wallet-signature
 * auth in a single contract. Either method can authorize KeyVault operations
 * and whitelist administration.
 *
 * This script creates a full wallet stack with:
 *   KeyVault.authenticator = PasswordOrWalletSignatureAuthenticator
 *   config                 = password hash + initial whitelist (one EOA)
 *
 * It then signs a message twice:
 *   1. Using the password (METHOD_PASSWORD)
 *   2. Using a whitelisted wallet signature (METHOD_WALLET_SIGNATURE)
 *
 * ── Required env vars ─────────────────────────────────────────────────────
 *
 *   SIGNER_PRIVATE_KEY=0x...   # deploys the wallet stack
 *   PASSWORD=mysecretpassword123
 *   ALLOWED_1_KEY=0x...        # private key for the initial whitelisted EOA
 *
 * ── Next step ─────────────────────────────────────────────────────────────
 *
 *   node examples/nodejs/authentication/password-or-wallet-signature/whitelist-flow.js
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { Wallet } from '../../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { verifyMessage } from '../../../../src/adapters/ethers/signing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;
const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'info'
});

async function main() {
  console.log('='.repeat(60));
  console.log('PasswordOrWalletSignatureAuthenticator — create wallet');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD || !ALLOWED_1_KEY) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY, PASSWORD, and ALLOWED_1_KEY env vars');
    process.exit(1);
  }

  const addresses = sdk.addresses;
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  const allowed1Signer = new Wallet(ALLOWED_1_KEY, sdk.readProvider);
  const initialWhitelist = [allowed1Signer.address];

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Prepare auth config');
  console.log('='.repeat(60));
  console.log('Authenticator:     ', addresses.passwordOrWalletSigAuth);
  console.log('Password hash:     ', passwordHash.slice(0, 20) + '...');
  console.log('Initial whitelist: ', initialWhitelist.length, 'address(es)');
  console.log('   •', allowed1Signer.address);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Create wallet stack');
  console.log('='.repeat(60));
  console.log('Deploying: WalletStorage + KeyVault + WalletProxy');
  console.log('Vault authenticator → PasswordOrWalletSignatureAuthenticator');

  const result = await sdk.createWallet({
    authenticatorAddr: addresses.passwordOrWalletSigAuth,
    authConfig: {
      passwordHash,
      initialWhitelist
    }
  });

  console.log('Transaction:', result.transactionHash);
  console.log('Wallet:       ', result.wallet);
  console.log('KeyVault:     ', result.keyVault);
  console.log('Authenticator:', result.authenticator);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Verify authenticator setup');
  console.log('='.repeat(60));

  const vaultAuthenticator = await sdk.getAuthenticatorAddr({
    keyVaultAddr: result.keyVault
  });
  const authMatch = vaultAuthenticator.toLowerCase() === addresses.passwordOrWalletSigAuth.toLowerCase();
  console.log('Vault uses PasswordOrWalletSig:', authMatch ? '✅ Yes' : '❌ No');

  const isConfigured = await sdk.isPasswordOrWalletSignatureConfigured({
    keyVaultAddr: result.keyVault
  });
  console.log('Authenticator configured:      ', isConfigured ? '✅ Yes' : '❌ No');

  const whitelist = await sdk.getPasswordOrWalletSignatureWhitelist({
    keyVaultAddr: result.keyVault
  });
  console.log('Whitelist size:                ', whitelist.length);
  for (const addr of whitelist) {
    console.log(`   • ${addr}`);
  }

  const domainSeparator = await sdk.getPasswordOrWalletSignatureDomainSeparator();
  console.log('EIP-712 domain separator:      ', domainSeparator.slice(0, 20) + '...');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Sign with password (METHOD_PASSWORD)');
  console.log('='.repeat(60));

  const messagePassword = 'Hello via password path!';
  const sigPassword = await sdk.signMessage({
    keyVaultAddr: result.keyVault,
    authProof: { password: toUtf8Bytes(PASSWORD) },
    index: 0,
    message: toUtf8Bytes(messagePassword)
  });

  const accountAddr = await sdk.getAccountAddr({
    keyVaultAddr: result.keyVault,
    index: 0
  });
  const recoveredPassword = verifyMessage(messagePassword, sigPassword);
  const passwordMatch = recoveredPassword.toLowerCase() === accountAddr.toLowerCase();
  console.log(`Message: "${messagePassword}"`);
  console.log(`Recovered: ${recoveredPassword}`);
  console.log(passwordMatch ? '✅ Password-path signature valid!' : '❌ Password-path signature invalid!');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Sign with whitelisted wallet (METHOD_WALLET_SIGNATURE)');
  console.log('='.repeat(60));

  const messageWallet = 'Hello via wallet-signature path!';
  const sigWallet = await sdk.signMessage({
    keyVaultAddr: result.keyVault,
    authProof: { signer: allowed1Signer },
    index: 0,
    message: toUtf8Bytes(messageWallet)
  });

  const recoveredWallet = verifyMessage(messageWallet, sigWallet);
  const walletMatch = recoveredWallet.toLowerCase() === accountAddr.toLowerCase();
  console.log(`Message: "${messageWallet}"`);
  console.log(`Recovered: ${recoveredWallet}`);
  console.log(walletMatch ? '✅ Wallet-sig-path signature valid!' : '❌ Wallet-sig-path signature invalid!');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: On-chain proof sanity check');
  console.log('='.repeat(60));

  const isValid = await sdk.isPasswordOrWalletSignatureValid({
    keyVaultAddr: result.keyVault,
    password: toUtf8Bytes(PASSWORD)
  });
  console.log('Verify probe (password path):', isValid ? '✅ Yes' : '❌ No');

  console.log('\n' + '='.repeat(60));
  console.log('WALLET CREATED!');
  console.log('='.repeat(60));
  console.log(`\nMNEMONIC="${result.mnemonic}"`);
  console.log(`WALLET_ADDRESS=${result.wallet}`);
  console.log(`KEYVAULT_ADDRESS=${result.keyVault}`);
  console.log(`STORAGE_ADDRESS=${result.storage}`);
  console.log(`AUTHENTICATOR_ADDRESS=${result.authenticator}`);
  console.log(`PASSWORD="${PASSWORD}"`);
  console.log(`ALLOWED_1_KEY=${ALLOWED_1_KEY}`);

  console.log('\n' + '='.repeat(60));
  console.log('Next: password-or-wallet-signature/whitelist-flow.js');
  console.log('='.repeat(60));
  console.log('Copy WALLET_ADDRESS, KEYVAULT_ADDRESS, PASSWORD, and ALLOWED_1_KEY into .env, then run:');
  console.log('  node examples/nodejs/authentication/password-or-wallet-signature/whitelist-flow.js');
  console.log('\nThat script demonstrates whitelist add/remove and wallet-link approval.');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
