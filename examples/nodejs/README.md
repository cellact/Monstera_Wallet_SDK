# Node.js Examples

## Quick start

```bash
cp examples/nodejs/.env.example .env
# Set SIGNER_PRIVATE_KEY and PASSWORD at minimum

node examples/nodejs/getting-started/01-create-wallet.js
node examples/nodejs/getting-started/02-use-wallet.js
```

After `01-create-wallet.js`, copy `WALLET_ADDRESS` and `MNEMONIC` from the output into `.env` for later examples.

## Directory index

### Flows — `getting-started/`

Run in order for a guided introduction.

| File | Description |
|------|-------------|
| [`01-create-wallet.js`](getting-started/01-create-wallet.js) | Create an HD wallet with password auth |
| [`02-use-wallet.js`](getting-started/02-use-wallet.js) | Get addresses, sign messages and hashes |
| — | Wallet-signature auth flow → [`authentication/wallet-signature/whitelist-flow.js`](authentication/wallet-signature/whitelist-flow.js) |

### Wallet creation — `wallet/`

| File | Description |
|------|-------------|
| [`create-with-hook.js`](wallet/create-with-hook.js) | Create wallet with post-creation hook |
| [`create-core-only.js`](wallet/create-core-only.js) | Create KeyVault + Storage only (no WalletLogic proxy) |
| [`create-custom-logic.js`](wallet/create-custom-logic.js) | Create wallet with custom logic implementation |
| [`create-with-mnemonic.js`](wallet/create-with-mnemonic.js) | Create wallet from a provided mnemonic |

### Accounts — `accounts/`

| File | Description |
|------|-------------|
| [`get-address.js`](accounts/get-address.js) | Derive a single account address by index |
| [`list-accounts.js`](accounts/list-accounts.js) | Derive multiple account addresses |

### Signing — `signing/`

| File | Description |
|------|-------------|
| [`sign-transaction.js`](signing/sign-transaction.js) | Sign and broadcast a contract interaction |
| [`sign-authorization.js`](signing/sign-authorization.js) | EIP-7702-style authorization via `signAuthorization` |

### Authentication — `authentication/`

See [authentication/README.md](authentication/README.md) for which auth type to use.

| Folder | File | Description |
|--------|------|-------------|
| `password/` | [`update-password.js`](authentication/password/update-password.js) | Change wallet password |
| `wallet-signature/` | [`whitelist-flow.js`](authentication/wallet-signature/whitelist-flow.js) | Full whitelist flow (create → test → add signer) |
| `wallet-signature/` | [`remove-whitelisted-wallet.js`](authentication/wallet-signature/remove-whitelisted-wallet.js) | Remove address from whitelist |
| `password-minute-signature/` | [`create-and-sign.js`](authentication/password-minute-signature/create-and-sign.js) | Time-bound password-minute-signature auth |
| `management/` | [`switch-authenticator.js`](authentication/management/switch-authenticator.js) | Switch authenticator on a wallet |
| `management/` | [`list-authenticator-clients.js`](authentication/management/list-authenticator-clients.js) | List and access authenticator clients |

### Upgrades — `upgrades/`

| File | Description |
|------|-------------|
| [`update-wallet-logic.js`](upgrades/update-wallet-logic.js) | Upgrade WalletLogic implementation (admin) |
| [`update-key-vault.js`](upgrades/update-key-vault.js) | Upgrade KeyVault implementation |

### Factory (admin) — `factory/`

| File | Description |
|------|-------------|
| [`transfer-admin.js`](factory/transfer-admin.js) | Transfer WalletFactory admin ownership |

### SDK configuration — `sdk/`

| File | Description |
|------|-------------|
| [`network-switching.js`](sdk/network-switching.js) | Switch between testnet and mainnet |
| [`version-check.js`](sdk/version-check.js) | Opt-in npm version check on connect |

### Reference — `reference/`

API tours — demonstrate many methods on one client. Use when you need to grep the API surface, not as a first read.

| File | Client |
|------|--------|
| [`key-vault-client.js`](reference/key-vault-client.js) | KeyVault |
| [`factory-client.js`](reference/factory-client.js) | WalletFactory |
| [`wallet-logic-client.js`](reference/wallet-logic-client.js) | WalletLogic |
| [`password-auth-client.js`](reference/password-auth-client.js) | PasswordAuthenticator |
| [`wallet-signature-auth-client.js`](reference/wallet-signature-auth-client.js) | WalletSignatureAuthenticator |

## npm scripts

```bash
npm run example:create-wallet
npm run example:use-wallet
npm run example:sign-transaction
```

Run `npm run` to see all `example:*` scripts.

## Environment variables

Copy [`.env.example`](.env.example) to the repo root as `.env`. Most examples need:

- `SIGNER_PRIVATE_KEY` — deployer/signer for on-chain writes
- `PASSWORD` — wallet password (password-auth wallets)
- `WALLET_ADDRESS` — existing wallet (most post-creation examples)
