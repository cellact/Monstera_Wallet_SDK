/**
 * Auth proof pipeline, initialization, and authenticator management option types.
 *
 * @module types/auth-proof
 */

// ============================================================================
// Initialization
// ============================================================================

/**
 * @typedef {Object} InitializeOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Address} storageAddr - WalletStorage contract address
 * @property {Address} authenticatorAddr - Authenticator contract address
 * @property {Bytes32} accessToken - Secret token for storage access (bytes32)
 * @property {Bytes} authConfig - ABI-encoded authenticator configuration bytes
 */

/**
 * @typedef {InitializeOptions & { policyRegistry: Address }} InitializeExplicitOptions
 */

// ============================================================================
// Auth Context (action-scoped proofs)
// ============================================================================

/**
 * Canonical commitment for an authenticated vault / authenticator call.
 *
 * @typedef {Object} AuthContext
 * @property {Address} target - Contract that will execute the action
 * @property {Bytes4} selector - 4-byte function selector
 * @property {Bytes32} paramsHash - {@code keccak256(abi.encode(...))} of user params excluding {@code authProof}
 * @property {Bytes32} actionHash - Canonical action hash bound into the proof
 */

/**
 * Caller input for action-scoped proofs. Vault {@code actionHash} is resolved on-chain via
 * {@link KeyVaultClient#computeActionHash}. Authenticator {@code actionHash} is derived off-chain
 * via {@link computeAuthenticatorActionHash} (matches {@code DualFactorAuthenticator._buildContext}).
 *
 * @typedef {Object} AuthActionInput
 * @property {Bytes4} selector - 4-byte function selector
 * @property {Bytes32} paramsHash - Hashed call parameters excluding {@code authProof}
 * @property {Address} [target] - Executing contract (defaults to {@code keyVaultAddr})
 */

// ============================================================================
// Auth Proof — Structured Inputs
// ============================================================================

/**
 * Structured input options to create auth proof for PasswordAuthenticator.
 * @typedef {Object} PasswordAuthProofInputOptions
 * @property {Uint8Array} password - UTF-8 password bytes (e.g. from {@code ethers.toUtf8Bytes})
 * @property {AuthActionInput} action - Operation being authorized ({@code selector}, {@code paramsHash}, optional {@code target})
 */

/**
 * Structured input options to create auth proof for WalletSignatureAuthenticator.
 * @typedef {Object} WalletSignatureAuthProofInputOptions
 * @property {EthersWallet | EthersHDNodeWallet} signer
 * @property {number} [deadline] - Deadline for the auth proof (Unix timestamp in seconds) (optional)
 * @property {AuthActionInput} [action] - Operation being authorized; required when {@code actionHash} is omitted
 * @property {Bytes32} [actionHash] - Pre-resolved on-chain action hash; required when {@code action} is omitted
 */

/**
 * Structured input options to create auth proof for DualFactorAuthenticator.
 * @typedef {Object} DualFactorAuthProofInputOptions
 * @property {Bytes32} passwordHash
 * @property {EthersWallet | EthersHDNodeWallet} signer
 * @property {number} [deadline] - Deadline for the auth proof (Unix timestamp in seconds) (optional)
 * @property {AuthActionInput} [action] - Operation being authorized; required when {@code actionHash} is omitted
 * @property {Bytes32} [actionHash] - Pre-resolved on-chain action hash; required when {@code action} is omitted
 */

/**
 * Structured input options to create auth proof for PasswordMinuteSignatureAuthenticator.
 * @typedef {Object} PasswordMinuteSignatureAuthProofInputOptions
 * @property {Bytes32} passwordHash
 * @property {AuthActionInput} [action] - Operation being authorized; required when {@code actionHash} is omitted
 * @property {Bytes32} [actionHash] - Pre-resolved on-chain action hash; required when {@code action} is omitted
 */

/**
 * Structured input options to create auth proof for PasswordOrWalletSignatureAuthenticator.
 * @typedef {Object} PasswordOrWalletSignatureAuthProofInputOptions
 * @property {'password' | 'walletSignature'} [method] - Explicit method; inferred from {@code signer} vs {@code password} when omitted
 * @property {Uint8Array} [password] - UTF-8 password bytes (defaults from connect credentials when omitted)
 * @property {EthersWallet | EthersHDNodeWallet} [signer] - Whitelisted wallet for the signature path
 * @property {number | bigint} [deadline] - Wallet-signature path only (defaults to now + 1 hour)
 * @property {AuthActionInput} [action] - Operation being authorized; required when {@code actionHash} is omitted
 * @property {Bytes32} [actionHash] - Pre-resolved on-chain action hash; required when {@code action} is omitted
 */

