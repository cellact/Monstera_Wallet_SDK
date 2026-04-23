# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-alpha.7] - 2026-04-23

### Added

- **`Monstera.prototype.signAuthorization`**: EIP-7702-style authorization signing through the KeyVault (digest aligned with ethers `Authorization` / `hashAuthorization`). Omitting `chainId` or `nonce` resolves them via `options.provider`, else `readProvider` / the connected signer’s provider. Orchestration lives in `src/internal/crypto/signAuthorization.js`; encoding and hashing helpers in `src/internal/crypto/wallet.js`.
- **Types (JSDoc)**: `SignAuthorizationOptions`, `SignedAuthorizationResult`, and `AuthorizationSplitSignature` in `src/types/index.js`.
- **Example**: `examples/nodejs/signAuthorization.js` shows encoding an `authProof` and calling `signAuthorization`.

### Changed

- **JSDoc types (`src/types/index.js`)**: Reorganized by topic; dropped `Sdk` suffixes on client/authenticator option types; shortened Monstera-centric names; aligned **Client** option naming; unified encode auth-proof / auth-config `*Input` / `*Result` typedefs and encoder contexts; renamed create-wallet structured `authConfig` options; clarified auth-config naming and typing for `configure(authConfig)`; simplified built-in unions and renamed encoded `authConfig` aliases. Consumers who reference these typedef names in their own JSDoc or TS tooling may need to follow the new names (**source-only** change; runtime API unchanged).
- **`EncodedAuthConfigPasswordMinuteSignature`**: Updated alongside the encoded auth-config / minute-signature type work.
- **Documentation (types)**: Tighter auth-proof and required-address JSDoc; factory clients model encoded auth config; create-wallet base options document structured `authConfig` where required.

### Fixed

- **Input validation**: Stricter validation for bytes32 fields and password UTF-8 bytes.

## [1.0.0-alpha.6] - 2026-04-20

### Added

- **ESLint**: Root `.eslintrc.cjs` (`eslint:recommended`, ESM, Node/Jest env) so `npm run lint` runs; `__MONSTERA_VERSION__` is declared for Rollup-injected browser builds.
- **Integration test teardown**: `tests/utils/teardown.js` exports `closeSdkConnections` and `registerSdkTeardown` to destroy ethers `JsonRpcProvider` instances after suites; integration tests and `testReadonlySDK` use it to avoid hanging Jest workers.
- **Assertions**: `requireUtf8Bytes`, `requireBoolean`, `requireStringOrNumber`, `requireWalletOrHdNode`, `requireBytes32`, `requireArray`, and `isInFuture`; internal time helpers consolidated for deadline checks; expanded unit tests for assertion helpers and for `src/internal/crypto/wallet.js`.
- **Integration tests — authentication**: Suite split into `tests/integration/authentication/` (password, wallet signature + `createAuthProofWalletSignature`, dual-factor, password-minute, SDK auth registry); added coverage for dual-factor and minute-signature flows and for `getAuthClient` / `getAvailableAuthTypes`.
- **Integration tests — signing**: `getSolanaAddr`, `signSolana`, `importKey` / `getImportedKeyAddr` / `signWithImportedKey`, and stronger message/hash signing checks (some paths depend on chain KeyVault V2 behavior).

### Changed

- **BREAKING — version check**: Outbound npm registry check runs only when **`checkVersion: true`** is set on `Monstera.connect()`, `Monstera.readonly()`, or the config passed to `new Monstera(...)`. Omitted or `false` skips the check (previously ran unless explicitly disabled). To restore old behavior, pass `checkVersion: true`.
- **`deriveSeed`**: Removed the unused `iterations` parameter; derivation still uses PBKDF2 with 2048 iterations. Implementation lives under internal crypto (see below).
- **Internal layout**: Wallet crypto helpers moved from `src/crypto/wallet.js` to **`src/internal/crypto/wallet.js`** (non-public surface; all imports updated). Deep imports must follow the new path if you bypass the package root.
- **Password KeyVault auth proof encoder** (`internal/authenticators/authProof/encoders/password.js`): Validates `password` with `requireUtf8Bytes` for consistent non-empty `Uint8Array` rules.
- **`.npmignore`**: Explicitly excludes `.eslintrc.cjs` from published tarballs (alongside existing `package.json` `files` allowlist).

### Fixed

