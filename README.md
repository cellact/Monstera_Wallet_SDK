# Sapphire Wallet SDK

A TypeScript/JavaScript SDK for interacting with wallet smart contracts on Oasis Sapphire. Provides a clean API for creating and managing wallets with encrypted transaction support.

## Features

- ✅ **One-line network switching** between `sapphire-testnet` and `sapphire-mainnet`
- ✅ **Single config** defining RPC + chain + contract addresses
- ✅ **Clean API surface**: read methods (public queries) and write methods (encrypted transactions via Sapphire wrapper)
- ✅ **First-class support** for `createWallet()` via `WalletFactory.createWallet()`
- ✅ **Modular architecture** with separation of concerns

## Installation

```bash
npm install @arnacon/wallet-sdk
```

## Quick Start

### Basic Usage

```javascript
const { SapphireWalletSDK } = require('@arnacon/wallet-sdk');

// Create SDK instance
const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet', // or 'mainnet'
  addresses: {
    factory: '0x...', // Factory contract address
    passwordAuth: '0x...' // Password authenticator address
  },
  signerOrProvider: '0x...' // Private key or Signer instance
});

// Create a wallet
const result = await sdk.wallets.createWallet({
  password: 'my-secure-password'
});

console.log('Wallet Address:', result.wallet);
console.log('Transaction:', result.transactionHash);
```

### Network Switching

```javascript
// Testnet
const testnetSdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  addresses: { /* testnet addresses */ },
  signerOrProvider: privateKey
});

// Mainnet
const mainnetSdk = SapphireWalletSDK.fromConfig({
  network: 'mainnet',
  addresses: { /* mainnet addresses */ },
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

## API Reference

### SapphireWalletSDK

Main SDK class for wallet operations.

#### `SapphireWalletSDK.fromConfig(options)`

Create an SDK instance from configuration.

**Parameters:**
- `network` (required): `'testnet'` or `'mainnet'`
- `addresses` (required): Object with contract addresses
  - `factory`: Factory contract address
  - `passwordAuth`: Password authenticator address
- `signerOrProvider` (required): Private key string, Signer, or Provider instance
- `rpcUrl` (optional): Custom RPC URL (overrides default)

**Returns:** `SapphireWalletSDK` instance

### Wallet Operations

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

**Example:**
```javascript
const result = await sdk.wallets.createWallet({
  password: 'my-password',
  returnMnemonic: false
});
```

## Configuration

### Network Presets

The SDK includes presets for both networks:

- **Testnet**: Chain ID `23295`, RPC `https://testnet.sapphire.oasis.io`
- **Mainnet**: Chain ID `23294`, RPC `https://sapphire.oasis.io`

### Address Overrides

You can override default addresses when creating the SDK:

```javascript
const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  addresses: {
    factory: '0x...', // Your deployed factory address
    passwordAuth: '0x...' // Your deployed password auth address
  },
  signerOrProvider: privateKey
});
```

### Custom RPC URLs

Override the default RPC URL:

```javascript
const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  rpcUrl: 'https://custom-rpc-endpoint.com',
  addresses: { /* ... */ },
  signerOrProvider: privateKey
});
```

## Examples

See the `/examples` directory for complete examples:

- `createWallet-new.js` - Create wallet example
- `network-switching.js` - Network switching examples

## Documentation

- [createWallet() Method](./docs/createWallet.md) - Detailed documentation for wallet creation
- [Network Switching Guide](./docs/network-switching.md) - How to switch between networks

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

## Support

For issues and questions, please open an issue on GitHub.

