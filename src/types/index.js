/**
 * Type Definitions for Monstera SDK
 * 
 * Comprehensive JSDoc type definitions for all SDK methods, options, and return types.
 * These types provide better IDE autocomplete, type checking, and documentation.
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
 * @typedef {EthersSigner} WrappedEthersSigner - Sapphire-wrapped Ethers signer (returned by wrapEthersSigner from @oasisprotocol/sapphire-ethers-v6)
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * @typedef {Object} WriteConnectOptions
 * @property {boolean} mainnet - true for mainnet, false for testnet
 * @property {EthersSigner | string} signer - Ethers Signer instance or private key string (0x-prefixed hex)
 * @property {string} [rpcUrl] - Optional custom RPC URL (defaults to network preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides
 * @property {boolean} [checkVersion=true] - Enable automatic version checking (default: true)
 */

/**
 * @typedef {Object} ReadConnectOptions
 * @property {boolean} mainnet - true for mainnet, false for testnet
 * @property {EthersProvider} [provider] - Optional ethers Provider instance
 * @property {string} [rpcUrl] - Optional custom RPC URL (defaults to network preset)
 * @property {Partial<ContractAddresses>} [addresses] - Optional contract address overrides
 * @property {boolean} [checkVersion=true] - Enable automatic version checking (default: true)
 */

/**
 * @typedef {Object} ContractAddresses
 * @property {Address} factory - WalletFactory contract address
 * @property {Address} passwordAuth - PasswordAuthenticator contract address
 * @property {Address} walletSignatureAuth - WalletSignatureAuthenticator contract address
 */

/**
 * @typedef {Object} DefaultContractAddresses
 * @property {Partial<ContractAddresses>} testnet - Testnet contract addresses
 * @property {Partial<ContractAddresses>} mainnet - Mainnet contract addresses (may have null values)
 */

/**
 * @typedef {Object} NetworkConfig
 * @property {string} network - Network name ('sapphire-testnet' or 'sapphire-mainnet')
 * @property {number} chainId - Chain ID
 * @property {string} rpcUrl - RPC URL
 * @property {string} explorerUrl - Block explorer URL
 * @property {ContractAddresses} addresses - Contract addresses for the network
 */

/**
 * Extended configuration for Monstera SDK instance.
 * Extends NetworkConfig with optional signer, provider, and version check settings.
 * 
 * @typedef {NetworkConfig & {
 *   signer?: EthersSigner | string;
 *   provider?: EthersProvider;
 *   checkVersion?: boolean;
 * }} MonsteraConfigOptions
 */

/**
 * Network preset configuration for a single network
 * @typedef {Object} NetworkPreset
 * @property {string} name - Network name ('sapphire-testnet' or 'sapphire-mainnet')
 * @property {number} chainId - Chain ID
 * @property {string} rpcUrl - RPC URL
 * @property {string} explorerUrl - Block explorer URL
 */

/**
 * Network presets for testnet and mainnet
 * @typedef {Object} NetworkPresets
 * @property {NetworkPreset} testnet - Testnet network configuration
 * @property {NetworkPreset} mainnet - Mainnet network configuration
 */


// ============================================================================
// Transaction Result Types
// ============================================================================

/**
 * Base transaction result type returned by executeWrite.
 * 
 * All write operations return at minimum these 4 fields.
 * Specific result types extend this with additional fields from:
 * - Parsed events (e.g., wallet, keyVault, added, removed)
 * - Extra data (e.g., mnemonic, newAdmin, implementation)
 * 
 * @typedef {Object} TransactionResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 */

/**
 * Extends TransactionResult with additional fields from parsed events and extraData.
 * @typedef {Object} WalletCreationResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {Address} wallet - Wallet proxy address (from parsed event)
 * @property {Address} keyVault - KeyVault contract address (from parsed event)
 * @property {Address} storage - WalletStorage contract address (from parsed event)
 * @property {Address} authenticator - Authenticator contract address (from parsed event)
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Mnemonic} mnemonic - Generated mnemonic phrase (BIP39) from extraData - save securely!
 */

