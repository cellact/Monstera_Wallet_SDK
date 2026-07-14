/**
 * Auth config types for wallet creation (structured inputs and encoded bytes).
 *
 * @module types/auth-config
 */

// ============================================================================
// Auth Config — Structured Inputs
// ============================================================================
//
// Plain {@code authConfig} objects for built-in authenticators at wallet creation (before ABI encoding).

/**
 * @typedef {Object} PasswordAuthConfigInputOptions
 * @property {Bytes32} passwordHash - keccak256(utf8(password))
 */

/** @typedef {PasswordAuthConfigInputOptions} PasswordMinuteSignatureAuthConfigInputOptions */

/**
 * @typedef {Object} WalletSignatureAuthConfigInputOptions
 * @property {Address[]} initialWhitelist - Initial whitelist (at least one address)
 */

/**
 * @typedef {Object} DualFactorAuthConfigInputOptions
 * @property {Bytes32} passwordHash - keccak256(utf8(password))
 * @property {Address} guardianAddr
 */

/**
 * @typedef {Object} ApiKeySessionAuthConfigInputOptions
 * @property {Bytes32} apiKeySecret - keccak256(rawApiKey); stored on-chain, raw key never sent
 */

/**
 * @typedef {Object} PasswordOrWalletSignatureAuthConfigInputOptions
 * @property {Bytes32} [passwordHash] - keccak256(utf8(password)); defaults from connect credentials when omitted
 * @property {Address[]} initialWhitelist - Initial whitelist (at least one address)
 */

/**
 * One structured child entry for {@link MultiAuthConfigInputOptions}.
 *
 * @typedef {Object} MultiAuthConfigChildEntry
 * @property {Address} authenticatorAddr - Deployed child authenticator address
 * @property {AuthConfigInputOptions} authConfig - Structured config for that child
 */

/**
 * Structured create-wallet config for {@code MultiAuthenticator}.
 *
 * @typedef {Object} MultiAuthConfigStructuredInputOptions
 * @property {MultiAuthConfigChildEntry[]} children - Child authenticators and structured configs
 */

/**
 * Pre-encoded create-wallet config for {@code MultiAuthenticator}.
 *
 * @typedef {Object} MultiAuthConfigEncodedInputOptions
 * @property {Address[]} children - Child authenticator addresses
 * @property {Bytes[]} childConfigs - ABI-encoded child configs (parallel array)
 */

/**
 * @typedef {MultiAuthConfigStructuredInputOptions | MultiAuthConfigEncodedInputOptions} MultiAuthConfigInputOptions
 */

/**
 * Plain object {@code authConfig} for built-in authenticators at wallet creation (before ABI encoding).
 *
 * Union of built-in authenticator config shapes at wallet creation. Runtime dispatches by
 * {@code authenticatorAddr}.
 *
 * @typedef {(
 *   | PasswordAuthConfigInputOptions
 *   | PasswordMinuteSignatureAuthConfigInputOptions
 *   | WalletSignatureAuthConfigInputOptions
 *   | DualFactorAuthConfigInputOptions
 *   | ApiKeySessionAuthConfigInputOptions
 *   | PasswordOrWalletSignatureAuthConfigInputOptions
 *   | MultiAuthConfigInputOptions
 * )} AuthConfigInputOptions
 */

// ============================================================================
// Auth Config — Encoded Types, Encoder & Context
// ============================================================================
//
// On-chain {@code authConfig} byte shapes, the create-wallet encoder entry type, and context for {@link AuthConfigBuilder}.

/**
 * ABI-encoded dual-factor authenticator config at wallet creation ({@code abi.encode(bytes32,address)}).
 * @see {@link module:internal/crypto/authConfig.js} {@code createDualFactorAuthConfig}
 * @typedef {Bytes} EncodedAuthConfigDualFactor
 */

/**
 * ABI-encoded ApiKeySessionAuthenticator config at wallet creation ({@code abi.encode(bytes32)}).
 * @typedef {Bytes} EncodedAuthConfigApiKeySession
 */

/**
 * ABI-encoded MultiAuthenticator config at wallet creation ({@code abi.encode(address[],bytes[])}).
 * @typedef {Bytes} EncodedAuthConfigMulti
 */

/**
 * ABI-encoded WalletSignatureAuthenticator whitelist ({@code abi.encode(address[])}).
 * @see {@link module:internal/crypto/authConfig.js} {@code createWalletSigAuthConfig}
 * @typedef {Bytes} EncodedAuthConfigWalletSignature
 */

/**
 * ABI-encoded PasswordOrWalletSignatureAuthenticator config at wallet creation ({@code abi.encode(bytes32,address[])}).
 * @typedef {Bytes} EncodedAuthConfigPasswordOrWalletSignature
 */

/**
 * Password-hash-only authenticator config for PasswordAuthenticator at creation (contract expects bytes32).
 * @see {@link module:internal/auth/specs/password.js} {@code passwordAuthenticator.configEncoder}
 * @typedef {Bytes32} EncodedAuthConfigPassword
 */

/**
 * Alias of {@link EncodedAuthConfigPassword} for PasswordMinuteSignatureAuthenticator create-wallet encoding (same bytes32 on-chain).
 * @see {@link module:internal/auth/specs/passwordMinuteSignature.js} {@code passwordMinuteSignatureAuthenticator.configEncoder}
 * @typedef {EncodedAuthConfigPassword} EncodedAuthConfigPasswordMinuteSignature
 */

