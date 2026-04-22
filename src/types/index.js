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
 * Keys of {@link ContractAddresses} that must be present after configuration is resolved.
 * @typedef {'factory'|'passwordAuth'|'walletSignatureAuth'|'dualFactorAuth'|'passwordMinuteSignatureAuth'} RequiredContractAddressKey
 */

/**
 * Canonical ordered list of required contract address keys (validation and static `requiredAddresses`).
 * @typedef {RequiredContractAddressKey[]} RequiredContractAddressKeys
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
 * Input for internal `buildNetworkConfig` (`src/config/networks.js`): preset key plus optional RPC and address overrides.
 * Distinct from {@link BaseConnectNetworkOptions}, which uses `mainnet: boolean` rather than `network`.
 * @typedef {Object} BuildNetworkConfigInput
 * @property {'testnet'|'mainnet'} network - Preset key (`testnet` or `mainnet`)
 * @property {string} [rpcUrl] - Optional RPC URL (defaults to preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides merged with defaults
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
 * @typedef {SdkLoggingAndVersionOptions & { signer?: EthersSigner | string; provider?: EthersProvider }} MonsteraConfigExtension
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
 * @typedef {Object} BaseTransactionResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 */

/** @typedef {BaseTransactionResult & { wallet: Address; keyVault: Address; storage: Address; authenticator: Address; mnemonic: Mnemonic }} WalletCreationResult */

/** @typedef {BaseTransactionResult & { wallet: Address }} ConfigurePasswordResult */

/** @typedef {BaseTransactionResult & { wallet: Address; initialWhitelist: Address[] }} ConfigureWalletSignatureResult */

/** @typedef {BaseTransactionResult & { wallet: Address; guardian: Address }} ConfigurePasswordDualFactorResult */

/** @typedef {BaseTransactionResult & { newAdmin?: Address; implementation?: Address }} UpdateResult */

/** @typedef {BaseTransactionResult & { newAdmin?: Address; factoryAddress?: Address }} TransferAdminResult */

/** @typedef {BaseTransactionResult & { walletAddr?: Address }} UpdatePasswordResult */

/**
 * Shared shape for admin updates that swap a proxy implementation (WalletLogic or KeyVault).
 * @typedef {BaseTransactionResult & { oldImpl: Address; newImpl: Address }} UpdateProxyImplementationResult
 */

/** @typedef {UpdateProxyImplementationResult} UpdateWalletLogicImplAddrResult */

/** @typedef {UpdateProxyImplementationResult} UpdateKeyVaultImplAddrResult */

/** @typedef {BaseTransactionResult & { oldAuth: Address; newAuth: Address }} UpdateAuthenticatorAddrResult */

/** @typedef {BaseTransactionResult & { wallet: Address; added: Address }} AddToWhitelistResult */

/** @typedef {BaseTransactionResult & { wallet: Address; removed: Address }} RemoveFromWhitelistResult */

/** @typedef {BaseTransactionResult & { wallet: Address; newGuardian: Address }} UpdateGuardianResult */

/** @typedef {BaseTransactionResult & { keyId: Bytes32; curve: number; chain: number }} ImportKeyResult */

/**
 * Parsed event payload shared by deactivate and activate imported key (same {@code keyId} field).
 * @typedef {BaseTransactionResult & { keyId: Bytes32 }} KeyVaultKeyIdMutationResult
 */

/** @typedef {KeyVaultKeyIdMutationResult} DeactivateKeyResult */

/** @typedef {KeyVaultKeyIdMutationResult} ActivateKeyResult */

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
 *
 * Union of four logical variants: password (PasswordAuthenticator), wallet-signature whitelist, dual-factor,
 * and password-minute-signature. TypeScript may show only three members in hovers because
 * {@link CreateWalletPasswordAuthConfig} and {@link CreateWalletPasswordMinuteSignatureAuthConfig} share the
 * same underlying shape ({@link CreateWalletPasswordHashOnlyAuthConfig}); runtime still dispatches by
 * {@code authenticatorAddr}.
 *
 * @typedef {(
 *   | CreateWalletPasswordAuthConfig
 *   | CreateWalletPasswordMinuteSignatureAuthConfig
 *   | CreateWalletWalletSignatureAuthConfig
 *   | CreateWalletDualFactorAuthConfig
 * )} AuthConfigInputOptions
 */

/**
 * ABI-encoded dual-factor authenticator config at wallet creation ({@code abi.encode(bytes32,address)}).
 * @see {@link module:internal/crypto/wallet.js} {@code createDualFactorAuthConfig}
 * @typedef {Bytes} EncodedDualFactorCreateWalletAuthConfig
 */

