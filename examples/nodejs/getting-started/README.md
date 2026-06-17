# Getting started

Two guided tracks. Pick the one that matches how your app identifies wallets.

| | **password-only** | **username-and-password** |
|---|---|---|
| **Best for** | Backend/admin-operated wallets | Product login (username + password) |
| **Create** | `createWallet()` | `createWalletForUsername()` |
| **Factory username map** | No | Yes (`usernameHash → wallet`) |
| **Connect (vault ops)** | `connect({ signer })` + explicit `keyVaultAddr` | `connect({ credentials })` |
| **Pass `keyVaultAddr`?** | Yes, on vault-scoped calls | No — resolved from username |
| **Env vars (use step)** | `SIGNER_PRIVATE_KEY`, `WALLET_ADDRESS`, `PASSWORD` | `USERNAME`, `USER_PASSWORD` |

> **password-only** means the wallet is not registered to a username in the factory. You still authenticate vault calls with the wallet password (and pass `keyVaultAddr` on each call).

## password-only

Wallet linked to a password only — no factory username registration.

```bash
node examples/nodejs/getting-started/password-only/01-create-wallet.js
# Copy WALLET_ADDRESS, KEYVAULT_ADDRESS, MNEMONIC, PASSWORD into .env

node examples/nodejs/getting-started/password-only/02-use-wallet.js
```

## username-and-password

Wallet registered to a username on the factory; end users connect with credentials.

```bash
node examples/nodejs/getting-started/username-and-password/01-create-wallet.js
# Copy USERNAME, USER_PASSWORD, MNEMONIC into .env

node examples/nodejs/getting-started/username-and-password/02-use-wallet.js
```

## Next steps

- Wallet-signature auth → [`../authentication/wallet-signature/whitelist-flow.js`](../authentication/wallet-signature/whitelist-flow.js)
- Sign a transaction → [`../signing/sign-transaction.js`](../signing/sign-transaction.js)
