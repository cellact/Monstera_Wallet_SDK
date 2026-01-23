# Contributing to Arnacon Wallet SDK

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the SDK.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/Ariana0699/Wallet_SDK_JavaScript.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Guidelines

### Code Style

- Follow JavaScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for all public APIs
- Keep functions focused and single-purpose

### Error Handling

- Use custom error classes from `src/errors/WalletError.js`
- Provide descriptive, contextual error messages
- Include error codes for programmatic handling
- Add context (function name, parameters, etc.)

### Testing

- Write tests for all new features
- Ensure existing tests pass: `npm test`
- Aim for high code coverage
- Test error cases as well as success cases

### Documentation

- Update README.md for user-facing changes (keep it simple - detailed docs go in `docs/`)
- Add JSDoc comments for new functions
- Update examples if API changes
- Document breaking changes in CHANGELOG.md
- See [docs/architecture.md](docs/architecture.md) for project structure and development details

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Write or update tests
3. Update documentation
4. Ensure all tests pass
5. Submit a pull request with a clear description

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

