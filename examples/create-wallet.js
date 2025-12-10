/**
 * Create Wallet Example
 * 
 * Demonstrates how to create a wallet by calling the createUser contract method
 */

const { Wallet } = require('../src');
const { registerWalletContract } = require('../src/contracts/WalletContract');

async function createWalletExample() {
  console.log('=== Create Wallet via Contract ===\n');

  // Configuration
  const config = {
    username: 'alice',
    secret: 'my-secret-password-123',
    contractAddress: '0x...', // Your wallet contract address
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY', // Or your RPC endpoint
    network: 'ethereum',
    signerPrivateKey: '0x...' // Private key of authorized signer (for onlyAuthorized modifier)
  };

  try {
    console.log('Creating wallet via contract...');
    console.log('Username:', config.username);
    console.log('Contract:', config.contractAddress);
    console.log();

    // Create wallet - this calls the createUser contract method
    const wallet = await Wallet.create(config);

    console.log('✅ Wallet created successfully!');
    console.log('User Address:', wallet.getAddress());
    console.log('Public Key:', wallet.getPublicKey());
    console.log('Username:', wallet.getUsername());
    console.log();

    // The wallet is now ready to use
    console.log('Wallet configuration:');
    console.log(JSON.stringify(wallet.getConfig(), null, 2));

  } catch (error) {
    console.error('❌ Error creating wallet:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
  }
}

// Run example
createWalletExample().catch(console.error);