/**
 * ABI-encoded WalletSignatureAuthenticator whitelist ({@code abi.encode(address[])}).
 * @see {@link module:internal/crypto/wallet.js} {@code createWalletSigAuthConfig}
 * @typedef {Bytes} EncodedWalletSignatureCreateWalletAuthConfig
 */

/**
 * Password-hash-only authenticator config for PasswordAuthenticator at creation (contract expects bytes32).
 * @see {@link module:internal/authenticators/authConfig/encoders/password.js} {@code passwordAuthCreateWalletEncoder}
 * @typedef {Bytes32} EncodedPasswordAuthenticatorCreateWalletAuthConfig
 */

/**
 * Same bytes32-on-chain shape as {@link EncodedPasswordAuthenticatorCreateWalletAuthConfig} for PasswordMinuteSignatureAuthenticator at creation.
 * @see {@link module:internal/authenticators/authConfig/encoders/passwordMinuteSignature.js} {@code passwordMinuteSignatureAuthCreateWalletEncoder}
 * @typedef {Bytes32} EncodedPasswordMinuteSignatureCreateWalletAuthConfig
 */

/**
 * Encoded outputs from built-in create-wallet authenticator encoders only (no arbitrary pass-through).
 *
 * Structural aliases: dual-factor and wallet-signature configs are dynamic {@link Bytes}; password variants are fixed {@link Bytes32}.
 *
 * @typedef {(
 *   | EncodedDualFactorCreateWalletAuthConfig
 *   | EncodedWalletSignatureCreateWalletAuthConfig
 *   | EncodedPasswordAuthenticatorCreateWalletAuthConfig
 *   | EncodedPasswordMinuteSignatureCreateWalletAuthConfig
 * )} CreateWalletBuiltinEncodedAuthConfig
 */

/**
 * Encoded {@code authConfig} acceptable to WalletFactoryClient: built-in variants {@link CreateWalletBuiltinEncodedAuthConfig},
 * or any pre-encoded hex string when using a non built-in authenticator ({@link Bytes}).
 *
 * @typedef {CreateWalletBuiltinEncodedAuthConfig|Bytes} EncodedAuthConfigOptions
 */

/**
 * Built-in registry entry: maps structured create-wallet {@code authConfig} to encoded bytes for a fixed authenticator.
 *
 * @typedef {Object} CreateWalletAuthEncoder
 * @property {string} id - Encoder identifier (logging / diagnostics)
 * @property {(authConfig: AuthConfigInputOptions) => CreateWalletBuiltinEncodedAuthConfig} encode - Encode structured config for on-chain {@code authConfig}
 */

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
 * Base options for WalletFactoryClient: {@code authConfig} is already encoded for the factory (never a structured object).
 * @typedef {Object} CreateWalletFactoryBaseOptions
 * @property {EncodedAuthConfigOptions} authConfig - Hex-encoded authenticator configuration
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
 */

/**
 * @typedef {CreateWalletFactoryBaseOptions & { mnemonic: Mnemonic }} CreateWalletFactoryFromMnemonicOptions
 */

/**
 * @typedef {CreateWalletFactoryBaseOptions & { hookAddr: Address; hookData: Bytes }} CreateWalletFactoryWithHookOptions
 */

/**
 * @typedef {CreateWalletFactoryBaseOptions & { customLogicImplAddr: Address; logicData: Bytes }} CreateWalletFactoryWithCustomLogicOptions
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

/**
 * Structured object branch of {@link AuthProofInputOptions} for built-in KeyVault authProof encoders (see {@code encodeAuthProofOptions}); not raw hex / {@link Uint8Array}.
 *
 * @typedef {(
 *   | KeyVaultPasswordAuthProofInput
 *   | KeyVaultWalletSignatureAuthProofInput
 *   | KeyVaultDualFactorAuthProofInput
 *   | KeyVaultPasswordMinuteSignatureAuthProofInput
 * )} KeyVaultStructuredAuthProofInput
 */

/**
 * Context passed into {@code encodeAuthProofOptions} before the on-chain authenticator address is resolved.
 *
 * @typedef {Object} AuthProofContext
 * @property {ContractAddresses} addresses
 * @property {ChainId} chainId
 * @property {EthersAbstractProvider} readProvider
 * @property {(keyVaultAddr: Address) => Promise<Address>} getAuthenticatorAddr
 */

