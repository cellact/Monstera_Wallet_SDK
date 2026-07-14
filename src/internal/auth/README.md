# Internal auth module

Built-in authenticator encoding and call orchestration for the Monstera SDK.

## Layer stack

```
session/          ConnectSession (connect → keyVaultAddr, password, API key)
    ↓
pipelines/        KeyVaultAuthPipeline, ExplicitAuthPipeline, AuthConfigPipeline
    ↓
proof/ + config/  AuthProofEncoder, per-auth proof builders; AuthConfigEncoder, config bytes
    ↓
specs/            BuiltinAuthenticatorSpec plugins (one file per built-in auth)
actions/          On-chain management action builders (selector + paramsHash)
probes/           Cross-authenticator verify probe actions
context/          Action hash resolution and AuthContext assembly
registry/         Checksum-keyed encoder lookup helper
```

## Adding a built-in authenticator

1. Add `specs/<name>.js` — implement `BuiltinAuthenticatorSpec` (see `types/auth-proof.js`)
2. Register in `specs/registry.js` (`BUILTIN_AUTHENTICATORS`)
3. **Proof** — pick one:
   - Trivial ABI wrap: add to `proof/abiProofs.js`, wire via `createActionBoundEncoder` in spec
   - EIP-712 / signing: add `proof/<name>.js` (reuse `proof/eip712.js`)
   - Provider / on-chain helpers: add `proof/<name>.js` (see `proof/apiKeySession.js`)
4. **Config** (if needed): add one function in `config/bytes.js`
5. Add `actions/<name>.js` for management writes; export from `actions/index.js`
6. Add client under `src/clients/auth/` and wire `MonsteraAuth` facade methods

## Operation classes (SDK recipes)

| Class | Pipeline | Encode |
|-------|----------|--------|
| Vault-authenticated | `KeyVaultAuthPipeline` | `AuthProofEncoder.encodeForKeyVault` |
| Authenticator invoke | `ExplicitAuthPipeline` | `AuthProofEncoder.encodeForFlow` |
| Configure | `AuthConfigPipeline` | `AuthConfigEncoder` |
| Factory create | — | `AuthConfigEncoder` (inline in `MonsteraFactory`) |

Vault-scoped reads use `mergeVaultOptions` only (no pipeline recipe).
