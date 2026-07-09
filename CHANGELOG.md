# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`ApiKeySessionAuthenticator`**: Full SDK integration — client (`ApiKeySessionAuthenticatorClient`), contract ABI/wrapper, registry spec (`apiKeySession`), events, and network defaults (`addresses.apiKeySessionAuth` on Sapphire testnet/mainnet).
- **Credentials session (`apiKey`)**: Connect with `{ username, apiKey }` where `apiKey` is a 32-byte hex string; session stores `apiKeySecret = keccak256(apiKey)` and injects it on vault calls via `applySessionInput` and explicit-flow `defaultApiKeySecret` flags. At least one of `password` or `apiKey` is required on connect.
- **`Monstera` ApiKeySession API**: `configureApiKeySession`, `isApiKeySessionConfigured`, `isApiKeySessionValid`, `computeTokenMac`, `computeActionMac`, `buildTokenAuthProof`, `buildActionAuthProof`, `rotateApiKey`, `selectorBit`; static scope constants `API_KEY_SESSION_SCOPE_SIGN_ALL` and `API_KEY_SESSION_SCOPE_ALL`.
- **On-chain proof orchestration**: ApiKeySession MAC computation and ABI encoding delegate to contract pure helpers (`computeTokenMac` / `computeActionMac`, `buildTokenAuthProof` / `buildActionAuthProof`) via `src/internal/auth/apiKeySession/onChainProof.js` — no duplicated off-chain MAC math.
- **ACTION and TOKEN proof modes**: ACTION mode binds proofs to a vault operation (`action` / `actionHash`); TOKEN mode mints scoped bearer proofs (`expiry`, `scopeMask`) for reuse. Structured `authProof: { mode: 'token', scopeMask }` on vault calls (e.g. `signMessage`) is supported.
- **Auth pipeline logging** (`pipelineLog.js`): Structured `info` / `debug` logs for vault vs explicit auth paths (encoder, flow, proof mode, proof byte length).
- **Getting-started track**: `examples/nodejs/getting-started/username-and-apiKey/` (`01-create-wallet.js`, `02-use-wallet.js`) — wallet creation with ApiKeySession auth config, connect with username + API key, ACTION-mode signing without explicit `authProof`, and inline TOKEN-mode `signMessage`.
- **Types**: `ConnectCredentials.apiKey`, ApiKeySession auth-config / proof / verify / rotate options, and `EncodedAuthProofApiKeySession`.
- **Tests**: Extended `credentialsSession` coverage for API key session defaults.
- **`MultiAuthenticator`**: Full SDK integration — client (`MultiAuthenticatorClient`), contract ABI/wrapper, registry spec (`multi`), events, and network defaults (`addresses.multiAuthenticator` on Sapphire testnet/mainnet).
- **`createAuthProofMulti`**: Routes proofs through enabled child authenticators via `abi.encode(address child, bytes childProof)`; child selection via `childFlowId`, `viaChildFlowId`, `viaChild`, or `child`.
- **`Monstera` MultiAuthenticator API**: `configureMultiAuthenticator`, `createAuthProofMulti`, `isMultiAuthenticatorConfigured`, `getMultiAuthenticators`, `isMultiAuthenticatorChildEnabled`, `isMultiValid`, `computeMultiAuthenticatorActionHash`, `addMultiAuthenticator`, `removeMultiAuthenticator`.
- **Multi auth config encoding**: Structured `authConfig.children` entries encode to `abi.encode(address[] children, bytes[] childConfigs)` at wallet creation and configure time.
- **MultiAuthenticator examples**: `examples/nodejs/authentication/multi/` (`create-wallet.js`, `add-authenticator.js`) — create a multi-auth wallet with a password child, then add ApiKeySession as a second child.
- **Tests**: Unit coverage for multi child address resolution (`tests/unit/internal/resolveChild.test.js`).
- **`PasswordOrWalletSignatureAuthenticator`**: Full SDK integration — client (`PasswordOrWalletSignatureAuthenticatorClient`), contract ABI/wrapper, registry spec (`passwordOrWalletSignature`), events, and network defaults (`addresses.passwordOrWalletSigAuth` on Sapphire testnet/mainnet).
- **Unified password-or-wallet proof envelope**: `createAuthProofPasswordOrWalletSignature` encodes `abi.encode(uint8 method, bytes methodProof)` — method `1` (password) or `2` (wallet signature); method inferred from `signer` vs `password` when omitted.
- **`createLinkWalletSignature`**: EIP-712 `LinkWallet` signing helper for `addToWhitelistWithProof` wallet-link approval flows.
- **`Monstera` PasswordOrWalletSignature API**: `configurePasswordOrWalletSignature`, `createAuthProofPasswordOrWalletSignature`, `isPasswordOrWalletSignatureConfigured`, `isPasswordOrWalletSignatureWhitelisted`, `getPasswordOrWalletSignatureWhitelist`, `isPasswordOrWalletSignatureLinkNonceUsed`, `getPasswordOrWalletSignatureDomainSeparator`, `computePasswordOrWalletSignatureLinkParamsHash`, `computePasswordOrWalletSignatureLinkActionHash`, `isPasswordOrWalletSignatureValid`, `updatePasswordOrWalletSignature`, `addToPasswordOrWalletSignatureWhitelist`, `removeFromPasswordOrWalletSignatureWhitelist`, `addToPasswordOrWalletSignatureWhitelistWithProof`.
- **PasswordOrWalletSignature examples**: `examples/nodejs/authentication/password-or-wallet-signature/` (`create-wallet.js`, `whitelist-flow.js`) — dual auth paths (password + whitelisted wallet signature), whitelist administration, and LinkWallet approval.
- **Types**: MultiAuthenticator and PasswordOrWalletSignature auth-config / proof / client options, result types, and encoded payload typedefs.

### Changed

