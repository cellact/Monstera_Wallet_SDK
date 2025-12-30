# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- This CHANGELOG file 
- **Browser Support** (HIGH Priority):
  - UMD/IIFE bundle for direct `<script>` tag inclusion
  - ES modules (ESM) build for modern bundlers
  - CDN distribution support
  - Async script loading with callback support
  - Build system (webpack/rollup/vite) for browser and Node.js builds
  - Source maps for debugging
  - Browser polyfills for older browsers (ES5+ support)
  - Feature detection and graceful degradation
- **Version Management** (MEDIUM Priority):
  - Version checking mechanism to detect outdated SDK versions
  - Deprecation warnings for deprecated methods
  - Migration guides for breaking changes
  - Automated changelog generation (standard-version or conventional-changelog)
- **Storage Mechanisms** (MEDIUM Priority):
  - `StorageManager` class with cookie support (read, write, remove)
  - localStorage support with quota exceeded error handling
  - sessionStorage support for temporary session data
  - Fallback mechanisms for storage unavailability
  - Third-party cookie restriction handling
- **Browser Event Handling** (MEDIUM Priority):
  - Document ready event handling utility
  - postMessage support for iframe communication
  - Page Visibility API integration (pause/resume operations)
  - Device orientation change handling
  - Scroll disable utility for modals
- **Debugging Support** (MEDIUM Priority):
  - Debug mode flag in SDK configuration
  - Structured logging with log levels (debug, info, warn, error)
  - Console logs polyfill for old browsers
  - Network request logging
  - Transaction trace logging
  - Error stack traces
  - Performance metrics
  - Browser DevTools integration
- **Browser Testing** (MEDIUM Priority):
  - Browser test suite (Karma, Jest with jsdom, or Playwright)
  - Cross-browser test automation
  - E2E testing for full SDK workflows in browser
  - Testing with different bundlers
- **Documentation** (MEDIUM Priority):
  - Browser setup guide
  - CDN usage examples and documentation
  - Browser compatibility matrix
  - Generated API documentation (JSDoc/TypeDoc)
  - Interactive examples
- **Request Utilities** (LOW Priority):
  - HTTP request utilities (`RequestManager` class)
  - Image beacon support for analytics/tracking
  - Iframe request support
  - JSONP request support
  - Navigator.sendBeacon for reliable delivery
- **URI Parsing Utilities** (LOW Priority):
  - `URIUtils` class for URL parsing and manipulation
  - Query parameter extraction
  - Query string building
  - URL parameter updates
- **Viewport Utilities** (LOW Priority):
  - `ViewportUtils` class for viewport operations
  - Element visibility checks
  - Viewport size detection
  - Pixel ratio handling
  - Style value utilities
- **Error Reporting** (LOW Priority):
  - Optional error reporting service integration
  - User-friendly error messages
  - Error recovery suggestions
  - Browser-specific error handling (CORS, network timeouts)

### Changed
- **Build System**: 
  - Separate builds for browser and Node.js environments
  - Universal JavaScript SDK (browser + Node.js compatible)
- **Error Handling**: 
  - Browser-specific error handling (CORS, network timeouts)
  - Enhanced error context for browser environments
- **Documentation**: 
  - Added `CHANGELOG.md` to files array
  - Browser usage examples and CDN documentation

### Deprecated
- (None planned yet - will be documented here when methods are deprecated)

### Removed
- (None planned yet)

### Fixed
- (None planned yet)

### Security
- (None planned yet - security vulnerabilities will be documented here)

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
