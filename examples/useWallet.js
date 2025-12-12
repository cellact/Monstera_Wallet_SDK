/**
 * Use Wallet Example
 * 
 * Demonstrates how to use a wallet using the SapphireWalletSDK
 * with clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require('ethers');

async function useWalletExample() {
  console.log('=== Use Wallet Example (New SDK) ===\n');

  // Option 1: Using testnet with environment variables
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    addresses: {
      factory: process.env.FACTORY_CONTRACT_ADDRESS, // Set in .env
      passwordAuth: process.env.PASSWORD_AUTH_ADDRESS // Set in .env
    },
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY // Private key for signing transactions
  });

  // Prepare auth proof (raw password bytes - contract hashes internally)
  const PASSWORD = process.env.TEST_PASSWORD;
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  try {
    console.log('Getting account address...');
    console.log('Network:', sdk.network);
    console.log();

    // Get account address
    const result = await sdk.wallets.getAccountAddress({
      walletAddress: process.env.TEST_WALLET_ADDRESS,
      index: 0
    });

    console.log('✅ Account address retrieved successfully!');
    console.log('Account Address:', result);
    console.log();

  } catch (error) {
    console.error('❌ Error getting account address:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  // get account private key and address
  try {
    console.log('Getting account private key and address...');
    console.log();

    const result = await sdk.wallets.getAccount({
      walletAddress: process.env.TEST_WALLET_ADDRESS,
      authProof: authProof,
      index: 0
    });

    console.log('✅ Account private key and address retrieved successfully!');
    console.log('Private Key:', result.privateKey);
    console.log('Account Address:', result.accountAddress);

  } catch (error) {
    console.error('❌ Error getting account private key and address:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  // sign message (EIP-191 personal message)
  try {
    console.log('Signing message...');
    console.log();

    const message = 'Hello from Monstera!';
    const bytesMessage = ethers.toUtf8Bytes(message);

    const result = await sdk.wallets.signMessage({
      walletAddress: process.env.TEST_WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      message: bytesMessage
    });

    console.log('Message:', message);
    console.log('Signature:', result.signature);

    // verify signature 
    const expectedAddr = await sdk.wallets.getAccountAddress({
        walletAddress: process.env.TEST_WALLET_ADDRESS,
        index: 0
    });
    const recovered = ethers.verifyMessage(message, result.signature);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.error('❌ Error signing message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  // sign a hash with account's private key
  try {
    console.log('Signing a raw hash (authenticated)...');
    console.log();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("Some data to hash"));

    const result = await sdk.wallets.sign({
      walletAddress: process.env.TEST_WALLET_ADDRESS,
      authProof: authProof,
      index: 0,
      hash: hash
    });

    console.log('Signature:', result.signature);

    // verify signature 
    const expectedAddr = await sdk.wallets.getAccountAddress({
        walletAddress: process.env.TEST_WALLET_ADDRESS,
        index: 0
    });
    const recovered = ethers.recoverAddress(hash, result.signature);
    const match = recovered.toLowerCase() === expectedAddr.toLowerCase();
    console.log(`   Recovered: ${recovered}`);
    console.log(`   ${match ? "✅ Signature valid!" : "❌ Signature invalid!"}`);
  } catch (error) {
    console.error('❌ Error signing hash:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
useWalletExample().catch(console.error);

