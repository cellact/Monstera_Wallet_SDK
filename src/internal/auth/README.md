# Internal auth module

Built-in authenticator encoding and call orchestration for the Monstera SDK.

## Layer stack

```
session/          ConnectSession (connect → keyVaultAddr, password, API key)
    ↓
pipelines/        KeyVaultAuthPipeline, ExplicitAuthPipeline, AuthConfigPipeline
    ↓
encoding/         AuthProofEncoder, AuthConfigEncoder, createAuthProof, authConfigBytes
    ↓
specs/            BuiltinAuthenticatorSpec plugins (one file per built-in auth)
actions/          On-chain management action builders (selector + paramsHash)
```

Root-level helpers: `actionContext.js`, `registryByChecksumAddress.js`, `pipelineLog.js`.

## Adding a built-in authenticator

1. Add `specs/<name>.js` — implement `BuiltinAuthenticatorSpec` (see `specs/types.js`)
2. Register in `specs/registry.js` (`BUILTIN_AUTHENTICATORS`)
3. Add proof helpers in `encoding/createAuthProof.js` (or `encoding/apiKeySessionProof.js` pattern)
4. Add config helper in `encoding/authConfigBytes.js` if needed
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
