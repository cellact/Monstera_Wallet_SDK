/**
 * Track: username-and-apiKey
 * Step: 01-create
 * Connect: Monstera.connect({ signer })
 * Prerequisites: none
 *
 * Run: node examples/nodejs/getting-started/username-and-apiKey/01-create-wallet.js
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   USERNAME=alice
 *
 * Optional env vars:
 *   API_KEY=0x<64-hex-chars> — raw 32-byte API key; generated randomly if omitted
 *   MNEMONIC="word1 word2 ..." — uses createWalletForUsernameFromMnemonic
 *
 * Creates wallet stack + factory username mapping (username hash → wallet)
 * with ApiKeySessionAuthenticator ({@code authConfig = abi.encode(keccak256(apiKey))}).
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { Monstera } from '../../../../src/index.js';
import { keccak256 } from '../../../../src/adapters/ethers/hashing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
// const USERNAME = process.env.USERNAME;
const USERNAME = "hannah";
const MNEMONIC = process.env.MNEMONIC;
const API_KEY = process.env.API_KEY ?? `0x${randomBytes(32).toString('hex')}`;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log('='.repeat(60));
  console.log('username-and-apiKey — Step 1: Create wallet');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !USERNAME) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY and USERNAME env vars');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Prepare auth config');
  console.log('='.repeat(60));
  const apiKeySecret = keccak256(API_KEY);
  console.log('   Username:', USERNAME);
  console.log('   API key (raw 32-byte hex):', API_KEY.slice(0, 14) + '...');
  console.log('   API key secret (keccak256):', apiKeySecret.slice(0, 20) + '...');

  const usernameHash = await sdk.hashUsername({ username: USERNAME });
  console.log('   Username hash (off-chain):', usernameHash);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Create wallet + register username on factory');
  console.log('='.repeat(60));
  console.log('   Usernames are normalised (trim + lowercase) before hashing on-chain');

  const createOptions = {
    authenticatorAddr: sdk.addresses.apiKeySessionAuth,
    authConfig: { apiKeySecret },
    username: USERNAME
  };

  const result = MNEMONIC
    ? await sdk.createWalletForUsernameFromMnemonic({ ...createOptions, mnemonic: MNEMONIC })
    : await sdk.createWalletForUsername(createOptions);

  console.log('   Transaction:', result.transactionHash);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Verify factory username lookup');
  console.log('='.repeat(60));
  const walletFromUsername = await sdk.walletOfUsername({ usernameHash });
  console.log('   walletOfUsername:', walletFromUsername);
  console.log('   Matches created wallet:', walletFromUsername.toLowerCase() === result.wallet.toLowerCase());

  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Verify ApiKeySession authenticator is configured');
  console.log('='.repeat(60));
  const configured = await sdk.isApiKeySessionConfigured({ keyVaultAddr: result.keyVault });
  console.log('   isApiKeySessionConfigured:', configured);

  console.log('\n' + '='.repeat(60));
  console.log('WALLET CREATED!');
  console.log('='.repeat(60));
  console.log(`\nUSERNAME="${USERNAME}"`);
  console.log(`API_KEY="${API_KEY}"`);
  console.log(`MNEMONIC="${result.mnemonic}"`);
  console.log(`WALLET_ADDRESS=${result.wallet}`);
  console.log(`KEYVAULT_ADDRESS=${result.keyVault}`);
  console.log(`STORAGE_ADDRESS=${result.storage}`);
  console.log(`AUTHENTICATOR_ADDRESS=${result.authenticator}`);

  console.log('\n' + '='.repeat(60));
  console.log('Next: username-and-apiKey/02-use-wallet.js');
  console.log('='.repeat(60));
  console.log(`
const userSdk = Monstera.connect({
  mainnet: false,
  credentials: { username: '${USERNAME}', apiKey: '${API_KEY}' }
});
await userSdk.isApiKeySessionValid();
await userSdk.signMessage({ index: 0, message: new TextEncoder().encode('Hello') });
`);

  console.log('⚠️  IMPORTANT: Save the mnemonic, API_KEY, and username securely!');
  console.log('   API_KEY is the raw 32-byte secret — the SDK hashes it to apiKeySecret internally.');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