/**
 * ApiKeySession proof mode discriminator.
 * @typedef {'token' | 'action'} ApiKeySessionProofMode
 */

/**
 * Bearer scope bitmask for TOKEN-mode proofs (bit {@code n} enables the {@code n}th KeyVault signing op).
 *
 * Contract constants: {@code SCOPE_SIGN_ALL = 0x1F} (bits 0–4, all signing ops except {@code executeWithAuth}),
 * {@code SCOPE_ALL = 0x3F} (bits 0–5, includes {@code executeWithAuth}).
 *
 * @typedef {number | bigint} ApiKeySessionScopeMask
 */

/**
 * Shared optional fields for ApiKeySession structured proof input.
 * @typedef {Object} ApiKeySessionAuthProofSharedOptions
 * @property {Bytes32} [apiKeySecret] - {@code keccak256(apiKey)}; defaults from connect credentials when omitted
 * @property {ApiKeySessionProofMode} [mode] - Explicit mode; inferred from {@code expiry}/{@code scopeMask} when omitted
 */

/**
 * ACTION-mode structured input: one-shot proof bound to a single {@code actionHash}.
 * @typedef {ApiKeySessionAuthProofSharedOptions & {
 *   action?: AuthActionInput;
 *   actionHash?: Bytes32;
 * }} ApiKeySessionAuthProofActionOptions
 */

/**
 * TOKEN-mode structured input: reusable bearer token until {@code expiry}.
 * @typedef {ApiKeySessionAuthProofSharedOptions & {
 *   mode?: 'token';
 *   expiry?: number | bigint;
 *   scopeMask?: ApiKeySessionScopeMask;
 * }} ApiKeySessionAuthProofTokenOptions
 */

/**
 * Structured input options to create auth proof for ApiKeySessionAuthenticator.
 *
 * Union of ACTION-mode ({@link ApiKeySessionAuthProofActionOptions}) and TOKEN-mode
 * ({@link ApiKeySessionAuthProofTokenOptions}) shapes. When neither {@code expiry} nor
 * {@code scopeMask} is set and {@code mode} is not {@code 'token'}, ACTION mode is used.
 *
 * @typedef {ApiKeySessionAuthProofActionOptions | ApiKeySessionAuthProofTokenOptions} ApiKeySessionAuthProofInputOptions
 */

/**
 * Allowed {@code authProof} input for KeyVault authenticated calls: raw bytes, UTF-8 password buffer, or a built-in structured proof object.
 * @typedef {(
 *   | PasswordAuthProofInputOptions
 *   | WalletSignatureAuthProofInputOptions
 *   | DualFactorAuthProofInputOptions
 *   | PasswordMinuteSignatureAuthProofInputOptions
 *   | ApiKeySessionAuthProofInputOptions
 *   | PasswordOrWalletSignatureAuthProofInputOptions
 * )} AuthProofInputOptions
 */

// ============================================================================
// Auth Proof — Encode Contexts & Encoder Registry
// ============================================================================

/**
 * Context fields held by {@link AuthProofBuilder} before the on-chain authenticator address is resolved.
 *
 * @typedef {Object} AuthProofContext
 * @property {ContractAddresses} addresses
 * @property {ChainId} chainId
 * @property {EthersAbstractProvider} readProvider
 * @property {(keyVaultAddr: Address) => Promise<Address>} getAuthenticatorAddr
 */

/**
 * Context passed to each built-in KeyVault authProof encoder after the authenticator is known.
 *
 * @typedef {Object} AuthProofEncodeContext
 * @property {ContractAddresses} addresses
 * @property {ChainId} chainId
 * @property {EthersAbstractProvider} readProvider
 * @property {Address} authenticatorAddr
 * @property {Address} keyVaultAddr
 */

/**
 * One entry in {@link createBuiltinAuthenticatorRegistry} (async encoder for a fixed built-in authenticator).
 *
 * @typedef {Object} KeyVaultAuthProofEncoder
 * @property {string} id - Encoder identifier (logging / diagnostics)
 * @property {(ctx: AuthProofEncodeContext, input: AuthProofInputOptions) => Promise<Bytes>} encode
 */

