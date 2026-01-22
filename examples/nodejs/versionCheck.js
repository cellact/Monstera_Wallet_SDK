/**
 * Test Version Checking Functionality
 * Run: node examples/nodejs/versionCheck.js
 * 
 * This script tests:
 * 1. Automatic version check on SDK initialization
 * 2. Manual version checking functions
 * 3. Version comparison utilities
 * 4. Disabling version checking
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { 
  checkVersion, 
  fetchLatestVersion, 
  checkAndWarnVersion 
} from '../../src/internal/versionCheck.js';
import { 
  compareVersions, 
  parseVersion, 
  satisfiesRange, 
  getVersionType 
} from '../../src/internal/version.js';

async function testVersionUtilities() {
  console.log("=".repeat(60));
  console.log("Testing Version Utilities");
  console.log("=".repeat(60));

  // Test parseVersion
  console.log("\n1. Testing parseVersion():");
  try {
    const parsed = parseVersion('1.0.0-alpha.2');
    console.log("   ✓ parseVersion('1.0.0-alpha.2'):", JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error("   ✗ parseVersion failed:", error.message);
  }

  // Test compareVersions
  console.log("\n2. Testing compareVersions():");
  const testCases = [
    ['1.0.0', '1.0.1', -1],
    ['1.0.1', '1.0.0', 1],
    ['1.0.0', '1.0.0', 0],
    ['1.0.0-alpha.2', '1.0.0', -1],
    ['2.0.0', '1.9.9', 1],
  ];
  
  for (const [v1, v2, expected] of testCases) {
    const result = compareVersions(v1, v2);
    const status = result === expected ? '✓' : '✗';
    console.log(`   ${status} compareVersions('${v1}', '${v2}') = ${result} (expected ${expected})`);
  }

  // Test satisfiesRange
  console.log("\n3. Testing satisfiesRange():");
  const rangeTests = [
    ['1.0.0', '^1.0.0', true],
    ['1.1.0', '^1.0.0', true],
    ['2.0.0', '^1.0.0', false],
    ['1.0.0', '>=1.0.0', true],
    ['0.9.0', '>=1.0.0', false],
  ];
  
  for (const [version, range, expected] of rangeTests) {
    const result = satisfiesRange(version, range);
    const status = result === expected ? '✓' : '✗';
    console.log(`   ${status} satisfiesRange('${version}', '${range}') = ${result} (expected ${expected})`);
  }

  // Test getVersionType
  console.log("\n4. Testing getVersionType():");
  const typeTests = [
    ['1.0.0', '2.0.0', 'major'],
    ['1.0.0', '1.1.0', 'minor'],
    ['1.0.0', '1.0.1', 'patch'],
    ['1.0.0-alpha.1', '1.0.0-alpha.2', 'prerelease'],
    ['1.0.0', '1.0.0', 'equal'],
  ];
  
  for (const [v1, v2, expected] of typeTests) {
    const result = getVersionType(v1, v2);
    const status = result === expected ? '✓' : '✗';
    console.log(`   ${status} getVersionType('${v1}', '${v2}') = '${result}' (expected '${expected}')`);
  }
}

async function testVersionCheck() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Version Check Functions");
  console.log("=".repeat(60));

  // Test fetchLatestVersion
  console.log("\n1. Testing fetchLatestVersion():");
  try {
    const latest = await fetchLatestVersion();
    if (latest) {
      console.log(`   ✓ Fetched latest version: ${latest}`);
    } else {
      console.log("   ⚠ Could not fetch latest version (network issue or browser environment)");
    }
  } catch (error) {
    console.error("   ✗ fetchLatestVersion failed:", error.message);
  }

  // Test checkVersion
  console.log("\n2. Testing checkVersion():");
  const currentVersion = Monstera.version;
  console.log(`   Current SDK version: ${currentVersion}`);
  
  try {
    const latestVersion = await fetchLatestVersion();
    if (latestVersion) {
      const result = await checkVersion(currentVersion, latestVersion);
      console.log("   ✓ Version check result:", JSON.stringify(result, null, 2));
    } else {
      console.log("   ⚠ Skipping checkVersion test (could not fetch latest version)");
    }
  } catch (error) {
    console.error("   ✗ checkVersion failed:", error.message);
  }
}

async function testAutomaticVersionCheck() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Automatic Version Check (on SDK initialization)");
  console.log("=".repeat(60));

  console.log("\n1. Creating SDK instance (version check should run automatically)...");
  console.log("   (Check console for version warning if update is available)");
  
  const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
  
  // This should trigger automatic version check
  const sdk = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY
  });
  
  console.log(`   ✓ SDK instance created`);
  console.log(`   SDK version: ${sdk.version}`);
  
  // Wait a bit for async version check to complete
  console.log("\n2. Waiting for version check to complete...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("   ✓ Version check should have completed (check console above for warnings)");
}

async function testDisableVersionCheck() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Disable Version Check");
  console.log("=".repeat(60));

  console.log("\n1. Creating SDK instance with checkVersion: false...");
  
  const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
  
  // This should NOT trigger version check
  const sdk = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY,
    checkVersion: false  // Disable version checking
  });
  
  console.log(`   ✓ SDK instance created (version check disabled)`);
  console.log(`   SDK version: ${sdk.version}`);
}

async function testManualVersionCheck() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Manual Version Check");
  console.log("=".repeat(60));

  console.log("\n1. Calling checkAndWarnVersion() manually...");
  console.log("   (This will show a warning if update is available)");
  
  await checkAndWarnVersion({ silent: false });
  
  console.log("   ✓ Manual version check completed");
}

async function main() {
  try {
    // Test version utilities
    await testVersionUtilities();
    
    // Test version check functions
    await testVersionCheck();
    
    // Test automatic version check
    await testAutomaticVersionCheck();
    
    // Test disabling version check
    await testDisableVersionCheck();
    
    // Test manual version check
    await testManualVersionCheck();
    
    console.log("\n" + "=".repeat(60));
    console.log("All Tests Completed!");
    console.log("=".repeat(60));
    console.log("\nNote: Version warnings only appear for major/minor updates.");
    console.log("      Patch and prerelease updates are silently ignored.");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });