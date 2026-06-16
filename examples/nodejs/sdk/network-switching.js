/**
 * Network switching
 * 
 * Run: node examples/nodejs/sdk/network-switching.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (for signer; can be omitted for read-only)
 * 
 * Demonstrates how to switch between testnet and mainnet by creating
 * SDK instances with different configs.
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;

async function networkSwitchingExample() {
  console.log("=".repeat(60));
  console.log("Network switching");
  console.log("=".repeat(60));

  // ============ STEP 1: Testnet configuration ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Testnet configuration");
  console.log("=".repeat(60));
  const testnetSdk = Monstera.connect({
    mainnet: false,
    signer: SIGNER_PRIVATE_KEY
  });

  console.log('Testnet Network:', testnetSdk.network);
  console.log('Testnet Chain ID:', testnetSdk.chainId);
  console.log('Testnet RPC:', testnetSdk.rpcUrl);
  console.log();

  // ============ STEP 2: Mainnet configuration ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Mainnet configuration");
  console.log("=".repeat(60));
  const mainnetSdk = Monstera.connect({
    mainnet: true,
    signer: SIGNER_PRIVATE_KEY
  });

  console.log('Mainnet Network:', mainnetSdk.network);
  console.log('Mainnet Chain ID:', mainnetSdk.chainId);
  console.log('Mainnet RPC:', mainnetSdk.rpcUrl);
  console.log();

  // ============ STEP 3: Custom RPC URL ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Custom RPC URL");
  console.log("=".repeat(60));
  const customSdk = Monstera.connect({
    mainnet: false,
    rpcUrl: 'https://custom-rpc-endpoint.com', // Override default RPC
    signer: SIGNER_PRIVATE_KEY
  });

  console.log('Custom RPC:', customSdk.rpcUrl);
  console.log();

  console.log('✅ Network switching examples completed!');
  console.log();
  console.log('Note: Each SDK instance is configured for a specific network.');
  console.log('To switch networks, create a new SDK instance with the desired network.');
}

// Run example
networkSwitchingExample().catch(console.error);
