/**
 * Type Definitions for Monstera SDK
 *
 * Central JSDoc types: base types are defined once and extended via intersection
 * to avoid repetition and keep the file maintainable.
 */

// ============================================================================
// Utility Types (primitives used across the SDK)
// ============================================================================

/**
 * @typedef {string} Bytes - Hex string representing bytes
 * @typedef {string} Bytes32 - Hex string representing 32 bytes
 * @typedef {string} Address - Ethereum address (0x-prefixed hex string, 42 characters)
 * @typedef {string} TransactionHash - Transaction hash (0x-prefixed hex string, 66 characters)
 * @typedef {string} Mnemonic - BIP39 mnemonic phrase (12 or 24 words)
 * @typedef {number|string} ChainId - EVM chain ID as used by ethers / RPC
 */

// ============================================================================
// Ethers.js Type Aliases
// ============================================================================

/**
 * @typedef {import('ethers').Provider} EthersProvider - Ethers.js Provider type
 * @typedef {import('ethers').Signer} EthersSigner - Ethers.js Signer type
 * @typedef {import('ethers').Contract} EthersContract - Ethers.js Contract type
 * @typedef {import('ethers').Wallet} EthersWallet - Ethers.js Wallet type
 * @typedef {import('ethers').HDNodeWallet} EthersHDNodeWallet - Ethers.js HDNodeWallet type
 * @typedef {import('ethers').TransactionReceipt} TransactionReceipt - Ethers.js TransactionReceipt type
 * @typedef {import('ethers').AbstractProvider} EthersAbstractProvider - Ethers.js AbstractProvider (e.g. {@code getBlock})
 * @typedef {EthersSigner} WrappedEthersSigner - Sapphire-wrapped Ethers signer (from @oasisprotocol/sapphire-ethers-v6 wrapEthersSigner)
 */

// ============================================================================
// Contract & Network Base Types
// ============================================================================

/**
 * @typedef {Object} ContractAddresses
 * @property {Address} factory - WalletFactory contract address
 * @property {Address} passwordAuth - PasswordAuthenticator contract address
 * @property {Address} walletSignatureAuth - WalletSignatureAuthenticator contract address
 * @property {Address} dualFactorAuth - DualFactorAuthenticator contract address
 * @property {Address} passwordMinuteSignatureAuth - PasswordMinuteSignatureAuthenticator contract address
 */

/**
 * @typedef {Object} DefaultContractAddresses
 * @property {Partial<ContractAddresses>} testnet - Testnet contract addresses
 * @property {Partial<ContractAddresses>} mainnet - Mainnet contract addresses (may have null values)
 */

/**
 * Base network fields shared by preset and full config.
 * @typedef {Object} NetworkBase
 * @property {ChainId} chainId - Chain ID (number or string)
 * @property {string} rpcUrl - RPC URL
 * @property {string} explorerUrl - Block explorer URL
 */

/**
 * Network preset for a single network (no contract addresses).
 * @typedef {NetworkBase & { name: string }} NetworkPreset
 */

/**
 * Full network configuration including contract addresses.
 * @typedef {NetworkBase & { network: string; addresses: ContractAddresses }} NetworkConfig
 */

/**
 * @typedef {Object} NetworkPresets
 * @property {NetworkPreset} testnet - Testnet network configuration
 * @property {NetworkPreset} mainnet - Mainnet network configuration
 */

// ============================================================================
// Connect Options (shared base, then write/read)
// ============================================================================

/**
 * Log level and version-check flags reused by connect and Monstera constructor.
 * @typedef {Object} SdkLoggingAndVersionOptions
 * @property {boolean} [checkVersion=true] - Enable automatic version checking (default: true)
 * @property {'error'|'warn'|'info'|'debug'} [logLevel='error'] - Log level. Default 'error'. Use debug: true as shorthand for logLevel 'debug'.
 * @property {boolean} [debug] - If true, equivalent to logLevel 'debug'. Ignored if logLevel is set.
 */

/**
 * Network selection and optional address overrides for connect.
 * @typedef {Object} BaseConnectNetworkOptions
 * @property {boolean} mainnet - true for mainnet, false for testnet
 * @property {string} [rpcUrl] - Optional custom RPC URL (defaults to network preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides
 */