/**
 * Context passed into {@link encodeAuthConfigOptions} for built-in authenticator resolution (registry keyed by contract addresses).
 *
 * @typedef {Object} AuthConfigContext
 * @property {ContractAddresses} addresses
 */

/**
 * Context passed to each built-in KeyVault authProof encoder after the authenticator is known.
 *
 * @typedef {Object} KeyVaultAuthProofEncodeContext
 * @property {ContractAddresses} addresses
 * @property {ChainId} chainId
 * @property {EthersAbstractProvider} readProvider
 * @property {Address} authenticatorAddr
 * @property {Address} keyVaultAddr
 */

/**
 * One entry in {@link createKeyVaultAuthProofEncoderRegistry} (async encoder for a fixed built-in authenticator).
 *
 * @typedef {Object} KeyVaultAuthProofEncoder
 * @property {string} id - Encoder identifier (logging / diagnostics)
 * @property {(ctx: KeyVaultAuthProofEncodeContext, input: KeyVaultStructuredAuthProofInput) => Promise<Bytes>} encode
 */

/**
 * Registry: authenticator address → {@link KeyVaultAuthProofEncoder}.
 *
 * @typedef {Object} KeyVaultAuthProofEncoderRegistry
 * @property {(authenticatorAddr: Address) => KeyVaultAuthProofEncoder | undefined} getByAuthenticatorAddr
 */

/**
 * PasswordAuthenticator encoder: {@code input} is {@link KeyVaultPasswordAuthProofInput} only.
 * Structurally assignable to {@link KeyVaultAuthProofEncoder} for the registry.
 *
 * @typedef {Object} KeyVaultAuthProofPasswordEncoder
 * @property {string} id
 * @property {(ctx: KeyVaultAuthProofEncodeContext, input: KeyVaultPasswordAuthProofInput) => Promise<Bytes>} encode
 */

/**
 * WalletSignatureAuthenticator encoder: {@code input} is {@link KeyVaultWalletSignatureAuthProofInput} only.
 *
 * @typedef {Object} KeyVaultAuthProofWalletSignatureEncoder
 * @property {string} id
 * @property {(ctx: KeyVaultAuthProofEncodeContext, input: KeyVaultWalletSignatureAuthProofInput) => Promise<Bytes>} encode
 */

/**
 * DualFactorAuthenticator encoder: {@code input} is {@link KeyVaultDualFactorAuthProofInput} only.
 *
 * @typedef {Object} KeyVaultAuthProofDualFactorEncoder
 * @property {string} id
 * @property {(ctx: KeyVaultAuthProofEncodeContext, input: KeyVaultDualFactorAuthProofInput) => Promise<Bytes>} encode
 */

/**
 * PasswordMinuteSignatureAuthenticator encoder: {@code input} is {@link KeyVaultPasswordMinuteSignatureAuthProofInput} only.
 *
 * @typedef {Object} KeyVaultAuthProofPasswordMinuteEncoder
 * @property {string} id
 * @property {(ctx: KeyVaultAuthProofEncodeContext, input: KeyVaultPasswordMinuteSignatureAuthProofInput) => Promise<Bytes>} encode
 */

// ============================================================================
// On-chain authProof bytes (contract layouts) vs structured create-auth inputs
// ============================================================================

/**
 * Raw UTF-8 password bytes for {@code PasswordAuthenticator.verify} (not ABI-encoded).
 * @typedef {Uint8Array} PasswordAuthenticatorVerifyAuthProof
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
 * Result of minute-signature auth proof creation ({@code internal/crypto/wallet.js}, {@code createAuthProofMinuteSignature}).
 *
 * @typedef {Object} CreateAuthProofMinuteSignatureResult
 * @property {EncodedAuthProofPasswordMinute} authProof - ABI-encoded signature for {@code PasswordMinuteSignatureAuthenticator.verify}
 * @property {number} minuteBucket - Unix timestamp floored to minute bucket used for signing
 * @property {Address} derivedAddress - Ephemeral signer address derived from password hash and minute bucket
 */

/**
 * Union of all **created / on-wire** {@code authProof} payloads for direct contract clients (e.g. {@link KeyVaultClient}).
 * Does not include structured {@link AuthProofInputOptions}; use that in {@link Monstera} (with {@link encodeAuthProofOptions}) before calling the client.
 * @typedef {PasswordAuthenticatorVerifyAuthProof|EncodedAuthProofWalletSignature|EncodedAuthProofDualFactor|EncodedAuthProofPasswordMinute} AuthProofOptions
 */