- **Sapphire `chainId` for auth proofs**: Auth proof encoding always uses the SDK config `chainId` (`applyConfigDefaults` on all built-in authenticators); optional caller overrides removed from public auth option types (`CreateAuthProofBaseOptions`, `PreparePasswordFlowOptions`, `UpdatePasswordOptions`, `ComputeTokenMacOptions`, `ComputeActionMacOptions`). **`signTransaction`** and **`signAuthorization`** still accept target-chain `chainId` where applicable.
- **`AuthenticatorCallPipeline`**: Maps `apiKeySession` flow inputs (`mode`, `expiry`, `scopeMask`, `apiKeySecret`); maps `multi` and `passwordOrWalletSignature` flow inputs; debug logging on explicit encode; no longer forwards caller `chainId` into prepare input (defaults come from config).
- **`VaultCallPipeline`**: Debug logging for pre-encoded vs built auth proofs on invoke.
- **`AuthProofPipeline`**: Vault and explicit paths emit structured pipeline logs after proof encoding.
- **`ExecutionPipeline`**: `Executing read` demoted from `info` to `debug` to reduce RPC noise during auth flows.
- **`collectProofInput`**: Collects ApiKeySession structured proof fields (`mode`, `expiry`, `scopeMask`); collects multi routing fields and PasswordOrWalletSignature method/password/signer/deadline fields.
- **`AuthenticatorClient`**: Registers `multi` and `passwordOrWalletSignature` clients on `monstera.auth`.
- **Built-in authenticator registry**: Extended with `multi` and `passwordOrWalletSignature` specs; PasswordOrWalletSignature available as a MultiAuthenticator child.
- **`createAuthProofWalletSignature`**: Optional `eip712ContractName` override (used by PasswordOrWalletSignatureAuthenticator).

### Fixed

- **`addMultiAuthenticator` / `removeMultiAuthenticator`**: Proof routing now prefers `viaChildFlowId` / `viaChild` over the contract `child` target so admin flows authorize via the correct enabled child instead of the child being added/removed.
- **`resolveChildAddr`**: Returns checksummed addresses for multi proof routing.

## [2.3.0] - 2026-06-18

### Added

- **`AuthenticatorCallPipeline`**: Symmetric with **`VaultCallPipeline`** for authenticator management writes (`encodeAuthProof`, `invokeWithAuthProof`); **`Monstera`** auth write methods invoke **`this.auth.*`** through the pipeline.
- **`withDefaultAccountIndex`** (`src/internal/vault/accountIndex.js`): Shared HD account index default (`0`) for vault auth encoding, **`signAuthorization`**, and account address reads.
- **`CredentialsSession.resolveVaultOptions`**: Static session-merge helper used by both **`VaultCallPipeline`** and **`AuthenticatorCallPipeline`**.
- **Assert / normalisation helpers**: **`normalizeMnemonic`**, **`requireNormalizedUsername`**, plain-object helpers (`isPlainObject`, `requirePlainObject`, `requireDefined`, `requireNonEmptyObject`), and **`configAssert`** / **`requireProviderMethod`** for config and provider duck-check sites.
- **Tests**: Unit coverage for **`AuthenticatorCallPipeline`**, **`accountIndex`**, and extended credentials session / vault pipeline tests.

### Changed

- **Authenticator management orchestration**: Replaced **`AuthenticatorManagementOps`** with **`AuthenticatorCallPipeline`**; all authenticator write paths and explicit proof builders route through **`encodeAuthProof`** / **`invokeWithAuthProof`** on **`Monstera`**.
- **`resolveVaultOptions`**: Consolidated on **`CredentialsSession`**; **`VaultCallPipeline.resolveVaultOptions`** is a thin delegate.
- **Account index defaulting**: Centralized via **`withDefaultAccountIndex`** instead of per-method **`defaultIndex`** flags on session resolution.
- **Validation boundaries**: Connect, auth, and config validators wired through shared assert helpers; factory and credentials session share **`requireNormalizedUsername`** rules.

### Removed

- **`AuthenticatorManagementOps`** and **`src/internal/auth/management/`**.

### Fixed

- **`AuthenticatorCallPipeline`**: Caller-supplied **`authenticatorAddr`** is preserved before config overrides or flow defaults (invalid addresses reach validation instead of being silently replaced).
- **`signAuthorization`**: Resolves **`keyVaultAddr`** from the credentials session when omitted, matching other vault operations.

## [2.2.0] - 2026-06-18

### Added

- **`AuthProofPipeline`**: Unified entry point for vault-authenticated KeyVault calls (discover authenticator from chain, merge session defaults, bind vault actions) and explicit proof builders (`prepare` / `encode`). Per-authenticator specs live under **`src/internal/auth/authenticators/`** (`password`, `minuteSignature`, `walletSignature`, `dualFactor`) with **`collectProofInput`**, **`applySessionInput`**, and a shared registry.
- **Getting-started tracks**: Node.js examples split into **`password-only/`** and **`username-and-password/`** under **`examples/nodejs/getting-started/`** (see **[examples/nodejs/getting-started/README.md](examples/nodejs/getting-started/README.md)**).
- **Tests**: Unit coverage for **`AuthProofPipeline.encodeVaultCall`**, **`collectProofInput`**, and updated **`VaultCallPipeline`** / authenticator session-default tests.

### Changed

- **Auth proof internals**: Replaced **`EncodeAuthProof`**, **`ProofFlowOrchestrator`**, **`sessionAuthProofDefaults`**, **`proofDefaults.js`**, and **`encoders/*`** with **`AuthProofPipeline`** plus **`authenticators/*`** specs. **`VaultCallPipeline`** now delegates encoding to **`AuthProofPipeline.encodeVaultCall`**; **`AuthenticatorManagementOps`** uses **`AuthProofPipeline.prepare`**.
- **Credentials session defaults**: When **`authProof`** is omitted on vault calls with an active **`credentials`** session, the SDK discovers the wallet’s on-chain authenticator and fills proof input automatically for **PasswordAuthenticator** (`password`) and **PasswordMinuteSignatureAuthenticator** (`passwordHash`). **WalletSignatureAuthenticator** and **DualFactorAuthenticator** still require an explicit **`authProof.signer`** (guardian for dual-factor).
- **`Monstera.connect()`**: Single connect API with optional **`signer`** and/or **`credentials`** (connect profile helpers removed from **`src/sdk/connect/`**).
- **Scope resolution**: More **`Monstera`** methods resolve **`keyVaultAddr`** / **`walletAddr`** from the credentials session when omitted (configure, initialize, and factory read paths).

