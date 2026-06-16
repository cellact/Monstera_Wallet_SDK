/**
 * Type Definitions for Monstera SDK
 *
 * Central JSDoc types: base types are defined once and extended via intersection
 * to avoid repetition and keep the file maintainable.
 *
 * Sections (match `// ==========` banners in order):
 * Foundation (basic → SDK plumbing):
 *  1. Utility Types
 *  2. Ethers.js Type Aliases
 *  3. Contract & Network Base Types
 *  4. Connect Options
 *  5. Monstera Constructor Config
 *  6. Transaction Result Types
 *  7. ExecuteWrite / ExecuteRead / ParseEvent
 * Auth config at create-wallet (structured inputs → encoded bytes → helpers that call encoders):
 *  8. Auth Config — Structured Inputs
 *  9. Auth Config — Encoded Types, Encoder & Context
 * 10. Wallet Creation & Factory Client Options
 * 11. Encode Auth Config Options
 * Post-create wallet wiring, then auth proof end-to-end (inputs → encode pipeline → wire bytes → call bundles):
 * 12. Initialization
 * 13. Auth Proof — Structured Inputs
 * 14. Auth Proof — Encode Contexts & Encoder Registry
 * 15. Auth Proof — Encoded / On-Wire Payloads
 * 16. Auth Proof — Call Bundles & Signing Options
 * 17. Create Auth Proof (builders & internal variants)
 * 18. Encode Auth Proof Options
 * KeyVault layers & facade:
 * 19. KeyVault V2 — Imported Keys & Multi-Chain
 * 20. KeyVaultClient Options (encoded proofs only)
 * 21. Update Authenticator Options
 * 22. Monstera Facade Option Types
 * 23. Version Check Types
 * 24. Client Type Aliases
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
 * @typedef {import('ethers').Interface} EthersInterface - Ethers.js ABI Interface (decode errors, encode calls)
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
 * @property {ChainId} [chainId] - Optional Sapphire chain id (defaults to network preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides
 */

/**
 * Input for internal `buildNetworkConfig` (`src/config/networks.js`): preset key plus optional RPC, chain id, and address overrides.
 * Distinct from {@link BaseConnectNetworkOptions}, which uses `mainnet: boolean` rather than `network`.
 * @typedef {Object} BuildNetworkConfigInput
 * @property {'testnet'|'mainnet'} network - Preset key (`testnet` or `mainnet`)
 * @property {string} [rpcUrl] - Optional RPC URL (defaults to preset)
 * @property {ChainId} [chainId] - Optional chain id (defaults to preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides merged with defaults
 */

/**
 * Options shared by write and read connect flows.
 * @typedef {BaseConnectNetworkOptions & SdkLoggingAndVersionOptions} BaseConnectOptions
 */

/**
 * Username/password pair for {@link Monstera.connect}. When provided, the SDK resolves and caches
 * the registered wallet's KeyVault address and can default {@code authProof} / {@code currentPassword}
 * on vault-scoped calls so callers omit {@code keyVaultAddr}.
 *
 * @typedef {Object} ConnectCredentials
 * @property {string} username - Registered username (factory-normalised before hashing)
 * @property {string} password - UTF-8 password for PasswordAuthenticator proofs
 */

/**
 * @typedef {BaseConnectOptions & {
 *   signer?: EthersSigner | string;
 *   provider?: EthersProvider;
 *   credentials?: ConnectCredentials;
 * }} ConnectOptions
 * @property {EthersSigner | string} [signer] - Ethers Signer instance or private key string (0x-prefixed hex); optional for read-only connections
 * @property {EthersProvider} [provider] - Optional ethers Provider instance
 * @property {ConnectCredentials} [credentials] - Optional username/password session; resolves and caches KeyVault for subsequent calls
 */

// ============================================================================
// Monstera Constructor Config
// ============================================================================

/**
 * Optional signer, provider, credentials, and logging/version overrides when constructing Monstera with a resolved NetworkConfig.
 * @typedef {SdkLoggingAndVersionOptions & {
 *   signer?: EthersSigner | string;
 *   provider?: EthersProvider;
 *   credentials?: ConnectCredentials;
 * }} MonsteraConfigExtension
 */

/**
 * Full config for Monstera SDK constructor. Extends NetworkConfig with optional signer, provider, and version check.
 * @typedef {NetworkConfig & MonsteraConfigExtension} MonsteraConfigOptions
 */

// ============================================================================
// Transaction Result Types
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

