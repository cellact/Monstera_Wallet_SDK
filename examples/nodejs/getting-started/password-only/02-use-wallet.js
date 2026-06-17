/**
 * Track: password-only
 * Step: 02-use
 * Connect: connectAdmin
 * Prerequisites: run password-only/01-create-wallet.js; set WALLET_ADDRESS and PASSWORD in .env
 *
 * Run: node examples/nodejs/getting-started/password-only/02-use-wallet.js
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   WALLET_ADDRESS=0x...
 *   PASSWORD=mysecretpassword123
 *
 * Optional env vars:
 *   MNEMONIC="word1 word2 ..." (verify account addresses against ethers.js)
 *
 * Vault calls pass keyVaultAddr and authProof.password on each request.
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { HDNodeWallet, Mnemonic } from '../../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { recoverAddress, verifyMessage } from '../../../../src/adapters/ethers/signing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const MNEMONIC = process.env.MNEMONIC;

const sdk = Monstera.connectAdmin({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
});

async function main() {
  console.log('='.repeat(60));
  console.log('password-only — Step 2: Use wallet');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !PASSWORD) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, and PASSWORD env vars');
    console.error('Run password-only/01-create-wallet.js first');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Resolve KeyVault from wallet address');
  console.log('='.repeat(60));
  console.log('   Wallet:', WALLET_ADDRESS);
  const keyVaultAddr = await sdk.getKeyVaultAddr({ walletAddr: WALLET_ADDRESS });
  const authenticatorAddr = await sdk.getAuthenticatorAddr({ keyVaultAddr });
  console.log('\n   Wallet stack:');
  console.log(`     Wallet (proxy): ${WALLET_ADDRESS}`);
  console.log(`     └── KeyVault:   ${keyVaultAddr}`);
  console.log(`         └── Auth:   ${authenticatorAddr}`);

  const authProof = toUtf8Bytes(PASSWORD);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Get account addresses (explicit keyVaultAddr)');
  console.log('='.repeat(60));
  for (let i = 0; i < 5; i++) {
    const addr = await sdk.getAccountAddr({ keyVaultAddr, index: i });
    console.log(`   Account ${i}: ${addr}`);
  }

  if (MNEMONIC) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Verify against ethers.js');
    console.log('='.repeat(60));
    const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
    for (let i = 0; i < 3; i++) {
      const ethersWallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
      const onChainAddr = await sdk.getAccountAddr({ keyVaultAddr, index: i });
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
      keyVaultAddr,
      authProof: { password: authProof },
      index: 0,
      message: toUtf8Bytes(message)
    });
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${result}`);

    const expectedAddr = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
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
      keyVaultAddr,
      authProof: { password: authProof },
      index: 0,
      hash
    });
    console.log(`   Hash: ${hash.slice(0, 20)}...`);
    console.log(`   Signature: ${result}`);

    const expectedAddr = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
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
      keyVaultAddr,
      authProof: { password: toUtf8Bytes('wrongpassword') },
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
  • connectAdmin — no username credentials at connect time
  • Every vault call includes keyVaultAddr (resolved from WALLET_ADDRESS above)
  • Every signing call includes authProof.password (admin/backend must know the password)
  `);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