/**
 * Registry: authenticator address → {@link KeyVaultAuthProofEncoder}.
 *
 * @typedef {Object} AuthProofEncoderRegistry
 * @property {(authenticatorAddr: Address) => KeyVaultAuthProofEncoder | undefined} getByAuthenticatorAddr
 */

/**
 * Built-in authenticator plugin: session merge, proof input shaping, validation, and encoding for one auth flow.
 *
 * @typedef {Object} BuiltinAuthenticatorSpec
 * @property {string} id - Registry id (e.g. {@code passwordAuth})
 * @property {string} flowId - Explicit-flow id (e.g. {@code password})
 * @property {keyof ContractAddresses} addressKey
 * @property {(session: import('../internal/auth/session/ConnectSession.js').ConnectSession | null, partial: Record<string, unknown>) => Record<string, unknown>} applySessionInput
 * @property {(options: Record<string, unknown>) => Record<string, unknown>} collectProofInput
 * @property {(resolved: Record<string, unknown>, authenticatorAddr: Address) => Record<string, unknown>} mapSessionResolved
 * @property {(options: Record<string, unknown>) => void} validatePrepareInput
 * @property {(config: MonsteraConfigOptions, options: Record<string, unknown>) => Record<string, unknown>} applyConfigDefaults
 * @property {KeyVaultAuthProofEncoder} proofEncoder
 * @property {CreateWalletAuthEncoder} configEncoder
 * @property {(encodeCtx: AuthProofEncodeContext, input: Record<string, unknown>) => Promise<unknown>} [prepareProofResult]
 */

// ============================================================================
// Auth Proof — Encoded / On-Wire Payloads
// ============================================================================
//
// ABI layouts and unions for {@code authProof} as consumed on-chain (after encoding), not structured SDK inputs.

/**
 * ABI-encoded proof for {@code PasswordAuthenticator.verify} and {@code changePassword}.
 * Layout: {@code abi.encode(bytes password, bytes32 actionHash)}.
 * @typedef {Bytes} EncodedAuthProofPassword
 */

/**
 * ABI-encoded proof for {@code WalletSignatureAuthenticator} (verify, whitelist writes, etc.).
 * Layout: {@code abi.encode(uint256 deadline, bytes signature)}; {@code signature} is over EIP-712 {@code WalletAuth(address wallet,bytes32 actionHash,uint256 deadline)}.
 * @typedef {Bytes} EncodedAuthProofWalletSignature
 */

/**
 * ABI-encoded proof for {@code DualFactorAuthenticator} (verify, password change, guardian update, etc.).
 * Layout: {@code abi.encode(bytes minutePasswordSignature, uint256 deadline, bytes guardianSignature)} (minute key + guardian EIP-712 leg).
 * @typedef {Bytes} EncodedAuthProofDualFactor
 */

/**
 * ABI-encoded proof for {@code PasswordMinuteSignatureAuthenticator.verify}.
 * Layout: {@code abi.encode(bytes signature)} with a 65-byte secp256k1 signature over the per-minute EIP-191 digest.
 * @typedef {Bytes} EncodedAuthProofPasswordMinute
 */

/**
 * ABI-encoded proof for {@code ApiKeySessionAuthenticator} (verify, rotateApiKey, etc.).
 * Layout: {@code abi.encode(uint8 mode, bytes modeProof)} where {@code mode} is {@code MODE_TOKEN} (1) or {@code MODE_ACTION} (2).
 * @typedef {Bytes} EncodedAuthProofApiKeySession
 */

/**
 * ABI-encoded proof for {@code MultiAuthenticator}.
 * Layout: {@code abi.encode(address child, bytes childProof)}.
 * @typedef {Bytes} EncodedAuthProofMulti
 */

/**
 * ABI-encoded proof for {@code PasswordOrWalletSignatureAuthenticator} (verify, password change, whitelist writes, etc.).
 * Layout: {@code abi.encode(uint8 method, bytes methodProof)} where {@code method} is {@code 1} (password) or {@code 2} (wallet signature).
 * @typedef {Bytes} EncodedAuthProofPasswordOrWalletSignature
 */

/**
 * Result of minute-signature auth proof creation ({@code internal/auth/proof/builders/minuteSignature.js}, {@code createAuthProofMinuteSignature}).
 *
 * @typedef {Object} CreateAuthProofMinuteSignatureResult
 * @property {EncodedAuthProofPasswordMinute} authProof - ABI-encoded signature for {@code PasswordMinuteSignatureAuthenticator.verify}
 * @property {number} minuteBucket - Unix timestamp floored to minute bucket used for signing
 * @property {Address} derivedAddress - Ephemeral signer address derived from password hash and minute bucket
 */