/**
 * Result of factory {@code createWallet*} methods ({@link WalletCreationResult} fields come from {@code WalletCreated}).
 *
 * For {@code createWalletCore} only, {@code wallet} and {@code keyVault} are the same address (KeyVault-only deployment).
 *
 * {@code mnemonic} is included so callers can back up the phrase (generated or echoed from input). It stays in memory until the write
 * completes and while the result is held; treat as a secret and avoid logging.
 *
 * @typedef {BaseTransactionResult & { wallet: Address; keyVault: Address; storage: Address; authenticator: Address; mnemonic: Mnemonic }} WalletCreationResult
 */

/**
 * Result of factory username {@code createWallet*} methods. Extends {@link WalletCreationResult} with
 * {@code usernameHash} from the {@code UsernameRegistered} event.
 *
 * @typedef {WalletCreationResult & { usernameHash: Bytes32 }} UsernameWalletCreationResult
 */

/** @typedef {BaseTransactionResult & { wallet: Address }} ConfigurePasswordResult */

/** @typedef {BaseTransactionResult & { wallet: Address; initialWhitelist: Address[] }} ConfigureWalletSignatureResult */

/** @typedef {BaseTransactionResult & { wallet: Address; guardian: Address }} ConfigurePasswordDualFactorResult */

/** @typedef {BaseTransactionResult & { newAdmin?: Address; implementation?: Address }} UpdateResult */

/** @typedef {BaseTransactionResult & { newAdmin?: Address; factoryAddress?: Address }} TransferAdminResult */

/** @typedef {BaseTransactionResult & { wallet?: Address }} UpdatePasswordResult */

/**
 * Shared shape for admin updates that swap a proxy implementation (WalletLogic or KeyVault).
 * @typedef {BaseTransactionResult & { oldImpl: Address; newImpl: Address }} UpdateProxyImplementationResult
 */

/** @typedef {UpdateProxyImplementationResult} UpdateWalletLogicImplAddrResult */

/** @typedef {UpdateProxyImplementationResult} UpdateKeyVaultImplAddrResult */

/** @typedef {UpdateKeyVaultImplAddrResult & { customAckHash: Bytes32 }} UpdateKeyVaultImplAddrCustomResult */

/** @typedef {BaseTransactionResult & { oldAuth: Address; newAuth: Address }} UpdateAuthenticatorAddrResult */

/** @typedef {UpdateAuthenticatorAddrResult & { customAckHash: Bytes32 }} UpdateAuthenticatorAddrCustomResult */

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
// ExecuteWrite / ExecuteRead / ParseEvent
// ============================================================================

/**
 * @typedef {Object} ExecuteWriteOptions
 * @property {WrappedEthersSigner} writeSigner - The write signer (must be Sapphire-wrapped)
 * @property {EthersProvider|null} [readProvider] - Provider for replaying failed txs via {@code eth_call} to recover revert data (ethers v6 omits it on {@code tx.wait()} failures)
 * @property {EthersInterface|null} [revertInterface] - ABI interface used to decode custom Solidity errors from revert data
 * @property {Array<ParseEventOptions>} [parseEvents] - Array of event definitions to parse
 * @property {boolean} [requireEvents=true] - When {@code true} (default), throws if a parsed event from {@code parseEvents} is missing from the receipt.
 *   When {@code false}, absence of those events does not fail the write — use only when the transaction is not expected to emit them.
 *   Invalid {@code eventDef}, ABI decode failures, or mapping errors after a matching log still throw; {@code requireEvents} only controls missing-event handling.
 * @property {Record<string, unknown>} [extraData] - Additional data to include in result (spread into result). Stripped before
 *   error-context building so secrets here are not merged into {@code sdkContext} by default; nested sensitive keys inside
 *   {@code extraData} are still redacted when {@code extraData} is passed through the sanitizer.
 * @property {string} [methodName] - Method name for error context
 * @property {string} [rpcUrl] - RPC URL for error context
 * @property {Record<string, unknown>} [sdkContext] - Pre-built safe context from buildErrorContext (merged into thrown WalletError)
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
 *   revertInterface?: EthersInterface|null;
 * }} ExecuteWriteInputOptions
 *
 * @remarks {@link ExecuteWriteOptions} documents {@code requireEvents}: {@code false} means missing parsed events do not throw;
 * parsing errors still propagate.
 */

/**
 * Complete options for BaseContractClient.executeRead(). Additional properties are included in error context.
 *
 * @typedef {ExecuteInputOptionsBase & {
 *   revertInterface?: EthersInterface|null;
 * }} ExecuteReadInputOptions
 */

