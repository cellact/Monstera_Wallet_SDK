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
- **`errors/`**: Error types, unified **`pipeline.js`** translator chain (`translators/`), and stable codes
- **`internal/`**: Logger, version check, validation (`assert`), built-in auth encoding (`auth/`: `config/` and `proof/` encoders + registries, `AuthConfigBuilder` / `AuthProofBuilder`, `defaults/authProofDefaults.js`), checksum registry helper (`auth/registryByChecksumAddress.js`), validators (`validators/`), wallet crypto (`crypto/index.js` barrel: `mnemonic.js`, `authorization.js`, `authConfig.js`, `authProof.js`, `signAuthorization.js`) — **not** a public package export
- **`sdk/`**: Main SDK class (`Monstera`) and `MonsteraUtils` (version-check only)
- **`types/`**: Shared JSDoc type definitions
- **`bin/`**: CLI tool (monstera command)

### API Design

- **Read operations**: Use plain provider (no Sapphire wrapper needed)
- **Write operations**: Automatically use Sapphire-wrapped signer for encrypted transactions
- **Network switching**: Single config parameter (`mainnet: true` for mainnet, `mainnet: false` for testnet)
- **Logging**: Optional configurable log levels (`logLevel` or `debug`) when calling `Monstera.connect()`; `setLogLevel()` at runtime; logs never include secrets

### Validation boundaries

- **Public API** — External inputs are validated at SDK boundaries: `Monstera.connect`, the `Monstera` constructor (resolved `NetworkConfig`), and public instance methods that accept user-supplied options.
- **Shared primitives** — [`src/internal/assert.js`](../src/internal/assert.js) provides reusable checks (`requireAddress`, `requireBytes`, …). Ethereum addresses are validated with **`ethers.isAddress`** so rules match the ethers ecosystem (including EIP-55 when the string is mixed-case).
- **Clients** — Contract clients (`src/clients/`) typically re-validate method options per call as defense-in-depth, even when the facade has already validated.
- **Parsers / decoders** — Event and receipt decoding (`events/`) interpret chain data with structured checks; composed validators handle structured auth options before crypto encoding.
- **Composed options** — [`src/internal/validators/authProofOptions.js`](../src/internal/validators/authProofOptions.js) centralizes auth-proof parameter checks used by [`authProof.js`](../src/internal/crypto/authProof.js) so wallet-signature / minute / dual-factor rules do not drift across call paths (dual-factor reuses minute encoding without re-validating twice).
- **Internals** — Crypto helpers either validate via shared composed validators (above), rely on types established by callers, or assert only where they receive raw external objects.

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
  internal/      # logger, versionCheck, version, assert, auth/ (built-in encoders + builders + defaults), validators/, crypto/ (index.js, mnemonic.js, authorization.js, authConfig.js, authProof.js, signAuthorization.js — internal only)
  sdk/           # Monstera, MonsteraUtils
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
- ethers ^6.0.0 or ^5.0.0 (peer dependency; required for typical usage)
- @oasisprotocol/sapphire-ethers-v6 ^6.0.1 (for encrypted writes)

**Note:** This SDK uses ES Modules (ESM). Ensure your project is configured for ESM or use a bundler that supports ESM.

## Development

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines and contribution instructions.

