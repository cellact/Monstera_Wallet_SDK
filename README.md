# Monstera SDK

[![npm version](https://img.shields.io/npm/v/@monstera_protocol/sdk.svg)](https://www.npmjs.com/package/@monstera_protocol/sdk)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A JavaScript SDK for creating and managing smart contract wallets on Oasis Sapphire. Built-in support for encrypted transactions via Sapphire's confidential computing.

## What is Monstera

Monstera is an SDK for **API-driven wallets where private keys never leave a Sapphire enclave**.  
It gives you one wallet with a single cryptographic root and **many isolated accounts**, each of which can be mapped to products, environments, or features.

Your application sends **auth proofs** (password-based, wallet-signature-based, dual-factor, or custom).  
Monstera verifies them on-chain against the **specific operation** being performed (action-bound authentication), derives the correct account from the wallet’s HD root, and signs **inside the enclave**.  
Your backend never sees private keys and never has to handle raw key material.

## How it works (high level)

- A wallet is created once and gets a single HD root inside a Sapphire-backed contract.
- All accounts are **derived** from that root by index (account 0, 1, 2, …).  
  Each account is a normal Ethereum address with its own balance and history.
- The user authenticates once (password, wallet signature, dual-factor, etc.).  
  Authentication is attached to the wallet, **not** to individual accounts.
- When you call `sign*` from the SDK (including `signAuthorization` for EIP-7702-style delegations):
  - With `credentials`, `keyVaultAddr` is resolved from the session; you may omit it on vault calls.
  - You send a structured `authProof` (e.g. `{ password: Uint8Array }`) or omit it when connected with `credentials` on password-based vaults.
  - The SDK binds the proof to that operation (selector + params hash) before the vault verifies it.
  - The wallet’s authenticator checks the proof for that action.
  - If valid, the KeyVault derives the requested account key and signs **inside the enclave**.
  - Only the signature leaves; the private key never does.

Responsibilities are split so that no single contract can compromise a wallet on its own.


## What It Does

- 🔐 **Encrypted Transactions** - Automatic Sapphire wrapper for confidential transactions
- 🌐 **Network Support** - Built-in testnet and mainnet presets
- 🔑 **Wallet Management** - Create and manage smart contract wallets (including username registration)
- 🔒 **Multiple Authenticators** - Password, wallet signature, dual-factor, and password-minute-signature authentication
- 🛡️ **Action-bound auth** - Proofs scoped to the exact vault operation (KeyVaultV3)
- 🔗 **Multi-chain & imported keys** - Solana signing, external key import, per-chain base keys
- 📋 **Optional Logging** - Configurable log levels (`error`, `warn`, `info`, `debug`); logs never include secrets
- ⚡ **Simple API** - Clean, intuitive interface with comprehensive error handling

## Installation

```bash
npm install @monstera_protocol/sdk
```

Install **ethers** v6 in your app as well (`npm install ethers`). The SDK lists it as a peer dependency so your bundler resolves a single copy. The SDK uses the ethers v6 API.

TypeScript and JavaScript editors read `dist/types`, generated from the JSDoc during `npm run build`. You do not need a local declaration file. `instanceof ValidationError` type-checks.

The calls an app should use are the [App API](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/docs/api.md#app-api). `sdk.factory`, `sdk.logic`, `sdk.keyVault`, and `sdk.auth` stay available for contract-level work.

**Note:** This SDK uses ES Modules (ESM). Requires Node.js 14+ or a bundler. **web3.js is not used** by this package; use ethers for all Ethereum interactions.

### Optional npm version check (`checkVersion`)

When you pass `checkVersion: true` to `Monstera.connect`, the SDK may perform a **best-effort** check for a newer package on the public npm registry. Details:

- **Opt-in only** — no outbound call unless you set `checkVersion: true`.
- **Node.js** — issues a **GET** to `https://registry.npmjs.org/@monstera_protocol/sdk/latest` to read the published version. If the request fails (offline, firewall, corporate proxy), the SDK continues normally; the check does not block usage.
- **Browser** — the registry request is **not** run (npm does not support CORS for this from browsers). You will see a one-line **debug** log that the check was skipped when debug logging is enabled.
- **Strict networks** — environments that block outbound HTTPS may never receive update hints; this is expected.

After installation, run the CLI to get started:

```bash
npx monstera
```

## Quick Start

```javascript
import { Monstera } from '@monstera_protocol/sdk';
import { keccak256, toUtf8Bytes } from 'ethers';

const username = 'alice';
const password = 'your-secure-password';

// `signer` pays Sapphire gas. `credentials` are the user's password.
const sdk = Monstera.connect({
  mainnet: false,
  signer: process.env.SIGNER_PRIVATE_KEY,
  credentials: { username, password }
});

const wallet = await sdk.createWalletForUsername({
  authenticatorAddr: sdk.addresses.passwordAuth,
  authConfig: { passwordHash: keccak256(toUtf8Bytes(password)) },
  username
});

// Password vault: the proof is filled from `credentials`.
const signature = await sdk.signMessage({
  message: toUtf8Bytes('Hello from Monstera')
});

console.log('Wallet created:', wallet.wallet);
console.log('Save this mnemonic securely:', wallet.mnemonic);
console.log('Signature:', signature);
```

`signer` pays gas and is a server private key. `credentials` are the user's username and password. `signMessage` uses those credentials, so this call does not pass `authProof`.

`createWalletForUsername` registers that password wallet under `alice`. The same create-and-sign session without a username is the password-only track, which passes `keyVaultAddr` and `authProof` on each sign. Both tracks are in [examples/nodejs/getting-started/](https://github.com/cellact/Monstera_Wallet_SDK/tree/main/examples/nodejs/getting-started).

Built-in contract addresses are `sdk.addresses`, taken from the network presets. Pass `addresses` on `connect` to replace one key when a deployment differs; every key you omit stays on the preset. Use `sdk.setLogLevel('debug')` at runtime to change log verbosity.

**Upgrading from 1.x?** See the [2.0.0 changelog](CHANGELOG.md#200---2026-06-16) for action-bound `authProof` and network preset changes. Unreleased auth-pipeline improvements are listed under [Unreleased](CHANGELOG.md#unreleased) in the changelog.

**Need more details?** See the [full wallet creation guide](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/docs/node.md#basic-usage).

## Documentation

Guides stay in the repository. They are not copied into the npm package.

- **[Node.js Usage](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/docs/node.md)** - Installation, configuration, examples, and running tests
- **[Browser Usage](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/docs/browser.md)** - ESM and IIFE builds for browsers
- **[API Reference](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/docs/api.md)** - Complete API documentation
- **[Architecture](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/docs/architecture.md)** - Project structure and development guide
- **[Contributing](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/CONTRIBUTING.md)** - Branches, tests, and pull-request expectations

## Examples

Examples stay in the repository: **[examples/](https://github.com/cellact/Monstera_Wallet_SDK/tree/main/examples)**.

- **[examples/README.md](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/examples/README.md)** — Start here: “I want to…” index
- **Node.js**: [examples/nodejs/](https://github.com/cellact/Monstera_Wallet_SDK/tree/main/examples/nodejs) — `getting-started/`, `wallet/`, `signing/`, `authentication/`, and more
- **Browser**: [examples/browser/](https://github.com/cellact/Monstera_Wallet_SDK/tree/main/examples/browser) — ESM and IIFE usage

## Security

- ⚠️ **Never expose private keys** in client-side code or logs
- 🔒 **Store mnemonics securely**
- 🧪 **Use testnet for development** - only use mainnet for production
- ✅ **Validate contract addresses** before use
- 📋 **SDK logging** is configurable and does not log seeds, mnemonics, passwords, or auth proofs

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## Support

- 🐛 [Report Issues](https://github.com/cellact/Monstera_Wallet_SDK/issues)
- 📖 [Changelog](CHANGELOG.md)
- 🤝 [Contributing](https://github.com/cellact/Monstera_Wallet_SDK/blob/main/CONTRIBUTING.md)

## Acknowledgments

Built for [Oasis Sapphire](https://docs.oasis.io/dapp/sapphire/) with [ethers.js](https://docs.ethers.io/).