/**
 * @typedef {Object} ParseEventOptions
 * @property {Record<string, unknown>} eventDef - Event definition (eventName and fieldMapping)
 * @property {EthersContract} contract - Contract instance to parse events from
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
 * Plain object {@code authConfig} for built-in authenticators at wallet creation (before ABI encoding).
 *
 * Union of four logical variants: password (PasswordAuthenticator), wallet-signature whitelist, dual-factor,
 * and password-minute-signature. TypeScript may show only three members in hovers because
 * {@link PasswordAuthConfigInputOptions} and {@link PasswordMinuteSignatureAuthConfigInputOptions} share the
 * same underlying shape ({@link PasswordAuthConfigInputOptions}); runtime still dispatches by
 * {@code authenticatorAddr}.
 *
 * @typedef {(
 *   | PasswordAuthConfigInputOptions
 *   | PasswordMinuteSignatureAuthConfigInputOptions
 *   | WalletSignatureAuthConfigInputOptions
 *   | DualFactorAuthConfigInputOptions
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
 * ABI-encoded WalletSignatureAuthenticator whitelist ({@code abi.encode(address[])}).
 * @see {@link module:internal/crypto/authConfig.js} {@code createWalletSigAuthConfig}
 * @typedef {Bytes} EncodedAuthConfigWalletSignature
 */

/**
 * Password-hash-only authenticator config for PasswordAuthenticator at creation (contract expects bytes32).
 * @see {@link module:internal/auth/config/encoders/password.js} {@code passwordAuthCreateWalletEncoder}
 * @typedef {Bytes32} EncodedAuthConfigPassword
 */

/**
 * Alias of {@link EncodedAuthConfigPassword} for PasswordMinuteSignatureAuthenticator create-wallet encoding (same bytes32 on-chain).
 * @see {@link module:internal/auth/config/encoders/passwordMinuteSignature.js} {@code passwordMinuteSignatureAuthCreateWalletEncoder}
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
 * Allowed {@code authProof} input for KeyVault authenticated calls: raw bytes, UTF-8 password buffer, or a built-in structured proof object.
 * @typedef {(
 *   | PasswordAuthProofInputOptions
 *   | WalletSignatureAuthProofInputOptions
 *   | DualFactorAuthProofInputOptions
 *   | PasswordMinuteSignatureAuthProofInputOptions
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
 * One entry in {@link createAuthProofEncoderRegistry} (async encoder for a fixed built-in authenticator).
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
 * Result of minute-signature auth proof creation ({@code internal/crypto/authProof.js}, {@code createAuthProofMinuteSignature}).
 *
 * @typedef {Object} CreateAuthProofMinuteSignatureResult
 * @property {EncodedAuthProofPasswordMinute} authProof - ABI-encoded signature for {@code PasswordMinuteSignatureAuthenticator.verify}
 * @property {number} minuteBucket - Unix timestamp floored to minute bucket used for signing
 * @property {Address} derivedAddress - Ephemeral signer address derived from password hash and minute bucket
 */

/**
 * Union of all **created / on-wire** {@code authProof} payloads for direct contract clients (e.g. {@link KeyVaultClient}).
 * Does not include structured {@link AuthProofInputOptions}; use that in {@link Monstera} (with {@link AuthProofBuilder.prototype.encode}) before calling the client.
 * @typedef {(
 *   | EncodedAuthProofPassword
 *   | EncodedAuthProofWalletSignature
 *   | EncodedAuthProofDualFactor
 *   | EncodedAuthProofPasswordMinute
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
 * @property {AuthProofInputOptions} [authProof] - Authentication proof (bytes or structured object); defaults to session password when omitted
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
 * @property {ChainId} [chainId] - Chain ID (optional, defaults to config)
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
 * KeyVault-style call options before/after {@link AuthProofBuilder.prototype.encode}. When {@code authProof} is a plain object, {@code keyVaultAddr} is required.
 * @typedef {Record<string, unknown> & {
 *   authProof?: AuthProofInputOptions;
 *   keyVaultAddr?: Address;
 * }} EncodeAuthProofInputOptions
 */

