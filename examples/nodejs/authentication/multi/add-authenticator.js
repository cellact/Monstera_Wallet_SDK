/**
 * Add ApiKeySessionAuthenticator to a MultiAuthenticator wallet
 *
 * Run: node examples/nodejs/authentication/multi/add-authenticator.js
 *
 * ── What this demonstrates ────────────────────────────────────────────────
 *
 * MultiAuthenticator is a router: the KeyVault holds ONE authenticator address
 * (MultiAuthenticator), which forwards verify/configure to child contracts.
 *
 * addAuthenticator() lets an EXISTING child authorize enabling a NEW child.
 * Typical flow: wallet starts with password-only sign-in, then you add API key
 * access for machine / backend use — authorized by signing in with the password.
 *
 * ── Important prerequisite ────────────────────────────────────────────────
 *
 * This script only works when the KeyVault's authenticator is MultiAuthenticator.
 *
 * Wallets from getting-started/password-only/01-create-wallet.js use
 * PasswordAuthenticator directly and CANNOT call addMultiAuthenticator.
 *
 * Create a compatible wallet first — run:
 *   node examples/nodejs/authentication/multi/create-wallet.js
 * and copy the printed env vars into .env.
 *
 *   SIGNER_PRIVATE_KEY=0x...
 *   WALLET_ADDRESS=0x...        # from multi/create-wallet.js
 *   PASSWORD=mysecretpassword123
 *
 * ── Optional env vars ─────────────────────────────────────────────────────
 *
 *   API_KEY=0x<64-hex-chars>   # raw 32-byte API key; generated if omitted
 *   KEYVAULT_ADDRESS=0x...     # skip wallet lookup when set
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { Monstera } from '../../../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { verifyMessage } from '../../../../src/adapters/ethers/signing.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const KEYVAULT_ADDRESS = process.env.KEYVAULT_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const API_KEY = process.env.API_KEY ?? `0x${randomBytes(32).toString('hex')}`;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'info'
});

/** Map deployed child address → SDK flow id for proof building. */
function resolveChildFlowId(childAddr, addresses) {
  const entries = [
    ['password', addresses.passwordAuth],
    ['minuteSignature', addresses.passwordMinuteSignatureAuth],
    ['apiKeySession', addresses.apiKeySessionAuth],
    ['walletSignature', addresses.walletSignatureAuth],
    ['dualFactor', addresses.dualFactorAuth]
  ];
  const match = entries.find(([, addr]) => addr.toLowerCase() === childAddr.toLowerCase());
  return match?.[0] ?? null;
}

