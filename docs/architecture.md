# Architecture & Development

## Architecture

The SDK is organized into modular components:

### Modules

- **`adapters/ethers/`**: Single import boundary for ethers (encoding, signing, hashing, addresses, provider helpers and common re-exports); internal modules prefer this over scattered **`ethers`** imports.
- **`base/`**: Base classes (`BaseContractClient`), contract wiring (`ContractRegistry`), execution pipeline (`ExecutionPipeline`: reads/writes + error context)
- **`config/`**: Network presets (networks.js), address defaults, and SDK configuration (monstera.js). Contract addresses resolve from presets and explicit connect-time overrides
- **`providers/`**: Ethers provider creation and Sapphire wrapper integration
- **`contracts/`**: Contract ABIs and typed contract getters (core + authenticators)
- **`clients/`**: Domain clients (factory, logic, keyVault, auth: password, walletSignature, dualFactor, passwordMinuteSignature)
- **`events/`**: Event definitions and receipt parsing
- **`errors/`**: Error types, unified **`pipeline.js`** translator chain (`translators/`), and stable codes
- **`internal/`**: Logger, version check, validation (`assert`), sanitization (`sanitization/` — **`Sanitizer`** for logs and error **`context`**), built-in auth encoding (`auth/`: **`AuthProofPipeline`**, per-authenticator specs in **`authenticators/`**, **`VaultCallPipeline`** + **`AuthenticatorCallPipeline`** + **`CredentialsSession`**, **`EncodeAuthConfig`**, **`createAuthProof.js`**, **`bindProofToAction.js`**, action context in **`context/createAuthContext.js`** and **`context/actions/`**, vault action builders in **`vault/actions/`**, **`vault/accountIndex.js`**, **`vault/signAuthorization.js`**), checksum registry helper (`auth/shared/registryByChecksumAddress.js`), validators (`validators/`), wallet crypto helpers (`crypto/` barrel: `mnemonic.js`, `authorization.js`), username normalisation (`utils/normalize.js`) — **not** a public package export
- **`sdk/`**: Main SDK class (`Monstera`) composed from domain modules (`sdk/domains/`), plus `MonsteraUtils` (version-check only)
- **`types/`**: Shared JSDoc type definitions split by domain (`connect.js`, `transactions.js`, `auth-config.js`, `auth-proof.js`, `factory.js`, `keyvault.js`)
- **`bin/`**: CLI tool (monstera command)

### API Design

- **Read operations**: Use plain provider (no Sapphire wrapper needed)
- **Write operations**: Automatically use Sapphire-wrapped signer for encrypted transactions
- **Network switching**: Single config parameter (`mainnet: true` for mainnet, `mainnet: false` for testnet)
- **Logging**: Optional configurable log levels (`logLevel` or `debug`) when calling `Monstera.connect()`; `setLogLevel()` at runtime; logs never include secrets

### Validation boundaries

- **Public API** — External inputs are validated at SDK boundaries: `Monstera.connect`, the `Monstera` constructor (resolved `NetworkConfig`), and public instance methods that accept user-supplied options.
- **Shared primitives** — [`src/internal/assert.js`](../src/internal/assert.js) provides reusable checks (`requireAddress`, `requireBytes`, …). Ethereum addresses are validated with **`isAddress`** from [`src/adapters/ethers/addresses.js`](../src/adapters/ethers/addresses.js) (ethers-compatible, including EIP-55 for mixed-case strings).
- **Clients** — Contract clients (`src/clients/`) typically re-validate method options per call as defense-in-depth, even when the facade has already validated.
- **Parsers / decoders** — Event and receipt decoding (`events/`) interpret chain data with structured checks; composed validators handle structured auth options before crypto encoding.
- **Composed options** — [`src/internal/validators/authProofOptions.js`](../src/internal/validators/authProofOptions.js) centralizes auth-proof parameter checks used by [`createAuthProof.js`](../src/internal/auth/proof/createAuthProof.js). Action builders in [`src/internal/vault/actions/`](../src/internal/vault/actions/) and [`src/internal/auth/context/actions/`](../src/internal/auth/context/actions/) compute `selector` + `paramsHash` pairs aligned with KeyVaultV3 on-chain checks.
- **Internals** — Crypto helpers either validate via shared composed validators (above), rely on types established by callers, or assert only where they receive raw external objects.