- **`SapphireWriteWrapper`**: On write failure, debug logs emit safe fields only (`methodName`, `errorName`, `errorCode`, `errorMessage`) instead of logging the raw `Error` object, which could expose sensitive provider/RPC payloads in debug mode.
- **`src/internal/versionCheck.js`**: JSDoc updated to state the check runs only when `checkVersion: true` is configured.
- **Rollup / Node ESM output (`dist/monstera.mjs`)**: Dedicated plugin pipeline for the ESM build vs the browser IIFE build; **`crypto` is marked `external`** and Node resolution prefers built-ins so PBKDF2/seed derivation uses Node’s `crypto` module (avoids `pbkdf2Sync is not a function` when browser-oriented crypto polyfills were bundled into the ESM output).

## [1.0.0-alpha.5] - 2026-04-16

### Fixed

- **SDK version when installed from npm**: `MonsteraConfig.version` no longer logged `Failed to load SDK version from package.json: fileURLToPath is not defined` and no longer resolved to `unknown` for consumers of the published ESM entry (`dist/monstera.mjs`). Node resolves the version via `createRequire(import.meta.url)` and `package.json` instead of `fileURLToPath` + `fs.readFileSync`.
- **Rollup browser build**: Version injection targets `src/config/monstera.js` with a brace-safe replacement of `static get version()` and strips Node-only `createRequire` usage so browser bundles stay valid.

## [1.0.0-alpha.4] - 2026-04-15

### Added

- **PasswordMinuteSignatureAuthenticator**: New built-in authenticator (client, ABI/events, default `passwordMinuteSignatureAuth` addresses on testnet and mainnet). Supports create-wallet `authConfig` (bytes32 password hash), KeyVault `authProof` encoding for minute-bucket signatures, and `Monstera` helpers (`createAuthProofMinuteSignature`, `configurePasswordMinuteSignature`, `isPasswordMinuteSignatureConfigured`, `isPasswordMinuteSignatureValid`, `updatePasswordMinuteSignature`).
- **Mainnet contract defaults**: Built-in default addresses for Sapphire mainnet (`factory`, `passwordAuth`, `walletSignatureAuth`, `dualFactorAuth`, `passwordMinuteSignatureAuth`). Connecting with `mainnet: true` resolves a full `addresses` map without requiring manual overrides for the shipped deployment.
- **Structured `authProof` types (JSDoc)**: Documented shapes for built-in KeyVault authenticators (`KeyVaultPasswordAuthProof`, `KeyVaultWalletSignatureAuthProof`, `KeyVaultDualFactorAuthProof`, `KeyVaultPasswordMinuteSignatureAuthProof`) and `CreateAuthProofDualFactorOptions` for dual-factor proof creation.
- **Custom deadline**: Optional `deadline` (Unix seconds) for wallet-signature and dual-factor auth proof flows where the contract and SDK support it (defaults remain one hour ahead when omitted).
- **Structured auth encoding helpers**: `encodeAuthConfigOptions` and `encodeAuthProofOptions` (`encodeAuthConfigOptions.js`, `encodeAuthProofOptions.js`) normalize create-wallet `authConfig` and KeyVault `authProof` options (hex/bytes pass-through; plain objects encoded via built-in authenticator registries).

### Changed

- **Internal layout**: Built-in authenticator encoding lives under `src/internal/authenticators/` (`authConfig/`, `authProof/`) with a shared checksum-keyed registry factory (`registryByChecksumAddress.js`). Ethereum address helpers moved to `src/internal/evm/addresses.js`.
- **`SapphireWriteWrapper`**: Stricter handling when a transaction or receipt is missing before `wait()`, optional `rpcUrl` on write options for clearer `NetworkError` context, and improved translation of nested JSON-RPC errors (for example Sapphire attestation messages).
- **Documentation**: `KeyVaultSigningBase` and related option types now describe `authProof` as hex bytes, `Uint8Array`, or one of the structured built-in object shapes (must match the authenticator installed on the target KeyVault).
- **BREAKING**: `Monstera#createAuthProof` renamed to `Monstera#createAuthProofWalletSignature` (same behavior; options unchanged aside from optional `deadline`). The JSDoc typedef `CreateAuthProofOptions` is renamed to `CreateAuthProofWalletSignatureOptions`.
- **BREAKING**: `createAuthProof` export from `src/crypto/wallet.js` renamed to `createAuthProofWalletSignature` and accepts a single options object `{ signer, chainId, authenticatorAddr, deadline, keyVaultAddr }` (update any positional call sites).
- **BREAKING**: Deep imports of `src/internal/authConfig/**` or `src/internal/authProof/**` must move to `src/internal/authenticators/authConfig/**` and `src/internal/authenticators/authProof/**` (prefer the public `Monstera` API to avoid internal paths).

### Fixed

- **Tests**: Wallet crypto unit tests call `createAuthProofWalletSignature` with the options object shape expected by `src/crypto/wallet.js`.