### Removed

- **`src/sdk/connect/`** module (profile-specific connect helpers).
- Legacy auth modules: **`EncodeAuthProof.js`**, **`ProofFlowOrchestrator.js`**, **`sessionAuthProofDefaults.js`**, **`proofDefaults.js`**, and **`src/internal/auth/encoders/*`**.

### Fixed

- **Omitted `authProof` on vault calls**: Credential-backed **`signMessage`**, **`sign`**, and similar methods no longer pass through without encoding (which caused **`authProof is required`** at the KeyVault client).
- **Minute-signature encoding**: **`actionHash`** is resolved before **`prepareProofResult`** so minute-signature proofs encode correctly end-to-end.
- **Explicit `authProof.password`**: For **PasswordMinuteSignatureAuthenticator** and **DualFactorAuthenticator**, **`collectProofInput`** now derives **`passwordHash`** from **`password`** bytes instead of ignoring them and falling back to session defaults (wrong-password overrides work as expected).

## [2.1.0] - 2026-06-16

### Added

- **Username/password credentials on connect**: Optional **`credentials`** (`{ username, password }`) on **`Monstera.connect()`** resolves and caches the registered wallet's KeyVault address via the factory (`hashUsername` → `walletOfUsername` → `getKeyVaultAddr`). Vault-scoped facade methods can omit **`keyVaultAddr`**; authenticated calls default **`authProof`** to the session password for **PasswordAuthenticator** wallets (`src/internal/auth/CredentialsSession.js`).
- **`Monstera` session helpers**: **`hasCredentials()`**, **`getSessionWalletAddr()`**, **`getSessionKeyVaultAddr()`**, and **`getWalletAddress({ index })`** for credential-backed sessions.
- **Types**: **`ConnectCredentials`** on **`ConnectOptions`**; **`keyVaultAddr`** and **`authProof`** optional on session-aware option types when credentials are set.
- **Tests**: Unit coverage for **`CredentialsSession`** and **`parseConnectCredentials`** (`tests/unit/internal/credentialsSession.test.js`).

### Changed

- **Examples layout**: Node.js examples reorganized into task-based folders (`getting-started/`, `wallet/`, `signing/`, `authentication/`, `reference/`, etc.) with kebab-case filenames. See **[examples/README.md](examples/README.md)** for the index. Old flat paths (e.g. `1_createHDWallet.js`) are removed.

## [2.0.0] - 2026-06-16

### Added

- **Action-bound authentication**: Proofs are scoped to a specific vault operation via **`AuthContext`** / **`AuthActionInput`** (`selector`, `paramsHash`, optional `target`, `actionHash`). New helpers in **`src/internal/crypto/authContext.js`**, **`src/internal/crypto/actions/`** (KeyVault and authenticator action builders), **`getSelector`**, and **`authenticatorProbe`** compute canonical hashes aligned with **KeyVaultV3** and built-in authenticators.
- **`AuthProofOrchestrator`** and **`AuthManagementOps`**: Central orchestration for encoding action-bound proofs and wiring password / guardian / whitelist management flows (`src/internal/auth/`).
- **`createActionBoundProofEncoder`**: Shared encoder wrapper for built-in authenticator proof paths (`src/internal/auth/proof/createActionBoundProofEncoder.js`).
- **`Monstera`**: **`computeActionHash`**, **`executeWithAuth`**, **`computeCustomImplementationAckHash`**, **`computeCustomAuthenticatorAckHash`**; high-level vault writes now resolve action context internally via the action builders.
- **KeyVaultV3 client surface**: Synced ABI and client methods for imported keys (**`importKey`**, **`deactivateKey`**, **`activateKey`**, **`signWithImportedKey`**), multi-chain signing (**`signSolana`**, **`setChainBaseKeys`**), policy-registry reads (**`policyRegistry`**, **`isImplementationApproved`**, **`isAuthenticatorApproved`**), and explicit **`initializeExplicit`** with **`policyRegistry`** (`src/clients/keyVault/KeyVaultClient.js`, `src/contracts/abi/core/keyVault.js`).
- **WalletFactory policy registry**: Factory allowlist reads/writes (**`allowedAuthenticators`**, **`allowedKeyVaultImplementations`**, **`setAuthenticatorAllowed`**, **`setKeyVaultImplementationAllowed`**, **`setWalletImplementationAllowed`**, **`setWalletAuthenticatorAllowed`**, **`isFactoryImplementationApproved`**, **`isFactoryAuthenticatorApproved`**, **`getKeyVaultTemplate`**) plus updated **`WalletFactory`** ABI/events (`src/clients/factory/WalletFactoryClient.js`).
- **Username wallet registration**: **`createWalletForUsername`**, **`createWalletForUsernameFromMnemonic`**, **`createWalletForUsernameHash`**, **`createWalletForUsernameHashFromMnemonic`**, **`hashUsername`**, **`walletOfUsername`**, **`getWalletUsernameHash`**; **`normalizeUsername`** helper (`src/internal/utils/normalize.js`); **`UsernameRegistered`** event parsing; **`UsernameWalletCreationResult`** type.
- **`IAuthenticator`** ABI fragment (`src/contracts/abi/interfaces/iAuthenticator.js`).
- **Tests**: Unit coverage for **`authContext`**, **`authenticatorProbe`**, **`getSelector`**, and KeyVault action builders (`tests/unit/crypto/`); integration tests updated for action-bound auth flows.

