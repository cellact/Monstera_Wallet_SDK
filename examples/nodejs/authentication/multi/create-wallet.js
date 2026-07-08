/**
 * Create a wallet with MultiAuthenticator as the KeyVault authenticator slot
 *
 * Run: node examples/nodejs/authentication/multi/create-wallet.js
 *
 * ── What this demonstrates ────────────────────────────────────────────────
 *
 * Most getting-started examples set the vault authenticator to a single contract
 * (e.g. PasswordAuthenticator). MultiAuthenticator occupies that one slot and
 * routes auth to child contracts configured at creation time.
 *
 * This script creates a full wallet stack with:
 *   KeyVault.authenticator = MultiAuthenticator
 *   initial child            = PasswordAuthenticator (password hash)
 *
 * You can add more children later (e.g. ApiKeySession) via add-authenticator.js.
 *
 * ── Required env vars ─────────────────────────────────────────────────────
 *
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 *
 * ── Next step ─────────────────────────────────────────────────────────────
 *
 *   node examples/nodejs/authentication/multi/add-authenticator.js
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { verifyMessage } from '../../../../src/adapters/ethers/signing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'info'
});

async function main() {
  console.log('='.repeat(60));
  console.log('MultiAuthenticator — create wallet');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY and PASSWORD env vars');
    process.exit(1);
  }

  const addresses = sdk.addresses;
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Prepare multi auth config');
  console.log('='.repeat(60));
  console.log('MultiAuthenticator:', addresses.multiAuthenticator);
  console.log('Initial child:     ', addresses.passwordAuth, '(PasswordAuthenticator)');
  console.log('Password hash:     ', passwordHash.slice(0, 20) + '...');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Create wallet stack');
  console.log('='.repeat(60));
  console.log('Deploying: WalletStorage + KeyVault + WalletProxy');
  console.log('Vault authenticator slot → MultiAuthenticator');
  console.log('MultiAuthenticator.configure → enables PasswordAuthenticator child');

  const result = await sdk.createWallet({
    authenticatorAddr: addresses.multiAuthenticator,
    authConfig: {
      children: [{
        authenticatorAddr: addresses.passwordAuth,
        authConfig: { passwordHash }
      }]
    }
  });

  console.log('Transaction:', result.transactionHash);
  console.log('Wallet:       ', result.wallet);
  console.log('KeyVault:     ', result.keyVault);
  console.log('Authenticator:', result.authenticator);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Verify MultiAuthenticator setup');
  console.log('='.repeat(60));

  const vaultAuthenticator = await sdk.getAuthenticatorAddr({
    keyVaultAddr: result.keyVault
  });
  const multiMatch = vaultAuthenticator.toLowerCase() === addresses.multiAuthenticator.toLowerCase();
  console.log('Vault authenticator is Multi:', multiMatch ? '✅ Yes' : '❌ No');

  const isMultiConfigured = await sdk.isMultiAuthenticatorConfigured({
    keyVaultAddr: result.keyVault
  });
  console.log('Multi configured:            ', isMultiConfigured ? '✅ Yes' : '❌ No');

  const children = await sdk.getMultiAuthenticators({ keyVaultAddr: result.keyVault });
  console.log('Enabled children:            ', children.length);
  for (const child of children) {
    console.log(`   • ${child}`);
  }

  const passwordChildEnabled = await sdk.isMultiAuthenticatorChildEnabled({
    keyVaultAddr: result.keyVault,
    child: addresses.passwordAuth
  });
  console.log('Password child enabled:      ', passwordChildEnabled ? '✅ Yes' : '❌ No');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Sign with password via MultiAuthenticator router');
  console.log('='.repeat(60));

  const message = 'Hello from multi-auth wallet!';
  const signature = await sdk.signMessage({
    keyVaultAddr: result.keyVault,
    authProof: {
      childFlowId: 'password',
      password: toUtf8Bytes(PASSWORD)
    },
    index: 0,
    message: toUtf8Bytes(message)
  });

  const expectedAddr = await sdk.getAccountAddr({
    keyVaultAddr: result.keyVault,
    index: 0
  });
  const recovered = verifyMessage(message, signature);
  const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
  console.log(`Message: "${message}"`);
  console.log(`Recovered: ${recovered}`);
  console.log(match ? '✅ Signature valid!' : '❌ Signature invalid!');

  console.log('\n' + '='.repeat(60));
  console.log('WALLET CREATED!');
  console.log('='.repeat(60));
  console.log(`\nMNEMONIC="${result.mnemonic}"`);
  console.log(`WALLET_ADDRESS=${result.wallet}`);
  console.log(`KEYVAULT_ADDRESS=${result.keyVault}`);
  console.log(`STORAGE_ADDRESS=${result.storage}`);
  console.log(`AUTHENTICATOR_ADDRESS=${result.authenticator}`);
  console.log(`PASSWORD="${PASSWORD}"`);

  console.log('\n' + '='.repeat(60));
  console.log('Next: authentication/multi/add-authenticator.js');
  console.log('='.repeat(60));
  console.log('Copy WALLET_ADDRESS, KEYVAULT_ADDRESS, and PASSWORD into .env, then run:');
  console.log('  node examples/nodejs/authentication/multi/add-authenticator.js');
  console.log('\nThat script adds ApiKeySessionAuthenticator as a second child.');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