/**
 * Union of all **created / on-wire** {@code authProof} payloads for direct contract clients (e.g. {@link KeyVaultClient}).
 * Does not include structured {@link AuthProofInputOptions}; use that in {@link Monstera} (with {@link AuthProofEncoder#encodeForKeyVault} / {@link AuthProofEncoder#encodeForFlow}) before calling the client.
 * @typedef {(
 *   | EncodedAuthProofPassword
 *   | EncodedAuthProofWalletSignature
 *   | EncodedAuthProofDualFactor
 *   | EncodedAuthProofPasswordMinute
 *   | EncodedAuthProofApiKeySession
 *   | EncodedAuthProofMulti
 *   | EncodedAuthProofPasswordOrWalletSignature
 * )} AuthProofOptions
 */

// ============================================================================
// Auth Proof — Call Bundles & Signing Options
// ============================================================================
//
// Options objects that combine addresses with {@link AuthProofInputOptions} or {@link AuthProofOptions}, then signing helpers.

/**
 * KeyVault address plus {@link AuthProofInputOptions} (Monstera / SDK encoding path).
 *
 * @typedef {Object} KeyVaultAuthBaseOptions
 * @property {Address} [keyVaultAddr] - KeyVault contract address; optional when connect {@code credentials} are set
 * @property {AuthProofInputOptions} [authProof] - Authentication proof (bytes or structured object); password-based fields default from connect credentials when omitted
 */

/**
 * KeyVault address plus {@link AuthProofOptions} (encoded proof bytes for {@link KeyVaultClient}).
 *
 * @typedef {Object} KeyVaultClientAuthBaseOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofOptions} authProof - Created authentication proof bytes
 */

/**
 * Wallet proxy plus {@link AuthProofInputOptions}.
 *
 * @typedef {Object} WalletAuthBaseOptions
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 */

/**
 * Base for signing options that target a KeyVault by address.
 *
 * @typedef {KeyVaultAuthBaseOptions & {
 *   index: number|bigint
 * }} KeyVaultSigningBase
 */

/**
 * Base for signing options that target a wallet proxy (from createWallet).
 *
 * @typedef {WalletAuthBaseOptions & {
 *   index: number|bigint
 * }} WalletSigningBase
 */

/**
 * @typedef {KeyVaultSigningBase & { nonce: number|bigint; gasPrice: number|bigint; gasLimit: number|bigint; to: Address; value: number|bigint; txData: Bytes; chainId: number|bigint }} SignTransactionOptions
 */

/**
 * @typedef {KeyVaultSigningBase & { message: Bytes }} SignMessageOptions
 */

/**
 * @typedef {KeyVaultSigningBase & { hash: Bytes32 }} SignHashOptions
 */

/**
 * Options for {@link Monstera.prototype.signAuthorization}.
 *
 * @typedef {KeyVaultAuthBaseOptions & {
 *   delegateAddr: Address;
 *   index?: number|bigint;
 *   nonce?: number|bigint;
 *   chainId?: ChainId;
 *   provider?: EthersAbstractProvider;
 * }} SignAuthorizationOptions
 */

/**
 * Resolved authorization signing inputs: validated options, optional RPC-resolved chain id and nonce,
 * and encoded KeyVault {@code implCall} bytes (internal pipeline before {@code executeWithAuth}).
 *
 * @typedef {{
 *   keyVaultAddr: Address,
 *   authProof: Bytes|Uint8Array,
 *   implCall: Bytes,
 *   delegateAddr: Address,
 *   nonce: bigint,
 *   chainId: bigint
 * }} ResolvedSignAuthorizationInputs
 */

/**
 * Dependency bundle injected from {@code Monstera} (or tests) for EIP-7702 authorization signing.
 *
 * @typedef {import('../clients/keyVault/KeyVaultClient.js').default} KeyVaultClient
 */

/**
 * @typedef {{
 *   keyVault: KeyVaultClient;
 *   fallbackProvider: EthersAbstractProvider | null;
 *   connectSession: import('../internal/auth/session/ConnectSession.js').ConnectSession | null;
 *   encodeVaultAuthProof: (
 *     options: SignAuthorizationOptions & { implCall: Bytes },
 *     buildAction: (options: SignAuthorizationOptions & { implCall: Bytes }) => AuthActionInput
 *   ) => Promise<EncodeAuthProofOptionsResult>;
 * }} SignAuthorizationDeps
 */