### Changed

- **BREAKING — structured `authProof`**: Built-in **`createAuthProof*`** inputs and vault write paths expect structured proof objects with an **`action`** (`selector` + `paramsHash`) or a precomputed **`actionHash`**. Pre-encoded proof hex strings alone are no longer sufficient for action-gated KeyVaultV3 calls—update callers to pass action context (see updated **`examples/nodejs/`** scripts).
- **BREAKING — network presets**: Default **`factory`**, authenticator, and related contract addresses in **`config/networks.js`** updated for current Sapphire **KeyVaultV3** / **WalletFactory** deployments (factory addresses updated again for username-registration contracts).
- **Authenticator clients**: Password, wallet-signature, dual-factor, and password-minute clients aligned with action-bound verify/configure flows and updated ABIs.
- **`signAuthorization`**: Uses action-bound proof encoding and **`executeWithAuth`** internally.
- **Examples**: Node.js examples refreshed for structured auth proofs, env validation, **`signAuthorization`**, factory policy helpers, and slimmer **`keyVaultMethods.js`** demo surface.

## [1.0.0] - 2026-05-13

### Added

- **`requireNonEmptyBytes`** (`src/internal/assert.js`) and stricter empty-bytes checks across **`KeyVaultClient`**, **`WalletLogicClient`**, and built-in **authenticator** clients for fields such as **`authProof`** and **`implCall`**.
- **`Sanitizer.forErrorContext`**: Recursive pass over nested **`extraData`** so sensitive keys inside nested objects are redacted (`src/internal/sanitization/Sanitizer.js`).
- **Tests**: Unit coverage for **`ContractRegistry`**, **`AuthConfigBuilder.encode`**, **`createRegistryByChecksumAddress`**, **`Sanitizer.forEncoderValue`**, **`fallbackTranslator`**, extended **`AuthProofBuilder.encode`** (wallet-signature / dual-factor paths and **`getAuthenticatorAddr`** failures), **`ExecutionPipeline`**, **`sensitiveParams`**, and **`signAuthorization`** resolution / **`executeSignAuthorization`** orchestration (`tests/unit/**`). New offline **`Monstera`** validation suite (`tests/unit/monstera/offlineValidation.test.js`).
- **`src/internal/crypto/signAuthorization.js`**: Exports **`resolveSignAuthorizationInputs`** alongside **`executeSignAuthorization`** (primarily for unit tests; same module surface as before for app code).

### Changed

- **`WalletFactoryClient`**: Create-wallet paths require a **non-empty** **`authConfig`**; documentation and types clarify **mnemonic** handling and factory behavior (`docs/api.md`, **`Monstera`**, **`src/types/index.js`**).
- **Password updates**: **`PasswordAuthenticatorClient`**, **`PasswordMinuteSignatureAuthenticatorClient`**, and **`DualFactorAuthenticatorClient`** no longer remap **`walletAddr`** in update-password options (`examples/nodejs/authentication/password/update-password.js` aligned).
- **`KeyVaultClient` / `WalletLogicClient`**: Shared address-validation helpers applied consistently on relevant entry points; **`decodeReceipt`** and **`src/internal/utils/time.js`** updated alongside stricter time/deadline handling.
- **Documentation (JSDoc)**: Expanded module and API documentation across **`src/adapters/ethers/`**, **`src/base/`**, **`src/clients/`** (auth, factory, keyVault, logic), **`src/config/`**, and related barrels.
- **`docs/api.md`**, **`Monstera`**, **`BaseContractClient`**, **`ExecutionPipeline`**, **`KeyVaultClient`**, **`WalletLogicClient`**, types: Clarified **KeyVault**-first vs **WalletLogic**-shaped call sites and documented **`executeWrite`** **`requireEvents`** semantics.

## [1.0.0-alpha.9] - 2026-05-06

### Added

- **`src/adapters/ethers/`**: Ethers **adapter** surface (`encoding.js`, `signing.js`, `hashing.js`, `addresses.js`, `provider.js`) plus re-exports of common ethers APIs (`Wallet`, `Mnemonic`, `HDNodeWallet`, `Contract`, `ContractFactory`, `Transaction`, formatting helpers, etc.) so SDK internals use one import boundary instead of scattering direct **`ethers`** imports.
- **Assertions / normalization**: **`normalizeChainId`** and **`requireChainId`** (`src/internal/assert.js`); **`normalizeBigInt`** and **`requireBigInt`** (`src/internal/utils/normalize.js`) for consistent chain ID and bigint handling.
- **Types (JSDoc)**: **`ResolvedSignAuthorizationInputs`** and related sign-authorization resolution typings (`src/types/index.js`).

### Changed

