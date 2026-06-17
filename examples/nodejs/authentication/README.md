# Authentication Examples

Choose the auth type that matches your product. Each folder has focused recipes; see [../README.md](../README.md) for the full index.

## Which auth type?

| Folder | When to use |
|--------|-------------|
| [`password/`](password/) | Default. User proves knowledge of a password hash stored on-chain. |
| [`wallet-signature/`](wallet-signature/) | Whitelist of EOAs that can sign proofs (no password). Good for backend or multi-signer setups. |
| [`password-minute-signature/`](password-minute-signature/) | Password + time-bound minute signature. Proofs expire quickly. |
| `dual-factor/` | *(not yet covered by an example)* — use API docs and unit tests under `tests/unit/`. |
| [`management/`](management/) | Switch authenticator type or inspect available authenticator clients. |

## Suggested order

1. **Password** — start with [../getting-started/password-only/01-create-wallet.js](../getting-started/password-only/01-create-wallet.js), then [password/update-password.js](password/update-password.js) if you need rotation.
2. **Wallet signature** — [wallet-signature/whitelist-flow.js](wallet-signature/whitelist-flow.js) (creates its own wallet).
3. **Password-minute-signature** — [password-minute-signature/create-and-sign.js](password-minute-signature/create-and-sign.js) (requires `KEYVAULT_ADDRESS`).

## Common env vars

| Variable | Used by |
|----------|---------|
| `PASSWORD` | Password auth |
| `ALLOWED_1_KEY`, `ALLOWED_2_KEY` | Wallet-signature whitelist |
| `KEYVAULT_ADDRESS` | Password-minute-signature (vault created separately) |
| `NEW_PASSWORD` | Password update |
| `NEW_AUTHENTICATOR_ADDRESS` | Switch authenticator |
