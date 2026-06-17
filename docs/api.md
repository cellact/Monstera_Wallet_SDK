# API Reference

Complete API documentation for the Monstera SDK.

## Monstera

Main SDK class for wallet operations.

### `Monstera.connectAdmin(options)`

Connect as an **admin** — Sapphire-wrapped `signer` for factory and on-chain writes. Vault signing and authenticated reads require a separate end-user session; use `connectUser` or `connect` with both `signer` and `credentials` for those operations.

**Parameters:**
- `mainnet` (required): `true` for mainnet, `false` for testnet
- `signer` (required): Private key string (0x-prefixed hex) or ethers `Signer` instance
- `provider`, `rpcUrl`, `addresses`, `logLevel`, `debug`, `checkVersion` — same as below

**Returns:** `Monstera` instance with `getConnectProfile() === 'admin'`.

### `Monstera.connectUser(options)`

Connect as an **end user** — `credentials` resolve the registered wallet KeyVault; vault signing and authenticated reads work without passing `keyVaultAddr`. On-chain admin writes are blocked (no `signer`).

**Parameters:**
- `mainnet` (required): `true` for mainnet, `false` for testnet
- `credentials` (required): `{ username, password }` — factory username and UTF-8 password
- `provider`, `rpcUrl`, `addresses`, `logLevel`, `debug`, `checkVersion` — same as below

**Returns:** `Monstera` instance with `getConnectProfile() === 'user'`.

### `Monstera.connectFull(options)`

Connect with **full access** — both admin `signer` and end-user `credentials`.

**Parameters:** `mainnet`, `signer`, `credentials`, plus optional `provider`, `rpcUrl`, `addresses`, `logLevel`, `debug`, `checkVersion`.

**Returns:** `Monstera` instance with `getConnectProfile() === 'full'`.

### `Monstera.connect(options)`

Backward-compatible router:

| Options | Profile | Capabilities |
|---------|---------|--------------|
| `signer` + `credentials` | `full` | Admin writes + vault signing/reads |
| `signer` only | `admin` | Factory/admin writes only |
| `credentials` only | `user` | Vault signing/reads only |
| neither | `readonly` | Factory/network reads only |

**Parameters:**
- `mainnet` (required): `true` for mainnet, `false` for testnet
- `signer` (optional): Private key string (0x-prefixed hex) or ethers `Signer` instance
- `credentials` (optional): `{ username, password }` for end-user vault access
- `provider` (optional): You may pass an ethers `Provider` for reads; otherwise the SDK uses the default RPC for the selected network.
- `rpcUrl` (optional): Custom RPC URL (overrides default)
- `addresses` (optional): Object with contract addresses to override defaults (`factory`, `passwordAuth`, `walletSignatureAuth`, `dualFactorAuth`, `passwordMinuteSignatureAuth`)
- `logLevel` (optional): `'error'` | `'warn'` | `'info'` | `'debug'` (default: `'error'`)
- `debug` (optional): If `true`, sets log level to `'debug'`
- `checkVersion` (optional): If **`true`**, runs the npm registry version check once on connect (Node.js). If omitted or `false`, the check is skipped.

**Returns:** `Monstera` instance. Use `sdk.getConnectProfile()`, `sdk.hasWriteAccess()` (admin signer), and `sdk.hasCredentials()` to inspect capabilities.

**Session defaults (end-user):** When `credentials` are set, `keyVaultAddr` is resolved from the factory; `authProof` defaults to the session password for PasswordAuthenticator wallets; HD `index` defaults to `0`.

## Wallet Creation Methods

Factory entry points require a **non-empty** `authConfig`: either a non-zero-length hex string (already-encoded bytes) or a plain object for a built-in authenticator (which the SDK encodes before calling the contract). Empty `0x` / empty bytes are rejected at validation.

### `sdk.createWallet(options)`

Create a new wallet with auto-generated mnemonic.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes). Must be non-empty (see note above).
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

The mnemonic is returned **intentionally** so you can back it up. It stays in memory until the promise resolves (and while your code holds the result). Treat it as a secret—avoid logging it and store it safely.

### `sdk.createWalletFromMnemonic(options)`

Create a new wallet from a provided mnemonic.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes). Must be non-empty.
- `mnemonic` (required): BIP39 mnemonic phrase
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