/**
 * Options shared by write and read connect flows.
 * @typedef {BaseConnectNetworkOptions & SdkLoggingAndVersionOptions} BaseConnectOptions
 */

/**
 * @typedef {BaseConnectOptions & { signer: EthersSigner | string }} WriteConnectOptions
 * @property {EthersSigner | string} signer - Ethers Signer instance or private key string (0x-prefixed hex)
 */

/**
 * @typedef {BaseConnectOptions & { provider?: EthersProvider }} ReadConnectOptions
 * @property {EthersProvider} [provider] - Optional ethers Provider instance
 */

// ============================================================================
// Monstera Constructor Config
// ============================================================================

/**
 * Optional signer, provider, and logging/version overrides when constructing Monstera with a resolved NetworkConfig.
 * @typedef {SdkLoggingAndVersionOptions & {
 *   signer?: EthersSigner | string;
 *   provider?: EthersProvider;
 * }} MonsteraConfigExtension
 */

/**
 * Full config for Monstera SDK constructor. Extends NetworkConfig with optional signer, provider, and version check.
 * @typedef {NetworkConfig & MonsteraConfigExtension} MonsteraConfigOptions
 */

// ============================================================================
// Transaction Result Base & Extensions
// ============================================================================

/**
 * Base transaction result returned by executeWrite. All write results include these four fields.
 * Specific result types extend this with parsed event data and extraData.
 *
 * @typedef {Object} TransactionResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 */

/** @typedef {TransactionResult & { wallet: Address; keyVault: Address; storage: Address; authenticator: Address; mnemonic: Mnemonic }} WalletCreationResult */

/** @typedef {TransactionResult & { wallet: Address }} ConfigurePasswordResult */

/** @typedef {TransactionResult & { wallet: Address; initialWhitelist: Address[] }} ConfigureWalletSignatureResult */

/** @typedef {TransactionResult & { wallet: Address; guardian: Address }} ConfigurePasswordDualFactorResult */

/** @typedef {TransactionResult & { newAdmin?: Address; implementation?: Address }} UpdateResult */

/** @typedef {TransactionResult & { newAdmin?: Address; factoryAddress?: Address }} TransferAdminResult */

/** @typedef {TransactionResult & { walletAddr?: Address }} UpdatePasswordResult */

/**
 * Shared shape for admin updates that swap a proxy implementation (WalletLogic or KeyVault).
 * @typedef {TransactionResult & { oldImpl: Address; newImpl: Address }} UpdateProxyImplementationResult
 */

/** @typedef {UpdateProxyImplementationResult} UpdateWalletLogicImplAddrResult */

/** @typedef {UpdateProxyImplementationResult} UpdateKeyVaultImplAddrResult */

/** @typedef {TransactionResult & { oldAuth: Address; newAuth: Address }} UpdateAuthenticatorAddrResult */

/** @typedef {TransactionResult & { wallet: Address; added: Address }} AddToWhitelistResult */

/** @typedef {TransactionResult & { wallet: Address; removed: Address }} RemoveFromWhitelistResult */

/** @typedef {TransactionResult & { wallet: Address; newGuardian: Address }} UpdateGuardianResult */

// ============================================================================
// Write / Read Wrapper Option Types
// ============================================================================

/**
 * @typedef {Object} ExecuteWriteOptions
 * @property {WrappedEthersSigner} writeSigner - The write signer (must be Sapphire-wrapped)
 * @property {Array<ParseEventOptions>} [parseEvents] - Array of event definitions to parse
 * @property {boolean} [requireEvents=true] - Whether to throw if events are not found
 * @property {Record<string, unknown>} [extraData] - Additional data to include in result (spread into result)
 * @property {string} [methodName] - Method name for error context
 * @property {string} [rpcUrl] - RPC URL for error context
 */

/**
 * Base options for executeWrite/executeRead (operation + methodName).
 * @typedef {Object} ExecuteInputOptionsBase
 * @property {() => Promise<any>} operation - Async function that returns a transaction
 * @property {string} methodName - Name of the method for error context
 */