## Execution map

`Monstera` is a thin composer: [`src/sdk/Monstera.js`](../src/sdk/Monstera.js) wires clients and pipelines in the constructor, then mixes domain methods from [`src/sdk/domains/`](../src/sdk/domains/). Use this table to trace a public call to its pipeline, action builder, and client.

### Signing (authenticated KeyVault views)

| User calls | Domain module | Pipeline | Action builder | Client method |
|------------|---------------|----------|----------------|---------------|
| `monstera.signTransaction()` | `MonsteraSigning` | `VaultCallPipeline` | `buildSignTransactionAction` | `keyVault.signTransaction` |
| `monstera.signMessage()` | `MonsteraSigning` | `VaultCallPipeline` | `buildSignMessageAction` | `keyVault.signMessage` |
| `monstera.sign()` | `MonsteraSigning` | `VaultCallPipeline` | `buildSignAction` | `keyVault.sign` |
| `monstera.signAuthorization()` | `MonsteraSigning` | `VaultCallPipeline` + `executeSignAuthorization` | `buildExecuteWithAuthAction` | `keyVault.executeWithAuth` |
| `monstera.executeWithAuth()` | `MonsteraSigning` | `VaultCallPipeline` | `buildExecuteWithAuthAction` | `keyVault.executeWithAuth` |
| `monstera.signWithImportedKey()` | `MonsteraSigning` | `VaultCallPipeline` | `buildSignWithImportedKeyAction` | `keyVault.signWithImportedKey` |
| `monstera.signSolana()` | `MonsteraSigning` | `VaultCallPipeline` | `buildSignSolanaAction` | `keyVault.signSolana` |

### KeyVault writes (authenticated)

| User calls | Domain module | Pipeline | Action builder | Client method |
|------------|---------------|----------|----------------|---------------|
| `monstera.updateKeyVaultImplAddr()` | `MonsteraKeyVault` | `VaultCallPipeline` | `buildUpgradeImplementationAction` | `keyVault.updateKeyVaultImplAddr` |
| `monstera.updateAuthenticatorAddr()` | `MonsteraKeyVault` | `VaultCallPipeline` | `buildChangeAuthenticatorAction` | `keyVault.updateAuthenticatorAddr` |
| `monstera.importKey()` | `MonsteraKeyVault` | `VaultCallPipeline` | `buildImportKeyAction` | `keyVault.importKey` |
| `monstera.deactivateKey()` / `activateKey()` | `MonsteraKeyVault` | `VaultCallPipeline` | `buildDeactivateKeyAction` / `buildActivateKeyAction` | `keyVault.deactivateKey` / `activateKey` |
| `monstera.setChainBaseKeys()` | `MonsteraKeyVault` | `VaultCallPipeline` | `buildSetChainBaseKeysAction` | `keyVault.setChainBaseKeys` |

### Authenticator management (authenticated)

| User calls | Domain module | Pipeline | Action builder | Client method |
|------------|---------------|----------|----------------|---------------|
| `monstera.updatePassword()` | `MonsteraAuth` | `AuthenticatorCallPipeline` | `buildChangePasswordAction` | `auth.password.updatePassword` |
| `monstera.addToWhitelist()` | `MonsteraAuth` | `AuthenticatorCallPipeline` | `buildAddToWhitelistAction` | `auth.walletSignature.addToWhitelist` |
| `monstera.updatePasswordDualFactor()` | `MonsteraAuth` | `AuthenticatorCallPipeline` | `buildDualFactorChangePasswordAction` | `auth.dualFactor.updatePassword` |
| `monstera.rotateApiKey()` | `MonsteraAuth` | `AuthenticatorCallPipeline` | `buildRotateApiKeyAction` | `auth.apiKeySession.rotateApiKey` |
| `monstera.addMultiAuthenticator()` | `MonsteraAuth` | `AuthenticatorCallPipeline` + `EncodeAuthConfig` | `buildAddAuthenticatorAction` | `auth.multi.addAuthenticator` |

