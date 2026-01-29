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
 */

/**
 * @typedef {Object} DefaultContractAddresses
 * @property {Partial<ContractAddresses>} testnet - Testnet contract addresses
 * @property {Partial<ContractAddresses>} mainnet - Mainnet contract addresses (may have null values)
 */

/**
 * Base network fields shared by preset and full config.
 * @typedef {Object} NetworkBase
 * @property {number | string} chainId - Chain ID (number or string)
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
 * Options shared by write and read connect flows.
 * @typedef {Object} BaseConnectOptions
 * @property {boolean} mainnet - true for mainnet, false for testnet
 * @property {string} [rpcUrl] - Optional custom RPC URL (defaults to network preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides
 * @property {boolean} [checkVersion=true] - Enable automatic version checking (default: true)
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
 * Optional overrides when constructing Monstera with a resolved NetworkConfig.
 * @typedef {Object} MonsteraConfigExtension
 * @property {EthersSigner | string} [signer] - Ethers Signer or private key (0x-prefixed hex)
 * @property {EthersProvider} [provider] - Ethers Provider instance
 * @property {boolean} [checkVersion=true] - Enable automatic version checking (default: true)
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

/** @typedef {TransactionResult & { oldImpl: Address; newImpl: Address }} UpdateWalletLogicImplAddrResult */

/** @typedef {TransactionResult & { oldImpl: Address; newImpl: Address }} UpdateKeyVaultImplAddrResult */

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
 * Options shared by createWalletWithHook and createWalletWithCustomLogic.
 * @typedef {Object} CreateWalletBaseOptions
 * @property {Bytes} authConfig - Configuration data for the authenticator (bytes)
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
 * Base for signing options that target a KeyVault by address.
 * @typedef {Object} KeyVaultSigningBase
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|bigint} index - Account index (uint32)
 */

/**
 * Base for signing options that target a wallet proxy (from createWallet).
 * @typedef {Object} WalletSigningBase
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {Bytes} authProof - Authentication proof (bytes)
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
 * @property {Bytes} authProof - Authentication proof
 * @property {Bytes32} keyId - Imported key ID
 * @property {Bytes32} digest - 32-byte hash to sign
 */

/**
 * Options for signSolana (V2). Same shape as SignMessageOptions (keyVault + auth + index + message).
 * @typedef {KeyVaultSigningBase & { message: Bytes }} SignSolanaOptions
 */

/**
 * Options for importKey (V2).
 * @typedef {Object} ImportKeyOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Bytes} authProof - Authentication proof
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
 * @property {Bytes} authProof - Authentication proof
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
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {Address} newAuthenticatorAddr - New authenticator contract address
 * @property {Bytes} newAuthConfig - New authentication configuration (bytes)
 */

/**
 * @typedef {UpdateAuthenticatorBase & { keyVaultAddr: Address }} UpdateAuthenticatorOptions
 */

/**
 * @typedef {UpdateAuthenticatorBase & { walletAddr: Address }} UpdateAuthenticatorWalletOptions
 */

// ============================================================================
// Auth Proof Option Types
// ============================================================================

/**
 * @typedef {Object} CreateAuthProofOptions
 * @property {EthersWallet | EthersHDNodeWallet} signer - Signer (Wallet or HDNodeWallet) used to sign the auth proof
 * @property {Address} keyVaultAddr - KeyVault address of the wallet to authenticate
 * @property {Address} [authenticatorAddr] - Wallet signature authenticator address (optional, defaults to config)
 * @property {number} [deadline] - Deadline for the auth proof (optional, Unix timestamp, default 1h from now)
 * @property {number | string} [chainId] - Chain ID (optional, defaults to config)
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
 * @typedef {import('../clients/auth/PasswordAuthenticatorClient.js').default | import('../clients/auth/WalletSignatureAuthenticatorClient.js').default | import('../clients/auth/DualFactorAuthenticatorClient.js').default} AuthenticatorClientInstance
 */

// Export empty object to make this a valid ES module
export {};
