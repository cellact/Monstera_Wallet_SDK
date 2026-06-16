# Monstera SDK Examples

Examples are organized by **what you want to do**, not by SDK internals.

## Start here

| I want to… | Example | Needs existing wallet? |
|------------|---------|------------------------|
| Create my first wallet | [`nodejs/getting-started/01-create-wallet.js`](nodejs/getting-started/01-create-wallet.js) | No |
| Use a wallet (addresses, sign message) | [`nodejs/getting-started/02-use-wallet.js`](nodejs/getting-started/02-use-wallet.js) | Yes |
| Try wallet-signature auth (whitelist) | [`nodejs/authentication/wallet-signature/whitelist-flow.js`](nodejs/authentication/wallet-signature/whitelist-flow.js) | No (creates one) |
| Sign a transaction | [`nodejs/signing/sign-transaction.js`](nodejs/signing/sign-transaction.js) | Yes |
| Sign EIP-7702 authorization | [`nodejs/signing/sign-authorization.js`](nodejs/signing/sign-authorization.js) | Yes |
| Change my password | [`nodejs/authentication/password/update-password.js`](nodejs/authentication/password/update-password.js) | Yes |
| Browse all KeyVault client methods | [`nodejs/reference/key-vault-client.js`](nodejs/reference/key-vault-client.js) | Yes |

## Example types

- **Flows** (`nodejs/getting-started/`) — numbered, sequential tutorials. Run in order.
- **Recipes** — one focused task per file (wallet creation variants, signing, auth, upgrades).
- **Reference** (`nodejs/reference/`) — API tours that demonstrate many methods on one client. Not starting points.

## Platforms

- **[Node.js](nodejs/README.md)** — full SDK usage with `dotenv` and a signer
- **[Browser](browser/README.md)** — ESM and IIFE builds

## Setup (Node.js)

```bash
cp examples/nodejs/.env.example .env
# Edit .env with your testnet signer key and passwords

node examples/nodejs/getting-started/01-create-wallet.js
```

See [nodejs/README.md](nodejs/README.md) for the full index and environment variables.
