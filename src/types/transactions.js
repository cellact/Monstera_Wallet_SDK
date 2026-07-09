/**
 * Transaction results and executeRead/executeWrite pipeline types.
 *
 * @module types/transactions
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

/** @typedef {BaseTransactionResult & { wallet: Address; initialWhitelist: Address[] }} ConfigurePasswordOrWalletSignatureResult */

/** @typedef {BaseTransactionResult & { wallet: Address; guardian: Address }} ConfigurePasswordDualFactorResult */

/** @typedef {BaseTransactionResult & { wallet: Address }} ConfigureApiKeySessionResult */

/** @typedef {BaseTransactionResult & { wallet: Address }} ConfigureMultiAuthenticatorResult */
/** @typedef {BaseTransactionResult & { wallet: Address; child: Address }} AddMultiAuthenticatorResult */
/** @typedef {BaseTransactionResult & { wallet: Address; child: Address }} RemoveMultiAuthenticatorResult */

/** @typedef {BaseTransactionResult & { wallet: Address }} RotateApiKeyResult */

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

/** @typedef {BaseTransactionResult & { wallet: Address; linkedWallet: Address; nonce: Bytes32 }} AddToWhitelistWithProofResult */

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