/**
 * KeyVault address plus {@link AuthProofInputOptions} (Monstera / SDK encoding path).
 *
 * @typedef {Object} KeyVaultAuthBase
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 */

/**
 * KeyVault address plus {@link AuthProofOptions} (encoded proof bytes for {@link KeyVaultClient}).
 *
 * @typedef {Object} KeyVaultClientAuthBase
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {AuthProofOptions} authProof - Created authentication proof bytes
 */

/**
 * Wallet proxy plus {@link AuthProofInputOptions}.
 *
 * @typedef {Object} WalletAuthBase
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 */

/**
 * Base for signing options that target a KeyVault by address.
 *
 * @typedef {KeyVaultAuthBase & {
 *   index: number|bigint
 * }} KeyVaultSigningBase
 */

/**
 * Base for signing options that target a wallet proxy (from createWallet).
 *
 * @typedef {WalletAuthBase & {
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
 * @typedef {KeyVaultAuthBase & ImportedKeyBase & { digest: Bytes32 }} SignWithImportedKeyOptions
 */

/**
 * Options for signSolana (V2). Same shape as {@link SignMessageOptions}.
 * @typedef {SignMessageOptions} SignSolanaOptions
 */

/**
 * Options for importKey (V2).
 *
 * @typedef {KeyVaultAuthBase & ImportedKeyBase & ImportedKeyMaterial} ImportKeyOptions
 */

/**
 * Options for setChainBaseKeys (V2).
 *
 * @typedef {KeyVaultAuthBase & {
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
 * @typedef {KeyVaultClientAuthBase & {
 *   index: number|bigint
 * }} KeyVaultClientSigningBase
 */

/**
 * @typedef {KeyVaultClientSigningBase & { nonce: number|bigint; gasPrice: number|bigint; gasLimit: number|bigint; to: Address; value: number|bigint; txData: Bytes; chainId: number|bigint }} KeyVaultClientSignTransactionOptions
 */

/**
 * @typedef {KeyVaultClientSigningBase & { message: Bytes }} KeyVaultClientSignMessageOptions
 */

/**
 * @typedef {KeyVaultClientSigningBase & { hash: Bytes32 }} KeyVaultClientSignHashOptions
 */

/**
 * Same shape as {@link KeyVaultClientSignMessageOptions} (Solana signing path).
 * @typedef {KeyVaultClientSignMessageOptions} KeyVaultClientSignSolanaOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & ImportedKeyBase & { digest: Bytes32 }} KeyVaultClientSignWithImportedKeyOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & ImportedKeyBase & ImportedKeyMaterial} KeyVaultClientImportKeyOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & {
 *   chain: number;
 *   basePrivateKey: Bytes;
 *   baseChainCode: Bytes;
 * }} KeyVaultClientSetChainBaseKeysOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & { implCall: Bytes }} KeyVaultClientExecuteWithAuthOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & { newImplAddr: Address }} KeyVaultClientUpdateKeyVaultImplOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & ImportedKeyBase} KeyVaultClientDeactivateActivateKeyOptions
 */

/**
 * @typedef {KeyVaultClientAuthBase & {
 *   newAuthenticatorAddr: Address;
 *   newAuthConfig: Bytes;
 * }} KeyVaultClientUpdateAuthenticatorOptions
 */

// ============================================================================
// Update Authenticator Option Types
// ============================================================================

/**
 * New authenticator binding for upgrade flows (address + encoded config bytes).
 *
 * @typedef {Object} UpdateAuthenticatorPayload
 * @property {Address} newAuthenticatorAddr - New authenticator contract address
 * @property {Bytes} newAuthConfig - New authentication configuration (bytes)
 */

/**
 * Shared fields for updating authenticator when the caller supplies {@code walletAddr} instead of {@code keyVaultAddr}.
 *
 * @typedef {Object} UpdateAuthenticatorBase
 * @property {AuthProofInputOptions} authProof - Authentication proof (bytes or structured object)
 * @property {Address} newAuthenticatorAddr - New authenticator contract address
 * @property {Bytes} newAuthConfig - New authentication configuration (bytes)
 */

/**
 * @typedef {KeyVaultAuthBase & UpdateAuthenticatorPayload} UpdateAuthenticatorOptions
 */

/**
 * @typedef {WalletProxyOptions & UpdateAuthenticatorBase} UpdateAuthenticatorWalletOptions
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
 * {@code authConfig} matches {@link EncodedAuthConfigOptions} for built-in encoders.
 * @typedef {Record<string, unknown> & { authConfig: EncodedAuthConfigOptions; authenticatorAddr: Address }} EncodedAuthConfigCallOptions
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
 * @typedef {WalletProxyOptions & { index: number }} WalletProxyIndexOptions
 */

