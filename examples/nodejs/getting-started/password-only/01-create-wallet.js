/**
 * Track: password-only
 * Step: 01-create
 * Connect: Monstera.connect({ signer })
 * Prerequisites: none
 *
 * Run: node examples/nodejs/getting-started/password-only/01-create-wallet.js
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x...
 *   PASSWORD=mysecretpassword123
 *
 * Creates WalletStorage + KeyVault + Wallet (no factory username mapping).
 */
import 'dotenv/config';
import { Monstera } from '../../../../src/index.js';
import { keccak256, toUtf8Bytes } from '../../../../src/adapters/ethers/hashing.js';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const PASSWORD = process.env.PASSWORD;

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log('='.repeat(60));
  console.log('password-only — Step 1: Create wallet');
  console.log('='.repeat(60));

  if (!SIGNER_PRIVATE_KEY || !PASSWORD) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY and PASSWORD env vars');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Verify SDK and get signer');
  console.log('='.repeat(60));
  const networks = Monstera.networks;
  console.log(`   Networks: ${JSON.stringify(networks, null, 2)}`);

  const contractAddresses = Monstera.defaultAddresses;
  console.log(`   Contract addresses: ${JSON.stringify(contractAddresses, null, 2)}`);

  const contractAddresses1 = sdk.addresses;
  console.log(`   Contract addresses (instance): ${JSON.stringify(contractAddresses1, null, 2)}`);

  const hasWriteAccess = sdk.hasWriteAccess();
  console.log(`   Can write: ${hasWriteAccess}`);
  if (!hasWriteAccess) {
    console.error('❌ ERROR: SDK instance cannot perform write operations');
    process.exit(1);
  }

  const signerAddress = await sdk.getSignerAddr();
  console.log(`   Signer address: ${signerAddress}`);
  if (!signerAddress) {
    console.error('❌ ERROR: Failed to get signer address');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Prepare auth config');
  console.log('='.repeat(60));
  const passwordHash = keccak256(toUtf8Bytes(PASSWORD));
  console.log('   Password hash:', passwordHash.slice(0, 20) + '...');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Create wallet stack (no username registration)');
  console.log('='.repeat(60));
  console.log('   This deploys: WalletStorage + KeyVault + WalletProxy');
  const result = await sdk.createWallet({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash },
  });
  console.log('   Transaction:', result.transactionHash);

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
  console.log('Next: password-only/02-use-wallet.js');
  console.log('='.repeat(60));
  console.log(`
  Wallet (BeaconProxy) ──► WalletLogic
  ${result.wallet}
      └──► KeyVault (password auth)
          ${result.keyVault}
              └──► WalletStorage
                  ${result.storage}
  `);
  console.log('⚠️  IMPORTANT: Save the mnemonic phrase securely!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
