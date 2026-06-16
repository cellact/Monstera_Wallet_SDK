# Browser Installation & Usage

The Monstera SDK works in browsers via ESM or IIFE builds.

## Installation

### Option A: ESM (Modern Browsers)

```html
<script type="module">
  import { Monstera } from './node_modules/@monstera_protocol/sdk/dist/monstera.mjs';
  import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6/dist/index.min.mjs';
  
  const sdk = Monstera.connect({
    mainnet: false,
    signer: 'your_private_key',  // or ethers Signer instance
    debug: true                 // optional: enable debug logs; or logLevel: 'info' | 'warn' | 'error'
  });
</script>
```

**Note:** For production, host `dist/monstera.mjs` on your CDN or use a bundler.

### Option B: IIFE Global (Script Tag)

```html
<!-- Load ethers first (required) -->
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>

<!-- Load Monstera SDK -->
<script src="./node_modules/@monstera_protocol/sdk/dist/monstera.global.js"></script>

<script>
  const sdk = window.Monstera.connect({
    mainnet: false,
    signer: 'your_private_key',
    debug: true   // optional: enable debug logs
  });
  
  // Change log level at runtime
  sdk.setLogLevel('debug');
  
  // Error classes are also exposed on window.Monstera
  console.log(window.Monstera.WalletError);
  console.log(window.Monstera.ValidationError);
</script>
```

**Note:** 
- The IIFE build (`monstera.global.js`) automatically includes a queue stub, so you can call `Monstera()` before the script loads if needed.
- All error classes are automatically exposed on `window.Monstera` (e.g., `window.Monstera.WalletError`).
- For production, host `dist/monstera.global.js` on your CDN.

### Async Loading with Queue Stub

The IIFE build (`monstera.global.js`) automatically includes a queue stub, so you can call `Monstera()` before the script loads:

```html
<!-- Load ethers first -->
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>

<!-- Optional: Call Monstera before script loads (will be queued automatically) -->
<script>
  // The queue stub is built into monstera.global.js, but you can also add it manually
  // if you want to call Monstera before the script tag executes
  Monstera = Monstera || function() {
    (Monstera.q = Monstera.q || []).push(arguments);
  };
  Monstera.q = Monstera.q || [];
  
  // Call Monstera before script loads (queued)
  Monstera('connect', { mainnet: false, signer: '0x...' });
</script>

<!-- Load SDK asynchronously -->
<script>
  (function() {
    var script = document.createElement('script');
    script.async = true;
    script.src = './node_modules/@monstera_protocol/sdk/dist/monstera.global.js';
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  })();
</script>
```

**Note:** The queue stub is automatically included in `monstera.global.js`, so queued calls will be processed when the SDK loads.

## Configuration

The same options as Node.js apply in the browser:

- **`Monstera.connect(options)`**: `mainnet` (required); `signer` (optional — omit for read-only); optional `provider`; `rpcUrl`, `addresses` (optional overrides: `factory`, `passwordAuth`, `walletSignatureAuth`, `dualFactorAuth`, `passwordMinuteSignatureAuth`), `logLevel`, `debug`, `checkVersion` (optional — must be **`true`** to opt into the npm version warning in Node.js; see [API Reference](api.md); typical browser usage does not hit the npm registry)
- **`sdk.setLogLevel(level)`**: Change log level at runtime (`'error'` | `'warn'` | `'info'` | `'debug'`)

Logs never include secrets (mnemonics, passwords, auth proofs). See [Node.js configuration](node.md#configuration) and [API Reference](api.md) for full option details.

**2.0+ note:** KeyVault calls use action-bound authentication. Pass structured `authProof` objects (e.g. `{ password: Uint8Array }`) on `signMessage` / `sign` / similar methods; see [Action-bound authentication](api.md#action-bound-authentication-20).

## Entry Points

The SDK provides multiple entry points via `package.json` exports:

- **Default**: `import { Monstera } from '@monstera_protocol/sdk'` → Uses ESM build (`dist/monstera.mjs`) for browsers, or source (`src/index.js`) for Node.js
- **ESM Build**: `import { Monstera } from '@monstera_protocol/sdk/mjs'` → Direct access to `dist/monstera.mjs`
- **IIFE Global**: Available at `dist/monstera.global.js` (for script tags) or via `@monstera_protocol/sdk/global` in package exports

## Examples

The SDK includes browser examples in `examples/browser/`:

- **`esm/basic-connect.html`** - ESM usage with `<script type="module">`
- **`iife/global.html`** - IIFE global bundle usage
- **`iife/global-async.html`** - Async loading with queue stub

See [examples/browser/README.md](../examples/browser/README.md) for details.