/**
 * Split secp256k1 signature for an authorization (ethers-style `yParity`, `r`, `s`).
 * @typedef {{ r: string, s: string, yParity: 0|1 }} AuthorizationSplitSignature
 */

/**
 * Ethers-compatible signed authorization: delegate `address`, `nonce`, `chainId`, and split `signature`.
 * @typedef {{
 *   address: string,
 *   nonce: bigint,
 *   chainId: bigint,
 *   signature: AuthorizationSplitSignature
 * }} SignedAuthorizationResult
 */

/**
 * @typedef {WalletSigningBase & { nonce: number|bigint; gasPrice: number|bigint; gasLimit: number|bigint; to: Address; value: number|bigint; data: Bytes; chainId: number|bigint }} SignTransactionWalletOptions
 */

/**
 * @typedef {WalletSigningBase & { message: Bytes }} SignMessageWalletOptions
 */

/**
 * @typedef {WalletSigningBase & { hash: Bytes32 }} SignHashWalletOptions
 */

// ============================================================================
// Create Auth Proof (builders & internal variants)
// ============================================================================

/**
 * @typedef {Object} CreateAuthProofBaseOptions
 * @property {Address} keyVaultAddr - KeyVault address of the wallet to authenticate
 * @property {Address} [authenticatorAddr] - Built-in authenticator address (defaults to config)
 */

/**
 * Inputs to build {@link EncodedAuthProofWalletSignature} (wallet-signature authenticator).
 * @typedef {CreateAuthProofBaseOptions & WalletSignatureAuthProofInputOptions } CreateAuthProofWalletSignatureOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofPasswordMinute} (minute-bucket ECDSA path).
 * @typedef {CreateAuthProofBaseOptions & PasswordMinuteSignatureAuthProofInputOptions } CreateAuthProofMinuteSignatureOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofDualFactor} (dual-factor authenticator).
 * @typedef {CreateAuthProofBaseOptions & DualFactorAuthProofInputOptions } CreateAuthProofDualFactorOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofPasswordOrWalletSignature}.
 * @typedef {CreateAuthProofBaseOptions & PasswordOrWalletSignatureAuthProofInputOptions} CreateAuthProofPasswordOrWalletSignatureOptions
 */

/**
 * ACTION-mode inputs to build {@link EncodedAuthProofApiKeySession} for a specific operation.
 * Supply {@code action} or {@code actionHash} (one required).
 *
 * @typedef {CreateAuthProofBaseOptions & ApiKeySessionAuthProofActionOptions} CreateAuthProofApiKeySessionActionOptions
 */

/**
 * TOKEN-mode inputs to build a bearer {@link EncodedAuthProofApiKeySession}.
 * {@code expiry} defaults to now + 1 hour; {@code scopeMask} defaults to {@code SCOPE_SIGN_ALL} (0x1F).
 *
 * @typedef {CreateAuthProofBaseOptions & ApiKeySessionAuthProofTokenOptions} CreateAuthProofApiKeySessionTokenOptions
 */

/**
 * Minimal inputs for verify-only checks ({@link Monstera#isApiKeySessionValid}).
 * The SDK builds an ACTION-mode verify-probe proof; no {@code action} required.
 *
 * @typedef {CreateAuthProofBaseOptions & ApiKeySessionAuthProofSharedOptions} CreateAuthProofApiKeySessionVerifyOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofApiKeySession} (API key session authenticator).
 *
 * @typedef {(
 *   | CreateAuthProofApiKeySessionActionOptions
 *   | CreateAuthProofApiKeySessionTokenOptions
 *   | CreateAuthProofApiKeySessionVerifyOptions
 * )} CreateAuthProofApiKeySessionOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofMulti} by routing through a child authenticator.
 *
 * @typedef {CreateAuthProofBaseOptions & {
 *   childFlowId?: string;
 *   viaChildFlowId?: string;
 *   viaChild?: Address;
 *   child?: Address;
 * } & Record<string, unknown>} CreateAuthProofMultiOptions
 */

/**
 * {@link CreateAuthProofMinuteSignatureOptions} plus a provider for on-chain time (crypto / internal callers).
 * @typedef {CreateAuthProofMinuteSignatureOptions & { provider: EthersAbstractProvider }} CreateAuthProofMinuteSignatureWithProviderOptions
 */