### `sdk.createWalletWithHook(options)`

Create a wallet with a post-creation hook.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes). Must be non-empty.
- `hookAddr` (required): Hook contract address
- `hookData` (required): Data for the hook
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

### `sdk.createWalletCore(options)`

Create a wallet core (KeyVault + Storage only, no WalletLogic proxy).

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes). Must be non-empty.
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same `WalletCreationResult` shape as `createWallet()`. For this method, `wallet` and `keyVault` are intentionally the same address (the KeyVault contract is the wallet for this deployment); that is not an SDK parsing bug.

### `sdk.createWalletWithCustomLogic(options)`

Create a wallet with a custom logic implementation.

**Parameters:**
- `authConfig` (required): Hex-encoded authenticator config bytes, or a plain object when using a built-in `authenticatorAddr` from `sdk.addresses` (SDK encodes to bytes). Must be non-empty.
- `customLogicImplAddr` (required): Custom logic implementation contract address
- `logicData` (required): Initialization data for custom logic
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`

### `sdk.createWalletForUsername(options)`

Create a new wallet and register it to a normalized username (trim + lowercase before hashing). The factory stores only `keccak256(bytes(username))`, not the plaintext.

**Parameters:**
- `authConfig` (required): Same as `createWallet()`
- `username` (required): Username string (normalized by the SDK before sending on-chain)
- `authenticatorAddr` (optional): Authenticator contract address (defaults to PasswordAuthenticator)

**Returns:** Same as `createWallet()`, plus `usernameHash` from the `UsernameRegistered` event.

### `sdk.createWalletForUsernameFromMnemonic(options)`

Same as `createWalletForUsername()`, but uses a caller-supplied mnemonic instead of generating one.

**Parameters:** `authConfig`, `username`, `mnemonic`, optional `authenticatorAddr`

**Returns:** Same as `createWalletForUsername()`

### `sdk.createWalletForUsernameHash(options)`

Create a wallet registered to a precomputed username hash. Prefer this when avoiding plaintext usernames on-chain.

**Parameters:**
- `authConfig` (required)
- `usernameHash` (required): `bytes32` hash (use `sdk.hashUsername({ username })` to compute)
- `authenticatorAddr` (optional)

**Returns:** Same as `createWalletForUsername()`

### `sdk.createWalletForUsernameHashFromMnemonic(options)`

Same as `createWalletForUsernameHash()`, but uses a caller-supplied mnemonic.

**Parameters:** `authConfig`, `usernameHash`, `mnemonic`, optional `authenticatorAddr`

**Returns:** Same as `createWalletForUsername()`

## Action-bound authentication (2.0+)

KeyVaultV3 binds every auth proof to the **specific operation** being authorized. Each proof covers a canonical action hash derived from:

- `selector` — 4-byte function selector of the vault operation
- `paramsHash` — `keccak256(abi.encode(...))` of call parameters (excluding `authProof`)
- `target` (optional) — executing contract (defaults to `keyVaultAddr`)

### High-level KeyVault calls (recommended)

For `signMessage`, `sign`, `signTransaction`, `importKey`, upgrades, and similar **`Monstera`** methods, pass a **structured** `authProof` object. The SDK builds the action context automatically:

```javascript
import { toUtf8Bytes } from 'ethers';

const authProof = { password: toUtf8Bytes('your-password') };

await sdk.signMessage({
  keyVaultAddr,
  authProof,
  index: 0,
  message: toUtf8Bytes('Hello')
});
```

Supported structured shapes depend on the vault’s authenticator (e.g. `{ password: Uint8Array }`, `{ passwordHash, signer, deadline?, action? }` for dual-factor). See `src/types/index.js` for full typedefs.

### Low-level proof builders

`createAuthProofWalletSignature`, `createAuthProofMinuteSignature`, and `createAuthProofDualFactor` require an **`action`** (`selector` + `paramsHash`) or a precomputed **`actionHash`**. Use `sdk.computeActionHash()` when you need the on-chain hash explicitly.

```javascript
const authProof = await sdk.createAuthProofWalletSignature({
  signer: walletSigner,
  keyVaultAddr,
  deadline: Math.floor(Date.now() / 1000) + 3600,
  action: {
    selector: '0x...',   // 4-byte selector
    paramsHash: '0x...'    // keccak256(abi.encode(...)) of params
  }
});
```

Pre-encoded proof hex strings without action context are **not** sufficient for KeyVaultV3 gated calls.

## SDK Instance Methods

```javascript
// Check if SDK instance can perform write operations
const hasWriteAccess = sdk.hasWriteAccess(); // boolean