- **`src/base/`**: Split **`BaseContractClient`** responsibilities into **`ContractRegistry`** (read/write contract getters) and **`ExecutionPipeline`** (**`executeRead`** / **`executeWrite`**, **`buildErrorContext`** via **`Sanitizer`**, injectable **`sdkErrorPipeline`**). Former **`SapphireWriteWrapper`** behavior lives inside **`ExecutionPipeline`** (the standalone module is removed).
- **BREAKING — contract address resolution**: Removed on-chain **`ConfigStorage`** registry integration (`src/config/registry.js`, ConfigStorage ABI/contracts, related **`Monstera`** wiring and **`polygon`** helper usage tied to that flow). Contract addresses come from **`config/networks.js`** presets and explicit **`addresses`** / config overrides when connecting—no remote registry fetch.
- **Auth encoding**: **`AuthProofBuilder`** / **`AuthConfigBuilder`** with **`AuthProofContext`** / **`AuthConfigContext`**; centralized auth-proof validation and defaults (**`applyAuthProofDefaults`** moved under helpers; sensitive parameter list and config validation centralized on **`Monstera`**).
- **Authenticator registry**: **`getAuthClient`** validates the requested type and uses an allowlisted set of authenticator keys.
- **Logging**: Redacts sensitive fields in client, registry, and minute-signature debug output; aligns logging with ethers usage.
- **JSDoc**: Shared ethers and **`WalletError`** typedef usage in base/error surfaces.
- **Config/registry validation**: Stricter validation and clearer errors when resolving built-in contract address maps (without remote registry).
- **Error translation pipeline**: Unified **`ErrorPipeline`** / **`sdkErrorPipeline`** in **`src/errors/pipeline.js`** composes **`revert`**, **`network`**, **`signing`**, **`ethersEncoder`**, and **`fallback`** translators (`src/errors/translators/`) so RPC failures, ABI decode/revert data, typed-data signing errors, and fallbacks map consistently to **`WalletError`** subclasses; pipeline **`translate`** / **`rethrow`**, **`applySdkContext`**, and **`rethrowExecuteError`** merge **sanitized** **`sdkContext`** onto errors for stable diagnostics.
- **Error context sanitization**: **`src/internal/sanitization/`** (**`Sanitizer`**, **`SENSITIVE_PARAM_NAMES`**) strips sensitive keys when enriching errors for logs and structured **`context`**.
- **Internal auth encoding layout**: Built-in KeyVault / factory auth encoding lives under **`src/internal/auth/`** (`config/`, `proof/`, `defaults/`), with 
**`AuthProofBuilder`** / **`AuthConfigBuilder`** (wired with **`AuthProofContext`** / **`AuthConfigContext`**) replacing the former `encodeAuthProofOptions` / 
`encodeAuthConfigOptions` helpers; auth-proof defaults moved to **`internal/auth/defaults/authProofDefaults.js`**. Older changelog entries that mention `src/internal/
authenticators/**` describe historical paths only.

### Removed

- **`SapphireWriteWrapper`** module (logic moved to **`ExecutionPipeline`**).
- **ConfigStorage** on-chain registry (**`src/config/registry.js`**, ConfigStorage ABI/contracts, related **`Monstera`** wiring—see breaking note above).

### Fixed

- **Auth registry**: Safer **`Monstera#getAuthClient`** / registry **`getClient`** behavior via type validation and allowlisting.


## [1.0.0-alpha.8] - 2026-04-28

### Added

- **Internal crypto modules**: Barrel export [`src/internal/crypto/index.js`](src/internal/crypto/index.js) composes **`mnemonic.js`** (BIP39 + PBKDF2 seed), **`authConfig.js`** (factory auth-config ABI bytes), **`authProof.js`** (built-in auth proofs), **`authorization.js`** (EIP-7702 tuple hashing, KeyVault `signAuthorizationImpl` calldata, checksum, decode/finalize), **`signAuthorization.js`** (KeyVault orchestration for **`Monstera.prototype.signAuthorization`**), and **`signingErrorMapper.js`** (typed-data / signer failures for auth proofs).

### Changed

- **BREAKING — SDK initialization**: `Monstera.readonly()` is removed. Use **`Monstera.connect()`** for both flows: omit **`signer`** (and optionally pass **`provider`**) for read-only; pass **`signer`** for a write-capable instance. Replace `Monstera.readonly(options)` with `Monstera.connect(options)` and delete the `.readonly` call.
- **BREAKING — `Monstera.connect()`**: **`signer` is optional.** Read-only connections no longer throw when `signer` is omitted (previously `connect()` required a signer). Omitting `signer` matches the former `readonly()` behavior.
- **BREAKING — internal crypto imports**: Monolithic **`src/internal/crypto/wallet.js`** is removed. Import from **`src/internal/crypto/index.js`** or the specific module (`mnemonic.js`, `authorization.js`, etc.). **`hashPassword`** is no longer exported; hash passwords off-chain with **`ethers.keccak256(ethers.toUtf8Bytes(password))`** (same pattern as **[`examples/nodejs/reference/password-auth-client.js`](examples/nodejs/reference/password-auth-client.js)**).
- **`errors/ethersErrorTranslator`**: Shared helper for **`CALL_EXCEPTION` / `UNPREDICTABLE_GAS_LIMIT`** revert resolution (decode paths unified); clearer **`ContractRevertError`** messages and merged **`sdkContext`** when mapping ethers/RPC failures.
- **`SapphireWriteWrapper`**: After ethers v6 **`wait()`**, mined reverts that omit calldata/revert bytes are enriched by replaying the transaction with **`getTransaction`** + **`eth_call`** at the mined block when a read provider is available, then decoding with the contract ABI so **`ContractRevertError`** can include revert reason and args.
- **`registryByChecksumAddress`**: Uses **`toChecksumAddress`** from the crypto barrel (`authorization.js`); invalid authenticator addresses throw **`ValidationError`** during lookup instead of silently missing the registry key.
- **Network presets**: Default **`factory`** and **`passwordAuth`** addresses synced with current Sapphire deployments (**`config/networks.js`**).

### Fixed

- **Writes**: More reliable decoding of **on-chain revert data** after failed transactions when ethers surfaces **`CALL_EXCEPTION`** without embedded revert payload on the initial error object.

## [1.0.0-alpha.7] - 2026-04-23

### Added

- **`Monstera.prototype.signAuthorization`**: EIP-7702-style authorization signing through the KeyVault (digest aligned with ethers `Authorization` / `hashAuthorization`). Omitting `chainId` or `nonce` resolves them via `options.provider`, else `readProvider` / the connected signer’s provider. Orchestration lives in `src/internal/crypto/signAuthorization.js`; encoding and hashing helpers in `src/internal/crypto/wallet.js`.
- **Types (JSDoc)**: `SignAuthorizationOptions`, `SignedAuthorizationResult`, and `AuthorizationSplitSignature` in `src/types/index.js`.
- **Example**: `examples/nodejs/signing/sign-authorization.js` shows encoding an `authProof` and calling `signAuthorization`.