/**
 * Complete options for BaseContractClient.executeWrite(). Extends ExecuteInputOptionsBase with parse/extra options.
 * Additional properties (e.g. keyVaultAddr, walletAddress) are included in error context for debugging.
 *
 * @typedef {ExecuteInputOptionsBase & {
 *   parseEvents?: Array<ParseEventOptions>;
 *   requireEvents?: boolean;
 *   extraData?: Record<string, unknown>;
 * }} ExecuteWriteInputOptions
 */

/**
 * Complete options for BaseContractClient.executeRead(). Additional properties are included in error context.
 * @typedef {ExecuteInputOptionsBase} ExecuteReadInputOptions
 */

/**
 * @typedef {Object} ParseEventOptions
 * @property {Record<string, unknown>} eventDef - Event definition (eventName and fieldMapping)
 * @property {EthersContract} contract - Contract instance to parse events from
 */

// ============================================================================
// Wallet Creation Option Types
// ============================================================================

/**
 * Structured {@code authConfig}: password hash only (PasswordAuthenticator and PasswordMinuteSignatureAuthenticator at creation share this shape).
 * @typedef {Object} CreateWalletPasswordHashOnlyAuthConfig
 * @property {Bytes32} passwordHash - keccak256(utf8(password))
 */

/** @typedef {CreateWalletPasswordHashOnlyAuthConfig} CreateWalletPasswordAuthConfig */

/** @typedef {CreateWalletPasswordHashOnlyAuthConfig} CreateWalletPasswordMinuteSignatureAuthConfig */

/**
 * Structured {@code authConfig} for WalletSignatureAuthenticator at wallet creation.
 * @typedef {Object} CreateWalletWalletSignatureAuthConfig
 * @property {Address[]} initialWhitelist - Initial whitelist (at least one address)
 */

/**
 * Structured {@code authConfig} for DualFactorAuthenticator at wallet creation.
 * @typedef {Object} CreateWalletDualFactorAuthConfig
 * @property {Bytes32} passwordHash
 * @property {Address} guardianAddr
 */

/**
 * Plain object {@code authConfig} for built-in authenticators at wallet creation (before ABI encoding).
 * @typedef {CreateWalletPasswordHashOnlyAuthConfig|CreateWalletWalletSignatureAuthConfig|CreateWalletDualFactorAuthConfig|CreateWalletPasswordMinuteSignatureAuthConfig} CreateWalletStructuredAuthConfig
 */

/**
 * Options shared by createWalletWithHook and createWalletWithCustomLogic.
 * @typedef {Object} CreateWalletBaseOptions
 * @property {Bytes|CreateWalletStructuredAuthConfig} authConfig -
 *   Hex-encoded authenticator config bytes, or a plain object when using a built-in {@code authenticatorAddr}
 *   from {@link Monstera#addresses} (SDK encodes to bytes).
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

// ============================================================================
// Initialization Option Types
// ============================================================================

/**
 * @typedef {Object} InitializeOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Address} storageAddr - WalletStorage contract address
 * @property {Address} authenticatorAddr - Authenticator contract address
 * @property {Bytes32} accessToken - Secret token for storage access (bytes32)
 */

// ============================================================================
// Signing Context Base Types (keyVault vs wallet, then transaction/message/hash)
// ============================================================================

/**
 * Structured input options to create auth proof for PasswordAuthenticator.
 * @typedef {Object} KeyVaultPasswordAuthProofInput
 * @property {Uint8Array} password - UTF-8 password bytes (e.g. from {@code ethers.toUtf8Bytes})
 */

/**
 * Structured input options to create auth proof for WalletSignatureAuthenticator.
 * @typedef {Object} KeyVaultWalletSignatureAuthProofInput
 * @property {EthersWallet | EthersHDNodeWallet} signer
 * @property {number} [deadline] - Deadline for the auth proof (Unix timestamp in seconds) (optional)
 */

/**
 * Structured input options to create auth proof for DualFactorAuthenticator.
 * @typedef {Object} KeyVaultDualFactorAuthProofInput
 * @property {Bytes32} passwordHash
 * @property {EthersWallet | EthersHDNodeWallet} signer
 * @property {number} [deadline] - Deadline for the auth proof (Unix timestamp in seconds) (optional)
 */

/**
 * Structured input options to create auth proof for PasswordMinuteSignatureAuthenticator.
 * @typedef {Object} KeyVaultPasswordMinuteSignatureAuthProofInput
 * @property {Bytes32} passwordHash
 */