// Get the signer address (if available)
const signerAddress = await sdk.getSignerAddr(); // string | null

// Set log level at runtime ('error' | 'warn' | 'info' | 'debug')
sdk.setLogLevel('debug');

// Create an auth proof for wallet signature authentication (low-level; action required)
const authProof = await sdk.createAuthProofWalletSignature({
  signer: walletSigner,
  keyVaultAddr,
  deadline: Math.floor(Date.now() / 1000) + 3600,
  action: {
    selector: '0x...',
    paramsHash: '0x...'
  }
});

// Hash a normalized username (trim + lowercase)
const usernameHash = await sdk.hashUsername({ username: 'alice' });

// Resolve username hash → wallet proxy address
const walletAddr = await sdk.walletOfUsername({ usernameHash });
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
await sdk.createWalletForUsername({ authConfig, username });
await sdk.createWalletForUsernameFromMnemonic({ authConfig, username, mnemonic });
await sdk.createWalletForUsernameHash({ authConfig, usernameHash });
await sdk.createWalletForUsernameHashFromMnemonic({ authConfig, usernameHash, mnemonic });
await sdk.hashUsername({ username });
await sdk.walletOfUsername({ usernameHash });
await sdk.getWalletUsernameHash({ walletAddr });
await sdk.isWallet({ walletAddr });
await sdk.getAdmin();
await sdk.getWalletLogicImplAddr();
await sdk.getKeyVaultAddr({ walletAddr });
await sdk.getStorageAddr({ walletAddr });
await sdk.getBeaconAddr();
await sdk.getSecretVaultAddr({ walletAddr });
await sdk.getKeyVaultTemplate();
await sdk.allowedAuthenticators({ authenticatorAddr });
await sdk.allowedKeyVaultImplementations({ implementationAddr });
await sdk.isFactoryImplementationApproved({ keyVaultAddr, implementationAddr });
await sdk.isFactoryAuthenticatorApproved({ keyVaultAddr, authenticatorAddr });
await sdk.updateWalletLogicImplAddr({ newLogicAddr });
await sdk.transferAdmin({ newAdminAddr });
await sdk.setAuthenticatorAllowed({ authenticatorAddr, allowed });
await sdk.setKeyVaultImplementationAllowed({ implementationAddr, allowed });
await sdk.setWalletImplementationAllowed({ walletOrKeyVaultAddr, implementationAddr, allowed });
await sdk.setWalletAuthenticatorAllowed({ walletOrKeyVaultAddr, authenticatorAddr, allowed });

// Logic client (`sdk.logic`) — WalletLogic proxy contract. Monstera wraps `initializeWalletLogic` here only;
// prefer KeyVault methods on `sdk` below for signing and accounts (WalletLogic delegates to KeyVault anyway).
await sdk.initializeWalletLogic({ walletAddr, keyVaultAddr });

