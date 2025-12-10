/**
 * Contract Call Script Template
 * 
 * Use this template to create scripts for calling specific contract methods.
 * Copy this file and modify it for your specific contract method.
 */

const { ContractClient } = require('../src');
const { WALLET_CONTRACT_ABI, registerWalletContract } = require('../src/contracts/WalletContract');

/**
 * Template for calling a contract method
 * 
 * Replace METHOD_NAME with your actual method name
 * Replace PARAM_TYPES with your actual parameter types
 */
async function callContractMethod() {
  // Configuration
  const contractAddress = '0x...'; // Your contract address
  const rpcUrl = 'https://mainnet.infura.io/v3/YOUR_KEY'; // Your RPC endpoint
  const signerPrivateKey = '0x...'; // Private key for write operations (if needed)

  // Initialize contract client
  const contractClient = new ContractClient({
    network: 'ethereum',
    rpcUrl: rpcUrl,
    contractAddress: contractAddress
  });

  // Register contract with ABI
  registerWalletContract(contractClient, contractAddress);

  // Method parameters
  const methodName = 'METHOD_NAME'; // Replace with your method name
  const params = [
    // Add your parameters here
    // Example: 'param1', 123, Buffer.from('data', 'utf8')
  ];

  // Determine if this is a read or write operation
  const isWriteOperation = true; // Set to false for read-only methods

  try {
    let result;
    
    if (isWriteOperation) {
      // Write operation (transaction)
      console.log(`Calling ${methodName} (write operation)...`);
      result = await contractClient.callWrite(
        contractAddress,
        methodName,
        params,
        signerPrivateKey
      );
      
      if (result.success) {
        console.log('✅ Transaction successful!');
        console.log('Transaction Hash:', result.transactionHash);
        console.log('Block Number:', result.blockNumber);
        console.log('Gas Used:', result.gasUsed);
        console.log('Return Values:', result.result);
      } else {
        console.log('❌ Transaction failed:', result.error);
      }
    } else {
      // Read operation
      console.log(`Calling ${methodName} (read operation)...`);
      result = await contractClient.callRead(
        contractAddress,
        methodName,
        params
      );
      
      if (result.success) {
        console.log('✅ Call successful!');
        console.log('Result:', result.result);
      } else {
        console.log('❌ Call failed:', result.error);
      }
    }

    return result;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  callContractMethod().catch(console.error);
}

module.exports = { callContractMethod };