/**
 * {@link CreateAuthProofDualFactorOptions} plus a provider for the minute-bucket leg (crypto / internal callers).
 * @typedef {CreateAuthProofDualFactorOptions & { provider: EthersAbstractProvider }} CreateAuthProofDualFactorWithProviderOptions
 */

/**
 * Shared fields returned by {@link AuthProofOrchestrator#prepare} after resolving {@code actionHash}.
 *
 * @typedef {Object} AuthProofFlowResultBase
 * @property {Bytes32} actionHash - Canonical action hash bound into the proof
 * @property {AuthContext | null} action - Full auth context when {@code includeAuthContext} is set
 */

/**
 * Result of {@link AuthProofOrchestrator#resolveAuthAction}.
 *
 * @typedef {Object} ResolvedAuthAction
 * @property {AuthActionInput} action - Resolved action input
 * @property {Bytes32} actionHash - Canonical action hash for the action
 */

/**
 * Options for {@link AuthProofOrchestrator#prepare}.
 *
 * @typedef {Object} AuthProofFlowOptions
 * @property {boolean} [includeAuthContext] - When true, attach a full {@link AuthContext} on the result
 * @property {boolean} [useVerifyProbe] - When true, use the canonical {@code IAuthenticator.verify} probe action
 */

/**
 * Result of {@link AuthProofOrchestrator#prepare}.
 *
 * @typedef {AuthProofFlowResultBase & {
 *   resolved: Record<string, unknown>;
 *   authProof: Bytes;
 *   minuteBucket?: number;
 *   derivedAddress?: Address;
 * }} AuthProofFlowResult
 */

// ============================================================================
// Encode Auth Proof Options
// ============================================================================

/**
 * KeyVault-style call options before/after {@link AuthProofEncoder#encodeForKeyVault}. When {@code authProof} is a plain object, {@code keyVaultAddr} is required.
 * @typedef {Record<string, unknown> & {
 *   authProof?: AuthProofInputOptions;
 *   keyVaultAddr?: Address;
 * }} EncodeAuthProofInputOptions
 */

/**
 * Result of {@link AuthProofEncoder#encodeForKeyVault}: same fields as input with {@code authProof} as hex {@link Bytes} or {@link Uint8Array}.
 * @typedef {Record<string, unknown> & { authProof: Bytes|Uint8Array }} EncodeAuthProofOptionsResult
 */

// --- Configure authenticators & account slices ---

/**
 * @typedef {{ keyVaultAddr?: Address }} KeyVaultAddrOptions
 * @property {Address} [keyVaultAddr] - KeyVault contract address; optional when {@link Monstera.connect} was given {@code credentials}
 */

/**
 * @typedef {KeyVaultAddrOptions & { selector: string; paramsHash: Bytes32 }} ComputeActionHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { selector: Bytes4; paramsHash: Bytes32 }} ComputeMultiAuthenticatorActionHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { newImplementation: Address }} ComputeCustomImplementationAckHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { newAuthenticator: Address; configHash: Bytes32 }} ComputeCustomAuthenticatorAckHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { implementation: Address }} IsImplementationApprovedOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authenticator: Address }} IsAuthenticatorApprovedOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & WalletProxyOptions } InitializeWalletLogicOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32 }} ConfigurePasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { initialWhitelist: Address[] }} ConfigureWalletSignatureOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash?: Bytes32; initialWhitelist: Address[] }} ConfigurePasswordOrWalletSignatureOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32; guardianAddr: Address }} ConfigureDualFactorOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { apiKeySecret?: Bytes32 }} ConfigureApiKeySessionOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authConfig: MultiAuthConfigInputOptions }} ConfigureMultiAuthenticatorOptions
 */

/**
 * @typedef {CreateAuthProofMultiOptions & {
 *   child: Address;
 *   childAuthConfig: AuthConfigInputOptions;
 * }} AddMultiAuthenticatorOptions
 */

/**
 * @typedef {CreateAuthProofMultiOptions & { child: Address }} RemoveMultiAuthenticatorOptions
 */

/**
 * @typedef {CreateAuthProofApiKeySessionActionOptions & { newApiKeySecret: Bytes32 }} RotateApiKeyOptions
 */

// --- Flows composed with CreateAuthProof* ---