/**
 * Allowed {@code authProof} input for KeyVault authenticated calls: raw bytes, UTF-8 password buffer, or a built-in structured proof object.
 * @typedef {Bytes|Uint8Array|KeyVaultPasswordAuthProofInput|KeyVaultWalletSignatureAuthProofInput|KeyVaultDualFactorAuthProofInput|KeyVaultPasswordMinuteSignatureAuthProofInput} AuthProofInputOptions
 */

// ============================================================================
// On-chain authProof bytes (contract layouts) vs structured create-auth inputs
// ============================================================================

/**
 * Raw UTF-8 password bytes for {@code PasswordAuthenticator.verify} (not ABI-encoded).
 * @typedef {Bytes} PasswordAuthenticatorVerifyAuthProof
 */

/**
 * ABI-encoded proof for {@code WalletSignatureAuthenticator} (verify, whitelist writes, etc.).
 * Layout: {@code abi.encode(uint256 deadline, bytes signature)}; {@code signature} is over EIP-712 {@code WalletAuth(wallet, deadline)}.
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
 * Base for signing options that target a KeyVault by address.
 * @typedef {Object} KeyVaultSigningBase
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {number|bigint} index - Account index (uint32)
 */

/**
 * Base for signing options that target a wallet proxy (from createWallet).
 * @typedef {Object} WalletSigningBase
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {number|bigint} index - Account index (uint32)
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
 * @typedef {WalletSigningBase & { nonce: number|bigint; gasPrice: number|bigint; gasLimit: number|bigint; to: Address; value: number|bigint; data: Bytes; chainId: number|bigint }} SignTransactionWalletOptions
 */

/**
 * @typedef {WalletSigningBase & { message: Bytes }} SignMessageWalletOptions
 */

/**
 * @typedef {WalletSigningBase & { hash: Bytes32 }} SignHashWalletOptions
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
 * Options for signWithImportedKey (V2).
 * @typedef {Object} SignWithImportedKeyOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {Bytes32} keyId - Imported key ID
 * @property {Bytes32} digest - 32-byte hash to sign
 */

/**
 * Options for signSolana (V2). Same shape as {@link SignMessageOptions}.
 * @typedef {SignMessageOptions} SignSolanaOptions
 */

/**
 * Options for importKey (V2).
 * @typedef {Object} ImportKeyOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {Bytes32} keyId - Unique identifier for the key
 * @property {Bytes} privateKey - Private key to import
 * @property {Bytes} [publicKey] - Optional public key (defaults to 0x)
 * @property {number} curve - Curve type (enum: 0=SECP256K1, 1=ED25519, etc.)
 * @property {number} chain - Chain type (enum: 0=ETHEREUM, 1=SOLANA, etc.)
 * @property {string} label - Human-readable label for the key
 */

/**
 * Options for setChainBaseKeys (V2).
 * @typedef {Object} SetChainBaseKeysOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {number} chain - Chain type (enum: 0=ETHEREUM, 1=SOLANA, etc.)
 * @property {Bytes} basePrivateKey - Base private key for HD derivation
 * @property {Bytes} baseChainCode - Base chain code for HD derivation
 */

// ============================================================================
// Update Authenticator Option Types
// ============================================================================

/**
 * Base fields for updating authenticator (keyVault vs wallet variant).
 * @typedef {Object} UpdateAuthenticatorBase
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {Address} newAuthenticatorAddr - New authenticator contract address
 * @property {Bytes} newAuthConfig - New authentication configuration (bytes)
 */

/**
 * @typedef {UpdateAuthenticatorBase & KeyVaultAddrOptions } UpdateAuthenticatorOptions
 */

/**
 * @typedef {UpdateAuthenticatorBase & WalletProxyOptions } UpdateAuthenticatorWalletOptions
 */

// ============================================================================
// Auth Proof Option Types
// ============================================================================

/**
 * @typedef {Object} CreateAuthProofBaseOptions
 * @property {Address} keyVaultAddr - KeyVault address of the wallet to authenticate
 * @property {Address} [authenticatorAddr] - Built-in authenticator address (defaults to config)
 * @property {ChainId} [chainId] - Chain ID (optional, defaults to config)
 */