/** Pick an enabled child to authorize the add (not the child being added). */
function pickAuthorizingChild(enabledChildren, newChildAddr, addresses) {
  const candidate = enabledChildren.find(
    (addr) => addr.toLowerCase() !== newChildAddr.toLowerCase()
  );
  if (!candidate) {
    return null;
  }
  return {
    childAddr: candidate,
    flowId: resolveChildFlowId(candidate, addresses)
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('MultiAuthenticator — add ApiKeySession child');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD || (!WALLET_ADDRESS && !KEYVAULT_ADDRESS)) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY, PASSWORD, and WALLET_ADDRESS (or KEYVAULT_ADDRESS)');
    process.exit(1);
  }

  const addresses = sdk.addresses;
  const apiKeySessionAddr = addresses.apiKeySessionAuth;
  const multiAddr = addresses.multiAuthenticator;
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  const apiKeySecret = keccak256(API_KEY);

  // ============ STEP 1: Resolve KeyVault and check authenticator type ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Resolve KeyVault and verify MultiAuthenticator');
  console.log('='.repeat(60));

  const keyVaultAddr = KEYVAULT_ADDRESS
    ?? await sdk.getKeyVaultAddr({ walletAddr: WALLET_ADDRESS });
  console.log('KeyVault:', keyVaultAddr);

  const vaultAuthenticator = await sdk.getAuthenticatorAddr({ keyVaultAddr });
  console.log('Vault authenticator:', vaultAuthenticator);
  console.log('MultiAuthenticator:  ', multiAddr);

  if (vaultAuthenticator.toLowerCase() !== multiAddr.toLowerCase()) {
    console.error('\n❌ This KeyVault does not use MultiAuthenticator.');
    console.error('   addMultiAuthenticator only works on multi-auth wallets.');
    console.error('\n   If you used password-only/01-create-wallet.js, the vault uses');
    console.error('   PasswordAuthenticator directly. Create a new wallet with:');
    console.error(`
   authenticatorAddr: sdk.addresses.multiAuthenticator,
   authConfig: {
     children: [{
       authenticatorAddr: sdk.addresses.passwordAuth,
       authConfig: { passwordHash }
     }]
   }
`);
    process.exit(1);
  }

  const isMultiConfigured = await sdk.isMultiAuthenticatorConfigured({ keyVaultAddr });
  console.log('Multi configured:', isMultiConfigured ? '✅ Yes' : '❌ No');
  if (!isMultiConfigured) {
    console.error('❌ MultiAuthenticator is not configured for this wallet.');
    process.exit(1);
  }

  // ============ STEP 2: Inspect current children ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: List enabled child authenticators');
  console.log('='.repeat(60));

  const enabledChildren = await sdk.getMultiAuthenticators({ keyVaultAddr });
  console.log('Enabled children:', enabledChildren.length ? enabledChildren : '(none)');

  for (const child of enabledChildren) {
    const flowId = resolveChildFlowId(child, addresses);
    console.log(`   • ${child}  (${flowId ?? 'unknown'})`);
  }

  const apiKeyAlreadyEnabled = await sdk.isMultiAuthenticatorChildEnabled({
    keyVaultAddr,
    child: apiKeySessionAddr
  });
  if (apiKeyAlreadyEnabled) {
    console.log('\n✅ ApiKeySession child is already enabled. Skipping add.');
  }

  // ============ STEP 3: Add ApiKeySession child (password authorizes) ============
  if (!apiKeyAlreadyEnabled) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Add ApiKeySession child (authorized by existing child)');
    console.log('='.repeat(60));

    const authorizer = pickAuthorizingChild(enabledChildren, apiKeySessionAddr, addresses);
    if (!authorizer?.flowId) {
      console.error('❌ No suitable enabled child found to authorize this change.');
      process.exit(1);
    }

    console.log(`Authorizing via: ${authorizer.childAddr} (${authorizer.flowId})`);
    console.log('New child:       ', apiKeySessionAddr);
    console.log('API key secret:  ', apiKeySecret.slice(0, 20) + '...');

    const addOptions = {
      keyVaultAddr,
      viaChildFlowId: authorizer.flowId,
      child: apiKeySessionAddr,
      childAuthConfig: { apiKeySecret }
    };

    // Supply credentials for the authorizing child's proof.
    if (authorizer.flowId === 'password') {
      addOptions.password = toUtf8Bytes(PASSWORD);
    } else if (authorizer.flowId === 'minuteSignature') {
      addOptions.passwordHash = passwordHash;
    } else {
      console.error(`❌ This example does not yet demonstrate authorizing via "${authorizer.flowId}".`);
      console.error('   Use a wallet whose first child is passwordAuth or passwordMinuteSignatureAuth.');
      process.exit(1);
    }

    const result = await sdk.addMultiAuthenticator(addOptions);
    console.log('   Transaction:', result.transactionHash);
    console.log('   Wallet:      ', result.wallet);
    console.log('   Child added: ', result.child);
    console.log('   Gas used:    ', result.gasUsed);
  }

  // ============ STEP 4: Verify API key child is enabled ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Verify ApiKeySession child is enabled');
  console.log('='.repeat(60));

  const enabledAfter = await sdk.getMultiAuthenticators({ keyVaultAddr });
  console.log('Enabled children now:', enabledAfter.length);
  for (const child of enabledAfter) {
    console.log(`   • ${child}  (${resolveChildFlowId(child, addresses) ?? 'unknown'})`);
  }

  const apiKeyEnabled = await sdk.isMultiAuthenticatorChildEnabled({
    keyVaultAddr,
    child: apiKeySessionAddr
  });
  console.log('ApiKeySession enabled:', apiKeyEnabled ? '✅ Yes' : '❌ No');
  if (!apiKeyEnabled) {
    process.exit(1);
  }

  // ============ STEP 5: Sign with API key via multi router ============
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Sign a message using ApiKeySession through MultiAuthenticator');
  console.log('='.repeat(60));

  const message = 'Hello from multi-auth + API key!';
  const signature = await sdk.signMessage({
    keyVaultAddr,
    authProof: {
      childFlowId: 'apiKeySession',
      apiKeySecret
    },
    index: 0,
    message: toUtf8Bytes(message)
  });
  console.log(`   Message: "${message}"`);
  console.log(`   Signature: ${signature}`);

  const expectedAddr = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
  const recovered = verifyMessage(message, signature);
  const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
  console.log(`   Recovered: ${recovered}`);
  console.log(`   ${match ? '✅ Signature valid!' : '❌ Signature invalid!'}`);

  // ============ SUMMARY ============
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Added ApiKeySession child — save API_KEY for backend sign-in:`);
  console.log(`   API_KEY="${API_KEY}"`);
  console.log('\n   Backend connect (no password needed for signing):');
  console.log(`
const apiSdk = Monstera.connect({
  mainnet: false,
  credentials: { apiKey: '${API_KEY}' }
});
await apiSdk.signMessage({
  keyVaultAddr: '${keyVaultAddr}',
  authProof: { childFlowId: 'apiKeySession' },
  index: 0,
  message: new TextEncoder().encode('...')
});
`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
