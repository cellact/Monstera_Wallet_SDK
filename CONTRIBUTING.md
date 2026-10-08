# Contributing to Monstera SDK

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Monstera SDK.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/cellact/Monstera_Wallet_SDK.git`
3. Install dependencies: `npm install`
4. Create a branch from `main`: `git checkout -b feature/your-feature-name` (see [Branch naming](#branch-naming) below)

## Development Guidelines

### Code Style

- Follow JavaScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for all public APIs
- Keep functions focused and single-purpose

### Logging

- Use the shared logger: `import log from '../internal/logger.js'` (or the correct relative path)
- Use **object form** for structured data: `log.debug('shortMessage', { key: value })` instead of string concatenation
- **Never log secrets**: no mnemonics, passwords, auth proofs, or private keys in logs
- Log levels: `error`, `warn`, `info`, `debug` (configurable via `logLevel` or `debug` when calling `Monstera.connect()` — read-only flows omit `signer`; write flows pass `signer`)

### Error Handling

- Use custom error classes from `src/errors/` (defined in `WalletError.js`, exported via `index.js`)
- Provide descriptive, contextual error messages
- Include error codes for programmatic handling
- Add context (function name, parameters, etc.)
- To add a new error: add the class in `WalletError.js` and export it from `src/errors/index.js`

### Testing

- Write tests for all new features; cover error cases as well as success paths.
- **Unit tests** (default `npm test`): fast, offline-first; Jest runs with `--experimental-vm-modules`. They import `src/`.
- **Bundle test** (`npm run test:bundle`): imports `@monstera_protocol/sdk`, which resolves to `dist/monstera.mjs`. Run `npm run build` first. Jest does not load this file.
- **Integration tests** live under `tests/integration/` and expect RPC access (and typically `SIGNER_PRIVATE_KEY`, `PASSWORD`, etc. via `.env`). Run the full suite with network available when validating end-to-end behavior.

```bash
npm test
# Run a single file, e.g.:
npm test -- tests/unit/base/contractRegistry.test.js
```

### Documentation

- Update README.md for user-facing changes (keep it simple - detailed docs go in `docs/`)
- Add JSDoc comments for new functions
- Update examples if API changes
- Document breaking changes in CHANGELOG.md
- See [docs/architecture.md](docs/architecture.md) for project structure and development details

### Branch naming

- Features: `feature/description-of-feature`
- Bug fixes: `fix/description-of-bug`
- Hotfixes: `hotfix/description-of-fix`
- Releases: `release/version-number`

### Commit messages

Use the format: **`<type>(<scope>): <subject>`**

- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope**: component or module name (lowercase, concise)
- **Subject**: imperative mood, no period, under 50 characters

Example: `feat(auth): add dual factor authenticator client`

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Write or update tests
3. Update documentation
4. Ensure all tests pass
5. Submit a pull request to the **`main`** branch with a clear description

## Reporting Issues

When reporting issues, please include:

- SDK version
- Node.js version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages (if any)

## Questions?

Open an issue or contact the maintainers.

Thank you for contributing! 🎉

