# API Reference

Complete API documentation for the Monstera SDK.

## Monstera

Main SDK class for wallet operations.

### `Monstera.connect(options)`

Create an SDK instance with write capabilities (requires signer).

**Parameters:**
- `mainnet` (required): `true` for mainnet, `false` for testnet
- `signer` (required): Private key string (0x-prefixed hex) or ethers Signer instance
- `rpcUrl` (optional): Custom RPC URL (overrides default)
- `addresses` (optional): Object with contract addresses to override defaults (`factory`, `passwordAuth`, `walletSignatureAuth`, `dualFactorAuth`, `passwordMinuteSignatureAuth`)
- `logLevel` (optional): `'error'` | `'warn'` | `'info'` | `'debug'` (default: `'error'`)
- `debug` (optional): If `true`, sets log level to `'debug'`
- `checkVersion` (optional): If `false`, skips npm version check on connect

**Returns:** `Monstera` instance with write capabilities

### `Monstera.readonly(options)`

Create a read-only SDK instance (no signer required).

**Parameters:**
- `mainnet` (required): `true` for mainnet, `false` for testnet
- `provider` (optional): ethers Provider instance (uses default RPC if not provided)
- `rpcUrl` (optional): Custom RPC URL (overrides default)
- `addresses` (optional): Object with contract addresses to override defaults
- `logLevel` (optional): Same as `connect()`
- `debug` (optional): Same as `connect()`
- `checkVersion` (optional): Same as `connect()`

**Returns:** `Monstera` instance (read-only)

## Wallet Creation Methods

### `sdk.createWallet(options)`

Create a new wallet with auto-generated mnemonic.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes)
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

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

### `sdk.createWalletFromMnemonic(options)`

Create a new wallet from a provided mnemonic.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes)
- `mnemonic` (required): BIP39 mnemonic phrase
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

### `sdk.createWalletWithHook(options)`

Create a wallet with a post-creation hook.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes)
- `hookAddr` (required): Hook contract address
- `hookData` (required): Data for the hook
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

### `sdk.createWalletCore(options)`

Create a wallet core (KeyVault + Storage only, no WalletLogic proxy).

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes)
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

### `sdk.createWalletWithCustomLogic(options)`

Create a wallet with a custom logic implementation.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes)
- `customLogicImplAddr` (required): Custom logic implementation contract address
- `logicData` (required): Initialization data for custom logic
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

## SDK Instance Methods

```javascript
// Check if SDK instance can perform write operations
const hasWriteAccess = sdk.hasWriteAccess(); // boolean

// Get the signer address (if available)
const signerAddress = await sdk.getSignerAddr(); // string | null

// Set log level at runtime ('error' | 'warn' | 'info' | 'debug')
sdk.setLogLevel('debug');

// Create an auth proof for wallet signature authentication
const authProof = await sdk.createAuthProofWalletSignature({
  signer: walletSigner,        // Wallet or HDNodeWallet instance
  keyVaultAddr: keyVaultAddr,  // KeyVault address
  authenticatorAddr: '0x...',  // Optional: authenticator address (defaults to config)
  deadline: 1234567890,        // Optional: Unix timestamp (defaults to 1h from now)
  chainId: 23295              // Optional: Chain ID (defaults to config chainId)
});
```

## SDK Clients

The SDK provides access to domain-specific clients:

```javascript
// Factory client - wallet creation and factory administration
await sdk.createWallet({ authConfig });
await sdk.createWalletFromMnemonic({ authConfig, mnemonic });
await sdk.createWalletWithHook({ authConfig, hookAddr, hookData });
await sdk.createWalletCore({ authConfig });
await sdk.createWalletWithCustomLogic({ authConfig, customLogicImplAddr, logicData });
await sdk.isWallet({ walletAddr });
await sdk.getAdmin();
await sdk.getWalletLogicImplAddr();
await sdk.getKeyVaultAddr({ walletAddr });
await sdk.getStorageAddr({ walletAddr });
await sdk.getBeaconAddr();
await sdk.getSecretVaultAddr({ walletAddr });
await sdk.updateWalletLogicImplAddr({ newLogicAddr });
await sdk.transferAdmin({ newAdminAddr });

// Logic client - wallet operations and account management
await sdk.initializeWalletLogic({ walletAddr, keyVaultAddr });

// KeyVault client - key vault operations and signing
// authProof may be hex bytes, Uint8Array, or a plain object when the vault uses a built-in authenticator
// (shape matches that authenticator, e.g. { password: Uint8Array } for password auth — see types in src/types/index.js)
await sdk.getKeyVaultStorageAddr({ keyVaultAddr });
await sdk.getAuthenticatorAddr({ keyVaultAddr });
await sdk.getKeyVaultImplAddr({ keyVaultAddr });
await sdk.isInitialized({ keyVaultAddr });
await sdk.getAccountAddr({ keyVaultAddr, index });
await sdk.getAccountAddresses({ keyVaultAddr, fromIndex, count });
await sdk.signTransaction({ keyVaultAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId });
await sdk.signMessage({ keyVaultAddr, authProof, index, message });
await sdk.sign({ keyVaultAddr, authProof, index, hash });
await sdk.executeWithAuth({ keyVaultAddr, authProof, implCall });
await sdk.initialize({ keyVaultAddr, storageAddr, authenticatorAddr, accessToken });
await sdk.updateKeyVaultImplAddr({ keyVaultAddr, authProof, newImplAddr });
await sdk.updateAuthenticatorAddr({ keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig });

// Auth client - authenticator management
const passwordAuth = sdk.getAuthClient('password');
const walletSigAuth = sdk.getAuthClient('walletSignature');
const dualFactorAuth = sdk.getAuthClient('dualFactor');
const passwordMinuteSigAuth = sdk.getAuthClient('passwordMinuteSignature');
const availableTypes = sdk.getAvailableAuthTypes(); // includes 'walletSignature', 'password', 'dualFactor', 'passwordMinuteSignature'
```

## Exports

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
  await sdk.createWallet({ authConfig: passwordHash });
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

