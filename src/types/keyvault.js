/**
 * KeyVault client options and vault operation facade types.
 *
 * @module types/keyvault
 */

// ============================================================================
// KeyVault V2: Imported Keys & Multi-Chain
// ============================================================================

/**
 * Result of getKeyMetadata (imported key metadata from WalletStorageV2).
 * @typedef {Object} KeyMetadataResult
 * @property {number} curve - Curve type (enum)
 * @property {number} chain - Chain type (enum)
 * @property {boolean} active - Whether the key is active
 * @property {string} labelHash - Keccak256 hash of the label (bytes32 as hex)
 */

/**
 * Imported key identifier (V2).
 *
 * @typedef {Object} ImportedKeyBase
 * @property {Bytes32} keyId - Imported key ID
 */

/**
 * Private key material and metadata for {@link ImportKeyOptions}.
 *
 * @typedef {Object} ImportedKeyMaterial
 * @property {Bytes} privateKey - Private key to import
 * @property {Bytes} [publicKey] - Optional public key (defaults to 0x)
 * @property {number} curve - Curve type (enum: 0=SECP256K1, 1=ED25519, etc.)
 * @property {number} chain - Chain type (enum: 0=ETHEREUM, 1=SOLANA, etc.)
 * @property {string} label - Human-readable label for the key
 */

/**
 * Options for signWithImportedKey (V2).
 *
 * @typedef {KeyVaultAuthBaseOptions & ImportedKeyBase & { digest: Bytes32 }} SignWithImportedKeyOptions
 */

/**
 * Options for signSolana (V2). Same shape as {@link SignMessageOptions}.
 * @typedef {SignMessageOptions} SignSolanaOptions
 */

/**
 * Options for importKey (V2).
 *
 * @typedef {KeyVaultAuthBaseOptions & ImportedKeyBase & ImportedKeyMaterial} ImportKeyOptions
 */

/**
 * Options for setChainBaseKeys (V2).
 *
 * @typedef {KeyVaultAuthBaseOptions & {
 *   chain: number;
 *   basePrivateKey: Bytes;
 *   baseChainCode: Bytes;
 * }} SetChainBaseKeysOptions
 */

// ============================================================================
// KeyVaultClient: options with created {@link AuthProofOptions} only
// ============================================================================
//
// Low-level {@link KeyVaultClient} methods expect encoded proof bytes (or raw password bytes where applicable).
// {@link Monstera} uses {@link AuthProofInputOptions} and encoding helpers instead.

/**
 * Signing base for {@link KeyVaultClient}.
 *
 * @typedef {KeyVaultClientAuthBaseOptions & {
 *   index: number|bigint
 * }} KeyVaultClientSigningBaseOptions
 */

/**
 * @typedef {KeyVaultClientSigningBaseOptions & { nonce: number|bigint; gasPrice: number|bigint; gasLimit: number|bigint; to: Address; value: number|bigint; txData: Bytes; chainId: number|bigint }} KeyVaultClientSignTransactionOptions
 */

/**
 * @typedef {KeyVaultClientSigningBaseOptions & { message: Bytes }} KeyVaultClientSignMessageOptions
 */

/**
 * @typedef {KeyVaultClientSigningBaseOptions & { hash: Bytes32 }} KeyVaultClientSignHashOptions
 */

/**
 * ABI calldata for {@code signAuthorizationImpl} (placeholder base keys; KeyVault substitutes real values).
 *
 * @typedef {{
 *   index: number|bigint;
 *   delegateAddr: Address;
 *   nonce: number|bigint;
 *   chainId: number|bigint;
 * }} CreateImplCallOptions
 */

/**
 * Same shape as {@link KeyVaultClientSignMessageOptions} (Solana signing path).
 * @typedef {KeyVaultClientSignMessageOptions} KeyVaultClientSignSolanaOptions
 */

/**
 * @typedef {KeyVaultClientAuthBaseOptions & ImportedKeyBase & { digest: Bytes32 }} KeyVaultClientSignWithImportedKeyOptions
 */

/**
 * @typedef {KeyVaultClientAuthBaseOptions & ImportedKeyBase & ImportedKeyMaterial} KeyVaultClientImportKeyOptions
 */

