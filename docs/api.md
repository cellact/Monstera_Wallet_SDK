# API Reference

Complete API documentation for the Monstera SDK.

## App API

These calls are the supported way to build an app. Every other method on `Monstera` still runs. `sdk.factory`, `sdk.logic`, `sdk.keyVault`, and `sdk.auth` are advanced: use them for contract-level work, not for the path below.

New contract methods land on the matching client first. They join this list only when an integrator must call them without using that client.

| Task | Call |
|------|------|
| Connect | `Monstera.connect` |
| Create a wallet | `createWallet`, `createWalletForUsername` |
| Resolve a username | `hashUsername`, `walletOfUsername` |
| Account address | `getKeyVaultAddr`, `getAccountAddr` |
| Sign | `signMessage`, `sign`, `signTransaction`, `signAuthorization` |
| Auth proof | Pass a structured `authProof`, or omit it when [Authenticators](#authenticators) says the session can fill it. `authProof.signer` is any object with `signTypedData` |
| Authenticator admin | Facade methods such as `configurePassword`, `isPasswordConfigured`, `isPasswordValid`, and `updatePassword`, and the matching methods for the other built-in authenticators |

The other `createWallet*` methods, the low-level `createAuthProof*` helpers, and the catalog under [Advanced surface](#advanced-surface) stay callable.

`Monstera.connect({ signer })` is the gas payer. That value may be a private key. `authProof.signer` is the whitelisted account that signs the EIP-712 proof. It must provide `signTypedData`. A browser wallet qualifies. A private-key string does not.

## Monstera

Main SDK class for wallet operations.

### `Monstera.connect(options)`

Connect to Monstera. Pass optional `signer` and/or `credentials` as needed.

| Options | Capabilities |
|---------|--------------|
| `signer` + `credentials` | On-chain writes + vault signing/reads (credentials resolve KeyVault) |
| `signer` only | On-chain writes; vault ops require explicit `keyVaultAddr` + `authProof` |
| `credentials` only | Vault signing/reads; no on-chain writes |
| neither | Read-only factory/network queries |

**Parameters:**
- `mainnet` (required): `true` for mainnet, `false` for testnet
- `signer` (optional): Private key string (0x-prefixed hex) or ethers `Signer` instance
- `credentials` (optional): `{ username, password }` or `{ username, apiKey }`. `apiKey` is the raw 32-byte hex key. The session stores `keccak256(apiKey)`.
- `provider` (optional): You may pass an ethers `Provider` for reads; otherwise the SDK uses the default RPC for the selected network.
- `rpcUrl` (optional): Custom RPC URL (overrides default)
- `addresses` (optional): Replace one or more preset addresses. Omitted keys stay on `sdk.addresses`. Keys: `factory`, `passwordAuth`, `walletSignatureAuth`, `dualFactorAuth`, `passwordMinuteSignatureAuth`, `apiKeySessionAuth`, `multiAuthenticator`, `passwordOrWalletSigAuth`
- `logLevel` (optional): `'error'` | `'warn'` | `'info'` | `'debug'` (default: `'error'`)
- `debug` (optional): If `true`, sets log level to `'debug'`
- `checkVersion` (optional): If **`true`**, runs the npm registry version check once on connect (Node.js). If omitted or `false`, the check is skipped.

**Returns:** `Monstera` instance. Use `sdk.hasWriteAccess()` and `sdk.hasCredentials()` to inspect capabilities.

**Session defaults (credentials):** When `credentials` are set, `keyVaultAddr` is resolved from the factory and HD `index` defaults to `0`. Whether you can omit `authProof` depends on the authenticator. See [Authenticators](#authenticators).

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

## Authenticators

For `signMessage`, `sign`, `signTransaction`, `signAuthorization`, and the other vault methods on `Monstera`, pass a structured `authProof` or omit it when the table says the session can fill it. The SDK reads the authenticator from the vault, builds the action, and encodes the proof. Do not pass `selector` or `paramsHash` on these calls. That pair is for [advanced proof builders](#advanced-proof-builders).

`authProof.signer` is any object with `signTypedData`. A browser wallet qualifies. A private-key string does not. The connect `signer` is a different value: it pays Sapphire gas.

`authConfig` on `createWallet` / `createWalletForUsername` is a plain object. Pass `authenticatorAddr` from `sdk.addresses`. The SDK encodes the bytes.

| Authenticator | `sdk.addresses` key | `authConfig` | Omit `authProof` when `credentials` are set? | `authProof` fields | Example |
|---|---|---|---|---|---|
| Password | `passwordAuth` | `{ passwordHash }` | Yes | `{ password }` | [username and password](../examples/nodejs/getting-started/username-and-password/02-use-wallet.js) |
| Password-minute-signature | `passwordMinuteSignatureAuth` | `{ passwordHash }` | Yes | `{ password }` or `{ passwordHash }` | [create and sign](../examples/nodejs/authentication/password-minute-signature/create-and-sign.js) |
| Wallet signature | `walletSignatureAuth` | `{ initialWhitelist }` | No | `{ signer, deadline? }` | [whitelist flow](../examples/nodejs/authentication/wallet-signature/whitelist-flow.js) |
| Dual factor | `dualFactorAuth` | `{ passwordHash, guardianAddr }` | No | `{ passwordHash, signer, deadline? }` | No example file yet. Facade methods: `configureDualFactor`, `createAuthProofDualFactor`, `updatePasswordDualFactor`, `updateGuardian` |
| Password-or-wallet | `passwordOrWalletSigAuth` | `{ passwordHash?, initialWhitelist }` | Yes, for the password path | `{ password }` or `{ signer, deadline? }`. Optional `method`: `'password'` or `'walletSignature'` | [create wallet](../examples/nodejs/authentication/password-or-wallet-signature/create-wallet.js) |
| API-key session | `apiKeySessionAuth` | `{ apiKeySecret }` | Yes, for ACTION mode | `{ apiKeySecret? }` for ACTION. TOKEN adds `mode: 'token'`, `expiry?`, `scopeMask?` | [username and API key](../examples/nodejs/getting-started/username-and-apiKey/02-use-wallet.js) |
| Multi | `multiAuthenticator` | `{ children: [{ authenticatorAddr, authConfig }] }` | Follows the child | Child proof fields, plus `child` or `viaChild` (the child address) | [create wallet](../examples/nodejs/authentication/multi/create-wallet.js) |

`passwordHash` and `apiKeySecret` are `keccak256` of the raw secret. Connect `credentials.apiKey` is the raw 32-byte hex key. The session hashes it.

API-key ACTION proofs are bound to one vault call. TOKEN proofs are reusable until `expiry`. `scopeMask` defaults to `Monstera.API_KEY_SESSION_SCOPE_SIGN_ALL` (`0x1F`, signing except `executeWithAuth`). `Monstera.API_KEY_SESSION_SCOPE_ALL` (`0x3F`) includes `executeWithAuth`. With credentials, `signMessage` uses ACTION mode and you can omit `authProof`. Call `buildTokenAuthProof` or pass `{ mode: 'token', expiry, scopeMask }` when you want a bearer token. `buildActionAuthProof` is the explicit ACTION builder.

```javascript
import { toUtf8Bytes } from 'ethers';

// Password vault, credentials on connect. The SDK fills the proof.
await sdk.signMessage({
  message: toUtf8Bytes('Hello')
});

// Same vault, no credentials. Pass the password on this call.
await sdk.signMessage({
  keyVaultAddr,
  authProof: { password: toUtf8Bytes('your-password') },
  message: toUtf8Bytes('Hello')
});

// Wallet-signature vault. signer is the whitelisted account, not the gas key.
await sdk.signMessage({
  keyVaultAddr,
  authProof: { signer: browserSigner },
  message: toUtf8Bytes('Hello')
});
```

Pre-encoded proof hex is accepted and passed through. It must already be bound to the action. A bare password string is not a proof.

## SDK Instance Methods

```javascript
// Check if SDK instance can perform write operations
const hasWriteAccess = sdk.hasWriteAccess(); // boolean

// Get the signer address (if available)
const signerAddress = await sdk.getSignerAddr(); // string | null

// Set log level at runtime ('error' | 'warn' | 'info' | 'debug')
sdk.setLogLevel('debug');

// Hash a normalized username (trim + lowercase)
const usernameHash = await sdk.hashUsername({ username: 'alice' });

// Resolve username hash → wallet proxy address
const walletAddr = await sdk.walletOfUsername({ usernameHash });
```

## Advanced surface

Everything in this section still works. It is the full facade catalog plus the domain clients. Prefer the [App API](#app-api) for application code.

`sdk.factory`, `sdk.logic`, `sdk.keyVault`, and `sdk.auth` talk to the contracts directly. The same writes are also on `Monstera` (for example `sdk.createWallet` and `sdk.factory.createWallet`). Use the client when you already hold encoded bytes or you need a contract method that is not in the app API.

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
// authProof: structured object from the Authenticators section. The SDK binds the action.
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
await sdk.signAuthorization({ delegateAddr, index, chainId, nonce, provider }); // keyVaultAddr + authProof optional with credentials
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
const apiKeySessionAuth = sdk.getAuthClient('apiKeySession');
const multiAuth = sdk.getAuthClient('multi');
const passwordOrWalletAuth = sdk.getAuthClient('passwordOrWalletSignature');
const availableTypes = sdk.getAvailableAuthTypes();
```

### Advanced proof builders

`selector` and `paramsHash` are how a proof is bound to one vault call. Facade methods such as `signMessage` build that pair. Pass them only when you call `createAuthProof*` or `computeActionHash` yourself.

- `selector` — 4-byte function selector of the vault operation
- `paramsHash` — `keccak256(abi.encode(...))` of the call parameters, excluding `authProof`
- `target` (optional) — executing contract. Defaults to `keyVaultAddr`

`createAuthProofWalletSignature`, `createAuthProofMinuteSignature`, `createAuthProofDualFactor`, `createAuthProofPasswordOrWalletSignature`, `createAuthProofMulti`, `buildActionAuthProof`, and `buildTokenAuthProof` return proof bytes (minute-signature also returns `minuteBucket` and `derivedAddress`). Each proof builder takes `action: { selector, paramsHash }` or a precomputed `actionHash`, except `buildTokenAuthProof`, which takes `expiry` and `scopeMask`.

```javascript
const authProof = await sdk.createAuthProofWalletSignature({
  signer: walletSigner,
  keyVaultAddr,
  deadline: Math.floor(Date.now() / 1000) + 3600,
  action: {
    selector: '0x...',
    paramsHash: '0x...'
  }
});

await sdk.computeActionHash({ keyVaultAddr, selector, paramsHash });
```

A pre-encoded proof hex string without that action context is not enough for a KeyVault call.

### `sdk.signAuthorization(options)`

Sign an EIP-7702-style **authorization** for a delegate contract through the KeyVault. The signed payload uses the same digest as ethers v6 `hashAuthorization` for the authorization tuple. Use this when you need an authority signature over `(chainId, address, nonce)` for account abstraction / delegation flows.

**Parameters:**

- `keyVaultAddr` (required unless `credentials` session resolves it): KeyVault contract address
- `authProof` (optional when [Authenticators](#authenticators) says the session can omit it): Structured object for the vault’s authenticator (e.g. `{ password: Uint8Array }`). The SDK binds the proof to the `signAuthorization` action automatically.
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