/**
 * Extends TransactionResult. No additional fields.
 * @typedef {Object} InitializeResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} ConfigurePasswordResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} wallet - Wallet address (from parsed event)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} ConfigureWalletSignatureResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} wallet - Wallet address (from parsed event)
 * @property {Address[]} initialWhitelist - Array of addresses that were added to the whitelist (from parsed event)
 */

/**
 * Extends TransactionResult with optional additional fields.
 * @typedef {Object} UpdateResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} [newAdmin] - New admin address (for transferAdmin)
 * @property {Address} [implementation] - New implementation address (for upgrades)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} UpdatePasswordResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} [walletAddr] - Wallet address (from parsed event, is keyVaultAddr)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} UpdateWalletLogicImplAddrResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} oldImpl - Old implementation address (from parsed event)
 * @property {Address} newImpl - New implementation address (from parsed event)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} UpdateKeyVaultImplAddrResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} oldImpl - Old implementation address (from parsed event)
 * @property {Address} newImpl - New implementation address (from parsed event)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} UpdateAuthenticatorAddrResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} oldAuth - Old authenticator address (from parsed event)
 * @property {Address} newAuth - New authenticator address (from parsed event)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} AddToWhitelistResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} wallet - Wallet address (from parsed event)
 * @property {Address} added - Address that was added to whitelist (from parsed event)
 */

/**
 * Extends TransactionResult with additional fields from parsed events.
 * @typedef {Object} RemoveFromWhitelistResult
 * @property {boolean} success - Whether the transaction succeeded
 * @property {TransactionHash} transactionHash - Transaction hash
 * @property {number} blockNumber - Block number where transaction was mined
 * @property {string} gasUsed - Gas used (as string)
 * @property {Address} wallet - Wallet address (from parsed event)
 * @property {Address} removed - Address that was removed from whitelist (from parsed event)
 */

// ============================================================================
// Write Wrapper Option Types
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
 * Complete options for BaseContractClient.executeWrite() (caller-facing).
 * All parameters are provided in a single options object.
 * 
 * Additional properties beyond the listed ones (e.g., keyVaultAddr, walletAddress) 
 * are automatically included in error context for better debugging.
 * 
 * @typedef {Object} ExecuteWriteInputOptions
 * @property {() => Promise<any>} operation - Async function that returns a transaction
 * @property {string} methodName - Name of the method for error context
 * @property {Array<ParseEventOptions>} [parseEvents] - Array of event definitions to parse
 * @property {boolean} [requireEvents=true] - Whether to throw if events are not found
 * @property {Record<string, unknown>} [extraData] - Additional data to include in result
 */

/**
 * @typedef {Object} ParseEventOptions
 * @property {Record<string, unknown>} eventDef - Event definition object (with eventName and fieldMapping)
 * @property {import('ethers').Contract} contract - Contract instance to parse events from
 */

// ============================================================================
// Read Wrapper Option Types
// ============================================================================

/**
 * Complete options for BaseContractClient.executeRead() (caller-facing).
 * All parameters are provided in a single options object.
 * 
 * Additional properties beyond the listed ones (e.g., keyVaultAddr, walletAddress) 
 * are automatically included in error context for better debugging.
 * 
 * @typedef {Object} ExecuteReadInputOptions
 * @property {() => Promise<any>} operation - Async function that returns a transaction
 * @property {string} methodName - Name of the method for error context
 */

// ============================================================================
// Wallet Creation Option Types
// ============================================================================

/**
 * @typedef {Object} CreateWalletWithHookOptions
 * @property {Bytes} authConfig - Configuration data for the authenticator (bytes)
 * @property {Address} hookAddr - Hook contract address
 * @property {Bytes} hookData - Data for the hook (bytes)
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
 */

