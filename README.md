# Monstera SDK

[![npm version](https://img.shields.io/npm/v/@monstera_protocol/sdk.svg)](https://www.npmjs.com/package/@monstera_protocol/sdk)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A JavaScript SDK for creating and managing smart contract wallets on Oasis Sapphire. Built-in support for encrypted transactions via Sapphire's confidential computing.

## What is Monstera

Monstera is an SDK for **API-driven wallets where private keys never leave a Sapphire enclave**.  
It gives you one wallet with a single cryptographic root and **many isolated accounts**, each of which can be mapped to products, environments, or features.

Your application sends **auth proofs** (password-based, wallet-signature-based, dual-factor, or custom).  
Monstera verifies them on-chain, derives the correct account from the wallet’s HD root, and signs **inside the enclave**.  
Your backend never sees private keys and never has to handle raw key material.

## How it works (high level)

- A wallet is created once and gets a single HD root inside a Sapphire-backed contract.
- All accounts are **derived** from that root by index (account 0, 1, 2, …).  
  Each account is a normal Ethereum address with its own balance and history.
- The user authenticates once (password, wallet signature, dual-factor, etc.).  
  Authentication is attached to the wallet, **not** to individual accounts.
- When you call `sign*` from the SDK (including `signAuthorization` for EIP-7702-style delegations):
  - You send an `authProof` plus signing params.
  - The wallet’s authenticator verifies the proof.
  - If valid, the KeyVault derives the requested account key and signs **inside the enclave**.
  - Only the signature leaves; the private key never does.

Responsibilities are split so that no single contract can compromise a wallet on its own.


## What It Does

- 🔐 **Encrypted Transactions** - Automatic Sapphire wrapper for confidential transactions
- 🌐 **Network Support** - Built-in testnet and mainnet presets
- 🔑 **Wallet Management** - Create and manage smart contract wallets
- 🔒 **Multiple Authenticators** - Password, wallet signature, dual-factor, and password-minute-signature authentication
- 📋 **Optional Logging** - Configurable log levels (`error`, `warn`, `info`, `debug`); logs never include secrets
- ⚡ **Simple API** - Clean, intuitive interface with comprehensive error handling

## Installation

```bash
npm install @monstera_protocol/sdk
```

The SDK ships with a dependency on **ethers** v5/v6 for contracts and signing. You should also declare `ethers` in your app (`npm install ethers`) so your bundler resolves a single copy; the package lists ethers as a **peer dependency** for that reason.

**Note:** This SDK uses ES Modules (ESM). Requires Node.js 14+ or a bundler. **web3.js is not used** by this package; use ethers for all Ethereum interactions.

### Optional npm version check (`checkVersion`)

When you pass `checkVersion: true` to `Monstera.connect` / `connectAsync`, the SDK may perform a **best-effort** check for a newer package on the public npm registry. Details:

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
import { ethers } from 'ethers';

const monstera = Monstera.connect({ 
  mainnet: false, 
  signer: '0x...', // Your private key (or ethers Signer)
  debug: true     // optional: enable debug logs; or use logLevel: 'info' | 'warn' | 'error'
});

// Create password hash for authentication
const passwordHash = ethers.keccak256(ethers.toUtf8Bytes('your-secure-password'));

// Create a wallet
const wallet = await monstera.createWallet({
  authenticatorAddr: monstera.addresses.passwordAuth,
  authConfig: { passwordHash } 
});

console.log('Wallet created:', wallet.wallet);
console.log('Save this mnemonic securely:', wallet.mnemonic);
```

That's it! Contract addresses use network presets; override with `addresses` or `rpcUrl` if needed. Use `monstera.setLogLevel('debug')` at runtime to change log verbosity.

**Need more details?** See [Full wallet creation guide](docs/node.md#basic-usage).

## Documentation

- **[Node.js Usage](docs/node.md)** - Installation, configuration, and examples for Node.js
- **[Browser Usage](docs/browser.md)** - ESM and IIFE builds for browsers
- **[API Reference](docs/api.md)** - Complete API documentation
- **[Architecture](docs/architecture.md)** - Project structure and development guide

## Examples

Check out the `examples/` directory for comprehensive examples:

- **Node.js**: `examples/nodejs/` - Wallet creation, authentication, signing (transactions, messages, EIP-7702 authorizations via `signAuthorization`), and more
- **Browser**: `examples/browser/` - ESM and IIFE usage examples

## Security

- ⚠️ **Never expose private keys** in client-side code or logs
- 🔒 **Store mnemonics securely**
- 🧪 **Use testnet for development** - only use mainnet for production
- ✅ **Validate contract addresses** before use
- 📋 **SDK logging** is configurable and does not log seeds, mnemonics, passwords, or auth proofs

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## Support

- 🐛 [Report Issues](https://github.com/Ariana0699/Wallet_SDK_JavaScript/issues)
- 📖 [Changelog](CHANGELOG.md)
- 🤝 [Contributing](CONTRIBUTING.md)

## Acknowledgments

Built for [Oasis Sapphire](https://docs.oasis.io/dapp/sapphire/) with [ethers.js](https://docs.ethers.io/).