/**
 * Inputs for password proof flows after {@link withPasswordProofDefaults}.
 *
 * @typedef {KeyVaultAddrOptions & {
 *   password: Uint8Array;
 *   action?: AuthActionInput;
 *   actionHash?: Bytes32;
 *   authenticatorAddr?: Address;
 * }} PreparePasswordFlowOptions
 */

/**
 * @typedef {PreparePasswordFlowOptions & { chainId: ChainId; authenticatorAddr: Address }} ResolvedPasswordFlowOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { currentPassword: Uint8Array }} VerifyPasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { addressToCheck: Address }} WhitelistCheckOptions
 */

/**
 * @typedef {CreateAuthProofWalletSignatureOptions & { addressToAdd: Address }} AddWhitelistOptions
 */

/**
 * @typedef {CreateAuthProofWalletSignatureOptions & { addressToRemove: Address }} RemoveWhitelistOptions
 */

/**
 * @typedef {CreateAuthProofPasswordOrWalletSignatureOptions & { newPasswordHash: Bytes32 }} UpdatePasswordOrWalletSignatureOptions
 */

/**
 * @typedef {CreateAuthProofPasswordOrWalletSignatureOptions & { addressToAdd: Address }} AddPasswordOrWalletSignatureWhitelistOptions
 */

/**
 * @typedef {CreateAuthProofPasswordOrWalletSignatureOptions & { addressToRemove: Address }} RemovePasswordOrWalletSignatureWhitelistOptions
 */

/**
 * @typedef {CreateAuthProofPasswordOrWalletSignatureOptions & {
 *   addressToAdd: Address;
 *   nonce?: Bytes32;
 *   deadline?: number | bigint;
 *   linkSigner?: EthersWallet | EthersHDNodeWallet;
 *   newWalletSignature?: Bytes;
 * }} AddPasswordOrWalletSignatureWhitelistWithProofOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { addressToAdd: Address; nonce?: Bytes32; deadline?: number | bigint }} ComputePasswordOrWalletSignatureLinkParamsHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { addressToAdd: Address; nonce?: Bytes32; deadline?: number | bigint }} ComputePasswordOrWalletSignatureLinkActionHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { nonce: Bytes32 }} IsPasswordOrWalletSignatureLinkNonceUsedOptions
 */

/**
 * @typedef {CreateAuthProofDualFactorOptions & { newPasswordHash: Bytes32 }} UpdatePasswordDualFactorOptions
 */

/**
 * @typedef {CreateAuthProofDualFactorOptions & { newGuardian: Address }} UpdateGuardianOptions
 */

/**
 * currentPassword is raw password bytes (utf8 password bytes)
 * newPasswordHash is the new password hash (bytes32)
 * @typedef {KeyVaultAddrOptions & { currentPassword: Uint8Array; newPasswordHash: Bytes32; authenticatorAddr?: Address }} UpdatePasswordOptions
 */

// --- Authenticator client methods (encoded {@code authProof} / {@code authConfig}) ---

/**
 * {@code PasswordAuthenticator.verify} — expects {@link EncodedAuthProofPassword}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPassword; action: AuthContext }} PasswordClientVerifyOptions
 */

/**
 * {@code PasswordMinuteSignatureAuthenticator.verify} — expects {@link EncodedAuthProofPasswordMinute}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordMinute; action: AuthContext }} PasswordMinuteClientVerifyOptions
 */

/**
 * {@code WalletSignatureAuthenticator.verify} — expects {@link EncodedAuthProofWalletSignature}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; action: AuthContext }} WalletSignatureClientVerifyOptions
 */

/**
 * {@code DualFactorAuthenticator.verify} — expects {@link EncodedAuthProofDualFactor}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; action: AuthContext }} DualFactorClientVerifyOptions
 */

/**
 * {@code ApiKeySessionAuthenticator.verify} — expects {@link EncodedAuthProofApiKeySession}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofApiKeySession; action: AuthContext }} ApiKeySessionClientVerifyOptions
 */

/**
 * {@code PasswordOrWalletSignatureAuthenticator.verify} — expects {@link EncodedAuthProofPasswordOrWalletSignature}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordOrWalletSignature; action: AuthContext }} PasswordOrWalletSignatureClientVerifyOptions
 */

/**
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigPassword }} PasswordClientConfigureOptions
 */

/**
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigPasswordMinuteSignature }} PasswordMinuteClientConfigureOptions
 */

/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigWalletSignature }} WalletSignatureClientConfigureOptions */


/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigDualFactor }} DualFactorClientConfigureOptions */

/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigApiKeySession }} ApiKeySessionClientConfigureOptions */

