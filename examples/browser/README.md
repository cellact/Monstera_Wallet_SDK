# Browser Examples

Build the SDK first (`npm run build`), then open these HTML files in a browser (or serve the repo with any static server).

## Files

| File | Description |
|------|-------------|
| [`esm/basic-connect.html`](esm/basic-connect.html) | ESM import from `dist/monstera.mjs` |
| [`iife/global.html`](iife/global.html) | IIFE global bundle (`window.Monstera`) |
| [`iife/global-async.html`](iife/global-async.html) | Async script load with queue stub |

## Notes

- Load **ethers** before Monstera (peer dependency).
- Browser examples are read-only demos (connect without a signer). For signing flows, use [Node.js examples](../nodejs/README.md).
- See [docs/browser.md](../../docs/browser.md) for installation options in your app.