// KeyVault-shaped API on `sdk` — signing, accounts, upgrades (`keyVaultAddr`)
// authProof: structured object for the vault's authenticator (SDK binds action automatically)
// e.g. { password: Uint8Array } for password auth — see types in src/types/index.js
await sdk.getKeyVaultStorageAddr({ keyVaultAddr });
await sdk.getAuthenticatorAddr({ keyVaultAddr });
await sdk.getKeyVaultImplAddr({ keyVaultAddr });
await sdk.getPolicyRegistry({ keyVaultAddr });
await sdk.isInitialized({ keyVaultAddr });
await sdk.computeActionHash({ keyVaultAddr, selector, paramsHash });
await sdk.isImplementationApproved({ keyVaultAddr, implementationAddr });
await sdk.isAuthenticatorApproved({ keyVaultAddr, authenticatorAddr });
await sdk.getAccountAddr({ keyVaultAddr, index });
await sdk.getAccountAddresses({ keyVaultAddr, fromIndex, count });
await sdk.signTransaction({ keyVaultAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId });
await sdk.signMessage({ keyVaultAddr, authProof, index, message });
await sdk.sign({ keyVaultAddr, authProof, index, hash });
await sdk.signAuthorization({ keyVaultAddr, authProof, delegateAddr, index, chainId, nonce, provider });
await sdk.signSolana({ keyVaultAddr, authProof, index, message });
await sdk.getSolanaAddr({ keyVaultAddr, index });
await sdk.importKey({ keyVaultAddr, authProof, keyId, privateKey, curve, chain, label });
await sdk.deactivateKey({ keyVaultAddr, authProof, keyId });
await sdk.activateKey({ keyVaultAddr, authProof, keyId });
await sdk.signWithImportedKey({ keyVaultAddr, authProof, keyId, digest });
await sdk.getImportedKeyAddr({ keyVaultAddr, keyId });
await sdk.getImportedKeyIds({ keyVaultAddr });
await sdk.getKeyMetadata({ keyVaultAddr, keyId });
await sdk.setChainBaseKeys({ keyVaultAddr, authProof, chain, basePrivateKey, baseChainCode });
await sdk.executeWithAuth({ keyVaultAddr, authProof, implCall });
await sdk.initialize({ keyVaultAddr, storageAddr, authenticatorAddr, accessToken, authConfig });
await sdk.initializeExplicit({ keyVaultAddr, storageAddr, authenticatorAddr, accessToken, authConfig, policyRegistry });
await sdk.updateKeyVaultImplAddr({ keyVaultAddr, authProof, newImplAddr });
await sdk.updateKeyVaultImplAddrCustom({ keyVaultAddr, authProof, newImplAddr, customAckHash });
await sdk.updateAuthenticatorAddr({ keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig });
await sdk.updateAuthenticatorAddrCustom({ keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig, customAckHash });
await sdk.computeCustomImplementationAckHash({ keyVaultAddr, newImplAddr });
await sdk.computeCustomAuthenticatorAckHash({ keyVaultAddr, newAuthenticatorAddr, newAuthConfig });

// Auth client - authenticator management
const passwordAuth = sdk.getAuthClient('password');
const walletSigAuth = sdk.getAuthClient('walletSignature');
const dualFactorAuth = sdk.getAuthClient('dualFactor');
const passwordMinuteSigAuth = sdk.getAuthClient('passwordMinuteSignature');
const availableTypes = sdk.getAvailableAuthTypes(); // includes 'walletSignature', 'password', 'dualFactor', 'passwordMinuteSignature'
```

### `sdk.signAuthorization(options)`

Sign an EIP-7702-style **authorization** for a delegate contract through the KeyVault. The signed payload uses the same digest as ethers v6 `hashAuthorization` for the authorization tuple. Use this when you need an authority signature over `(chainId, address, nonce)` for account abstraction / delegation flows.

**Parameters:**

- `keyVaultAddr` (required): KeyVault contract address
- `authProof` (required): Structured object for the vault’s authenticator (e.g. `{ password: Uint8Array }`). The SDK binds the proof to the `signAuthorization` action automatically.
- `delegateAddr` (required): Delegate (implementation) contract address for the authorization
- `index` (optional): HD account index (default `0`)
- `chainId` (optional): Chain ID; if omitted, fetched from `provider` / SDK read provider / signer provider
- `nonce` (optional): Authority nonce for the authorization; if omitted, read from chain via provider
- `provider` (optional): ethers `Provider` for resolving `chainId` and/or `nonce` when those are omitted (defaults to `readProvider` or the write signer’s provider)

**Returns:** `Promise<SignedAuthorizationResult>` — ethers-shaped result: `address` (delegate), `chainId`, `nonce` as `bigint`, and `signature` with `r`, `s`, `yParity`.

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

For advanced error handling / diagnostics, the package also re-exports **`decodeCustomError`**, **`extractRpcRevertBytes`**, **`applySdkContext`**, **`rethrowExecuteError`**, **`toWalletError`**, **`sdkErrorPipeline`**, and **`ErrorPipeline`** from `src/errors/index.js` (same import path as above).

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
import { ValidationError, ContractRevertError } from '@monstera_protocol/sdk';

// `passwordHash` is a 32-byte 0x-prefixed string (e.g. from keccak256(utf8(password)))
try {
  await sdk.createWallet({ authConfig: { passwordHash } });
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