### Changed

- **JSDoc types (`src/types/index.js`)**: Reorganized by topic; dropped `Sdk` suffixes on client/authenticator option types; shortened Monstera-centric names; aligned **Client** option naming; unified encode auth-proof / auth-config `*Input` / `*Result` typedefs and encoder contexts; renamed create-wallet structured `authConfig` options; clarified auth-config naming and typing for `configure(authConfig)`; simplified built-in unions and renamed encoded `authConfig` aliases. Consumers who reference these typedef names in their own JSDoc or TS tooling may need to follow the new names (**source-only** change; runtime API unchanged).
- **`EncodedAuthConfigPasswordMinuteSignature`**: Updated alongside the encoded auth-config / minute-signature type work.
- **Documentation (types)**: Tighter auth-proof and required-address JSDoc; factory clients model encoded auth config; create-wallet base options document structured `authConfig` where required.

### Fixed

- **Input validation**: Stricter validation for bytes32 fields and password UTF-8 bytes.

## [1.0.0-alpha.6] - 2026-04-20

### Added

- **ESLint**: Root `.eslintrc.cjs` (`eslint:recommended`, ESM, Node/Jest env) so `npm run lint` runs; `__MONSTERA_VERSION__` is declared for Rollup-injected browser builds.
- **Integration test teardown**: `tests/utils/teardown.js` exports `closeSdkConnections` and `registerSdkTeardown` to destroy ethers `JsonRpcProvider` instances after suites; integration tests and `testReadonlySDK` use it to avoid hanging Jest workers.
- **Assertions**: `requireUtf8Bytes`, `requireBoolean`, `requireStringOrNumber`, `requireWalletOrHdNode`, `requireBytes32`, `requireArray`, and `isInFuture`; internal time helpers consolidated for deadline checks; expanded unit tests for assertion helpers and for `src/internal/crypto/wallet.js`.
- **Integration tests — authentication**: Suite split into `tests/integration/authentication/` (password, wallet signature + `createAuthProofWalletSignature`, dual-factor, password-minute, SDK auth registry); added coverage for dual-factor and minute-signature flows and for `getAuthClient` / `getAvailableAuthTypes`.
- **Integration tests — signing**: `getSolanaAddr`, `signSolana`, `importKey` / `getImportedKeyAddr` / `signWithImportedKey`, and stronger message/hash signing checks (some paths depend on chain KeyVault V2 behavior).

### Changed

- **BREAKING — version check**: Outbound npm registry check runs only when **`checkVersion: true`** is set on `Monstera.connect()`, `Monstera.readonly()`, or the config passed to `new Monstera(...)`. Omitted or `false` skips the check (previously ran unless explicitly disabled). To restore old behavior, pass `checkVersion: true`.
- **`deriveSeed`**: Removed the unused `iterations` parameter; derivation still uses PBKDF2 with 2048 iterations. Implementation lives under internal crypto (see below).
- **Internal layout**: Wallet crypto helpers moved from `src/crypto/wallet.js` to **`src/internal/crypto/wallet.js`** (non-public surface; all imports updated). Deep imports must follow the new path if you bypass the package root.
- **Password KeyVault auth proof encoder** (`internal/authenticators/authProof/encoders/password.js`): Validates `password` with `requireUtf8Bytes` for consistent non-empty `Uint8Array` rules.
- **`.npmignore`**: Explicitly excludes `.eslintrc.cjs` from published tarballs (alongside existing `package.json` `files` allowlist).

### Fixed

- **`SapphireWriteWrapper`**: On write failure, debug logs emit safe fields only (`methodName`, `errorName`, `errorCode`, `errorMessage`) instead of logging the raw `Error` object, which could expose sensitive provider/RPC payloads in debug mode.
- **`src/internal/versionCheck.js`**: JSDoc updated to state the check runs only when `checkVersion: true` is configured.
- **Rollup / Node ESM output (`dist/monstera.mjs`)**: Dedicated plugin pipeline for the ESM build vs the browser IIFE build; **`crypto` is marked `external`** and Node resolution prefers built-ins so PBKDF2/seed derivation uses Node’s `crypto` module (avoids `pbkdf2Sync is not a function` when browser-oriented crypto polyfills were bundled into the ESM output).

## [1.0.0-alpha.5] - 2026-04-16

### Fixed

- **SDK version when installed from npm**: `MonsteraConfig.version` no longer logged `Failed to load SDK version from package.json: fileURLToPath is not defined` and no longer resolved to `unknown` for consumers of the published ESM entry (`dist/monstera.mjs`). Node resolves the version via `createRequire(import.meta.url)` and `package.json` instead of `fileURLToPath` + `fs.readFileSync`.
- **Rollup browser build**: Version injection targets `src/config/monstera.js` with a brace-safe replacement of `static get version()` and strips Node-only `createRequire` usage so browser bundles stay valid.

## [1.0.0-alpha.4] - 2026-04-15

### Added

- **PasswordMinuteSignatureAuthenticator**: New built-in authenticator (client, ABI/events, default `passwordMinuteSignatureAuth` addresses on testnet and mainnet). Supports create-wallet `authConfig` (bytes32 password hash), KeyVault `authProof` encoding for minute-bucket signatures, and `Monstera` helpers (`createAuthProofMinuteSignature`, `configurePasswordMinuteSignature`, `isPasswordMinuteSignatureConfigured`, `isPasswordMinuteSignatureValid`, `updatePasswordMinuteSignature`).
- **Mainnet contract defaults**: Built-in default addresses for Sapphire mainnet (`factory`, `passwordAuth`, `walletSignatureAuth`, `dualFactorAuth`, `passwordMinuteSignatureAuth`). Connecting with `mainnet: true` resolves a full `addresses` map without requiring manual overrides for the shipped deployment.
- **Structured `authProof` types (JSDoc)**: Documented shapes for built-in KeyVault authenticators (`KeyVaultPasswordAuthProof`, `KeyVaultWalletSignatureAuthProof`, `KeyVaultDualFactorAuthProof`, `KeyVaultPasswordMinuteSignatureAuthProof`) and `CreateAuthProofDualFactorOptions` for dual-factor proof creation.
- **Custom deadline**: Optional `deadline` (Unix seconds) for wallet-signature and dual-factor auth proof flows where the contract and SDK support it (defaults remain one hour ahead when omitted).
- **Structured auth encoding helpers**: `encodeAuthConfigOptions` and `encodeAuthProofOptions` (`encodeAuthConfigOptions.js`, `encodeAuthProofOptions.js`) normalize create-wallet `authConfig` and KeyVault `authProof` options (hex/bytes pass-through; plain objects encoded via built-in authenticator registries).

