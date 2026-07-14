/**
 * Auth pipeline and Monstera recipe descriptor types.
 *
 * @module types/auth-pipeline
 */

/**
 * Built-in authenticator proof flow identifiers.
 *
 * @typedef {'apiKeySession' | 'password' | 'minuteSignature' | 'walletSignature' | 'dualFactor' | 'passwordOrWalletSignature' | 'multi'} AuthProofFlowId
 */

/**
 * Session merge flags for vault-authenticated and authenticator-managed calls.
 *
 * @typedef {Object} ResolveVaultOptionsFlags
 * @property {boolean} [defaultCurrentPassword=false] - Inject {@code currentPassword} from the session password
 * @property {boolean} [defaultApiKeySecret=false] - Inject {@code apiKeySecret} from the session API key
 */

/**
 * Factory lookups required to resolve a username to on-chain wallet addresses.
 *
 * @typedef {Object} ConnectSessionDeps
 * @property {(options: { username: string }) => Promise<Bytes32>} hashUsername
 * @property {(options: { usernameHash: Bytes32 }) => Promise<Address>} walletOfUsername
 * @property {(options: { walletAddr: Address }) => Promise<Address>} getKeyVaultAddr
 */

/**
 * @typedef {Object} AuthenticatorInvokeOverrides
 * @property {Address} [authenticatorAddr]
 */

/**
 * @typedef {Object} AuthenticatorEncodeConfig
 * @property {ResolveVaultOptionsFlags} [flags]
 * @property {(resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput} [buildAction]
 * @property {AuthProofFlowOptions} [flowOptions]
 * @property {AuthenticatorInvokeOverrides} [overrides]
 */

/**
 * @template T
 * @typedef {AuthenticatorEncodeConfig & {
 *   buildAction: (resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput;
 *   invoke: (ctx: AuthenticatorInvokeContext) => Promise<T>;
 * }} AuthenticatorInvokeConfig
 */

/**
 * @typedef {Record<string, unknown> & {
 *   authProof: Bytes;
 *   authenticatorAddr: Address;
 *   action?: AuthContext | null;
 *   actionHash?: Bytes32;
 *   minuteBucket?: bigint;
 *   derivedAddress?: Address;
 * }} AuthenticatorEncodeResult
 */

/**
 * @typedef {AuthenticatorEncodeResult} AuthenticatorInvokeContext
 */

/**
 * @typedef {Object} ConfigureCallDescriptor
 * @property {ResolveVaultOptionsFlags} [resolveFlags]
 * @property {Address} authenticatorAddr
 * @property {(resolved: Record<string, unknown>) => AuthConfigInputOptions} buildAuthConfigInput
 * @property {(params: { keyVaultAddr: Address; authConfig: Bytes }) => Promise<unknown>} invoke
 */

/**
 * @template T
 * @typedef {Object} VaultAuthenticatedCallDescriptor
 * @property {Record<string, unknown>} [options]
 * @property {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
 * @property {(encoded: EncodeAuthProofOptionsResult) => Promise<T>} invoke
 */

/**
 * @template T
 * @typedef {Object} AuthenticatorManagedCallDescriptor
 * @property {AuthProofFlowId} flowId
 * @property {Record<string, unknown>} [options]
 * @property {ResolveVaultOptionsFlags} [flags]
 * @property {(resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput} buildAction
 * @property {(ctx: AuthenticatorInvokeContext) => Promise<T>} invoke
 * @property {AuthProofFlowOptions} [flowOptions]
 * @property {AuthenticatorInvokeOverrides} [overrides]
 */

/**
 * @typedef {Object} AuthenticatorManagedEncodeDescriptor
 * @property {AuthProofFlowId} flowId
 * @property {Record<string, unknown>} [options]
 * @property {AuthenticatorEncodeConfig} [config]
 */

/**
 * @typedef {Object} ConfigureAuthenticatorCallDescriptor
 * @property {Record<string, unknown>} [options]
 * @property {Address} authenticatorAddr
 * @property {ResolveVaultOptionsFlags} [resolveFlags]
 * @property {(resolved: Record<string, unknown>) => AuthConfigInputOptions} buildAuthConfigInput
 * @property {(params: { keyVaultAddr: Address; authConfig: Bytes }) => Promise<unknown>} invoke
 */
