/**
 * Track: username-and-password
 * Step: 02-use
 * Connect: Monstera.connect({ credentials })
 * Prerequisites: run username-and-password/01-create-wallet.js; set USERNAME and USER_PASSWORD in .env
 *
 * Run: node examples/nodejs/getting-started/username-and-password/02-use-wallet.js
 *
 * Required env vars:
 *   USERNAME=alice
 *   USER_PASSWORD=mysecretpassword123
 *
 * Optional env vars:
 *   MNEMONIC="word1 word2 ..." (verify account addresses against ethers.js)
 *
 * No keyVaultAddr on vault calls — resolved from credentials at connect time.
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { HDNodeWallet, Mnemonic } from '../../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { recoverAddress, verifyMessage } from '../../../../src/adapters/ethers/signing.js';

const MNEMONIC = process.env.MNEMONIC;
const USERNAME = process.env.USERNAME;
const USER_PASSWORD = process.env.USER_PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  credentials: {
    username: USERNAME,
    password: USER_PASSWORD
  }
});

async function main() {
  console.log('='.repeat(60));
  console.log('username-and-password — Step 2: Use wallet');
  console.log('='.repeat(60));

  if (!USERNAME || !USER_PASSWORD) {
    console.error('ERROR: Set USERNAME and USER_PASSWORD env vars');
    console.error('Run username-and-password/01-create-wallet.js first');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Session-resolved wallet stack');
  console.log('='.repeat(60));
  const walletAddr = await sdk.getSessionWalletAddr();
  const keyVaultAddr = await sdk.getSessionKeyVaultAddr();
  const authenticatorAddr = await sdk.getAuthenticatorAddr({});
  console.log(`   Username: ${USERNAME}`);
  console.log(`   Wallet (proxy): ${walletAddr}`);
  console.log(`   └── KeyVault:   ${keyVaultAddr}`);
  console.log(`       └── Auth:   ${authenticatorAddr}`);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Get account addresses (no keyVaultAddr passed)');
  console.log('='.repeat(60));
  for (let i = 0; i < 5; i++) {
    const addr = await sdk.getAccountAddr({ index: i });
    console.log(`   Account ${i}: ${addr}`);
  }

  if (MNEMONIC) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Verify against ethers.js');
    console.log('='.repeat(60));
    const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
    for (let i = 0; i < 3; i++) {
      const ethersWallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
      const onChainAddr = await sdk.getAccountAddr({ index: i });
      const match = ethersWallet.address.toLowerCase() === onChainAddr.toLowerCase();
      console.log(`   Account ${i}: ${match ? '✅ MATCH' : '❌ MISMATCH'}`);
    }
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Verify against ethers.js (skipped — no MNEMONIC)');
    console.log('='.repeat(60));
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Sign message');
  console.log('='.repeat(60));
  const message = 'Hello from TheWallet!';
  try {
    const result = await sdk.signMessage({
      index: 0,
      message: toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${result}`);

    const expectedAddr = await sdk.getAccountAddr({ index: 0 });
    const recovered = verifyMessage(message, result);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? '✅ Signature valid!' : '❌ Signature invalid!'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Sign hash');
  console.log('='.repeat(60));
  const hash = keccak256(toUtf8Bytes('Some data'));
  try {
    const result = await sdk.sign({
      index: 0,
      hash
    });
    console.log(`   Hash: ${hash.slice(0, 20)}...`);
    console.log(`   Signature: ${result}`);

    const expectedAddr = await sdk.getAccountAddr({ index: 0 });
    const recovered = recoverAddress(hash, result);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   ${match ? '✅ Signature valid!' : '❌ Signature invalid!'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: Wrong password test');
  console.log('='.repeat(60));
  try {
    await sdk.signMessage({
      authProof: { password: toUtf8Bytes('wrongpassword') }, // when authenticator is passwordAuth
      // authProof: { passwordHash: keccak256(toUtf8Bytes('wrongpassword')) }, // when authenticator is passwordMinuteSignatureAuth 
      index: 0,
      message: toUtf8Bytes('test')
    });
    console.log('   ❌ Should have failed!');
  } catch (error) {
    console.log(`   ✅ Correctly rejected: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 7: What to notice');
  console.log('='.repeat(60));
  console.log(`
  • Monstera.connect({ credentials }) — resolves wallet + KeyVault (no signer required)
  • Vault calls omit keyVaultAddr — session supplies it from USERNAME
  • authProof is optional on sign calls — password comes from connect-time credentials
  `);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