/**
 * Encoded outputs from built-in create-wallet authenticator encoders only (no arbitrary pass-through).
 *
 * Structural shapes: dual-factor and wallet-signature configs are dynamic {@link Bytes}; password-hash configs (both password authenticators) are {@link Bytes32}.
 *
 * @typedef {(
 *   | EncodedAuthConfigDualFactor
 *   | EncodedAuthConfigWalletSignature
 *   | EncodedAuthConfigPassword
 *   | EncodedAuthConfigPasswordMinuteSignature
 *   | EncodedAuthConfigApiKeySession
 *   | EncodedAuthConfigMulti
 *   | EncodedAuthConfigPasswordOrWalletSignature
 * )} EncodedAuthConfigOptions
 */

/**
 * Built-in registry entry: maps structured create-wallet {@code authConfig} to encoded bytes for a fixed authenticator.
 *
 * @typedef {Object} CreateWalletAuthEncoder
 * @property {string} id - Encoder identifier (logging / diagnostics)
 * @property {(authConfig: AuthConfigInputOptions) => EncodedAuthConfigOptions} encode - Encode structured config for on-chain {@code authConfig}
 */

/**
 * Context held by {@link AuthConfigBuilder} for built-in authenticator resolution (registry keyed by contract addresses).
 *
 * @typedef {Object} AuthConfigContext
 * @property {ContractAddresses} addresses
 */

// ============================================================================
// Wallet Creation & Factory Client Options
// ============================================================================

/**
 * @typedef {Object} CreateWalletBaseOptions
 * @property {AuthConfigInputOptions} authConfig - Structured auth config options
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
 */

/**
 * @typedef {CreateWalletBaseOptions & { mnemonic: Mnemonic }} CreateWalletFromMnemonicOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { hookAddr: Address; hookData: Bytes }} CreateWalletWithHookOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { customLogicImplAddr: Address; logicData: Bytes }} CreateWalletWithCustomLogicOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { username: string }} CreateWalletForUsernameOptions
 */

/**
 * @typedef {CreateWalletForUsernameOptions & { mnemonic: Mnemonic }} CreateWalletForUsernameFromMnemonicOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { usernameHash: Bytes32 }} CreateWalletForUsernameHashOptions
 */

/**
 * @typedef {CreateWalletForUsernameHashOptions & { mnemonic: Mnemonic }} CreateWalletForUsernameHashFromMnemonicOptions
 */

/**
 * Base options for WalletFactoryClient: {@code authConfig} is already encoded for the factory (never a structured object).
 * @typedef {Object} FactoryClientCreateWalletBaseOptions
 * @property {EncodedAuthConfigOptions} authConfig - Hex-encoded authenticator configuration
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { mnemonic: Mnemonic }} FactoryClientCreateWalletFromMnemonicOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { hookAddr: Address; hookData: Bytes }} FactoryClientCreateWalletWithHookOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { customLogicImplAddr: Address; logicData: Bytes }} FactoryClientCreateWalletWithCustomLogicOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { username: string }} FactoryClientCreateWalletForUsernameOptions
 */

/**
 * @typedef {FactoryClientCreateWalletForUsernameOptions & { mnemonic: Mnemonic }} FactoryClientCreateWalletForUsernameFromMnemonicOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { usernameHash: Bytes32 }} FactoryClientCreateWalletForUsernameHashOptions
 */

/**
 * @typedef {FactoryClientCreateWalletForUsernameHashOptions & { mnemonic: Mnemonic }} FactoryClientCreateWalletForUsernameHashFromMnemonicOptions
 */

/**
 * @typedef {{ username: string }} FactoryHashUsernameOptions
 */

/**
 * @typedef {{ usernameHash: Bytes32 }} FactoryWalletOfUsernameOptions
 */

/**
 * @typedef {{ walletAddr: Address }} FactoryWalletUsernameHashOptions
 */

// ============================================================================
// Encode Auth Config Options
// ============================================================================

/**
 * Valid inputs to {@link AuthConfigBuilder.prototype.encode} (structured or pre-encoded {@code authConfig}).
 * @typedef {(
 *   | CreateWalletBaseOptions
 *   | CreateWalletFromMnemonicOptions
 *   | CreateWalletWithHookOptions
 *   | CreateWalletWithCustomLogicOptions
 *   | CreateWalletForUsernameOptions
 *   | CreateWalletForUsernameFromMnemonicOptions
 *   | CreateWalletForUsernameHashOptions
 *   | CreateWalletForUsernameHashFromMnemonicOptions
 * )} EncodeAuthConfigInputOptions
 */

/**
 * Output when structured {@code authConfig} was encoded: caller fields spread with encoded bytes and resolved {@code authenticatorAddr}.
 * {@code authConfig} matches {@link EncodedAuthConfigOptions} for built-in encoders.
 * @typedef {Record<string, unknown> & {
 *   authConfig: EncodedAuthConfigOptions;
 *   authenticatorAddr: Address
 * }} EncodedAuthConfigCallOptions
 */

/**
 * Return type of {@link AuthConfigBuilder.prototype.encode}: unchanged caller options when {@code authConfig} was already hex, otherwise encoded payload.
 * @typedef {EncodeAuthConfigInputOptions | EncodedAuthConfigCallOptions} EncodeAuthConfigOptionsResult
 */

