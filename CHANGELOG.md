# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