/**
 * @typedef {KeyVaultClientAuthBaseOptions & {
 *   chain: number;
 *   basePrivateKey: Bytes;
 *   baseChainCode: Bytes;
 * }} KeyVaultClientSetChainBaseKeysOptions
 */

/**
 * @typedef {KeyVaultClientAuthBaseOptions & { implCall: Bytes }} KeyVaultClientExecuteWithAuthOptions
 */

/**
 * @typedef {KeyVaultClientAuthBaseOptions & { newImplAddr: Address }} KeyVaultClientUpdateKeyVaultImplOptions
 */

/**
 * @typedef {KeyVaultClientUpdateKeyVaultImplOptions & { customAckHash: Bytes32 }} KeyVaultClientUpdateKeyVaultImplCustomOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { newImplementation: Address }} KeyVaultClientComputeCustomImplementationAckHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { newAuthenticator: Address; configHash: Bytes32 }} KeyVaultClientComputeCustomAuthenticatorAckHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { implementation: Address }} KeyVaultClientIsImplementationApprovedOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authenticator: Address }} KeyVaultClientIsAuthenticatorApprovedOptions

/**
 * @typedef {KeyVaultClientAuthBaseOptions & ImportedKeyBase} KeyVaultClientDeactivateActivateKeyOptions
 */

/**
 * @typedef {KeyVaultClientAuthBaseOptions & {
 *   newAuthenticatorAddr: Address;
 *   newAuthConfig: Bytes;
 * }} KeyVaultClientUpdateAuthenticatorOptions
 */

/**
 * @typedef {KeyVaultClientUpdateAuthenticatorOptions & { customAckHash: Bytes32 }} KeyVaultClientUpdateAuthenticatorCustomOptions
 */

// ============================================================================
// Update Authenticator Option Types
// ============================================================================

/**
 * @typedef {KeyVaultAuthBaseOptions & { newAuthenticatorAddr: Address; newAuthConfig: Bytes }} UpdateAuthenticatorOptions
 */

/**
 * @typedef {WalletAuthBaseOptions & { authProof: AuthProofInputOptions; newAuthenticatorAddr: Address; newAuthConfig: Bytes }} UpdateAuthenticatorWalletOptions
 */

// --- KeyVault & wallet admin (authenticated) ---

/**
 * @typedef {KeyVaultAuthBaseOptions & { implCall: Bytes }} ExecuteWithAuthOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & { newImplAddr: Address }} UpdateKeyVaultImplOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & { newImplAddr: Address; customAckHash: Bytes32 }} UpdateKeyVaultImplCustomOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & { newAuthenticatorAddr: Address; newAuthConfig: Bytes; customAckHash: Bytes32 }} UpdateAuthenticatorCustomOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & ImportedKeyBase} DeactivateActivateKeyOptions
 */

// ============================================================================
// EIP-7702 Authorization
// ============================================================================

/**
 * EIP-7702 authorization tuple for hashing / verification (ethers-compatible field names).
 *
 * @typedef {{ chainId: bigint, address: Address, nonce: bigint }} AuthorizationTupleInput
 */

// ============================================================================
// Version Check Types
// ============================================================================

/**
 * @typedef {Object} VersionCheckResult
 * @property {boolean} isOutdated - Whether current version is outdated
 * @property {boolean} isLatest - Whether current version is the latest
 * @property {boolean} isNewer - Whether current version is newer than latest (unlikely)
 * @property {string} versionType - Type of update ('major', 'minor', 'patch', 'prerelease', 'same')
 * @property {string} currentVersion - Current SDK version
 * @property {string} latestVersion - Latest available version
 * @property {string} recommendation - Recommendation message
 */

// ============================================================================
// Client Type Aliases
// ============================================================================

/**
 * Union type for authenticator client instances.
 * @typedef {import('../clients/auth/PasswordAuthenticatorClient.js').default | import('../clients/auth/WalletSignatureAuthenticatorClient.js').default | import('../clients/auth/DualFactorAuthenticatorClient.js').default | import('../clients/auth/PasswordMinuteSignatureAuthenticatorClient.js').default | import('../clients/auth/ApiKeySessionAuthenticatorClient.js').default | import('../clients/auth/MultiAuthenticatorClient.js').default | import('../clients/auth/PasswordOrWalletSignatureAuthenticatorClient.js').default} AuthenticatorClientInstance
 */

