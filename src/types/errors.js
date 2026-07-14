/**
 * Error pipeline context and translator types.
 *
 * @module types/errors
 */

/**
 * Context object passed to every translator describing the call site.
 *
 * @typedef {Object} ErrorTranslationContext
 * @property {string} [methodName] - Public method on the originating client (e.g. {@code "createWallet"})
 * @property {string | null} [rpcUrl] - RPC URL associated with the call (used by network translator)
 * @property {EthersInterface | null} [revertInterface] - Contract interface used by the revert translator to decode custom errors
 * @property {Record<string, unknown>} [sdkContext] - Free-form context merged onto the produced {@link WalletError}
 * @property {TransactionReceipt | null | undefined} [receipt] - Transaction receipt for write flows
 * @property {string | null} [transactionHash] - Transaction hash for write flows
 * @property {string | null} [revertData] - Pre-extracted revert data for the revert translator
 * @property {string | null} [revertReason] - Pre-extracted human-readable revert reason
 * @property {unknown} [revertArgs] - Pre-decoded custom error arguments
 * @property {string | null} [revertSignature] - Pre-decoded custom error signature
 * @property {string} [authProofType] - When set, signing translator engages and network translator defers
 * @property {string} [functionName] - Caller id used by the signing translator
 * @property {Record<string, unknown>} [validationExtra] - Extra context for {@link ValidationError}-shaped failures
 */

/**
 * Shape of a translator function in the pipeline.
 *
 * @typedef {(error: unknown, context: ErrorTranslationContext) => WalletError | null} ErrorTranslator
 */