/**
 * @typedef {Object} CreateWalletWithCustomLogicOptions
 * @property {Bytes} authConfig - Configuration data for the authenticator (bytes)
 * @property {Address} customLogicImplAddr - Custom logic implementation contract address
 * @property {Bytes} logicData - Initialization data for custom logic (bytes)
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
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
// Signing Option Types
// ============================================================================

/**
 * @typedef {Object} SignTransactionOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|BigInt} index - Account index
 * @property {number|BigInt} nonce - Transaction nonce
 * @property {number|BigInt} gasPrice - Gas price
 * @property {number|BigInt} gasLimit - Gas limit
 * @property {Address} to - Recipient address
 * @property {number|BigInt} value - Transaction value (in wei)
 * @property {Bytes} txData - Transaction data (bytes)
 * @property {number|BigInt} chainId - Chain ID
 */

/**
 * @typedef {Object} SignMessageOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|BigInt} index - Account index (uint32)
 * @property {Bytes} message - Message to sign (bytes)
 */

/**
 * @typedef {Object} SignHashOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|BigInt} index - Account index (uint32)
 * @property {Bytes32} hash - Hash to sign (bytes32)
 */

/**
 * @typedef {Object} SignTransactionWalletOptions
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|BigInt} index - Account index
 * @property {number|BigInt} nonce - Transaction nonce
 * @property {number|BigInt} gasPrice - Gas price
 * @property {number|BigInt} gasLimit - Gas limit
 * @property {Address} to - Recipient address
 * @property {number|BigInt} value - Transaction value (in wei)
 * @property {Bytes} data - Transaction data (bytes)
 * @property {number|BigInt} chainId - Chain ID
 */

/**
 * @typedef {Object} SignMessageWalletOptions
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|BigInt} index - Account index (uint32)
 * @property {Bytes} message - Message to sign (bytes)
 */

/**
 * @typedef {Object} SignHashWalletOptions
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {number|BigInt} index - Account index (uint32)
 * @property {Bytes32} hash - Hash to sign (bytes32)
 */

// ============================================================================
// Update Option Types
// ============================================================================

/**
 * @typedef {Object} UpdateAuthenticatorOptions
 * @property {Address} keyVaultAddr - KeyVault contract address
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {Address} newAuthenticatorAddr - New authenticator contract address
 * @property {Bytes} newAuthConfig - New authentication configuration (bytes)
 */

/**
 * @typedef {Object} UpdateAuthenticatorWalletOptions
 * @property {Address} walletAddr - Wallet proxy address (from createWallet)
 * @property {Bytes} authProof - Authentication proof (bytes)
 * @property {Address} newAuthenticatorAddr - New authenticator contract address
 * @property {Bytes} newAuthConfig - New authentication configuration (bytes)
 */

// ============================================================================
// Auth Proof Option Types
// ============================================================================

/**
 * @typedef {Object} CreateAuthProofOptions
 * @property {import('ethers').Wallet | import('ethers').HDNodeWallet} signer - Signer (Wallet or HDNodeWallet) trying to authenticate
 * @property {Address} keyVaultAddr - KeyVault address of the wallet trying to authenticate
 * @property {Address} [authenticatorAddr] - Wallet signature authenticator contract address (optional, defaults to the one in the config)
 * @property {number} [deadline] - Deadline for the auth proof (optional, defaults to 1h from now, Unix timestamp)
 * @property {number} [chainId] - Chain ID (optional, defaults to the one in the config)
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
 * Union type for authenticator client instances
 * @typedef {import('../clients/auth/PasswordAuthenticatorClient.js').default | import('../clients/auth/WalletSignatureAuthenticatorClient.js').default} AuthenticatorClientInstance
 */

// ============================================================================
// Utility Types
// ============================================================================

/**
 * @typedef {String} Bytes - Hex string representing bytes
 * @typedef {String} Bytes32 - Hex string representing 32 bytes
 * @typedef {String} Address - Ethereum address (0x-prefixed hex string, 42 characters)
 * @typedef {String} TransactionHash - Transaction hash (0x-prefixed hex string, 66 characters)
 * @typedef {String} Mnemonic - BIP39 mnemonic phrase (12 or 24 words)
 */

// Export empty object to make this a valid ES module
export {};
