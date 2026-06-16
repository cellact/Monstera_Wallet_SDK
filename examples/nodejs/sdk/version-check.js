/**
 * Version Checking Example
 *
 * Run: node examples/nodejs/sdk/version-check.js
 *
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (for SDK)
 *
 * This example demonstrates:
 * 1. Opt-in version checking on SDK initialization ({@code checkVersion: true})
 * 2. Default behavior (no version check unless explicitly enabled)
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;

async function demonstrateOptInVersionCheck() {
  console.log('='.repeat(60));
  console.log('Opt-In Version Check');
  console.log('='.repeat(60));
  console.log('\nPass checkVersion: true to Monstera.connect() to check for updates.');
  console.log('If a major or minor update is available, you\'ll see a warning.\n');

  const monstera = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY,
    checkVersion: true
  });

  console.log(`✓ SDK instance created (version: ${monstera.version})`);
  console.log('  (Check console above for version warnings if an update is available)\n');

  // Wait for async version check to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function demonstrateDefaultNoVersionCheck() {
  console.log('='.repeat(60));
  console.log('Default: No Version Check');
  console.log('='.repeat(60));
  console.log('\nBy default, Monstera.connect() does not check for updates.');
  console.log('Omit checkVersion or leave it false to skip the background check.\n');

  const monstera = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY
  });

  console.log(`✓ SDK instance created (version: ${monstera.version})`);
  console.log('  No version warning expected unless you passed checkVersion: true\n');
}

async function main() {
  if (!SIGNER_PRIVATE_KEY) {
    console.error('ERROR: Set SIGNER_PRIVATE_KEY env var');
    process.exit(1);
  }

  try {
    await demonstrateOptInVersionCheck();
    await demonstrateDefaultNoVersionCheck();

    console.log('='.repeat(60));
    console.log('Example Complete!');
    console.log('='.repeat(60));
    console.log('\nNote: Version warnings only appear for major/minor updates.');
    console.log('      Patch and prerelease updates are silently ignored.\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
