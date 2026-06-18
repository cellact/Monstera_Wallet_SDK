# Node.js Installation & Usage

## Installation

```bash
npm install @monstera_protocol/sdk
```

**Note:** This SDK uses ES Modules (ESM). Make sure your project supports ESM or use a bundler that handles ESM.

## Peer Dependencies

Monstera expects **`ethers`** (v5 or v6) at runtime (`peerDependencies` in `package.json`).

```bash
npm install ethers
```

## Basic Usage

Pass optional `signer` and/or `credentials` to `Monstera.connect()` depending on what you need.

```javascript
import { Monstera } from '@monstera_protocol/sdk';

// Admin writes — create wallets, configure authenticators, factory writes
const adminSdk = Monstera.connect({
  mainnet: false,
  signer: process.env.SIGNER_PRIVATE_KEY
});

// End user — sign messages, authenticated vault reads (no keyVaultAddr needed)
const userSdk = Monstera.connect({
  mainnet: false,
  credentials: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD
  }
});

// Both — admin writes and vault ops on one instance
const fullSdk = Monstera.connect({
  mainnet: false,
  signer: process.env.SIGNER_PRIVATE_KEY,
  credentials: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD
  }
});
```

`Monstera.connect({ mainnet })` without `signer` or `credentials` is **read-only** (factory/network queries only).

### Action-bound auth proofs (2.0+)

KeyVaultV3 requires proofs bound to the operation being performed. With **`credentials`**, you can omit `keyVaultAddr` and often omit `authProof` on password-based vaults — the SDK resolves the vault from `credentials` and encodes the proof from the session (password or password-minute-signature authenticators):

```javascript
import { toUtf8Bytes } from 'ethers';

await userSdk.signMessage({
  index: 0, // optional; defaults to 0
  message: toUtf8Bytes('Hello from Monstera')
});
```

**Wallet-signature** and **dual-factor** vaults still require an explicit `authProof.signer` on each authenticated call even when `credentials` are set. Pass a partial structured `authProof` to override the session password (e.g. `{ password: toUtf8Bytes('other') }`; minute-signature derives `passwordHash` from `password` automatically).

