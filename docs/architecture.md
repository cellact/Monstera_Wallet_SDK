# Architecture & Development

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
- **`bin/`**: CLI tool (monstera command)

### API Design

- **Read operations**: Use plain provider (no wrapper needed)
- **Write operations**: Automatically use Sapphire-wrapped signer for encrypted transactions
- **Network switching**: Single config parameter (`mainnet: true` for mainnet, `mainnet: false` for testnet)

## Project Structure

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
bin/             # CLI tool (monstera command)
build/           # Build entry points (browser-global.js)
dist/            # Build outputs (monstera.mjs, monstera.global.js) - gitignored
examples/
  nodejs/        # Node.js examples
  browser/       # Browser HTML examples
docs/            # Documentation files
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
- ethers.js ^6.0.0
- @oasisprotocol/sapphire-ethers-v6 ^6.0.1

**Note:** This SDK uses ES Modules (ESM). Ensure your project is configured for ESM or use a bundler that supports ESM.

## Development

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines and contribution instructions.

