# Internal auth module

Built-in authenticator encoding and call orchestration for the Monstera SDK.

## Layer stack

```
session/          ConnectSession (connect → keyVaultAddr, password, API key)
    ↓
pipelines/        KeyVaultAuthPipeline, ExplicitAuthPipeline, AuthConfigPipeline
    ↓
proof/            AuthProofEncoder + builders/signing helpers; config/ for authConfig bytes
    ↓
specs/            BuiltinAuthenticatorSpec plugins + registry lookups
actions/          On-chain management action builders (selector + paramsHash)
probes/           Cross-authenticator verify probe actions
context/          Action hash resolution and AuthContext assembly
```

## `proof/` layout

```
proof/
  AuthProofEncoder.js   Orchestrator (vault resolve + explicit flow encode)
  logging.js            Encoder-only structured logs
  common.js             createActionBoundEncoder, deadlines, password hash resolution
  builders/             Per-authenticator createAuthProof* functions
  signing/              Auth-domain EIP-712 wrappers (uses internal/crypto/eip712)
```

## Adding a built-in authenticator

1. Add `specs/<name>.js` via `createAuthenticatorSpec` (see `types/auth-proof.js` for the resulting shape):
   ```js
   export const fooAuthenticator = createAuthenticatorSpec({
     id: 'fooAuth',
     flowId: 'foo',
     addressKey: 'fooAuth',
     applySessionInput: requirePartialOrSession('…', …),
     collectKeys: ['…'],
     mapFields: { …: true },
     validate: (options) => { … },
     proofEncoder: createActionBoundEncoder({ … }),
     configEncoder: (authConfig) => { … }
   });
   ```
2. Register in `specs/registry.js` (`CHILD_AUTHENTICATORS` / `BUILTIN_AUTHENTICATORS`)
3. **Proof** — pick one:
   - Trivial ABI wrap: add to `proof/builders/abiProofs.js`, wire via `createActionBoundEncoder` in spec
   - EIP-712 / signing: add `proof/builders/<name>.js` (reuse `proof/signing/eip712.js`)
   - Provider / on-chain helpers: add `proof/builders/<name>.js` (see `apiKeySession.js`)
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