/**
 * Wallet proxy plus contiguous address slice (WalletLogic account reads).
 * @typedef {WalletProxyOptions & { fromIndex: number; count: number }} WalletProxyAccountSliceOptions
 */

/**
 * Authenticated KeyVault implementation upgrade via WalletLogic proxy.
 * {@code authProof} is opaque bytes for the wallet's authenticator (contract validates). Typical layouts:
 * {@link EncodedAuthProofDualFactor}, {@link EncodedAuthProofWalletSignature}, {@link EncodedAuthProofPasswordMinute}, or {@link PasswordAuthenticatorVerifyAuthProof} (raw UTF-8) for password-only flows — match your vault's authenticator.
 * @typedef {WalletProxyOptions & { authProof: Bytes; newImplAddr: Address }} WalletLogicUpdateKeyVaultImplOptions
 */

/**
 * @typedef {{ keyVaultAddr: Address }} KeyVaultAddrOptions
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
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32; guardianAddr: Address }} ConfigureDualFactorOptions
 */

/**
 * @typedef {ConfigurePasswordOptions} ConfigurePasswordMinuteOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { index: number }} KeyVaultAddrIndexOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { fromIndex: number; count: number }} KeyVaultAccountSliceOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & ImportedKeyBase} KeyVaultImportedKeyOptions
 */

/**
 * @typedef {KeyVaultAuthBase & { implCall: Bytes }} ExecuteWithAuthOptions
 */

/**
 * @typedef {KeyVaultAuthBase & { newImplAddr: Address }} UpdateKeyVaultImplOptions
 */

/**
 * @typedef {KeyVaultAuthBase & ImportedKeyBase} DeactivateActivateKeyOptions
 */

/**
 * @typedef {{ newLogicAddr: Address }} UpdateWalletLogicImplOptions
 */

/**
 * @typedef {{ newAdminAddr: Address }} TransferAdminOptions
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
 * @typedef {CreateAuthProofDualFactorOptions & { newPasswordHash: Bytes32 }} UpdatePasswordDualFactorOptions
 */

/**
 * @typedef {CreateAuthProofDualFactorOptions & { newGuardian: Address }} UpdateGuardianOptions
 */

/**
 * currentPassword is raw password bytes (utf8 password bytes)
 * newPasswordHash is the new password hash (bytes32)
 * @typedef {KeyVaultAddrOptions & { currentPassword: Uint8Array; newPasswordHash: Bytes32 }} UpdatePasswordOptions
 */

/**
 * {@code PasswordAuthenticator.verify} — expects raw UTF-8 password bytes ({@link PasswordAuthenticatorVerifyAuthProof}), not ABI-encoded.
 * @typedef {KeyVaultAddrOptions & { authProof: PasswordAuthenticatorVerifyAuthProof }} PasswordAuthenticatorVerifyOptions
 */

/**
 * {@code PasswordMinuteSignatureAuthenticator.verify} — expects {@link EncodedAuthProofPasswordMinute}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofPasswordMinute }} PasswordMinuteSignatureAuthenticatorVerifyOptions
 */

/**
 * {@code WalletSignatureAuthenticator.verify} — expects {@link EncodedAuthProofWalletSignature}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature }} WalletSignatureAuthenticatorVerifyOptions
 */

/**
 * {@code DualFactorAuthenticator.verify} — expects {@link EncodedAuthProofDualFactor}.
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor }} DualFactorAuthenticatorVerifyOptions
 */

/**
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: EncodedPasswordAuthenticatorCreateWalletAuthConfig }} PasswordAuthenticatorConfigureOptions
 */

/**
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: EncodedPasswordMinuteSignatureCreateWalletAuthConfig }} PasswordMinuteSignatureAuthenticatorConfigureOptions
 */

/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedWalletSignatureCreateWalletAuthConfig }} WalletSignatureAuthenticatorConfigureOptions */


/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedDualFactorCreateWalletAuthConfig }} DualFactorAuthenticatorConfigureOptions */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToAdd: Address }} WalletSignatureAddToWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToRemove: Address }} WalletSignatureRemoveFromWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newPasswordHash: Bytes32 }} DualFactorAuthenticatorUpdatePasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newGuardian: Address }} DualFactorAuthenticatorUpdateGuardianOptions
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