/**
 * Result of {@link AuthProofBuilder.prototype.encode}: same fields as input with {@code authProof} as hex {@link Bytes} or {@link Uint8Array}.
 * @typedef {Record<string, unknown> & { authProof: Bytes|Uint8Array }} EncodeAuthProofOptionsResult
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

// ============================================================================
// Monstera facade: small option objects (thin delegation to clients)
// ============================================================================
//
// Grouped below: proxies & addresses → configure / iteration → KeyVault ops →
// proof-building flows → thin authenticator client option objects.

// --- Proxies & address bundles ---

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
 * {@link EncodedAuthProofDualFactor}, {@link EncodedAuthProofWalletSignature}, {@link EncodedAuthProofPasswordMinute}, or {@link EncodedAuthProofPassword} — match your vault's authenticator.
 * @typedef {WalletProxyOptions & { authProof: Bytes; newImplAddr: Address }} WalletLogicUpdateKeyVaultImplOptions
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

/**
 * @typedef {{ newLogicAddr: Address }} UpdateWalletLogicImplOptions
 */

/**
 * @typedef {{ newAdminAddr: Address }} TransferAdminOptions
 */

/**
 * @typedef {{ authenticatorAddr: Address }} FactoryAllowedAuthenticatorsOptions
 */

/**
 * @typedef {{ implementationAddr: Address }} FactoryAllowedKeyVaultImplementationsOptions
 */

/**
 * Factory policy-registry view: whether {@code implementationAddr} is approved for {@code keyVaultAddr}.
 * @typedef {KeyVaultAddrOptions & { implementationAddr: Address }} FactoryIsImplementationApprovedOptions
 */

/**
 * Factory policy-registry view: whether {@code authenticatorAddr} is approved for {@code keyVaultAddr}.
 * @typedef {KeyVaultAddrOptions & { authenticatorAddr: Address }} FactoryIsAuthenticatorApprovedOptions
 */

/**
 * @typedef {{ authenticatorAddr: Address; allowed: boolean }} SetAuthenticatorAllowedOptions
 */

/**
 * @typedef {{ implementationAddr: Address; allowed: boolean }} SetKeyVaultImplementationAllowedOptions
 */

/**
 * @typedef {{ walletOrKeyVaultAddr: Address; authenticatorAddr: Address; allowed: boolean }} SetWalletAuthenticatorAllowedOptions
 */

/**
 * @typedef {{ walletOrKeyVaultAddr: Address; implementationAddr: Address; allowed: boolean }} SetWalletImplementationAllowedOptions
 */

/** @typedef {BaseTransactionResult & { authenticatorAddr: Address; allowed: boolean }} SetAuthenticatorAllowedResult */

/** @typedef {BaseTransactionResult & { implementationAddr: Address; allowed: boolean }} SetKeyVaultImplementationAllowedResult */

/** @typedef {BaseTransactionResult & { keyVault: Address; authenticatorAddr: Address; allowed: boolean }} SetWalletAuthenticatorAllowedResult */

/** @typedef {BaseTransactionResult & { keyVault: Address; implementationAddr: Address; allowed: boolean }} SetWalletImplementationAllowedResult */

// --- Flows composed with CreateAuthProof* ---

/**
 * Inputs for password proof flows after {@link withPasswordProofDefaults}.
 *
 * @typedef {KeyVaultAddrOptions & {
 *   password: Uint8Array;
 *   action?: AuthActionInput;
 *   actionHash?: Bytes32;
 *   chainId?: ChainId;
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
 * @typedef {CreateAuthProofDualFactorOptions & { newPasswordHash: Bytes32 }} UpdatePasswordDualFactorOptions
 */

/**
 * @typedef {CreateAuthProofDualFactorOptions & { newGuardian: Address }} UpdateGuardianOptions
 */

/**
 * currentPassword is raw password bytes (utf8 password bytes)
 * newPasswordHash is the new password hash (bytes32)
 * @typedef {KeyVaultAddrOptions & { currentPassword: Uint8Array; newPasswordHash: Bytes32; chainId?: ChainId; authenticatorAddr?: Address }} UpdatePasswordOptions
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
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigPassword }} PasswordClientConfigureOptions
 */

/**
 * {@code IAuthenticator.configure} with fixed 32-byte {@code authConfig} (password hash authenticators).
 * @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigPasswordMinuteSignature }} PasswordMinuteClientConfigureOptions
 */

/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigWalletSignature }} WalletSignatureClientConfigureOptions */


/** @typedef {KeyVaultAddrOptions & { authConfig: EncodedAuthConfigDualFactor }} DualFactorClientConfigureOptions */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToAdd: Address }} WalletSignatureClientAddToWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofWalletSignature; addressToRemove: Address }} WalletSignatureClientRemoveFromWhitelistOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newPasswordHash: Bytes32 }} DualFactorClientUpdatePasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authProof: EncodedAuthProofDualFactor; newGuardian: Address }} DualFactorClientUpdateGuardianOptions
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