/**
 * Inputs to build {@link EncodedAuthProofWalletSignature} (wallet-signature authenticator).
 * @typedef {CreateAuthProofBaseOptions & KeyVaultWalletSignatureAuthProofInput } CreateAuthProofWalletSignatureOptions
 */

/**
 * Inputs to build a password-based proof for flows that encode the password path (not the same bytes as {@link PasswordAuthenticatorVerifyAuthProof}).
 * @typedef {CreateAuthProofBaseOptions & KeyVaultPasswordAuthProofInput } CreateAuthProofPasswordOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofPasswordMinute} (minute-bucket ECDSA path).
 * @typedef {CreateAuthProofBaseOptions & KeyVaultPasswordMinuteSignatureAuthProofInput } CreateAuthProofMinuteSignatureOptions
 */

/**
 * Inputs to build {@link EncodedAuthProofDualFactor} (dual-factor authenticator).
 * @typedef {CreateAuthProofBaseOptions & KeyVaultDualFactorAuthProofInput } CreateAuthProofDualFactorOptions
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
 * Valid inputs to {@link encodeAuthConfigOptions} (structured or pre-encoded {@code authConfig}).
 * @typedef {CreateWalletBaseOptions | CreateWalletFromMnemonicOptions | CreateWalletWithHookOptions | CreateWalletWithCustomLogicOptions} EncodeAuthConfigCallerOptions
 */

/**
 * Output when structured {@code authConfig} was encoded: caller fields spread with encoded bytes and resolved {@code authenticatorAddr}.
 * @typedef {Record<string, unknown> & { authConfig: Bytes; authenticatorAddr: Address }} EncodedAuthConfigCallOptions
 */

/**
 * Return type of {@link encodeAuthConfigOptions}: unchanged caller options when {@code authConfig} was already hex, otherwise encoded payload.
 * @typedef {EncodeAuthConfigCallerOptions | EncodedAuthConfigCallOptions} EncodeAuthConfigOptionsReturn
 */

/**
 * KeyVault-style call options before/after {@link encodeAuthProofOptions}. When {@code authProof} is a plain object, {@code keyVaultAddr} is required.
 * @typedef {Record<string, unknown> & {
 *   authProof?: AuthProofInputOptions;
 *   keyVaultAddr?: Address;
 * }} EncodeAuthProofOptionsInput
 */

/**
 * Result of {@link encodeAuthProofOptions}: same fields as input with {@code authProof} as hex {@link Bytes} or {@link Uint8Array}.
 * @typedef {Record<string, unknown> & { authProof: Bytes|Uint8Array }} EncodeAuthProofOptionsResult
 */

// ============================================================================
// Monstera facade: small option objects (thin delegation to clients)
// ============================================================================

/**
 * @typedef {{ walletAddr: Address }} WalletProxyOptions
 */

/**
 * Wallet proxy plus HD index (WalletLogic account reads).
 * @typedef {WalletProxyOptions & { index: number }} WalletProxyIndexSdkOptions
 */

/**
 * Wallet proxy plus contiguous address slice (WalletLogic account reads).
 * @typedef {WalletProxyOptions & { fromIndex: number; count: number }} WalletProxyAccountSliceSdkOptions
 */

/**
 * Authenticated KeyVault implementation upgrade via WalletLogic proxy.
 * {@code authProof} is opaque bytes for the wallet's authenticator (contract validates). Typical layouts:
 * {@link EncodedAuthProofDualFactor}, {@link EncodedAuthProofWalletSignature}, {@link EncodedAuthProofPasswordMinute}, or {@link PasswordAuthenticatorVerifyAuthProof} (raw UTF-8) for password-only flows — match your vault's authenticator.
 * @typedef {WalletProxyOptions & { authProof: Bytes; newImplAddr: Address }} WalletLogicUpdateKeyVaultImplSdkOptions
 */

/**
 * @typedef {{ keyVaultAddr: Address }} KeyVaultAddrOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & WalletProxyOptions } InitializeWalletLogicSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32 }} MonsteraConfigurePasswordHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { initialWhitelist: Address[] }} MonsteraConfigureWalletSignatureSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32; guardianAddr: Address }} MonsteraConfigureDualFactorSdkOptions
 */

