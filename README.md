# Arnacon Wallet SDK Documentation

A JavaScript SDK for creating and managing wallets through smart contract interactions. The SDK provides a simple interface for calling contract methods and managing wallet operations.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Creating Wallets](#creating-wallets)
- [Calling Contract Methods](#calling-contract-methods)
- [Scripts and Examples](#scripts-and-examples)
- [API Reference](#api-reference)
- [Contract Integration](#contract-integration)

## Overview

The Arnacon Wallet SDK allows you to:

- **Create wallets** by calling the `createUser` contract method
- **Call contract methods** easily with helper functions
- **Manage wallet instances** with a simple API
- **Generate scripts** for calling any contract method

All wallet operations are performed through smart contract calls, ensuring consistency and security.

## Installation

```bash
npm install @arnacon/wallet-sdk
```

### Dependencies

The SDK requires either `ethers.js` or `web3.js`:

```bash
# Using ethers.js (recommended)
npm install ethers

# Or using web3.js
npm install web3
```

## Quick Start

### Create a Wallet

```javascript
const { Wallet } = require('@arnacon/wallet-sdk');

const wallet = await Wallet.create({
  username: 'alice',
  secret: 'my-secret-password',
  contractAddress: '0x...', // Your wallet contract address
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  signerPrivateKey: '0x...' // Authorized signer private key
});

console.log('Wallet Address:', wallet.getAddress());
console.log('Public Key:', wallet.getPublicKey());
```

### Call Contract Methods

```javascript
const { ContractClient } = require('@arnacon/wallet-sdk');

const contractClient = new ContractClient({
  network: 'ethereum',
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  contractAddress: '0x...'
});

// Call read-only method
const result = await contractClient.callRead(
  '0x...',
  'getUserInfo',
  [usernameHash]
);

// Call write method (transaction)
const txResult = await contractClient.callWrite(
  '0x...',
  'createUser',
  ['bob', Buffer.from('secret', 'utf8')],
  signerPrivateKey
);
```

## Creating Wallets

### Using Wallet.create()

The `create()` method calls the contract's `createUser` method:

```javascript
const wallet = await Wallet.create({
  username: 'alice',                    // Required: Username
  secret: 'my-secret-password',        // Required: User's secret/password
  contractAddress: '0x...',           // Required: Contract address
  rpcUrl: 'https://...',               // Required: RPC URL
  signerPrivateKey: '0x...',          // Required: Authorized signer key
  network: 'ethereum'                  // Optional: Network name
});
```

**Contract Method Called:**
```solidity
function createUser(string memory username, bytes calldata secret) 
    external 
    onlyAuthorized 
    returns (address userAddress, bytes memory publicKey)
```

**Returns:**
- `userAddress`: The generated wallet address
- `publicKey`: The compressed public key

### Import Existing Wallet

```javascript
const wallet = await Wallet.import({
  address: '0x...',                    // Required: Wallet address
  contractAddress: '0x...',           // Required: Contract address
  rpcUrl: 'https://...',               // Required: RPC URL
  network: 'ethereum'                  // Optional: Network name
});
```

## Calling Contract Methods

### Using ContractClient

The `ContractClient` provides low-level access to contract methods:

```javascript
const { ContractClient } = require('@arnacon/wallet-sdk');

const client = new ContractClient({
  network: 'ethereum',
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  contractAddress: '0x...'
});

// Register contract with ABI (optional but recommended)
const { registerWalletContract } = require('@arnacon/wallet-sdk');
registerWalletContract(client, '0x...');
```

#### Read-Only Methods

```javascript
const result = await client.callRead(
  contractAddress,
  'methodName',
  [param1, param2, ...]
);

if (result.success) {
  console.log('Result:', result.result);
} else {
  console.error('Error:', result.error);
}
```

#### Write Methods (Transactions)

```javascript
const result = await client.callWrite(
  contractAddress,
  'methodName',
  [param1, param2, ...],
  privateKey // Signer's private key
);

if (result.success) {
  console.log('Transaction Hash:', result.transactionHash);
  console.log('Block Number:', result.blockNumber);
  console.log('Gas Used:', result.gasUsed);
  console.log('Return Values:', result.result);
}
```

### Using Wallet Instance

```javascript
const wallet = await Wallet.import({...});

// Read-only call
const result = await wallet.callContract('getUserInfo', [usernameHash]);

// Write call (requires private key)
const txResult = await wallet.callContractWrite(
  'someMethod',
  [params],
  privateKey
);
```

## Scripts and Examples

The SDK provides example scripts for common operations. Use these as templates for your own scripts.

### Example Scripts

1. **`examples/create-wallet.js`** - Create a wallet via contract
2. **`examples/contract-methods.js`** - Call various contract methods
3. **`examples/script-template.js`** - Template for creating new scripts

### Creating Your Own Script

Use the template to create scripts for calling specific contract methods:

```javascript
const { ContractClient } = require('@arnacon/wallet-sdk');

async function callMyMethod() {
  const client = new ContractClient({
    rpcUrl: 'https://...',
    contractAddress: '0x...'
  });

  const result = await client.callWrite(
    '0x...',
    'myMethod',
    ['param1', 123],
    '0x...' // private key
  );

  console.log('Result:', result);
}

callMyMethod().catch(console.error);
```

### Running Examples

```bash
# Create a wallet
node examples/create-wallet.js

# Call contract methods
node examples/contract-methods.js
```

## API Reference

### Wallet Class

#### `Wallet.create(options)`

Creates a new wallet by calling the contract's `createUser` method.

**Parameters:**
- `options.username` (String, required) - Username for the wallet
- `options.secret` (String|Buffer, required) - User's secret/password
- `options.contractAddress` (String, required) - Contract address
- `options.rpcUrl` (String, required) - RPC URL for blockchain network
- `options.signerPrivateKey` (String, required) - Private key of authorized signer
- `options.network` (String, optional) - Network name (default: 'ethereum')

**Returns:** `Promise<Wallet>`

**Example:**
```javascript
const wallet = await Wallet.create({
  username: 'alice',
  secret: 'password123',
  contractAddress: '0x...',
  rpcUrl: 'https://...',
  signerPrivateKey: '0x...'
});
```

#### `Wallet.import(options)`

Imports an existing wallet by address.

**Parameters:**
- `options.address` (String, required) - Wallet address
- `options.contractAddress` (String, required) - Contract address
- `options.rpcUrl` (String, required) - RPC URL
- `options.network` (String, optional) - Network name

**Returns:** `Promise<Wallet>`

#### `wallet.getAddress()`

Gets the wallet address.

**Returns:** `String`

#### `wallet.getPublicKey()`

Gets the wallet public key.

**Returns:** `String|Buffer`

#### `wallet.getUsername()`

Gets the username (if created via `create()`).

**Returns:** `String|null`

#### `wallet.callContract(methodName, params)`

Calls a read-only contract method.

**Parameters:**
- `methodName` (String) - Method name
- `params` (Array) - Method parameters

**Returns:** `Promise<Object>`

#### `wallet.callContractWrite(methodName, params, privateKey)`

Calls a write contract method (transaction).

**Parameters:**
- `methodName` (String) - Method name
- `params` (Array) - Method parameters
- `privateKey` (String) - Private key for signing

**Returns:** `Promise<Object>`

### ContractClient Class

#### `new ContractClient(config)`

Creates a new contract client.

**Parameters:**
- `config.network` (String) - Network name
- `config.rpcUrl` (String) - RPC URL
- `config.contractAddress` (String, optional) - Default contract address

#### `contractClient.callRead(contractAddress, methodName, params)`

Calls a read-only contract method.

**Returns:** `Promise<Object>` with `{ success, result, error }`

#### `contractClient.callWrite(contractAddress, methodName, params, privateKey)`

Calls a write contract method.

**Returns:** `Promise<Object>` with `{ success, transactionHash, blockNumber, gasUsed, result, error }`

#### `contractClient.registerContract(name, address, abi)`

Registers a contract with ABI for easier access.

## Contract Integration

### Contract ABI

The SDK includes the wallet contract ABI. Import it:

```javascript
const { WALLET_CONTRACT_ABI } = require('@arnacon/wallet-sdk');
```

### Registering Contracts

Register contracts to make calling methods easier:

```javascript
const { ContractClient, registerWalletContract } = require('@arnacon/wallet-sdk');

const client = new ContractClient({...});
registerWalletContract(client, '0x...'); // Registers with default ABI
```

### Custom Contract ABIs

For contracts with additional methods, extend the ABI:

```javascript
const customABI = [
  ...WALLET_CONTRACT_ABI,
  {
    "inputs": [...],
    "name": "myCustomMethod",
    "outputs": [...],
    "type": "function"
  }
];

client.registerContract('MyContract', '0x...', customABI);
```

### Parameter Types

When calling contract methods, ensure parameters match Solidity types:

- **Strings**: Pass as JavaScript strings
- **Bytes**: Pass as `Buffer` objects or hex strings with `0x` prefix
- **Addresses**: Pass as hex strings with `0x` prefix
- **Numbers**: Pass as JavaScript numbers or BigInt for large numbers
- **Arrays**: Pass as JavaScript arrays

**Example:**
```javascript
await client.callWrite(
  contractAddress,
  'createUser',
  [
    'alice',                           // string
    Buffer.from('secret', 'utf8')     // bytes
  ],
  privateKey
);
```

## Error Handling

Always handle errors when calling contracts:

```javascript
try {
  const wallet = await Wallet.create({...});
} catch (error) {
  if (error.reason) {
    // Contract revert reason
    console.error('Contract error:', error.reason);
  } else {
    console.error('Error:', error.message);
  }
}
```

Common errors:
- `"User already exists"` - Username is already taken
- `"Secret cannot be empty"` - Secret parameter is empty
- `"Contract address is required"` - Missing contract address
- Transaction failures - Check gas, permissions, etc.

## Best Practices

1. **Store Private Keys Securely**: Never commit private keys to version control
2. **Use Environment Variables**: Store sensitive configuration in `.env` files
3. **Handle Errors**: Always wrap contract calls in try-catch blocks
4. **Validate Inputs**: Validate usernames, addresses, etc. before calling contracts
5. **Register Contracts**: Register contracts with ABIs for better error messages
6. **Use Scripts**: Create reusable scripts for common contract operations

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.
