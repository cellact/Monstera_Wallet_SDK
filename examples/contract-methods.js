/**
 * Contract Methods Example
 * 
 * Demonstrates how to call various contract methods
 * This script shows the pattern for calling any contract method
 */

const { Wallet, ContractClient } = require('../src');
const { WALLET_CONTRACT_ABI, registerWalletContract } = require('../src/contracts/WalletContract');

async function contractMethodsExample() {
  console.log('=== Contract Methods Example ===\n');

  const contractAddress = '0x...'; // Your contract address
  const rpcUrl = 'https://mainnet.infura.io/v3/YOUR_KEY';
  const signerPrivateKey = '0x...'; // Authorized signer private key

  // Initialize contract client
  const contractClient = new ContractClient({
    network: 'ethereum',
    rpcUrl: rpcUrl,
    contractAddress: contractAddress
  });

  // Register the contract with ABI
  registerWalletContract(contractClient, contractAddress);

  console.log('Contract registered:', contractAddress);
  console.log();

  // Example 1: Create a wallet (write operation)
  console.log('Example 1: Creating wallet via createUser()...');
  try {
    const result = await contractClient.callWrite(
      contractAddress,
      'createUser',
      ['bob', Buffer.from('bob-secret-password', 'utf8')],
      signerPrivateKey
    );

    if (result.success) {
      console.log('✅ Transaction successful!');
      console.log('Transaction Hash:', result.transactionHash);
      console.log('Block Number:', result.blockNumber);
      console.log('Gas Used:', result.gasUsed);
      console.log('User Address:', result.userAddress);
      console.log('Public Key:', result.publicKey);
    } else {
      console.log('❌ Transaction failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log();

  // Example 2: Call a read-only method (if your contract has one)
  // Replace 'getUserInfo' with an actual read method from your contract
  console.log('Example 2: Calling read-only method...');
  try {
    // Example: getUserInfo(usernameHash)
    // const usernameHash = '0x...'; // keccak256 hash of username
    // const result = await contractClient.callRead(
    //   contractAddress,
    //   'getUserInfo',
    //   [usernameHash]
    // );
    // console.log('Result:', result);
    console.log('(Replace with actual read method from your contract)');
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log();

  // Example 3: Using Wallet class to call contract methods
  console.log('Example 3: Using Wallet class...');
  try {
    // Import existing wallet
    const wallet = await Wallet.import({
      address: '0x...', // Existing wallet address
      contractAddress: contractAddress,
      rpcUrl: rpcUrl
    });

    // Call read-only method
    // const userInfo = await wallet.callContract('getUserInfo', [usernameHash]);
    // console.log('User Info:', userInfo);

    // Call write method (requires private key)
    // const result = await wallet.callContractWrite('someMethod', [params], privateKey);
    // console.log('Result:', result);

    console.log('Wallet address:', wallet.getAddress());
    console.log('(Use wallet.callContract() or wallet.callContractWrite() to call methods)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

contractMethodsExample().catch(console.error);