### Auth proof builders (off-chain, no tx)

| User calls | Domain module | Pipeline | Client method |
|------------|---------------|----------|---------------|
| `monstera.createAuthProofWalletSignature()` | `MonsteraAuth` | `AuthenticatorCallPipeline.encodeAuthProof` | — |
| `monstera.createAuthProofDualFactor()` | `MonsteraAuth` | `AuthenticatorCallPipeline.encodeAuthProof` | — |
| `monstera.createAuthProofMulti()` | `MonsteraAuth` | `AuthenticatorCallPipeline.encodeAuthProof` | — |

### Wallet creation & factory admin

| User calls | Domain module | Pipeline | Client method |
|------------|---------------|----------|---------------|
| `monstera.createWallet()` | `MonsteraFactory` | `EncodeAuthConfig` (in method) | `factory.createWallet` |
| `monstera.initializeWalletLogic()` | `MonsteraFactory` | `CredentialsSession` (resolve `keyVaultAddr`) | `logic.initialize` |
| `monstera.configurePassword()` | `MonsteraAuth` | `EncodeAuthConfig` | `auth.password.configure` |
| `monstera.getKeyVaultAddr()` | `MonsteraFactory` | `CredentialsSession` (via `_resolveWalletProxyOptions`) | `factory.getKeyVaultAddr` |
| `monstera.updateWalletLogicImplAddr()` | `MonsteraFactory` | — (admin signer) | `factory.updateWalletLogicImplAddr` |
| `monstera.setAuthenticatorAllowed()` | `MonsteraFactory` | — (admin signer) | `factory.setAuthenticatorAllowed` |

### Session & option resolution

| User calls | Domain module | What runs |
|------------|---------------|-----------|
| `monstera.hasCredentials()` | `MonsteraSession` | `VaultCallPipeline.hasCredentials()` |
| `monstera.getSessionKeyVaultAddr()` | `MonsteraSession` | `VaultCallPipeline.resolveVaultOptions()` |
| Any vault-scoped call with connect credentials | `MonsteraSession` | `CredentialsSession.resolveVaultOptions()` merges username → `keyVaultAddr`, password |

### Read paths (no auth pipeline)

| User calls | Domain module | Client method |
|------------|---------------|---------------|
| `monstera.getAccountAddr()` | `MonsteraKeyVault` | `keyVault.getAccountAddr` |
| `monstera.isPasswordValid()` | `MonsteraAuth` | `auth.password.verify` (after `encodeAuthProof` with verify probe) |
| `monstera.getWhitelist()` | `MonsteraAuth` | `auth.walletSignature.getWhitelist` |
| `monstera.isWallet()` | `MonsteraFactory` | `factory.isWallet` |

All RPC/signing failures flow through `BaseContractClient` → `ExecutionPipeline` → `sdkErrorPipeline` regardless of domain module.

## Project Structure

```
src/             # Source code
  adapters/      # ethers adapter (encoding, signing, …)
  base/          # BaseContractClient, ContractRegistry, ExecutionPipeline
  config/        # Network presets (networks.js), SDK config (monstera.js)
  providers/     # Provider and Sapphire wrapper
  contracts/     # ABIs and getters (core: factory, logic, keyVault V3; auth: password, walletSig, dualFactor, passwordMinuteSignature; interfaces: iAuthenticator)
  clients/       # Factory, logic, keyVault, auth (password, walletSignature, dualFactor, passwordMinuteSignature)
  events/        # Event definitions and receipt parsing
  errors/        # Error types (single source of truth for error exports)
  internal/      # logger, sanitization/, versionCheck, assert, auth/ (AuthProofPipeline, authenticators/, session/, proof/, context/), vault/ (actions/, accountIndex.js, signAuthorization.js), validators/, crypto/, utils/
  sdk/           # Monstera (thin composer), MonsteraUtils, domains/ (MonsteraSession, MonsteraAuth, …)
  types/         # Shared JSDoc types (connect, transactions, auth-config, auth-proof, factory, keyvault)
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