/**
 * @typedef {MonsteraConfigurePasswordHashOptions} MonsteraConfigurePasswordMinuteSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { index: number }} KeyVaultAddrIndexSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { fromIndex: number; count: number }} KeyVaultAccountSliceSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { keyId: Bytes32 }} KeyVaultImportedKeySdkOptions
 */

/**
 * @typedef {Object} ExecuteWithAuthSdkOptions
 * @property {Address} keyVaultAddr
 * @property {AuthProofInputOptions} authProof
 * @property {Bytes} implCall
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: AuthProofInputOptions; newImplAddr: Address }} MonsteraUpdateKeyVaultImplSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: AuthProofInputOptions; keyId: Bytes32 }} MonsteraDeactivateActivateKeySdkOptions
 */

/**
 * @typedef {{ newLogicAddr: Address }} MonsteraUpdateWalletLogicImplSdkOptions
 */

/**
 * @typedef {{ newAdminAddr: Address }} MonsteraTransferAdminSdkOptions
 */

/**
 * currentPassword is raw password bytes (utf8 encoded string)
 * @typedef {KeyVaultAddrOptions & { currentPassword: Bytes }} MonsteraVerifyPasswordSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { addressToCheck: Address }} MonsteraWhitelistCheckSdkOptions
 */

/**
 * @typedef {CreateAuthProofWalletSignatureOptions & { addressToAdd: Address }} MonsteraAddWhitelistSdkOptions
 */

/**
 * @typedef {CreateAuthProofWalletSignatureOptions & { addressToRemove: Address }} MonsteraRemoveWhitelistSdkOptions
 */

/**
 * @typedef {CreateAuthProofDualFactorOptions & { newPasswordHash: Bytes32 }} MonsteraUpdatePasswordDualFactorSdkOptions
 */

/**
 * @typedef {CreateAuthProofDualFactorOptions & { newGuardian: Address }} MonsteraUpdateGuardianSdkOptions
 */

/**
 * currentPassword is raw password bytes (utf8 encoded string)
 * newPasswordHash is the new password hash (bytes32)
 * @typedef {KeyVaultAddrOptions & { currentPassword: Bytes; newPasswordHash: Bytes32 }} MonsteraUpdatePasswordSdkOptions
 */

/**
 * {@code PasswordAuthenticator.verify} — expects raw UTF-8 password bytes ({@link PasswordAuthenticatorVerifyAuthProof}), not ABI-encoded.
 * @typedef {KeyVaultAddrOptions & { authProof: PasswordAuthenticatorVerifyAuthProof }} PasswordAuthenticatorVerifySdkOptions
 */

/**
 * {@code PasswordMinuteSignatureAuthenticator.verify} — expects {@link EncodedAuthProofPasswordMinute}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordMinute }} PasswordMinuteSignatureAuthenticatorVerifySdkOptions
 */

/**
 * {@code WalletSignatureAuthenticator.verify} — expects {@link EncodedAuthProofWalletSignature}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature }} WalletSignatureAuthenticatorVerifySdkOptions
 */

/**
 * {@code DualFactorAuthenticator.verify} — expects {@link EncodedAuthProofDualFactor}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor }} DualFactorAuthenticatorVerifySdkOptions
 */

/**
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: Bytes32 }} AuthenticatorConfigurePasswordHashSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authConfig: Bytes }} WalletSignatureAuthenticatorConfigureSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authConfig: Bytes }} DualFactorAuthenticatorConfigureSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToAdd: Address }} WalletSignatureAddToWhitelistSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToRemove: Address }} WalletSignatureRemoveFromWhitelistSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newPasswordHash: Bytes32 }} DualFactorAuthenticatorUpdatePasswordSdkOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newGuardian: Address }} DualFactorAuthenticatorUpdateGuardianSdkOptions
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
 * @typedef {import('../clients/auth/PasswordAuthenticatorClient.js').default | import('../clients/auth/WalletSignatureAuthenticatorClient.js').default | import('../clients/auth/DualFactorAuthenticatorClient.js').default | import('../clients/auth/PasswordMinuteSignatureAuthenticatorClient.js').default} AuthenticatorClientInstance
 */

// Export empty object to make this a valid ES module
export {};
