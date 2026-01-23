# Node.js Installation & Usage

## Installation

```bash
npm install @monstera_protocol/sdk
```

**Note:** This SDK uses ES Modules (ESM). Make sure your project supports ESM or use a bundler that handles ESM.

## Peer Dependencies

Monstera requires either `ethers` or `web3` as a peer dependency:

```bash
# Using ethers (recommended)
npm install ethers

# Or using web3
npm install web3
```

## Basic Usage

```javascript
import { Monstera } from '@monstera_protocol/sdk';
import { ethers } from 'ethers';

// Create SDK instance for testnet (with signer for write operations)
const sdk = Monstera.connect({
  mainnet: false, // or true for mainnet
  signer: 'your_private_key' // Private key string or ethers Signer instance
});
```

## Network Switching

```javascript
import { Monstera } from '@monstera_protocol/sdk';

// Testnet configuration (with signer for write operations)
const testnetSdk = Monstera.connect({
  mainnet: false,
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Mainnet configuration
const mainnetSdk = Monstera.connect({
  mainnet: true,
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Read-only instance (no signer, read operations only)
const readonlySdk = Monstera.readonly({
  mainnet: false
  // provider is optional - will use default RPC if not provided
});

// Access network information
console.log('Network:', testnetSdk.network); // 'sapphire-testnet'
console.log('Chain ID:', testnetSdk.chainId); // 23295
console.log('RPC URL:', testnetSdk.rpcUrl);
console.log('Addresses:', testnetSdk.addresses);
```

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
  mainnet: false,
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
  mainnet: false,
  rpcUrl: 'https://custom-rpc-endpoint.com',
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Or with address overrides
const sdkWithOverrides = Monstera.connect({
  mainnet: false,
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

The SDK includes comprehensive Node.js examples in `examples/nodejs/`:

**Wallet Creation:**
- **`1_createHDWallet.js`** - Create a hierarchical deterministic wallet
- **`1.2_createWalletWithHook.js`** - Create wallet with initialization hook
- **`1.3_createWalletCore.js`** - Create wallet core functionality
- **`1.4_createWalletCustom.js`** - Create wallet with custom logic
- **`1.5_createWalletWithMnemonic.js`** - Create wallet from provided mnemonic

**Wallet Usage:**
- **`2_useWallet.js`** - Basic wallet usage examples
- **`3_useWalletSigAuth.js`** - Wallet signature authentication
- **`4_getAddress.js`** - Get account addresses
- **`6.1_signTransaction.js`** - Sign transactions
- **`6.2_getAccounts.js`** - Get multiple account addresses

**Authentication:**
- **`authenticator.js`** - Authenticator operations
- **`updatePassword.js`** - Update wallet password
- **`updateAuthenticator.js`** - Update authenticator
- **`passwordAuthMethods.js`** - Password authenticator methods
- **`walletSigAuth.js`** - Wallet signature authenticator methods
- **`removeWhitelistedWallet.js`** - Remove from whitelist

**Administration:**
- **`5_ugradeToNewLogic.js`** - Update wallet logic implementation
- **`13.2_updateKeyVault.js`** - Update KeyVault implementation
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
```

**Note:** Examples use ES Modules. Ensure you're using Node.js 14+ with ESM support, or use a bundler.

