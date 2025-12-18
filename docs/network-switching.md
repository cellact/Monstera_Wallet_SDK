# Network Switching Guide

## Overview

The Sapphire Wallet SDK supports easy switching between Oasis Sapphire testnet and mainnet. Network configuration is handled through the SDK's config system, allowing you to switch networks with a single parameter change.

## Supported Networks

### Testnet
- **Network Name**: `sapphire-testnet`
- **Chain ID**: `23295` (0x5aff)
- **Default RPC URL**: `https://testnet.sapphire.oasis.io`
- **Explorer**: `https://testnet.explorer.sapphire.oasis.io`
- **Use Case**: Development, testing, and experimentation

### Mainnet
- **Network Name**: `sapphire-mainnet`
- **Chain ID**: `23294` (0x5afe)
- **Default RPC URL**: `https://sapphire.oasis.io`
- **Explorer**: `https://explorer.sapphire.oasis.io`
- **Use Case**: Production deployments

## Basic Usage

### Creating SDK Instance for Testnet

```javascript
const { Monstera } = require('@arnacon/wallet-sdk');

const sdk = Monstera.fromConfig({
  network: 'testnet',
  addresses: {
    factory: '0x...', // Testnet factory address
    passwordAuth: '0x...' // Testnet password auth address
  },
  signerOrProvider: '0x...' // Private key
});
```

### Creating SDK Instance for Mainnet

```javascript
const sdk = Monstera.fromConfig({
  network: 'mainnet',
  addresses: {
    factory: '0x...', // Mainnet factory address
    passwordAuth: '0x...' // Mainnet password auth address
  },
  signerOrProvider: '0x...' // Private key
});
```

## Configuration Options

### Required Parameters

- **`network`**: `'testnet'` or `'mainnet'`
- **`addresses`**: Object containing contract addresses
  - `factory`: Factory contract address (required)
  - `passwordAuth`: Password authenticator address (required for createWallet)
- **`signerOrProvider`**: Private key string, Signer, or Provider instance

### Optional Parameters

- **`rpcUrl`**: Custom RPC URL (overrides default for the network)

## Custom RPC URLs

You can override the default RPC URL for any network:

```javascript
const sdk = Monstera.fromConfig({
  network: 'testnet',
  rpcUrl: 'https://custom-rpc-endpoint.com', // Custom RPC
  addresses: {
    factory: '0x...',
    passwordAuth: '0x...'
  },
  signerOrProvider: '0x...'
});
```

## Environment-Based Configuration

### Using Environment Variables

```javascript
require('dotenv').config();

const network = process.env.NETWORK || 'testnet'; // 'testnet' or 'mainnet'

const sdk = Monstera.fromConfig({
  network: network,
  addresses: {
    factory: process.env[`FACTORY_ADDRESS_${network.toUpperCase()}`],
    passwordAuth: process.env[`PASSWORD_AUTH_ADDRESS_${network.toUpperCase()}`]
  },
  signerOrProvider: process.env.SIGNER_PRIVATE_KEY
});
```

### Example .env File

```env
# Network
NETWORK=testnet

# Testnet Addresses
FACTORY_ADDRESS_TESTNET=0x...
PASSWORD_AUTH_ADDRESS_TESTNET=0x...

# Mainnet Addresses
FACTORY_ADDRESS_MAINNET=0x...
PASSWORD_AUTH_ADDRESS_MAINNET=0x...

# Signer (same for both networks)
SIGNER_PRIVATE_KEY=0x...
```

## Switching Networks in Code

### Creating Separate Instances

Each SDK instance is configured for a specific network. To switch networks, create a new instance:

```javascript
// Testnet instance
const testnetSdk = Monstera.fromConfig({
  network: 'testnet',
  addresses: { /* testnet addresses */ },
  signerOrProvider: privateKey
});

// Mainnet instance
const mainnetSdk = Monstera.fromConfig({
  network: 'mainnet',
  addresses: { /* mainnet addresses */ },
  signerOrProvider: privateKey
});

// Use the appropriate instance
if (process.env.NODE_ENV === 'production') {
  await mainnetSdk.wallets.createWallet({ password: '...' });
} else {
  await testnetSdk.wallets.createWallet({ password: '...' });
}
```

### Helper Function for Network Switching

```javascript
function createSdkForNetwork(network) {
  const addresses = {
    testnet: {
      factory: process.env.FACTORY_ADDRESS_TESTNET,
      passwordAuth: process.env.PASSWORD_AUTH_ADDRESS_TESTNET
    },
    mainnet: {
      factory: process.env.FACTORY_ADDRESS_MAINNET,
      passwordAuth: process.env.PASSWORD_AUTH_ADDRESS_MAINNET
    }
  };

  return Monstera.fromConfig({
    network,
    addresses: addresses[network],
    signerOrProvider: process.env.SIGNER_PRIVATE_KEY
  });
}

// Usage
const sdk = createSdkForNetwork('testnet');
```

## Address Validation

The SDK validates that required contract addresses are provided:

```javascript
try {
  const sdk = Monstera.fromConfig({
    network: 'testnet',
    addresses: {
      // Missing factory address
    },
    signerOrProvider: privateKey
  });
} catch (error) {
  // Error: Missing required contract addresses: factory
}
```

## Network Information

You can access network information from the SDK instance:

```javascript
const sdk = Monstera.fromConfig({ /* config */ });

console.log('Network:', sdk.network);        // 'sapphire-testnet' or 'sapphire-mainnet'
console.log('Chain ID:', sdk.chainId);       // 23295 (testnet) or 23294 (mainnet)
console.log('RPC URL:', sdk.rpcUrl);         // RPC endpoint
console.log('Explorer:', sdk.config.explorerUrl); // Block explorer URL
```

## Best Practices

1. **Environment Separation**: Use different contract addresses for testnet and mainnet
2. **Private Key Security**: Never hardcode private keys. Use environment variables
3. **Network Validation**: Always verify you're using the correct network for your use case
4. **Error Handling**: Handle network errors gracefully (RPC failures, wrong network, etc.)
5. **Testing**: Always test on testnet before deploying to mainnet

## Troubleshooting

### Wrong Network Error

If you get errors about wrong network or chain ID:

1. Verify the `network` parameter is correct (`'testnet'` or `'mainnet'`)
2. Check that contract addresses match the network
3. Ensure your RPC URL matches the network

### RPC Connection Issues

If RPC connection fails:

1. Check your internet connection
2. Verify the RPC URL is correct
3. Try using a different RPC endpoint
4. Check if the network is experiencing issues

### Address Mismatch

If transactions fail with address errors:

1. Verify contract addresses are correct for the network
2. Ensure contracts are deployed on the target network
3. Check that addresses are in correct format (0x followed by 40 hex characters)

