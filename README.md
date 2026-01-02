# Monstera SDK

[![npm version](https://img.shields.io/npm/v/@monstera_protocol/sdk.svg)](https://www.npmjs.com/package/@monstera_protocol/sdk)
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

### Node.js / Bundlers

```bash
npm install @monstera_protocol/sdk
```

**Note:** This SDK uses ES Modules (ESM). Make sure your project supports ESM or use a bundler that handles ESM.

The SDK provides multiple entry points via `package.json` exports:
- **Default**: `import { Monstera } from '@monstera_protocol/sdk'` → Uses ESM build (`dist/monstera.mjs`) for browsers, or source (`src/index.js`) for Node.js
- **ESM Build**: `import { Monstera } from '@monstera_protocol/sdk/mjs'` → Direct access to `dist/monstera.mjs`
- **IIFE Global**: Available at `dist/monstera.global.js` (for script tags) or via `@monstera_protocol/sdk/global` in package exports

### Browser

#### Option A: ESM (Modern Browsers)

```html
<script type="module">
  import { Monstera } from './node_modules/@monstera_protocol/sdk/dist/monstera.mjs';
  import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6/dist/index.min.mjs';
  
  const sdk = Monstera.connect({
    network: 'testnet',
    signer: 'your_private_key'
  });
</script>
```

**Note:** For production, host `dist/monstera.mjs` on your CDN or use a bundler.

#### Option B: IIFE Global (Script Tag)

```html
<!-- Load ethers first (required) -->
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>

<!-- Load Monstera SDK (queue stub is automatically included in the build) -->
<script src="./node_modules/@monstera_protocol/sdk/dist/monstera.global.js"></script>

<script>
  const sdk = window.Monstera.connect({
    network: 'testnet',
    signer: 'your_private_key'
  });
  
  // Error classes are also exposed on window.Monstera
  console.log(window.Monstera.WalletError);
  console.log(window.Monstera.ValidationError);
</script>
```

**Note:** 
- The IIFE build (`monstera.global.js`) automatically includes a queue stub, so you can call `Monstera()` before the script loads if needed.
- All error classes are automatically exposed on `window.Monstera` (e.g., `window.Monstera.WalletError`).
- For production, host `dist/monstera.global.js` on your CDN.

#### Async Loading with Queue Stub

The IIFE build (`monstera.global.js`) automatically includes a queue stub, so you can call `Monstera()` before the script loads:

```html
<!-- Load ethers first -->
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>

<!-- Optional: Call Monstera before script loads (will be queued automatically) -->
<script>
  // The queue stub is built into monstera.global.js, but you can also add it manually
  // if you want to call Monstera before the script tag executes
  Monstera = Monstera || function() {
    (Monstera.q = Monstera.q || []).push(arguments);
  };
  Monstera.q = Monstera.q || [];
  
  // Call Monstera before script loads (queued)
  Monstera('connect', { network: 'testnet', signer: '0x...' });
</script>

<!-- Load SDK asynchronously -->
<script>
  (function() {
    var script = document.createElement('script');
    script.async = true;
    script.src = './node_modules/@monstera_protocol/sdk/dist/monstera.global.js';
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  })();
</script>
```

**Note:** The queue stub is automatically included in `monstera.global.js`, so queued calls will be processed when the SDK loads.

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
import { Monstera } from '@monstera_protocol/sdk';
import { ethers } from 'ethers';

// Create SDK instance for testnet (with signer for write operations)
const sdk = Monstera.connect({
  network: 'testnet', // or 'mainnet'
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

async function createWallet() {
  
  // Prepare auth config (password hash for PasswordAuthenticator)
  const password = 'my-secure-password'; // Replace with your password
  const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));

  // Create a wallet
  const result = await sdk.factory.createWallet({
    authConfig: passwordHash
    // authenticator is optional - defaults to PasswordAuthenticator
  });

  return result;
}

createWallet();
```

### Network Switching

```javascript
import { Monstera } from '@monstera_protocol/sdk';
import { ethers } from 'ethers';

// Testnet configuration (with signer for write operations)
const testnetSdk = Monstera.connect({
  network: 'testnet',
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Mainnet configuration
const mainnetSdk = Monstera.connect({
  network: 'mainnet',
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Read-only instance (no signer, read operations only)
const readonlySdk = Monstera.readonly({
  network: 'testnet'
  // provider is optional - will use default RPC if not provided
});

// Access network information
console.log('Network:', testnetSdk.network); // 'sapphire-testnet'
console.log('Chain ID:', testnetSdk.chainId); // 23295
console.log('RPC URL:', testnetSdk.rpcUrl);
console.log('Addresses:', testnetSdk.addresses);
```

## Architecture

The SDK is organized into modular components:

### Modules

- **`base/`**: Base classes (BaseContractClient, SapphireWriteWrapper)
- **`config/`**: Network presets, address validation, and SDK configuration
- **`providers/`**: Ethers provider creation and Sapphire wrapper integration
- **`crypto/`**: Mnemonic generation, seed derivation, and password hashing
- **`contracts/`**: Contract ABIs and typed contract getters
- **`clients/`**: Domain clients (factory, logic, keyVault, auth)
- **`events/`**: Event definitions and receipt parsing
- **`errors/`**: Consistent error types with stable error codes
- **`internal/`**: Internal utilities (validation helpers)
- **`sdk/`**: Main SDK class (Monstera)
- **`utils/`**: Utility functions

### API Design

- **Read operations**: Use plain provider (no wrapper needed)
- **Write operations**: Automatically use Sapphire-wrapped signer for encrypted transactions
- **Network switching**: Single config parameter (`'testnet'` or `'mainnet'`)

## Configuration

### Network Presets

The SDK includes presets for both networks:

- **Testnet**: 
  - Name: `sapphire-testnet`
  - Chain ID: `23295` (0x5aff)
  - RPC URL: `https://testnet.sapphire.oasis.dev`
  - Explorer: `https://testnet.explorer.sapphire.oasis.io`

- **Mainnet**: 
  - Name: `sapphire-mainnet`
  - Chain ID: `23294` (0x5afe)
  - RPC URL: `https://sapphire.oasis.io`
  - Explorer: `https://explorer.sapphire.oasis.io`

### Address Overrides

You can override default contract addresses when creating the SDK:

```javascript
const sdk = Monstera.connect({
  network: 'testnet',
  signer: 'your_private_key', // Private key string or ethers Signer instance
  addresses: {
    factory: '0x...',               // Override factory address
    passwordAuth: '0x...',          // Override password authenticator
    walletSignatureAuth: '0x...'    // Override wallet signature authenticator
  }
});
```

**Note:** You can override individual addresses or all of them. Addresses not provided will use the defaults for the selected network.

### Custom RPC URLs

Override the default RPC URL:

```javascript
const sdk = Monstera.connect({
  network: 'testnet',
  rpcUrl: 'https://custom-rpc-endpoint.com',
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Or with address overrides
const sdkWithOverrides = Monstera.connect({
  network: 'testnet',
  rpcUrl: 'https://custom-rpc-endpoint.com',
  addresses: {
    factory: '0x99a98ea83F5b62D2F26A72C85459ae6c75b44C2a',
    passwordAuth: '0xc54aDC2B8Dc7b2AF787c8a30945e32CdB1bB2ee7',
    walletSignatureAuth: '0xe31a99416d2E3a807a5e379AFbc2e230bff2Ee9a'
  },
  signer: 'your_private_key' // Private key string or ethers Signer instance
});
```

## Examples

### Browser Examples

The SDK includes browser examples in `examples/browser/` demonstrating both ESM and IIFE usage:

- **`browser-esm.html`** - ESM usage with `<script type="module">`
- **`browser-global.html`** - IIFE global bundle usage
- **`browser-global-async.html`** - Async loading with queue stub

### Node.js Examples

The SDK includes comprehensive Node.js examples in `examples/nodejs/`:

**Wallet Creation:**
- **`1_createHDWallet.js`** - Create a hierarchical deterministic wallet
- **`1.2_createWalletWithHook.js`** - Create wallet with initialization hook
- **`1.3_createWalletCore.js`** - Create wallet core functionality
- **`1.4_createWalletCustom.js`** - Create wallet with custom logic

**Wallet Usage:**
- **`2_useWallet.js`** - Basic wallet usage examples
- **`3_useWalletSigAuth.js`** - Wallet signature authentication
- **`4_getAddress.js`** - Get account addresses
- **`6.1_signTransaction.js`** - Sign transactions
- **`6.2_getAccounts.js`** - Get multiple account addresses

**Authentication:**
- **`authenticator.js`** - Authenticator operations
- **`changePassword.js`** - Change wallet password
- **`changeAuthenticator.js`** - Change authenticator (WalletLogic)
- **`changeAuthenticatorKeyVault.js`** - Change authenticator (KeyVault)
- **`passwordAuthMethods.js`** - Password authenticator methods
- **`walletSigAuth.js`** - Wallet signature authenticator methods
- **`removeWhitelistedWallet.js`** - Remove from whitelist

**Administration:**
- **`5_ugradeToNewLogic.js`** - Upgrade wallet logic implementation
- **`13.2_upgradeKeyVault.js`** - Upgrade KeyVault implementation
- **`transferAdmin.js`** - Transfer factory admin
- **`factoryMethods.js`** - Factory contract methods
- **`walletLogicMethods.js`** - Wallet logic contract methods
- **`keyVaultMethods.js`** - Key vault operations
- **`network-switching.js`** - Switch between testnet and mainnet

### Running Examples

```bash
# Set up environment variables
export SIGNER_PRIVATE_KEY=0x...

# Run a Node.js example
node examples/nodejs/1_createHDWallet.js

# Or run a browser example by opening the HTML file in a browser
open examples/browser/browser-esm.html
```

**Note:** Examples use ES Modules. Ensure you're using Node.js 14+ with ESM support, or use a bundler.

## API Reference

### Monstera

Main SDK class for wallet operations.

#### `Monstera.connect(options)`

Create an SDK instance with write capabilities (requires signer).

**Parameters:**
- `network` (required): `'testnet'` or `'mainnet'`
- `signer` (required): Private key string (0x-prefixed hex) or ethers Signer instance
- `rpcUrl` (optional): Custom RPC URL (overrides default)
- `addresses` (optional): Object with contract addresses to override defaults

**Returns:** `Monstera` instance with write capabilities

#### `Monstera.readonly(options)`

Create a read-only SDK instance (no signer required).

**Parameters:**
- `network` (required): `'testnet'` or `'mainnet'`
- `provider` (optional): ethers Provider instance (uses default RPC if not provided)
- `rpcUrl` (optional): Custom RPC URL (overrides default)
- `addresses` (optional): Object with contract addresses to override defaults

**Returns:** `Monstera` instance (read-only)

#### `sdk.factory.createWallet(options)`

Create a new wallet.

**Parameters:**
- `authConfig` (required): Authentication configuration (e.g., password hash as hex string)
- `authenticator` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:**
```javascript
{
  success: boolean,
  wallet: string,           // Wallet address
  keyVault: string,         // KeyVault address
  storage: string,          // Storage address
  authenticator: string,    // Authenticator address
  transactionHash: string,  // Transaction hash
  blockNumber: number,      // Block number
  gasUsed: string,          // Gas used
  mnemonic: string          // Generated mnemonic (save securely!)
}
```

#### SDK Instance Methods

```javascript
// Check if SDK instance can perform write operations
const canWrite = sdk.canWrite(); // boolean

// Get the signer address (if available)
const signerAddress = await sdk.getSignerAddress(); // string | null

// Create an auth proof for wallet signature authentication
const authProof = await sdk.createAuthProof({
  signer: walletSigner,        // Wallet or HDNodeWallet instance
  keyVault: keyVaultAddress,   // KeyVault address
  authenticator: '0x...',      // Optional: authenticator address (defaults to config)
  deadline: 1234567890,         // Optional: Unix timestamp (defaults to 1h from now)
  chainId: 23295               // Optional: Chain ID (defaults to config chainId)
});
```

#### SDK Clients

The SDK provides access to domain-specific clients:

```javascript
// Factory client - wallet creation and factory administration
await sdk.factory.createWallet({ authConfig });
await sdk.factory.isWallet({ walletAddress });
await sdk.factory.getAdmin();

// Logic client - wallet operations and account management
await sdk.logic.getKeyVault({ walletAddress });
await sdk.logic.getAuthenticator({ walletAddress });
await sdk.logic.getAccountAddress({ walletAddress, index });

// KeyVault client - key vault operations and signing
await sdk.keyVault.getStorageAddr({ keyVaultAddress });
await sdk.keyVault.getAuthenticator({ keyVaultAddress });
await sdk.keyVault.signTransaction({ keyVaultAddress, ... });

// Auth client - authenticator management
const passwordAuth = sdk.auth.getClient('password');
const walletSigAuth = sdk.auth.getClient('walletSignature');
```

### Exports

The SDK exports the following:

```javascript
import {
  // Main SDK class (default export)
  Monstera,
  
  // Error classes (automatically exported - no manual maintenance required)
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  EventParseError,
  SapphireRequiredError,
  WriteRequiresSignerError
} from '@monstera_protocol/sdk';

// Access network presets and addresses via static properties
const networks = Monstera.networks;
const defaultAddresses = Monstera.defaultAddresses;
const requiredAddresses = Monstera.requiredAddresses;
```

**Note:** Error classes are automatically exported from `src/errors/index.js`. Adding a new error class to that file will automatically make it available in the SDK exports.

## Security Considerations

1. **Never expose private keys** in client-side code or logs
2. **Store mnemonics securely** 
3. **Use testnet for development** - only use mainnet for production
4. **Validate contract addresses** before use
5. **Use environment variables** for sensitive configuration

## Error Handling

The SDK uses consistent error types with stable error codes:

- `WalletError` - Base error class
- `ValidationError` - Invalid input parameters (code: `INVALID_ARGUMENT`)
- `ConfigError` - Missing or invalid configuration (code: `MISSING_CONFIG`)
- `NetworkError` - Network/RPC communication failures (code: `RPC_ERROR`)
- `ContractRevertError` - Transaction reverted on-chain (code: `TX_REVERTED`)
- `EventNotFoundError` - Expected event missing from receipt (code: `EVENT_NOT_FOUND`)
- `EventParseError` - Event found but failed to parse/decode (code: `EVENT_PARSE_ERROR`)
- `SapphireRequiredError` - Operation requires Sapphire signer (code: `SAPPHIRE_REQUIRED`)
- `WriteRequiresSignerError` - Write operation requires signer (code: `WRITE_REQUIRES_SIGNER`)

```javascript
try {
  await sdk.factory.createWallet({ authConfig: passwordHash });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    console.error('Parameter:', error.context.parameter);
  } else if (error instanceof ContractRevertError) {
    console.error('Transaction reverted:', error.message);
    console.error('Transaction hash:', error.context.transactionHash);
  } else if (error.code === 'RPC_ERROR') {
    console.error('Network error:', error.message);
  }
}
```

## Development

### Project Structure

```
src/             # Source code
  base/          # Base classes (BaseContractClient, SapphireWriteWrapper)
  config/        # Network configuration
  providers/     # Provider and Sapphire wrapper
  crypto/        # Cryptographic utilities
  contracts/     # Contract interfaces and ABIs
  clients/       # Domain clients (factory, logic, keyVault, auth)
  events/        # Event definitions and parsing
  errors/        # Error types (single source of truth for error exports)
  internal/      # Internal utilities (validation helpers)
  sdk/           # Main SDK class (Monstera)
  utils/         # Utility functions
build/           # Build entry points (browser-global.js)
dist/            # Build outputs (monstera.mjs, monstera.global.js) - gitignored
examples/
  nodejs/        # Node.js examples
  browser/       # Browser HTML examples
```

### Building

The SDK uses Rollup to build browser bundles:

```bash
# Build browser bundles (ESM and IIFE)
npm run build

# Watch mode for development
npm run build:watch
```

This generates:
- `dist/monstera.mjs` - ESM build for modern browsers
- `dist/monstera.global.js` - IIFE global bundle for script tags

**Note:** Builds are automatically generated before publishing via `prepublishOnly` script. The `dist/` directory is gitignored.

### Requirements

- Node.js >= 14.0.0 (ESM support required)
- ethers.js ^6.0.0
- @oasisprotocol/sapphire-ethers-v6 ^6.0.1

**Note:** This SDK uses ES Modules (ESM). Ensure your project is configured for ESM or use a bundler that supports ESM.

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

