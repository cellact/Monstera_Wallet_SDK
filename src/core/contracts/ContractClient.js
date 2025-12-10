/**
 * Contract Client - Handles smart contract interactions
 * 
 * Provides methods to call contract functions using Web3.js or Ethers.js
 */

class ContractClient {
  constructor(config = {}) {
    this.network = config.network || 'ethereum';
    this.rpcUrl = config.rpcUrl || null;
    this.contractAddress = config.contractAddress || null;
    this.contracts = new Map();
    this.web3 = null;
    this.ethers = null;
    this.initialized = false;
  }

  /**
   * Initialize Web3/Ethers provider
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    // Try to use ethers.js first (more modern)
    try {
      const { ethers } = require('ethers');
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      this.ethers = ethers;
      this.initialized = true;
      return;
    } catch (error) {
      // Fallback to web3.js
      try {
        const { Web3 } = require('web3');
        this.web3 = new Web3(this.rpcUrl);
        this.initialized = true;
        return;
      } catch (err) {
        throw new Error('Neither ethers.js nor web3.js is installed. Please install one: npm install ethers or npm install web3');
      }
    }
  }

  /**
   * Register a contract with ABI
   * 
   * @param {String} name - Contract name
   * @param {String} address - Contract address
   * @param {Array} abi - Contract ABI
   */
  registerContract(name, address, abi) {
    this.contracts.set(name, {
      address,
      abi,
      instance: null
    });
  }

  /**
   * Get contract instance
   * 
   * @param {String} contractAddress - Contract address
   * @param {Array} abi - Contract ABI (optional if already registered)
   * @returns {Object} Contract instance
   */
  async getContractInstance(contractAddress, abi = null) {
    await this.initialize();
    
    // Check if contract is registered
    let contractInfo = null;
    for (const [name, info] of this.contracts.entries()) {
      if (info.address.toLowerCase() === contractAddress.toLowerCase()) {
        contractInfo = info;
        abi = abi || info.abi;
        break;
      }
    }
    
    if (!abi) {
      throw new Error('Contract ABI is required. Either register the contract first or provide ABI.');
    }
    
    if (this.ethers) {
      // Use ethers.js
      return new this.ethers.Contract(contractAddress, abi, this.provider);
    } else if (this.web3) {
      // Use web3.js
      return new this.web3.eth.Contract(abi, contractAddress);
    }
    
    throw new Error('Contract client not initialized');
  }

  /**
   * Call a read-only contract method
   * 
   * @param {String} contractAddress - Contract address
   * @param {String} methodName - Method name
   * @param {Array} params - Method parameters
   * @returns {Promise<Object>} Contract call result
   */
  async callRead(contractAddress, methodName, params = []) {
    await this.initialize();
    
    // Get default contract ABI or use a minimal ABI
    const abi = this.getContractABI(contractAddress) || this.getMinimalABI(methodName);
    const contract = await this.getContractInstance(contractAddress, abi);
    
    try {
      if (this.ethers) {
        // Ethers.js
        const result = await contract[methodName](...params);
        
        // Handle multiple return values
        if (Array.isArray(result)) {
          return {
            success: true,
            result: result,
            // Map named return values if available
            userAddress: result[0],
            publicKey: result[1]
          };
        }
        
        return {
          success: true,
          result: result
        };
      } else if (this.web3) {
        // Web3.js
        const result = await contract.methods[methodName](...params).call();
        
        // Handle multiple return values
        if (Array.isArray(result)) {
          return {
            success: true,
            result: result,
            userAddress: result[0],
            publicKey: result[1]
          };
        }
        
        return {
          success: true,
          result: result
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Call a write contract method (transaction)
   * 
   * @param {String} contractAddress - Contract address
   * @param {String} methodName - Method name
   * @param {Array} params - Method parameters
   * @param {String} privateKey - Private key for signing
   * @returns {Promise<Object>} Transaction result
   */
  async callWrite(contractAddress, methodName, params = [], privateKey) {
    if (!privateKey) {
      throw new Error('Private key required for write operations');
    }
    
    await this.initialize();
    
    const abi = this.getContractABI(contractAddress) || this.getMinimalABI(methodName);
    
    try {
      if (this.ethers) {
        // Ethers.js
        const wallet = new this.ethers.Wallet(privateKey, this.provider);
        const contract = new this.ethers.Contract(contractAddress, abi, wallet);
        
        // Convert Buffer params to hex strings if needed
        const processedParams = params.map(p => {
          if (Buffer.isBuffer(p)) {
            return '0x' + p.toString('hex');
          }
          return p;
        });
        
        const tx = await contract[methodName](...processedParams);
        const receipt = await tx.wait();
        
        // Parse return values from transaction receipt/logs if available
        let returnValues = null;
        if (receipt.logs && receipt.logs.length > 0) {
          // Try to decode events
          const eventInterface = new this.ethers.Interface(abi);
          for (const log of receipt.logs) {
            try {
              const decoded = eventInterface.parseLog(log);
              if (decoded && decoded.args) {
                returnValues = decoded.args;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
        
        return {
          success: true,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          result: returnValues,
          // Extract common return values
          userAddress: returnValues ? returnValues[0] : null,
          publicKey: returnValues ? returnValues[1] : null
        };
      } else if (this.web3) {
        // Web3.js
        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        const contract = new this.web3.eth.Contract(abi, contractAddress);
        
        // Convert Buffer params to hex strings if needed
        const processedParams = params.map(p => {
          if (Buffer.isBuffer(p)) {
            return '0x' + p.toString('hex');
          }
          return p;
        });
        
        const data = contract.methods[methodName](...processedParams).encodeABI();
        
        const tx = {
          from: account.address,
          to: contractAddress,
          data: data,
          gas: await this.web3.eth.estimateGas({
            from: account.address,
            to: contractAddress,
            data: data
          })
        };
        
        const signedTx = await account.signTransaction(tx);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        return {
          success: true,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          result: null // Web3.js doesn't easily return function return values
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get contract ABI if registered
   */
  getContractABI(contractAddress) {
    for (const [name, info] of this.contracts.entries()) {
      if (info.address.toLowerCase() === contractAddress.toLowerCase()) {
        return info.abi;
      }
    }
    return null;
  }

  /**
   * Get minimal ABI for a method (fallback)
   */
  getMinimalABI(methodName) {
    // Return a minimal ABI that allows calling the method
    // This is a fallback - ideally contracts should be registered with full ABI
    return [
      {
        "inputs": [],
        "name": methodName,
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }

  /**
   * Call contract method (alias for callRead)
   */
  async call(contractAddress, methodName, params = [], privateKey = null) {
    if (privateKey) {
      return await this.callWrite(contractAddress, methodName, params, privateKey);
    }
    return await this.callRead(contractAddress, methodName, params);
  }
}

module.exports = ContractClient;
