/**
 * Network Switching Example
 * 
 * Demonstrates how to switch between testnet and mainnet
 * with the same SDK instance or create new instances.
 */

require('dotenv').config();
const { Monstera } = require('../src/index');

async function networkSwitchingExample() {
  console.log('=== Network Switching Example ===\n');

  // Example 1: Testnet configuration
  console.log('1. Creating testnet SDK instance...');
  const testnetSdk = Monstera.connect({
    network: 'testnet',
    signer: process.env.SIGNER_PRIVATE_KEY
  });

  console.log('Testnet Network:', testnetSdk.network);
  console.log('Testnet Chain ID:', testnetSdk.chainId);
  console.log('Testnet RPC:', testnetSdk.rpcUrl);
  console.log();

  // Example 2: Mainnet configuration
  console.log('2. Creating mainnet SDK instance...');
  const mainnetSdk = Monstera.connect({
    network: 'mainnet',
    signer: process.env.SIGNER_PRIVATE_KEY
  });

  console.log('Mainnet Network:', mainnetSdk.network);
  console.log('Mainnet Chain ID:', mainnetSdk.chainId);
  console.log('Mainnet RPC:', mainnetSdk.rpcUrl);
  console.log();

  // Example 3: Custom RPC URL (for local development or custom endpoints)
  console.log('3. Creating SDK with custom RPC URL...');
  const customSdk = Monstera.connect({
    network: 'testnet',
    rpcUrl: 'https://custom-rpc-endpoint.com', // Override default RPC
    signer: process.env.SIGNER_PRIVATE_KEY
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

