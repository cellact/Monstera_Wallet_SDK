/**
 * Foundation types: primitives, ethers aliases, network config, and connect options.
 *
 * @module types/connect
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
 * @property {Address} apiKeySessionAuth - ApiKeySessionAuthenticator contract address
 * @property {Address} multiAuthenticator - MultiAuthenticator contract address
 * @property {Address} passwordOrWalletSigAuth - PasswordOrWalletSignatureAuthenticator contract address
 */

/**
 * Keys of {@link ContractAddresses} that must be present after configuration is resolved.
 * @typedef {'factory'|'passwordAuth'|'walletSignatureAuth'|'dualFactorAuth'|'passwordMinuteSignatureAuth'|'apiKeySessionAuth'|'multiAuthenticator'|'passwordOrWalletSigAuth'} RequiredContractAddressKey
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
 * Username/password pair for end-user connect paths.
 *
 * @typedef {Object} ConnectCredentials
 * @property {string} username - Registered username (factory-normalised before hashing)
 * @property {string} [password] - UTF-8 password for PasswordAuthenticator proofs
 * @property {Bytes32} [apiKey] - Raw 32-byte API key ({@code credentials.apiKey}); session exposes {@code apiKeySecret = keccak256(apiKey)}
 */

/**
 * @typedef {BaseConnectOptions & {
 *   signer?: EthersSigner | string;
 *   provider?: EthersProvider;
 *   credentials?: ConnectCredentials;
 * }} ConnectOptions
 * @property {EthersSigner | string} [signer] - Optional admin private key or ethers Signer for on-chain writes
 * @property {EthersProvider} [provider] - Optional ethers Provider instance
 * @property {ConnectCredentials} [credentials] - Optional username/password; resolves vault from factory username
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