Low-level `createAuthProof*` helpers require an explicit `action` or `actionHash`. See [API Reference — Action-bound authentication](api.md#action-bound-authentication-20) and the [2.0.0 changelog](../CHANGELOG.md#200---2026-06-16).

### Upgrading from 2.0.x / 1.x

- **2.1+**: Use `Monstera.connect({ signer })` for admin writes and `Monstera.connect({ credentials })` for username-registered vault ops. Signer-only connect supports vault calls when you pass explicit `keyVaultAddr` and `authProof`.
- Update `authProof` usage to structured objects on KeyVault calls (see examples in `examples/nodejs/`).
- Confirm network preset addresses match your deployments, or override via `addresses` in `Monstera.connect()`.
- New wallets use **KeyVaultV3**; factory creation requires authenticators on the factory allowlist (`allowedAuthenticators`).

## Network Switching

```javascript
import { Monstera } from '@monstera_protocol/sdk';

// Testnet admin writes
const testnetSdk = Monstera.connect({
  mainnet: false,
  signer: 'your_private_key'
});

// Testnet vault signing/reads
const userSdk = Monstera.connect({
  mainnet: false,
  credentials: { username: 'alice', password: 'secret' }
});

// Mainnet admin
const mainnetSdk = Monstera.connect({
  mainnet: true,
  signer: 'your_private_key'
});

// Read-only instance (omit signer; read operations only)
const readonlySdk = Monstera.connect({
  mainnet: false,
  // provider (optional) - ethers Provider; uses default RPC if not provided
  // logLevel or debug (optional)
});

// Access network information
console.log('Network:', testnetSdk.network); // 'sapphire-testnet'
console.log('Chain ID:', testnetSdk.chainId); // 23295
console.log('RPC URL:', testnetSdk.rpcUrl);
console.log('Addresses:', testnetSdk.addresses);
```

## Configuration

### Network Presets

The SDK includes presets for both networks:

- **Testnet**: 
  - Name: `sapphire-testnet`
  - Chain ID: `23295` (0x5aff)
  - RPC URL: `https://testnet.sapphire.oasis.dev`
  - Explorer: `https://testnet.explorer.sapphire.oasis.io`

- **Mainnet**: 
  - Name: `sapphire-mainnet`
  - Chain ID: `23294` (0x5afe)
  - RPC URL: `https://sapphire.oasis.io`
  - Explorer: `https://explorer.sapphire.oasis.io`

### Address Overrides

Default contract addresses come from **`config/networks.js`** for the selected network.
You can override default contract addresses when creating the SDK:

```javascript
const sdk = Monstera.connect({
  mainnet: false,
  signer: 'your_private_key', // Private key string or ethers Signer instance
  addresses: {
    factory: '0x...',               // Override factory address
    passwordAuth: '0x...',          // Override password authenticator
    walletSignatureAuth: '0x...',   // Override wallet signature authenticator
    dualFactorAuth: '0x...',        // Override dual factor authenticator
    passwordMinuteSignatureAuth: '0x...' // Override password-minute-signature authenticator
  }
});
```

**Note:** You can override individual addresses or all of them. Addresses not provided will use the defaults for the selected network.

### npm version check (optional)

Pass **`checkVersion: true`** to `Monstera.connect()` to run a one-time check against the npm registry for a newer SDK version (Node.js). If omitted or `false`, no outbound registry request is made.

### Custom RPC URLs

Override the default RPC URL:

```javascript
const sdk = Monstera.connect({
  mainnet: false,
  rpcUrl: 'https://custom-rpc-endpoint.com',
  signer: 'your_private_key' // Private key string or ethers Signer instance
});

// Or with address overrides
const sdkWithOverrides = Monstera.connect({
  mainnet: false,
  rpcUrl: 'https://custom-rpc-endpoint.com',
  addresses: {
    factory: '0x...',
    passwordAuth: '0x...',
    walletSignatureAuth: '0x...',
    dualFactorAuth: '0x...',
    passwordMinuteSignatureAuth: '0x...',
  },
  signer: 'your_private_key' // Private key string or ethers Signer instance
});
```

### Logging

You can control SDK log verbosity when creating the instance or at runtime. Logs never include secrets (mnemonics, passwords, auth proofs, or private keys).

**When calling `Monstera.connect()` (with or without `signer`):**

```javascript
// Option 1: enable all debug logs
const sdk = Monstera.connect({
  mainnet: false,
  signer: '0x...',
  debug: true
});

// Option 2: set level explicitly
const sdk = Monstera.connect({
  mainnet: false,
  signer: '0x...',
  logLevel: 'info'  // 'error' | 'warn' | 'info' | 'debug' (default: 'error')
});
```

**At runtime:**

```javascript
sdk.setLogLevel('debug');  // switch to debug logs
sdk.setLogLevel('error');  // quiet again
```

## Examples

Examples are organized by task under `examples/nodejs/`. See **[examples/README.md](../examples/README.md)** for the full index and **[examples/nodejs/README.md](../examples/nodejs/README.md)** for the Node.js catalog.

**Start here (flows):** see [examples/nodejs/getting-started/README.md](../examples/nodejs/getting-started/README.md)

- `getting-started/password-only/` — `createWallet()` + `connect({ signer })` + explicit `keyVaultAddr`
- `getting-started/username-and-password/` — `createWalletForUsername()` + `connect({ credentials })`

**Common recipes:**
- `signing/sign-transaction.js` — Sign and broadcast a transaction
- `signing/sign-authorization.js` — EIP-7702-style authorization via `signAuthorization`
- `authentication/password/update-password.js` — Update wallet password
- `authentication/wallet-signature/whitelist-flow.js` — Wallet-signature auth flow

**Reference tours** (many methods per client): `examples/nodejs/reference/`

### Running Examples

```bash
cp examples/nodejs/.env.example .env
# Edit .env — at minimum SIGNER_PRIVATE_KEY and PASSWORD

node examples/nodejs/getting-started/password-only/01-create-wallet.js
```

Or use npm scripts: `npm run example:create-wallet`

**Note:** Examples use ES Modules. Ensure you're using Node.js 14+ with ESM support, or use a bundler.

## Running tests

```bash
npm test
```

Unit tests under `tests/unit/` are intended to run without a live RPC. Integration tests under `tests/integration/` need network access and environment variables (see `examples/nodejs/` and your `.env`). See [CONTRIBUTING.md](../CONTRIBUTING.md) for more detail.
