/**
 * Version Checking Example
 * 
 * Run: node examples/nodejs/versionCheck.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (for SDK)
 * 
 * This example demonstrates:
 * 1. How automatic version checking works on SDK initialization
 * 2. How to manually check for updates
 * 3. How to disable automatic version checking
 */
import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { checkAndWarnVersion } from '../../src/internal/versionCheck.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;

async function demonstrateAutomaticVersionCheck() {
  console.log('='.repeat(60));
  console.log('Automatic Version Check');
  console.log('='.repeat(60));
  console.log('\nWhen you create an SDK instance, it automatically checks for updates.');
  console.log('If a major or minor update is available, you\'ll see a warning.\n');

  const monstera = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY
  });
  
  console.log(`✓ SDK instance created (version: ${monstera.version})`);
  console.log('  (Check console above for version warnings if update is available)\n');
  
  // Wait for async version check to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function demonstrateDisableVersionCheck() {
  console.log('='.repeat(60));
  console.log('Disable Automatic Version Check');
  console.log('='.repeat(60));
  console.log('\nYou can disable automatic version checking by setting checkVersion: false\n');

  const monstera = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY,
    checkVersion: false  // Disable version checking
  });
  
  console.log(`✓ SDK instance created with version checking disabled`);
  console.log(`  Version: ${monstera.version}\n`);
}

async function demonstrateManualVersionCheck() {
  console.log('='.repeat(60));
  console.log('Manual Version Check');
  console.log('='.repeat(60));
  console.log('\nYou can manually check for updates using checkAndWarnVersion()\n');

  console.log('Checking for updates...');
  await checkAndWarnVersion(Monstera.version);
  console.log('✓ Manual version check completed\n');
}

async function main() {
  try {
    // Demonstrate automatic version check
    await demonstrateAutomaticVersionCheck();
    
    // Demonstrate disabling version check
    await demonstrateDisableVersionCheck();
    
    // Demonstrate manual version check
    await demonstrateManualVersionCheck();
    
    console.log('='.repeat(60));
    console.log('Example Complete!');
    console.log('='.repeat(60));
    console.log('\nNote: Version warnings only appear for major/minor updates.');
    console.log('      Patch and prerelease updates are silently ignored.\n');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
