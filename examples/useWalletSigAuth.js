/**
 * Create and use Wallet (with Wallet Signature Authenticator) Example
 * 
 * Demonstrates how to create and use a wallet with a Wallet Signature Authenticator using the SapphireWalletSDK
 * with network switching and clean API.
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require('ethers');

async function useWalletSigAuthExample() {
  console.log('=== Create and use Wallet (with Wallet Signature Authenticator) Example ===\n');

  // Option 1: Using testnet with environment variables
  const sdk = SapphireWalletSDK.fromConfig({
    network: 'testnet', // or 'mainnet'
    addresses: {
      walletFactory: process.env.WALLET_FACTORY_CONTRACT_ADDRESS, // Set in .env
      walletSignatureAuth: process.env.WALLET_SIGNATURE_AUTH_ADDRESS // Set in .env
    },
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY // Private key for signing transactions
  });

  // Whitelisted addresses
  const ALLOWED_1 = process.env.ALLOWED_1 || "0xADaAf2160f7E8717FF67131E5AA00BfD73e377d5";
  const ALLOWED_2 = process.env.ALLOWED_2 ||"0xD0a2b03fCCAD184B9eec286FeFA34301E9436206";

  // Private keys for signing (set via env or use test keys)
  const ALLOWED_1_KEY = process.env.ALLOWED_1_KEY || "";
  const ALLOWED_2_KEY = process.env.ALLOWED_2_KEY || "";


  try {
    console.log('Creating wallet...');
    console.log('Network:', sdk.network);
    console.log('Wallet Factory:', sdk.addresses.walletFactory);
    console.log('Authenticator:', sdk.addresses.walletSignatureAuth);
    console.log();

    // Encode whitelist config
    const whitelist = [ALLOWED_1, ALLOWED_2];
    const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
    console.log(`Whitelist: ${whitelist.join(", ")}`);

    // Create wallet with password hash
    const result = await sdk.wallets.createWallet({
      authConfig: authConfig,
      authenticator: sdk.addresses.walletSignatureAuth
    });

    console.log('✅ Wallet created successfully!');
    console.log('Wallet Address:', result.wallet);
    console.log('Mnemonic:', result.mnemonic);
    console.log('Authenticator:', result.authenticator);
    console.log('Storage:', result.storage);
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Block Number:', result.blockNumber);
    console.log('Gas Used:', result.gasUsed);
    console.log('\n⚠️  WARNING: Store this mnemonic securely!');
    
  } catch (error) {
    console.error('❌ Error creating wallet:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run example
useWalletSigAuthExample().catch(console.error);

