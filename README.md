# Monstera SDK

[![npm version](https://img.shields.io/npm/v/@monstera/sdk.svg)](https://www.npmjs.com/package/@monstera/sdk)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A JavaScript SDK for interacting with wallet smart contracts on Oasis Sapphire. Monstera provides a clean, type-safe API for creating and managing wallets with built-in support for encrypted transactions via Sapphire's confidential computing.

## Features

- 🔐 **Encrypted Transactions** - Automatic Sapphire wrapper integration for confidential transactions
- 🌐 **Network Support** - Built-in support for Sapphire testnet and mainnet
- 🔑 **Wallet Management** - Create, manage, and interact with smart contract wallets
- 🔒 **Multiple Authenticators** - Support for password and wallet signature authentication
- 📦 **Modular Architecture** - Clean separation of concerns with extensible design
- ⚡ **Easy Integration** - Simple API with comprehensive error handling

## Installation

```bash
npm install @monstera/sdk
```

### Peer Dependencies

Monstera requires either `ethers` or `web3` as a peer dependency:

```bash
# Using ethers (recommended)
npm install ethers

# Or using web3
npm install web3
```

## Quick Start

### Simple Usage (Recommended)

Contract addresses are **hardcoded** - no configuration needed! Just install and use:

```javascript
const { Monstera } = require('@monstera/sdk');

// Create SDK instance for testnet
const sdk = Monstera.fromConfig({
  network: 'testnet', // or 'mainnet'
  signerOrProvider: '0x...' // Private key or Signer instance
});

// Create a wallet
const result = await sdk.wallets.createWallet({
  password: 'my-secure-password'
});

console.log('Wallet Address:', result.wallet);
console.log('Transaction Hash:', result.transactionHash);
console.log('Block Number:', result.blockNumber);
```

### Network Switching

```javascript
const { Monstera } = require('@monstera/sdk');

// Testnet configuration
const testnetSdk = Monstera.fromConfig({
  network: 'testnet',
  signerOrProvider: privateKey
});

// Mainnet configuration
const mainnetSdk = Monstera.fromConfig({
  network: 'mainnet',
  signerOrProvider: privateKey
});
```

## Architecture

The SDK is organized into modular components:

### Modules

- **`config/`**: Network presets, address validation, and SDK configuration
- **`provider/`**: Ethers provider creation and Sapphire wrapper integration
- **`crypto/`**: Mnemonic generation, seed derivation, and auth config encoding
- **`contracts/`**: Typed contract getters (factory, wallet, storage, authenticators)
- **`client/`**: Main SDK class exposing read/write methods
- **`errors/`**: Consistent error types

### API Design

- **Read operations**: Use plain provider (no wrapper needed)
- **Write operations**: Automatically use Sapphire-wrapped signer for encrypted transactions
- **Network switching**: Single config parameter (`'testnet'` or `'mainnet'`)

## Configuration

### Network Presets

The SDK includes presets for both networks:

- **Testnet**: Chain ID `23295`, RPC `https://testnet.sapphire.oasis.dev`
- **Mainnet**: Chain ID `23294`, RPC `https://sapphire.oasis.io`

### Address Overrides

You can override default addresses when creating the SDK:

```javascript
const sdk = Monstera.fromConfig({
  network: 'testnet',
  signerOrProvider: privateKey
});
```

### Custom RPC URLs

Override the default RPC URL:

```javascript
const sdk = Monstera.fromConfig({
  network: 'testnet',
  rpcUrl: 'https://custom-rpc-endpoint.com',
  addresses: { /* ... */ },
  signerOrProvider: privateKey
});
```

## Examples

The SDK includes comprehensive examples in the `/examples` directory:

- **`1_createHDWallet.js`** - Create a hierarchical deterministic wallet
- **`1.2_createWalletWithHook.js`** - Create wallet with initialization hook
- **`1.3_createWalletCore.js`** - Create wallet core functionality
- **`1.4_createWalletCustom.js`** - Create wallet with custom logic
- **`2_useWallet.js`** - Basic wallet usage examples
- **`3_useWalletSigAuth.js`** - Wallet signature authentication
- **`network-switching.js`** - Switch between testnet and mainnet
- **`walletLogicMethods.js`** - Wallet logic contract methods
- **`keyVaultMethods.js`** - Key vault operations
- **`factoryMethods.js`** - Factory contract methods

### Running Examples

```bash
# Set up environment variables
export SIGNER_PRIVATE_KEY=0x...
export TEST_PASSWORD=your-secure-password

# Run an example
node examples/1_createHDWallet.js
```

## Documentation

- [createWallet() Method](./docs/createWallet.md) - Detailed documentation for wallet creation
- [Network Switching Guide](./docs/network-switching.md) - How to switch between networks

## API Reference

### Monstera

Main SDK class for wallet operations.

#### `Monstera.fromConfig(options)`

Create an SDK instance from configuration.

**Parameters:**
- `network` (required): `'testnet'` or `'mainnet'`
- `addresses` (required): Object with contract addresses
  - `factory`: Factory contract address
  - `passwordAuth`: Password authenticator address
- `signerOrProvider` (required): Private key string, Signer, or Provider instance
- `rpcUrl` (optional): Custom RPC URL (overrides default)

**Returns:** `Monstera` instance

#### `sdk.wallets.createWallet(options)`

Create a new wallet.

**Parameters:**
- `password` (required): User password
- `mnemonic` (optional): BIP39 mnemonic (auto-generated if not provided)
- `returnMnemonic` (optional): Whether to return mnemonic in result (default: `false`)

**Returns:**
```javascript
{
  success: boolean,
  wallet: string,           // Wallet address
  authenticator: string,     // Authenticator address
  transactionHash: string,   // Transaction hash
  blockNumber: number,       // Block number
  gasUsed: string,          // Gas used
  mnemonic?: string         // Only if returnMnemonic: true
}
```

### Exports

The SDK exports the following:

```javascript
const {
  // Main SDK class
  Monstera,
  
  // Configuration
  NETWORKS,
  createSdkConfig,
  
  // Providers
  getReadProvider,
  getWriteSigner,
  
  // Crypto utilities
  generateMnemonic,
  deriveSeed,
  hashPassword,
  
  // Contract utilities
  getWalletFactoryContract,
  getWalletLogicContract,
  getWalletSignatureAuthenticatorContract,
  getKeyVaultContract,
  getPasswordAuthenticatorContract,
  
  // Error classes
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError
} = require('@monstera/sdk');
```

## Security Considerations

1. **Never expose private keys** in client-side code or logs
2. **Store mnemonics securely** - they're not returned by default
3. **Use testnet for development** - only use mainnet for production
4. **Validate contract addresses** before use
5. **Use environment variables** for sensitive configuration

## Error Handling

The SDK uses consistent error types:

- `WalletError` - Base error class
- `ContractError` - Contract-related errors
- `ValidationError` - Input validation errors
- `ConfigurationError` - Configuration errors
- `NetworkError` - Network/RPC errors
- `TransactionError` - Transaction errors

```javascript
try {
  await sdk.wallets.createWallet({ password: '...' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof TransactionError) {
    console.error('Transaction failed:', error.transactionHash);
  }
}
```

## Development

### Project Structure

```
src/
  config/        # Network configuration
  provider/      # Provider and Sapphire wrapper
  crypto/        # Cryptographic utilities
  contracts/     # Contract interfaces
  client/        # Main SDK class
  errors/        # Error types
```

### Requirements

- Node.js >= 14.0.0
- ethers.js ^6.0.0
- @oasisprotocol/sapphire-ethers-v6 ^6.0.1

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You must share the source code when distributing
- ✅ Any modifications must also be licensed under GPL-3.0
- ❌ You cannot incorporate this into proprietary software without sharing source

See the [LICENSE](LICENSE) file for the full text.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/Ariana0699/Wallet_SDK_JavaScript/issues)
- 💬 [Discussions](https://github.com/Ariana0699/Wallet_SDK_JavaScript/discussions)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes and version history.

## Acknowledgments

- Built for [Oasis Sapphire](https://docs.oasis.io/dapp/sapphire/)
- Uses [ethers.js](https://docs.ethers.io/) for blockchain interactions
- Powered by [Sapphire Confidential Computing](https://docs.oasis.io/dapp/sapphire/)

