# Architecture & Development

## Architecture

The SDK is organized into modular components:

### Modules

- **`base/`**: Base classes (BaseContractClient, SapphireWriteWrapper)
- **`config/`**: Network presets (networks.js), address defaults, and SDK configuration (monstera.js)
- **`providers/`**: Ethers provider creation and Sapphire wrapper integration
- **`contracts/`**: Contract ABIs and typed contract getters (core + authenticators)
- **`clients/`**: Domain clients (factory, logic, keyVault, auth: password, walletSignature, dualFactor, passwordMinuteSignature)
- **`events/`**: Event definitions and receipt parsing
- **`errors/`**: Consistent error types with stable error codes
- **`internal/`**: Logger, version check, validation (`assert`), built-in authenticator encoders (`authenticators/`), wallet crypto (`crypto/index.js` barrel: `mnemonic.js`, `authorization.js`, `authConfig.js`, `authProof.js`, `signAuthorization.js`, `signingErrorMapper.js`) — **not** a public package export
- **`sdk/`**: Main SDK class (`Monstera`), `MonsteraUtils` (version-check only), and `helpers/` (e.g. auth-proof defaulting for the facade)
- **`types/`**: Shared JSDoc type definitions
- **`bin/`**: CLI tool (monstera command)

### API Design

- **Read operations**: Use plain provider (no Sapphire wrapper needed)
- **Write operations**: Automatically use Sapphire-wrapped signer for encrypted transactions
- **Network switching**: Single config parameter (`mainnet: true` for mainnet, `mainnet: false` for testnet)
- **Logging**: Optional configurable log levels (`logLevel` or `debug`) when calling `Monstera.connect()`; `setLogLevel()` at runtime; logs never include secrets

## Project Structure

```
src/             # Source code
  base/          # BaseContractClient, SapphireWriteWrapper
  config/        # Network presets (networks.js), SDK config (monstera.js)
  providers/     # Provider and Sapphire wrapper
  contracts/     # ABIs and getters (core: factory, logic, keyVault; auth: password, walletSig, dualFactor, passwordMinuteSignature)
  clients/       # Factory, logic, keyVault, auth (password, walletSignature, dualFactor, passwordMinuteSignature)
  events/        # Event definitions and receipt parsing
  errors/        # Error types (single source of truth for error exports)
  internal/      # logger, versionCheck, version, assert, authenticators/, crypto/ (index.js, mnemonic.js, authorization.js, authConfig.js, authProof.js, signAuthorization.js, signingErrorMapper.js — internal only)
  sdk/           # Monstera, MonsteraUtils, helpers/ (applyAuthProofDefaults, etc.)
  types/         # Shared JSDoc types
bin/             # CLI (monstera command)
build/           # Build entry points (e.g. browser-global.js for Rollup)
dist/            # Build outputs (monstera.mjs, monstera.global.js) - gitignored
examples/
  nodejs/        # Node.js examples
  browser/       # Browser HTML examples
docs/            # Documentation
```

## Building

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

## Requirements

- Node.js >= 14.0.0 (ESM support required)
- ethers ^6.0.0 or ^5.0.0 (peer dependency; recommended)
- @oasisprotocol/sapphire-ethers-v6 ^6.0.1 (for encrypted writes)
- web3 optional peer dependency for projects that use it

**Note:** This SDK uses ES Modules (ESM). Ensure your project is configured for ESM or use a bundler that supports ESM.

## Development

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines and contribution instructions.