## [1.0.0-alpha.3] - 2026-01-22

### Added
- This CHANGELOG file
- **ESM Support**: Full ES Modules (ESM) support throughout the SDK
- **Automatic Version Checking**: SDK automatically checks for updates on initialization (Node.js only, can be disabled via `checkVersion: false`)
- **Version Management Utilities**: Version comparison and checking utilities (`parseVersion`, `compareVersions`, `satisfiesRange`, `getVersionType`)
- **Convenience API Methods**: All factory, keyVault, and auth methods are now accessible directly on the SDK instance (e.g., `sdk.createWallet()` instead of `sdk.factory.createWallet()`)
- **Wallet Creation from Mnemonic**: Added `createWalletFromMnemonic()` method with BIP39 validation
- **KeyVault Initialization**: Added `initialize()` method to KeyVaultClient
- **Browser Builds**: Added ESM and IIFE browser builds with Rollup bundler

### Changed
- **Module System** (BREAKING): Migrated entire SDK from CommonJS to ES Modules (ESM)
  - **BREAKING**: SDK now requires ESM-compatible environment (Node.js 14+ with ESM support or a bundler)
  - Migration: Replace `require()` with `import` and `module.exports` with `export`
  - Example:
    ```javascript
    // Before (CommonJS)
    const { Monstera } = require('@monstera_protocol/sdk');
    
    // After (ESM)
    import { Monstera } from '@monstera_protocol/sdk';
    ```
- **SDK Configuration**: Added `checkVersion` option to `Monstera.connect()` and `Monstera.readonly()` methods (defaults to `true`)
- **Method Organization**: Reorganized SDK methods by operation type (Utility, Initialize, Configure, Create, Read, Write) for better discoverability
- **KeyVault vs WalletLogic**: Prefer KeyVaultClient methods over WalletLogicClient for duplicate functionality (better performance)
- **Network Parameter** (BREAKING): Changed from `network: 'testnet'|'mainnet'` to `mainnet: boolean` in `connect()` and `readonly()` methods
  - **BREAKING**: API now uses `mainnet: boolean` instead of `network: string`
  - Migration: Replace `network: 'testnet'` with `mainnet: false` and `network: 'mainnet'` with `mainnet: true`
  - Example:
    ```javascript
    // Before
    Monstera.connect({ network: 'testnet', signer: ... });
    
    // After
    Monstera.connect({ mainnet: false, signer: ... });
    ```
- **Method Renames** (BREAKING): Renamed several methods to use "update" prefix for consistency
  - **BREAKING**: `upgradeWalletLogicImplAddr()` → `updateWalletLogicImplAddr()`
  - **BREAKING**: `upgradeKeyVaultImplAddr()` → `updateKeyVaultImplAddr()`
  - **BREAKING**: `changeAuthenticatorAddr()` → `updateAuthenticatorAddr()`
  - **BREAKING**: `changePassword()` → `updatePassword()`
  - Aligns with SDK naming conventions for write operations
- **Address Parameter Naming** (BREAKING): Standardized all address parameters to use "Addr" suffix
  - **BREAKING**: All address parameters now use "Addr" suffix (e.g., `walletAddr`, `keyVaultAddr`)
  - **BREAKING**: All address getter methods use "Addr" suffix (e.g., `getKeyVaultAddr()`)
  - Migration: Update all address parameter names in your code to use "Addr" suffix
  - Example:
    ```javascript
    // Before
    sdk.getKeyVault({ walletAddress: ... });
    
    // After
    sdk.getKeyVaultAddr({ walletAddr: ... });
    ```

### Removed
- **CommonJS Support**: Removed CommonJS (`require`/`module.exports`) support - SDK is now ESM-only

### Fixed
- **Circular Dependency**: Resolved circular dependency between `Monstera.js` and `versionCheck.js` by passing version as parameter instead of importing
- **Browser Builds**: Fixed browser builds by bundling `@oasisprotocol/sapphire-ethers-v6` dependency
- **Browser Global Queue**: Fixed browser global queue stub to use `window.Monstera` correctly
- **Example Files**: Fixed method calls, typos, and removed duplicate files

## [1.0.0-alpha.2] - 2025-12-30

### Added
- **CLI Support**: Added `bin/` folder with `monstera.js` CLI tool
- **Post-install Scripts**: Added `scripts/` folder with postinstall banner display
- **Utilities Folder**: Added `src/utils/` folder for utility functions
- **Base Module**: Created `src/base/` folder for core base classes
- **SapphireWriteWrapper**: New centralized write execution wrapper for all contract write operations
  - Ensures all writes go through Sapphire encryption
  - Provides consistent error translation
  - Normalizes transaction and receipt output