/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigMulti }} MultiAuthenticatorClientConfigureOptions */

/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigPasswordOrWalletSignature }} PasswordOrWalletSignatureClientConfigureOptions */
/** @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofMulti; action: AuthContext }} MultiAuthenticatorClientVerifyOptions */
/** @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofMulti; child: Address; childConfig: Bytes }} MultiAuthenticatorClientAddAuthenticatorOptions */
/** @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofMulti; child: Address }} MultiAuthenticatorClientRemoveAuthenticatorOptions */
/** @typedef {KeyVaultAddrOptions & { child: Address }} MultiAuthenticatorClientIsEnabledOptions */
/** @typedef {KeyVaultAddrOptions} MultiAuthenticatorClientGetAuthenticatorsOptions */
/** @typedef {KeyVaultAddrOptions & { selector: Bytes4; paramsHash: Bytes32 }} MultiAuthenticatorClientComputeActionHashOptions */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToAdd: Address }} WalletSignatureClientAddToWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToRemove: Address }} WalletSignatureClientRemoveFromWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordOrWalletSignature; newPasswordHash: Bytes32 }} PasswordOrWalletSignatureClientChangePasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordOrWalletSignature; addressToAdd: Address }} PasswordOrWalletSignatureClientAddToWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordOrWalletSignature; addressToRemove: Address }} PasswordOrWalletSignatureClientRemoveFromWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordOrWalletSignature; addressToAdd: Address; nonce: Bytes32; deadline: number | bigint; newWalletSignature: Bytes }} PasswordOrWalletSignatureClientAddToWhitelistWithProofOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { addressToAdd: Address; nonce: Bytes32; deadline: number | bigint }} PasswordOrWalletSignatureClientComputeLinkParamsHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { addressToAdd: Address; nonce: Bytes32; deadline: number | bigint }} PasswordOrWalletSignatureClientComputeLinkActionHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { nonce: Bytes32 }} PasswordOrWalletSignatureClientIsLinkNonceUsedOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newPasswordHash: Bytes32 }} DualFactorClientUpdatePasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newGuardian: Address }} DualFactorClientUpdateGuardianOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofApiKeySession; newApiKeySecret: Bytes32 }} ApiKeySessionClientRotateApiKeyOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { apiKeySecret: Bytes32; chainId: ChainId; expiry: number | bigint; scopeMask: number | bigint }} ApiKeySessionClientComputeTokenMacOptions
 */

/**
 * @typedef {Object} ApiKeySessionClientComputeActionMacOptions
 * @property {Bytes32} apiKeySecret
 * @property {Bytes32} actionHash
 */

/**
 * @typedef {Object} ApiKeySessionClientBuildTokenAuthProofOptions
 * @property {number | bigint} expiry
 * @property {number | bigint} scopeMask
 * @property {Bytes32} mac
 */

/**
 * @typedef {Object} ApiKeySessionClientBuildActionAuthProofOptions
 * @property {Bytes32} mac
 */

/**
 * @typedef {Object} ApiKeySessionClientSelectorBitOptions
 * @property {string} selector - 4-byte function selector ({@code 0x........})
 */

/**
 * @typedef {KeyVaultAddrOptions & {
 *   apiKeySecret?: Bytes32;
 *   expiry?: number | bigint;
 *   scopeMask?: ApiKeySessionScopeMask;
 * }} ComputeTokenMacOptions
 */

/**
 * @typedef {Object} ComputeActionMacOptions
 * @property {Bytes32} [apiKeySecret] - Defaults from connect credentials when omitted
 * @property {Address} [keyVaultAddr] - Required when resolving {@code actionHash} from {@code action}
 * @property {AuthActionInput} [action] - Operation; required when {@code actionHash} is omitted
 * @property {Bytes32} [actionHash] - Pre-resolved hash; required when {@code action} is omitted
 */

/**
 * @typedef {CreateAuthProofApiKeySessionTokenOptions} BuildTokenAuthProofOptions
 */

/**
 * @typedef {CreateAuthProofApiKeySessionActionOptions} BuildActionAuthProofOptions
 */

/** @typedef {ApiKeySessionClientSelectorBitOptions} SelectorBitOptions */

/**
 * @typedef {Object} SelectorBitResult
 * @property {boolean} ok - Whether the selector is bearer-eligible
 * @property {number} bit - Scope bit position when {@code ok} is true
 */