### Changed

- **Internal layout**: Built-in authenticator encoding lives under `src/internal/authenticators/` (`authConfig/`, `authProof/`) with a shared checksum-keyed registry factory (`registryByChecksumAddress.js`). Ethereum address helpers moved to `src/internal/evm/addresses.js`.
- **`SapphireWriteWrapper`**: Stricter handling when a transaction or receipt is missing before `wait()`, optional `rpcUrl` on write options for clearer `NetworkError` context, and improved translation of nested JSON-RPC errors (for example Sapphire attestation messages).
- **Documentation**: `KeyVaultSigningBase` and related option types now describe `authProof` as hex bytes, `Uint8Array`, or one of the structured built-in object shapes (must match the authenticator installed on the target KeyVault).
- **BREAKING**: `Monstera#createAuthProof` renamed to `Monstera#createAuthProofWalletSignature` (same behavior; options unchanged aside from optional `deadline`). The JSDoc typedef `CreateAuthProofOptions` is renamed to `CreateAuthProofWalletSignatureOptions`.
- **BREAKING**: `createAuthProof` export from `src/crypto/wallet.js` renamed to `createAuthProofWalletSignature` and accepts a single options object `{ signer, chainId, authenticatorAddr, deadline, keyVaultAddr }` (update any positional call sites).
- **BREAKING**: Deep imports of `src/internal/authConfig/**` or `src/internal/authProof/**` must move to `src/internal/authenticators/authConfig/**` and `src/internal/authenticators/authProof/**` (prefer the public `Monstera` API to avoid internal paths).

### Fixed

- **Tests**: Wallet crypto unit tests call `createAuthProofWalletSignature` with the options object shape expected by `src/crypto/wallet.js`.

## [1.0.0-alpha.3] - 2026-01-22

### Added
- This CHANGELOG file
- **ESM Support**: Full ES Modules (ESM) support throughout the SDK
- **Automatic Version Checking**: SDK automatically checks for updates on initialization (Node.js only, can be disabled via `checkVersion: false`)
- **Version Management Utilities**: Version comparison and checking utilities (`parseVersion`, `compareVersions`, `satisfiesRange`, `getVersionType`)
- **Convenience API Methods**: All factory, keyVault, and auth methods are now accessible directly on the SDK instance (e.g., `sdk.createWallet()` instead of `sdk.factory.createWallet()`)
- **Wallet Creation from Mnemonic**: Added `createWalletFromMnemonic()` method with BIP39 validation
- **KeyVault Initialization**: Added `initialize()` method to KeyVaultClient
- **Browser Builds**: Added ESM and IIFE browser builds with Rollup bundler

### Changed
- **Module System** (BREAKING): Migrated entire SDK from CommonJS to ES Modules (ESM)
  - **BREAKING**: SDK now requires ESM-compatible environment (Node.js 14+ with ESM support or a bundler)
  - Migration: Replace `require()` with `import` and `module.exports` with `export`
  - Example:
    ```javascript
    // Before (CommonJS)
    const { Monstera } = require('@monstera_protocol/sdk');
    
    // After (ESM)
    import { Monstera } from '@monstera_protocol/sdk';
    ```
- **SDK Configuration**: Added `checkVersion` option to `Monstera.connect()` and `Monstera.readonly()` methods (defaults to `true`)
- **Method Organization**: Reorganized SDK methods by operation type (Utility, Initialize, Configure, Create, Read, Write) for better discoverability
- **KeyVault vs WalletLogic**: Prefer KeyVaultClient methods over WalletLogicClient for duplicate functionality (better performance)
- **Network Parameter** (BREAKING): Changed from `network: 'testnet'|'mainnet'` to `mainnet: boolean` in `connect()` and `readonly()` methods
  - **BREAKING**: API now uses `mainnet: boolean` instead of `network: string`
  - Migration: Replace `network: 'testnet'` with `mainnet: false` and `network: 'mainnet'` with `mainnet: true`
  - Example:
    ```javascript
    // Before
    Monstera.connect({ network: 'testnet', signer: ... });
    
    // After
    Monstera.connect({ mainnet: false, signer: ... });
    ```
- **Method Renames** (BREAKING): Renamed several methods to use "update" prefix for consistency
  - **BREAKING**: `upgradeWalletLogicImplAddr()` → `updateWalletLogicImplAddr()`
  - **BREAKING**: `upgradeKeyVaultImplAddr()` → `updateKeyVaultImplAddr()`
  - **BREAKING**: `changeAuthenticatorAddr()` → `updateAuthenticatorAddr()`
  - **BREAKING**: `changePassword()` → `updatePassword()`
  - Aligns with SDK naming conventions for write operations
- **Address Parameter Naming** (BREAKING): Standardized all address parameters to use "Addr" suffix
  - **BREAKING**: All address parameters now use "Addr" suffix (e.g., `walletAddr`, `keyVaultAddr`)
  - **BREAKING**: All address getter methods use "Addr" suffix (e.g., `getKeyVaultAddr()`)
  - Migration: Update all address parameter names in your code to use "Addr" suffix
  - Example:
    ```javascript
    // Before
    sdk.getKeyVault({ walletAddress: ... });
    
    // After
    sdk.getKeyVaultAddr({ walletAddr: ... });
    ```