- **EventParseError**: New error class for event parsing failures (replaces console.error usage)
- **PasswordConfigured Event**: Added support for PasswordConfigured event in password authenticator
- **WalletConfigured Event**: Added support for WalletConfigured event in wallet signature authenticator
- **SDK Instance Methods**:
  - `canWrite()`: Check if SDK instance can perform write operations
  - `getSignerAddress()`: Get the signer address (if available)
- **Authenticator Methods**:
  - `configure()` and `verify()` method in PasswordAuthenticatorClient
  - `configure()` and `verify()` methods in WalletSignatureAuthenticatorClient
- **Monstera ASCII Banner**: Added leaf ASCII art banner displayed on install and CLI usage
- **BigInt Support**: Updated `requireNumber()` validation to accept both Number and BigInt types

### Changed
- **README.md**: Updated documentation with improved examples and usage instructions
- **package.json**: 
  - Updated version to 1.0.0-alpha.2
  - Added `bin` field for CLI support
  - Added `scripts` folder to files array
- **Examples**: Updated all example files with improved error handling and best practices
- **BaseContractClient**: Moved from `src/internal/` to `src/base/` for better organization
- **requireBytes Method**: Updated to handle both String and Uint8Array types more robustly
- **parseEvent**: Changed from console.error to throwing EventParseError for better error handling
- **createAuthProof**: Added comprehensive error handling in `src/crypto/wallet.js`
- **Code Organization**:
  - Organized imports across all files
  - Added clear section comments to classes (read methods, write methods, instance methods, static methods, private helpers)
  - Improved code structure and readability
- **Error Context**: Standardized error context handling with blacklist approach for sensitive data
- **Factory Client**: Extracted wallet preparation logic into helper methods for better maintainability
- **Contract Access**: Replaced deprecated `contract()` method with `getReadContract()` and `getWriteContract()`

### Removed
- **PermissionError**: Removed unused error class
- **Validation Helpers**: Removed unused helper functions:
  - `requireBytesLike()`
  - `requireHex()`
  - `requireOneOf()`
- **generateMnemonic Check**: Removed redundant check as mnemonic generation always succeeds
- **TODO Comments**: Removed all TODO comments from codebase
- **Commented Code**: Cleaned up commented-out code and formatting issues
- **Redundant Methods**: Removed redundant `parseEvents()` method and simplified options passing
- **Deprecated Methods**: Removed deprecated `contract()` method from BaseContractClient

### Fixed
- **Error Handling**: Improved error handling throughout the SDK with standardized error codes
- **Transaction Data Validation**: Fixed transaction data validation in requireBytes
- **Insufficient Funds**: Improved insufficient funds error handling in examples
- **Address Validation**: Removed redundant address validation and standardized error handling
- **Event Parsing**: Fixed event parsing to use proper error classes instead of console logging
- **Error Exports**: Fixed missing EventParseError export in errors/index.js
- **Variable Declarations**: Fixed variable declarations (use `let` when reassigning, `const` otherwise)
- **Error Context**: Fixed error context to use blacklist instead of whitelist for better security

## [1.0.0-alpha.1] - 2025-12-23

### Added
- **Core SDK**: Main `Monstera` class with `connect()` and `readonly()` static methods
- **Factory Client**: Wallet creation and management via `WalletFactoryClient`
- **Wallet Logic Client**: Wallet operations (signing, account management) via `WalletLogicClient`
- **KeyVault Client**: Key management operations via `KeyVaultClient`
- **Authentication System**: 
  - `AuthenticatorClient` base class
  - `PasswordAuthenticatorClient` for password-based authentication
  - `WalletSignatureAuthenticatorClient` for wallet signature authentication
- **Network Configuration**: Built-in support for Sapphire testnet and mainnet with default contract addresses
- **Error Handling**: Comprehensive error system with custom error classes:
  - `WalletError`, `ValidationError`, `ConfigError`, `NetworkError`
  - `ContractRevertError`, `EventNotFoundError`, `SapphireRequiredError`, `WriteRequiresSignerError`
- **Event System**: Event parsing and decoding for all contract events
- **Sapphire Integration**: Provider and signer setup for encrypted transactions
- **Crypto Utilities**: Mnemonic generation, seed derivation, and auth proof creation
- **Validation Utilities**: Input validation helpers (`requireAddress`, `requireBytes`, `requireNumber`, etc.)
- **Contract ABIs**: Complete ABIs for WalletFactory, WalletLogic, KeyVault, and Authenticator contracts
- **Examples**: Comprehensive example files demonstrating SDK usage
- **Documentation**: README with usage examples and API documentation
