/**
 * Track: username-and-password
 * Step: 01-create
 * Connect: Monstera.connect({ signer })
 * Prerequisites: none
 *
 * Run: node examples/nodejs/getting-started/username-and-password/01-create-wallet.js
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   USER_PASSWORD=mysecretpassword123
 *   USERNAME=alice
 *
 * Optional env vars:
 *   MNEMONIC="word1 word2 ..." — uses createWalletForUsernameFromMnemonic
 *
 * Creates wallet stack + factory username mapping (username hash → wallet).
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.USER_PASSWORD;
const USERNAME = process.env.USERNAME;
const MNEMONIC = process.env.MNEMONIC;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log('='.repeat(60));
  console.log('username-and-password — Step 1: Create wallet');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD || !USERNAME) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY, USER_PASSWORD, and USERNAME env vars');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Prepare auth config');
  console.log('='.repeat(60));
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  console.log('   Username:', USERNAME);
  console.log('   Password hash:', passwordHash.slice(0, 20) + '...');

  const usernameHash = await sdk.hashUsername({ username: USERNAME });
  console.log('   Username hash (off-chain):', usernameHash);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Create wallet + register username on factory');
  console.log('='.repeat(60));
  console.log('   Usernames are normalised (trim + lowercase) before hashing on-chain');

  const createOptions = {
    // authenticatorAddr: sdk.addresses.passwordMinuteSignatureAuth, // use this for passwordMinuteSignatureAuth instead of passwordAuth
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash },
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
  console.log('WALLET CREATED!');
  console.log('='.repeat(60));
  console.log(`\nUSERNAME="${USERNAME}"`);
  console.log(`MNEMONIC="${result.mnemonic}"`);
  console.log(`WALLET_ADDRESS=${result.wallet}`);
  console.log(`KEYVAULT_ADDRESS=${result.keyVault}`);
  console.log(`STORAGE_ADDRESS=${result.storage}`);
  console.log(`AUTHENTICATOR_ADDRESS=${result.authenticator}`);
  console.log(`USER_PASSWORD="${PASSWORD}"`);

  console.log('\n' + '='.repeat(60));
  console.log('Next: username-and-password/02-use-wallet.js');
  console.log('='.repeat(60));
  console.log(`
const userSdk = Monstera.connect({
  mainnet: false,
  credentials: { username: '${USERNAME}', password: '${PASSWORD}' }
});
await userSdk.signMessage({ message: 'Hello' });
`);

  console.log('⚠️  IMPORTANT: Save the mnemonic phrase and credentials securely!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