### Removed
- **CommonJS Support**: Removed CommonJS (`require`/`module.exports`) support - SDK is now ESM-only

### Fixed
- **Circular Dependency**: Resolved circular dependency between `Monstera.js` and `versionCheck.js` by passing version as parameter instead of importing
- **Browser Builds**: Fixed browser builds by bundling `@oasisprotocol/sapphire-ethers-v6` dependency
- **Browser Global Queue**: Fixed browser global queue stub to use `window.Monstera` correctly
- **Example Files**: Fixed method calls, typos, and removed duplicate files

## [1.0.0-alpha.2] - 2025-12-30

### Added
- **CLI Support**: Added `bin/` folder with `monstera.js` CLI tool
- **Post-install Scripts**: Added `scripts/` folder with postinstall banner display
- **Utilities Folder**: Added `src/utils/` folder for utility functions
- **Base Module**: Created `src/base/` folder for core base classes
- **SapphireWriteWrapper**: New centralized write execution wrapper for all contract write operations
  - Ensures all writes go through Sapphire encryption
  - Provides consistent error translation
  - Normalizes transaction and receipt output
- **EventParseError**: New error class for event parsing failures (replaces console.error usage)
- **PasswordConfigured Event**: Added support for PasswordConfigured event in password authenticator
- **WalletConfigured Event**: Added support for WalletConfigured event in wallet signature authenticator
- **SDK Instance Methods**:
  - `canWrite()`: Check if SDK instance can perform write operations
  - `getSignerAddress()`: Get the signer address (if available)
- **Authenticator Methods**:
  - `configure()` and `verify()` method in PasswordAuthenticatorClient
  - `configure()` and `verify()` methods in WalletSignatureAuthenticatorClient
- **Monstera ASCII Banner**: Added leaf ASCII art banner displayed on install and CLI usage
- **BigInt Support**: Updated `requireNumber()` validation to accept both Number and BigInt types

### Changed
- **README.md**: Updated documentation with improved examples and usage instructions
- **package.json**: 
  - Updated version to 1.0.0-alpha.2
  - Added `bin` field for CLI support
  - Added `scripts` folder to files array
- **Examples**: Updated all example files with improved error handling and best practices
- **BaseContractClient**: Moved from `src/internal/` to `src/base/` for better organization
- **requireBytes Method**: Updated to handle both String and Uint8Array types more robustly
- **parseEvent**: Changed from console.error to throwing EventParseError for better error handling
- **createAuthProof**: Added comprehensive error handling in `src/crypto/wallet.js`
- **Code Organization**:
  - Organized imports across all files
  - Added clear section comments to classes (read methods, write methods, instance methods, static methods, private helpers)
  - Improved code structure and readability
- **Error Context**: Standardized error context handling with blacklist approach for sensitive data
- **Factory Client**: Extracted wallet preparation logic into helper methods for better maintainability
- **Contract Access**: Replaced deprecated `contract()` method with `getReadContract()` and `getWriteContract()`

### Removed
- **PermissionError**: Removed unused error class
- **Validation Helpers**: Removed unused helper functions:
  - `requireBytesLike()`
  - `requireHex()`
  - `requireOneOf()`
- **generateMnemonic Check**: Removed redundant check as mnemonic generation always succeeds
- **TODO Comments**: Removed all TODO comments from codebase
- **Commented Code**: Cleaned up commented-out code and formatting issues
- **Redundant Methods**: Removed redundant `parseEvents()` method and simplified options passing
- **Deprecated Methods**: Removed deprecated `contract()` method from BaseContractClient

### Fixed
- **Error Handling**: Improved error handling throughout the SDK with standardized error codes
- **Transaction Data Validation**: Fixed transaction data validation in requireBytes
- **Insufficient Funds**: Improved insufficient funds error handling in examples
- **Address Validation**: Removed redundant address validation and standardized error handling
- **Event Parsing**: Fixed event parsing to use proper error classes instead of console logging
- **Error Exports**: Fixed missing EventParseError export in errors/index.js
- **Variable Declarations**: Fixed variable declarations (use `let` when reassigning, `const` otherwise)
- **Error Context**: Fixed error context to use blacklist instead of whitelist for better security

## [1.0.0-alpha.1] - 2025-12-23

### Added
- **Core SDK**: Main `Monstera` class with `connect()` and `readonly()` static methods
- **Factory Client**: Wallet creation and management via `WalletFactoryClient`
- **Wallet Logic Client**: Wallet operations (signing, account management) via `WalletLogicClient`
- **KeyVault Client**: Key management operations via `KeyVaultClient`
- **Authentication System**: 
  - `AuthenticatorClient` base class
  - `PasswordAuthenticatorClient` for password-based authentication
  - `WalletSignatureAuthenticatorClient` for wallet signature authentication
- **Network Configuration**: Built-in support for Sapphire testnet and mainnet with default contract addresses
- **Error Handling**: Comprehensive error system with custom error classes:
  - `WalletError`, `ValidationError`, `ConfigError`, `NetworkError`
  - `ContractRevertError`, `EventNotFoundError`, `SapphireRequiredError`, `WriteRequiresSignerError`
- **Event System**: Event parsing and decoding for all contract events
- **Sapphire Integration**: Provider and signer setup for encrypted transactions
- **Crypto Utilities**: Mnemonic generation, seed derivation, and auth proof creation
- **Validation Utilities**: Input validation helpers (`requireAddress`, `requireBytes`, `requireNumber`, etc.)
- **Contract ABIs**: Complete ABIs for WalletFactory, WalletLogic, KeyVault, and Authenticator contracts
- **Examples**: Comprehensive example files demonstrating SDK usage
- **Documentation**: README with usage examples and API documentation
