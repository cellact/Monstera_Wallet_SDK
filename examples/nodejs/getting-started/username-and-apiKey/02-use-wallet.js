/**
 * Track: username-and-apiKey
 * Step: 02-use
 * Connect: Monstera.connect({ credentials: { username, apiKey } })
 * Prerequisites: run username-and-apiKey/01-create-wallet.js; set USERNAME and API_KEY in .env
 *
 * Run: node examples/nodejs/getting-started/username-and-apiKey/02-use-wallet.js
 *
 * Required env vars:
 *   USERNAME=alice
 *   API_KEY=0x<64-hex-chars>  (raw 32-byte API key from step 01)
 *
 * Optional env vars:
 *   MNEMONIC="word1 word2 ..." (verify account addresses against ethers.js)
 *
 * No keyVaultAddr on vault calls — resolved from credentials at connect time.
 * No authProof on sign calls by default — SDK builds ACTION-mode proofs from session apiKey.
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { HDNodeWallet, Mnemonic } from '../../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';
import { recoverAddress, verifyMessage } from '../../../../src/adapters/ethers/signing.js';

const MNEMONIC = process.env.MNEMONIC;
const USERNAME = process.env.USERNAME;
const API_KEY = process.env.API_KEY;

const sdk = Monstera.connect({
  mainnet: false,
  credentials: {
    username: USERNAME,
    apiKey: API_KEY
  },
  logLevel: 'debug'
});

async function main() {
  console.log('='.repeat(60));
  console.log('username-and-apiKey — Step 2: Use wallet');
  console.log('='.repeat(60));

  if (!USERNAME || !API_KEY) {
    console.error('ERROR: Set USERNAME and API_KEY env vars');
    console.error('Run username-and-apiKey/01-create-wallet.js first');
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
  console.log('STEP 2: ApiKeySession authenticator checks');
  console.log('='.repeat(60));
  const configured = await sdk.isApiKeySessionConfigured();
  console.log(`   isApiKeySessionConfigured: ${configured ? '✅' : '❌'}`);

  const valid = await sdk.isApiKeySessionValid();
  console.log(`   isApiKeySessionValid: ${valid ? '✅' : '❌'}`);

  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Get account addresses (no keyVaultAddr passed)');
  console.log('='.repeat(60));
  for (let i = 0; i < 5; i++) {
    const addr = await sdk.getAccountAddr({ index: i });
    console.log(`   Account ${i}: ${addr}`);
  }

  if (MNEMONIC) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: Verify against ethers.js');
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
    console.log('STEP 4: Verify against ethers.js (skipped — no MNEMONIC)');
    console.log('='.repeat(60));
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Sign message (ACTION-mode proof from session — no authProof passed)'); 
  // The SDK does:
  // resolves keyvaultAddr from your session 
  // injects apiKeySecret from connect credentials
  // builds the action for this call: I want signMessage at index 0 with this message
  // builds an ACTION-mode authProof bound to that action 
  // calls KeyVault.signMessage(authproof, index, message)
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
  console.log('STEP 6: Sign hash (ACTION-mode, session apiKey)');
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
  console.log('STEP 7: TOKEN-mode bearer token (mint once, reuse)');
  console.log('='.repeat(60));
  try {
    // const tokenProof = await sdk.createAuthProofApiKeySession({
    //   mode: 'token',
    //   scopeMask: Monstera.API_KEY_SESSION_SCOPE_SIGN_ALL
    // });
    // console.log(`   Token proof minted (${tokenProof.length} chars)`);

    const bearerMessage = 'Signed with bearer token';
    const bearerSig = await sdk.signMessage({
      // authProof: tokenProof,
      authProof: { mode: 'token', scopeMask: Monstera.API_KEY_SESSION_SCOPE_SIGN_ALL },
      index: 0,
      message: toUtf8Bytes(bearerMessage)
    });
    const expectedAddr = await sdk.getAccountAddr({ index: 0 });
    const recovered = verifyMessage(bearerMessage, bearerSig);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Bearer signMessage: ${match ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 8: Wrong API key test');
  console.log('='.repeat(60));
  const wrongApiKey = `0x${'ff'.repeat(32)}`;
  try {
    await sdk.signMessage({
      authProof: { apiKeySecret: keccak256(wrongApiKey) },
      index: 0,
      message: toUtf8Bytes('test')
    });
    console.log('   ❌ Should have failed!');
  } catch (error) {
    console.log(`   ✅ Correctly rejected: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 9: What to notice');
  console.log('='.repeat(60));
  console.log(`
  • Monstera.connect({ credentials: { username, apiKey } }) — apiKey is raw 32-byte hex
  • Session stores apiKeySecret = keccak256(apiKey); raw key is never sent on-chain
  • Vault calls omit keyVaultAddr — session resolves it from USERNAME
  • ACTION-mode signing: omit authProof; SDK builds per-operation proofs from session
  • TOKEN-mode: mint with createAuthProofApiKeySession({ mode: 'token' }), reuse authProof bytes
  • isApiKeySessionValid({}) — sanity check with zero extra inputs when credentials are set
  `);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
