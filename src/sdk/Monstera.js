/**
 * Monstera Wallet SDK — top-level facade ({@link Monstera}).
 *
 * Public entry point that wires the read provider and Sapphire-wrapped write signer to the
 * four domain clients ({@link WalletFactoryClient}, {@link WalletLogicClient}, {@link KeyVaultClient},
 * {@link AuthenticatorClient}) and offers high-level helpers that accept structured options.
 *
 * Most methods on this class delegate to one of the underlying clients after running the
 * structured input through {@link AuthConfigBuilder} (create-wallet `authConfig`) or
 * {@link AuthProofBuilder} (KeyVault `authProof`); contract calls then go through
 * {@link BaseContractClient.executeRead} / {@link BaseContractClient.executeWrite}, so any error
 * surfaced on this class is a {@link WalletError} subclass produced by `sdkErrorPipeline`.
 *
 * @typedef {import('../types/index.js').DefaultContractAddresses} DefaultContractAddresses
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').NetworkPresets} NetworkPresets
 * @typedef {import('../types/index.js').InitializeOptions} InitializeOptions
 * @typedef {import('../types/index.js').InitializeExplicitOptions} InitializeExplicitOptions
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ConfigurePasswordResult} ConfigurePasswordResult
 * @typedef {import('../types/index.js').ConfigureWalletSignatureResult} ConfigureWalletSignatureResult
 * @typedef {import('../types/index.js').WalletCreationResult} WalletCreationResult
 * @typedef {import('../types/index.js').CreateWalletWithHookOptions} CreateWalletWithHookOptions
 * @typedef {import('../types/index.js').CreateWalletWithCustomLogicOptions} CreateWalletWithCustomLogicOptions
 * @typedef {import('../types/index.js').CreateWalletForUsernameOptions} CreateWalletForUsernameOptions
 * @typedef {import('../types/index.js').CreateWalletForUsernameFromMnemonicOptions} CreateWalletForUsernameFromMnemonicOptions
 * @typedef {import('../types/index.js').CreateWalletForUsernameHashOptions} CreateWalletForUsernameHashOptions
 * @typedef {import('../types/index.js').CreateWalletForUsernameHashFromMnemonicOptions} CreateWalletForUsernameHashFromMnemonicOptions
 * @typedef {import('../types/index.js').FactoryHashUsernameOptions} FactoryHashUsernameOptions
 * @typedef {import('../types/index.js').FactoryWalletOfUsernameOptions} FactoryWalletOfUsernameOptions
 * @typedef {import('../types/index.js').FactoryWalletUsernameHashOptions} FactoryWalletUsernameHashOptions
 * @typedef {import('../types/index.js').UsernameWalletCreationResult} UsernameWalletCreationResult
 * @typedef {import('../types/index.js').SignTransactionOptions} SignTransactionOptions
 * @typedef {import('../types/index.js').SignMessageOptions} SignMessageOptions
 * @typedef {import('../types/index.js').SignHashOptions} SignHashOptions
 * @typedef {import('../types/index.js').UpdateWalletLogicImplAddrResult} UpdateWalletLogicImplAddrResult
 * @typedef {import('../types/index.js').UpdateKeyVaultImplAddrResult} UpdateKeyVaultImplAddrResult
 * @typedef {import('../types/index.js').UpdateKeyVaultImplAddrCustomResult} UpdateKeyVaultImplAddrCustomResult
 * @typedef {import('../types/index.js').UpdateAuthenticatorOptions} UpdateAuthenticatorOptions
 * @typedef {import('../types/index.js').UpdateAuthenticatorAddrResult} UpdateAuthenticatorAddrResult
 * @typedef {import('../types/index.js').UpdateAuthenticatorAddrCustomResult} UpdateAuthenticatorAddrCustomResult
 * @typedef {import('../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../types/index.js').AddToWhitelistResult} AddToWhitelistResult
 * @typedef {import('../types/index.js').RemoveFromWhitelistResult} RemoveFromWhitelistResult
 * @typedef {import('../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../types/index.js').CreateAuthProofMinuteSignatureOptions} CreateAuthProofMinuteSignatureOptions
 * @typedef {import('../types/index.js').CreateAuthProofMinuteSignatureResult} CreateAuthProofMinuteSignatureResult
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').Bytes} Bytes
 * @typedef {import('../types/index.js').Bytes32} Bytes32
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').AuthenticatorClientInstance} AuthenticatorClientInstance
 * @typedef {import('../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../types/index.js').CreateWalletBaseOptions} CreateWalletBaseOptions
 * @typedef {import('../types/index.js').CreateWalletFromMnemonicOptions} CreateWalletFromMnemonicOptions
 * @typedef {import('../types/index.js').ConfigurePasswordDualFactorResult} ConfigurePasswordDualFactorResult
 * @typedef {import('../types/index.js').UpdateGuardianResult} UpdateGuardianResult
 * @typedef {import('../types/index.js').TransferAdminResult} TransferAdminResult
 * @typedef {import('../types/index.js').KeyMetadataResult} KeyMetadataResult
 * @typedef {import('../types/index.js').SignWithImportedKeyOptions} SignWithImportedKeyOptions
 * @typedef {import('../types/index.js').SignSolanaOptions} SignSolanaOptions
 * @typedef {import('../types/index.js').ImportKeyOptions} ImportKeyOptions
 * @typedef {import('../types/index.js').SetChainBaseKeysOptions} SetChainBaseKeysOptions
 * @typedef {import('../types/index.js').CreateAuthProofDualFactorOptions} CreateAuthProofDualFactorOptions
 * @typedef {import('../types/index.js').ChainId} ChainId
 * @typedef {import('../types/index.js').ExecuteWithAuthOptions} ExecuteWithAuthOptions
 * @typedef {import('../types/index.js').InitializeWalletLogicOptions} InitializeWalletLogicOptions
 * @typedef {import('../types/index.js').KeyVaultAccountSliceOptions} KeyVaultAccountSliceOptions
 * @typedef {import('../types/index.js').KeyVaultAddrIndexOptions} KeyVaultAddrIndexOptions
 * @typedef {import('../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../types/index.js').ComputeActionHashOptions} ComputeActionHashOptions
 * @typedef {import('../types/index.js').ComputeCustomImplementationAckHashOptions} ComputeCustomImplementationAckHashOptions
 * @typedef {import('../types/index.js').ComputeCustomAuthenticatorAckHashOptions} ComputeCustomAuthenticatorAckHashOptions
 * @typedef {import('../types/index.js').IsImplementationApprovedOptions} IsImplementationApprovedOptions
 * @typedef {import('../types/index.js').IsAuthenticatorApprovedOptions} IsAuthenticatorApprovedOptions
 * @typedef {import('../types/index.js').KeyVaultImportedKeyOptions} KeyVaultImportedKeyOptions
 * @typedef {import('../types/index.js').AddWhitelistOptions} AddWhitelistOptions
 * @typedef {import('../types/index.js').ConfigureDualFactorOptions} ConfigureDualFactorOptions
 * @typedef {import('../types/index.js').ConfigurePasswordOptions} ConfigurePasswordOptions
 * @typedef {import('../types/index.js').ConfigurePasswordMinuteOptions} ConfigurePasswordMinuteOptions
 * @typedef {import('../types/index.js').ConfigureWalletSignatureOptions} ConfigureWalletSignatureOptions
 * @typedef {import('../types/index.js').ConfigureApiKeySessionOptions} ConfigureApiKeySessionOptions
 * @typedef {import('../types/index.js').ConfigureApiKeySessionResult} ConfigureApiKeySessionResult
 * @typedef {import('../types/index.js').RotateApiKeyOptions} RotateApiKeyOptions
 * @typedef {import('../types/index.js').RotateApiKeyResult} RotateApiKeyResult
 * @typedef {import('../types/index.js').CreateAuthProofApiKeySessionOptions} CreateAuthProofApiKeySessionOptions
 * @typedef {import('../types/index.js').EncodedAuthProofApiKeySession} EncodedAuthProofApiKeySession
 * @typedef {import('../types/index.js').ComputeTokenMacOptions} ComputeTokenMacOptions
 * @typedef {import('../types/index.js').ComputeActionMacOptions} ComputeActionMacOptions
 * @typedef {import('../types/index.js').BuildTokenAuthProofOptions} BuildTokenAuthProofOptions
 * @typedef {import('../types/index.js').BuildActionAuthProofOptions} BuildActionAuthProofOptions
 * @typedef {import('../types/index.js').SelectorBitOptions} SelectorBitOptions
 * @typedef {import('../types/index.js').SelectorBitResult} SelectorBitResult
 * @typedef {import('../types/index.js').DeactivateActivateKeyOptions} DeactivateActivateKeyOptions
 * @typedef {import('../types/index.js').RemoveWhitelistOptions} RemoveWhitelistOptions
 * @typedef {import('../types/index.js').TransferAdminOptions} TransferAdminOptions
 * @typedef {import('../types/index.js').UpdateGuardianOptions} UpdateGuardianOptions
 * @typedef {import('../types/index.js').UpdateKeyVaultImplOptions} UpdateKeyVaultImplOptions
 * @typedef {import('../types/index.js').UpdateKeyVaultImplCustomOptions} UpdateKeyVaultImplCustomOptions
 * @typedef {import('../types/index.js').UpdateAuthenticatorCustomOptions} UpdateAuthenticatorCustomOptions
 * @typedef {import('../types/index.js').UpdatePasswordDualFactorOptions} UpdatePasswordDualFactorOptions
 * @typedef {import('../types/index.js').UpdatePasswordOptions} UpdatePasswordOptions
 * @typedef {import('../types/index.js').UpdateWalletLogicImplOptions} UpdateWalletLogicImplOptions
 * @typedef {import('../types/index.js').FactoryAllowedAuthenticatorsOptions} FactoryAllowedAuthenticatorsOptions
 * @typedef {import('../types/index.js').FactoryAllowedKeyVaultImplementationsOptions} FactoryAllowedKeyVaultImplementationsOptions
 * @typedef {import('../types/index.js').FactoryIsImplementationApprovedOptions} FactoryIsImplementationApprovedOptions
 * @typedef {import('../types/index.js').FactoryIsAuthenticatorApprovedOptions} FactoryIsAuthenticatorApprovedOptions
 * @typedef {import('../types/index.js').SetAuthenticatorAllowedOptions} SetAuthenticatorAllowedOptions
 * @typedef {import('../types/index.js').SetKeyVaultImplementationAllowedOptions} SetKeyVaultImplementationAllowedOptions
 * @typedef {import('../types/index.js').SetWalletAuthenticatorAllowedOptions} SetWalletAuthenticatorAllowedOptions
 * @typedef {import('../types/index.js').SetWalletImplementationAllowedOptions} SetWalletImplementationAllowedOptions
 * @typedef {import('../types/index.js').SetAuthenticatorAllowedResult} SetAuthenticatorAllowedResult
 * @typedef {import('../types/index.js').SetKeyVaultImplementationAllowedResult} SetKeyVaultImplementationAllowedResult
 * @typedef {import('../types/index.js').SetWalletAuthenticatorAllowedResult} SetWalletAuthenticatorAllowedResult
 * @typedef {import('../types/index.js').SetWalletImplementationAllowedResult} SetWalletImplementationAllowedResult
 * @typedef {import('../types/index.js').VerifyPasswordOptions} VerifyPasswordOptions
 * @typedef {import('../types/index.js').WhitelistCheckOptions} WhitelistCheckOptions
 * @typedef {import('../types/index.js').WalletProxyOptions} WalletProxyOptions
 * @typedef {import('../types/index.js').ImportKeyResult} ImportKeyResult
 * @typedef {import('../types/index.js').DeactivateKeyResult} DeactivateKeyResult
 * @typedef {import('../types/index.js').ActivateKeyResult} ActivateKeyResult
 * @typedef {import('../types/index.js').RequiredContractAddressKeys} RequiredContractAddressKeys
 * @typedef {import('../types/index.js').EncodedAuthProofWalletSignature} EncodedAuthProofWalletSignature
 * @typedef {import('../types/index.js').EncodedAuthProofDualFactor} EncodedAuthProofDualFactor
 * @typedef {import('../types/index.js').SignAuthorizationOptions} SignAuthorizationOptions
 * @typedef {import('../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 * @typedef {import('../types/index.js').ConnectOptions} ConnectOptions
 * @typedef {import('../types/index.js').AuthContext} AuthContext
 * @typedef {import('../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../types/index.js').EncodedAuthProofPassword} EncodedAuthProofPassword
 * @typedef {import('../types/index.js').EncodedAuthProofPasswordMinute} EncodedAuthProofPasswordMinute
 * @typedef {import('../types/index.js').PreparePasswordFlowOptions} PreparePasswordFlowOptions
 * @typedef {import('../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../types/index.js').ResolvedPasswordFlowOptions} ResolvedPasswordFlowOptions
 * @typedef {import('../types/index.js').AuthProofFlowOptions} AuthProofFlowOptions
 * @typedef {import('../types/index.js').ResolvedAuthAction} ResolvedAuthAction
 *
 */

import MonsteraConfig from '../config/monstera.js';
import MonsteraUtils from './MonsteraUtils.js';
import log from '../internal/logger.js';
import WalletFactoryClient from '../clients/factory/index.js';
import WalletLogicClient from '../clients/logic/index.js';
import KeyVaultClient from '../clients/keyVault/index.js';
import { AuthenticatorClient } from '../clients/auth/index.js';
import {
  buildSignAction,
  buildSignMessageAction,
  buildSignTransactionAction,
  buildExecuteWithAuthAction,
  buildUpgradeImplementationAction,
  buildUpgradeImplementationCustomAction,
  buildChangeAuthenticatorAction,
  buildChangeAuthenticatorCustomAction,
  buildImportKeyAction,
  buildDeactivateKeyAction,
  buildActivateKeyAction,
  buildSignWithImportedKeyAction,
  buildSignSolanaAction,
  buildSetChainBaseKeysAction
} from '../internal/crypto/index.js';
import { withDefaultAccountIndex } from '../internal/vault/accountIndex.js';
import { executeSignAuthorization } from '../internal/vault/signAuthorization.js';
import { createProvider, createWriteSigner } from '../providers/sapphire.js';
import { assertValidResolvedConfig } from '../internal/validators/networkConfig.js';
import { EncodeAuthConfig } from '../internal/auth/config/EncodeAuthConfig.js';
import { AuthProofPipeline } from '../internal/auth/proof/AuthProofPipeline.js';
import {
  buildChangePasswordAction,
  buildDualFactorChangePasswordAction,
  buildChangeGuardianAction,
  buildAddToWhitelistAction,
  buildRemoveFromWhitelistAction,
  buildMinuteSignatureChangePasswordAction,
  buildRotateApiKeyAction
} from '../internal/auth/context/actions/index.js';
import { CredentialsSession } from '../internal/auth/session/CredentialsSession.js';
import { parseConnectCredentials } from '../internal/validators/connectOptions.js';
import { VaultCallPipeline } from '../internal/auth/session/VaultCallPipeline.js';
import { AuthenticatorCallPipeline } from '../internal/auth/session/AuthenticatorCallPipeline.js';
import { resolveActionHash } from '../internal/auth/context/createAuthContext.js';
import { defaultProofDeadline } from '../internal/auth/authenticators/deadline.js';
import { SCOPE_ALL, SCOPE_SIGN_ALL } from '../internal/auth/apiKeySession/constants.js';

/**
 * Main entry point for Monstera wallet operations on Oasis Sapphire.
 *
 * Construct via {@link Monstera.connect} for the typical case, or pass a fully resolved
 * {@link MonsteraConfigOptions} to the constructor for advanced wiring.
 *
 * @remarks
 * Top-level methods prefer {@link KeyVaultClient} (`keyVaultAddr`): signing, account queries, upgrades, and imports
 * mirror what WalletLogic ultimately forwards to KeyVault, so calling KeyVault directly is simpler and matches most docs.
 * {@link WalletLogicClient} remains available as {@link Monstera#logic} for wallet-proxy-shaped calls (`walletAddr`), e.g.
 * {@link Monstera#initializeWalletLogic} or advanced use when you must hit the WalletLogic contract explicitly.
 *
 * @public
 */
class Monstera {
  // ============================================================================
  // Constructor
  // ============================================================================

  /**
   * Build a Monstera SDK instance from a fully resolved network config.
   *
   * Validates the config, lazily creates a Sapphire JSON-RPC provider when one isn't supplied,
   * wraps any provided signer for Sapphire encrypted writes, and instantiates the four domain clients
   * plus the {@link AuthConfigBuilder} / {@link AuthProofBuilder} used by the high-level helpers.
   *
   * @public
   * @param {MonsteraConfigOptions} config - Fully resolved SDK configuration (network, addresses, optional signer/provider)
   * @throws {ConfigError} If {@code config} is missing required fields ({@code rpcUrl}, {@code chainId}, {@code network}, {@code addresses}) or required contract addresses are missing
   * @throws {ValidationError} If contract addresses are present but malformed, or if {@code signer} is a non-string non-Signer value
   * @throws {SapphireRequiredError} If wrapping the provided signer with the Sapphire ethers adapter fails
   *
   * @remarks Prefer {@link Monstera.connect} unless you already have a resolved {@link NetworkConfig}.
   */
  constructor(config) {
    const parsedCredentials = parseConnectCredentials(config?.credentials);
    const { credentials: _credentials, ...resolvedConfig } = config ?? {};

    assertValidResolvedConfig(resolvedConfig);
    this.config = resolvedConfig;
    this.version = MonsteraConfig.version;

    // Initialize read provider (for read operations)
    this.readProvider = resolvedConfig.provider ?? createProvider(resolvedConfig.rpcUrl, 'read');
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    this.writeSigner = resolvedConfig.signer ? createWriteSigner(resolvedConfig.signer, resolvedConfig.rpcUrl, 'write') : null;

    // Wire domain clients
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, resolvedConfig);
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, resolvedConfig);
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, resolvedConfig);
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, resolvedConfig);

    this._credentialsSession = parsedCredentials
      ? new CredentialsSession(parsedCredentials, {
          hashUsername: (opts) => this.factory.hashUsername(opts),
          walletOfUsername: (opts) => this.factory.walletOfUsername(opts),
          getKeyVaultAddr: (opts) => this.factory.getKeyVaultAddr(opts)
        })
      : null;

    this._authProofPipeline = new AuthProofPipeline({
      config: resolvedConfig,
      readProvider: this.readProvider,
      getAuthenticatorAddr: (keyVaultAddr) => this.getAuthenticatorAddr({ keyVaultAddr })
    });

    this._vaultPipeline = new VaultCallPipeline({
      credentialsSession: this._credentialsSession,
      authProofPipeline: this._authProofPipeline
    });
    this._authenticatorPipeline = new AuthenticatorCallPipeline({
      credentialsSession: this._credentialsSession,
      authProofPipeline: this._authProofPipeline
    });
    this._encodeAuthConfig = new EncodeAuthConfig({ addresses: resolvedConfig.addresses });

    // Check version in background only when explicitly enabled.
    if (resolvedConfig?.checkVersion === true && !MonsteraUtils.versionCheckDone) {
      MonsteraUtils.checkVersionOnce(this.version);
    }
  }

  // ============================================================================
  // Static methods
  // ============================================================================

  /**
   * Connect to Monstera.
   *
   * Pass an optional {@code signer} for on-chain writes and optional {@code credentials} for
   * vault-authenticated operations. Omit both for read-only factory/network queries.
   *
   * Vault operations require {@code credentials} or an explicit {@code keyVaultAddr} on each call.
   * Write operations require a {@code signer}.
   *
   * @public
   * @static
   * @param {ConnectOptions} options
   * @returns {Monstera}
   */
  static connect(options) {
    return new Monstera(MonsteraConfig.resolveConnectConfig(options));
  }

  /**
   * Set the SDK log level. Affects the shared logger used by all Monstera code.
   *
   * @public
   * @param {'error' | 'warn' | 'info' | 'debug'} level - Minimum level to emit (error < warn < info < debug)
   * @returns {void}
   * @throws {Error} If {@code level} is not one of the four supported levels
   */
  setLogLevel(level) {
    log.setLevel(level);
  }

  // ============================================================================
  // Static Properties (Class-Level Constants)
  // ============================================================================

  /**
   * SDK version string (e.g. {@code "1.2.3"}).
   *
   * @public
   * @static
   * @readonly
   * @returns {string} SDK version string, or {@code "unknown"} if it cannot be resolved
   */
  static get version() {
    return MonsteraConfig.version;
  }
  
  /**
   * Network presets for testnet and mainnet (chain id, RPC URL, explorer URL, etc.).
   *
   * @public
   * @static
   * @readonly
   * @returns {NetworkPresets} Network configuration presets
   */
  static get networks() {
    return MonsteraConfig.networks;
  }

  /**
   * Built-in contract address defaults shipped with the SDK (no network I/O).
   *
   * @public
   * @static
   * @readonly
   * @returns {DefaultContractAddresses} Static defaults keyed by network ({@code testnet} / {@code mainnet})
   */
  static get defaultAddresses() {
    return MonsteraConfig.defaultAddresses;
  }

  /**
   * ApiKeySession TOKEN-mode scope: all KeyVault signing ops (bits 0–4), excluding {@code executeWithAuth}.
   *
   * @public
   * @static
   * @readonly
   * @returns {number}
   */
  static get API_KEY_SESSION_SCOPE_SIGN_ALL() {
    return SCOPE_SIGN_ALL;
  }

  /**
   * ApiKeySession TOKEN-mode scope: all signing ops plus {@code executeWithAuth} (bits 0–5).
   *
   * @public
   * @static
   * @readonly
   * @returns {number}
   */
  static get API_KEY_SESSION_SCOPE_ALL() {
    return SCOPE_ALL;
  }

  /**
   * Ordered list of {@link ContractAddresses} keys that must be present after config is resolved.
   *
   * @public
   * @static
   * @readonly
   * @returns {RequiredContractAddressKeys} Ordered list of required {@link ContractAddresses} keys
   */
  static get requiredAddresses() {
    return MonsteraConfig.requiredAddresses;
  }

  // ============================================================================
  // Instance Properties (Convenience Getters)
  // ============================================================================

  /**
   * Network name for the configured network (e.g. {@code "sapphire-mainnet"}).
   *
   * @public
   * @readonly
   * @returns {string} Network name
   */
  get network() { return this.config.network; }

  /**
   * Chain ID for the configured network.
   *
   * @public
   * @readonly
   * @returns {ChainId} Chain ID
   */
  get chainId() { return this.config.chainId; }

  /**
   * RPC URL for the configured network.
   *
   * @public
   * @readonly
   * @returns {string} RPC URL
   */
  get rpcUrl() { return this.config.rpcUrl; }

  /**
   * Resolved contract addresses for the configured network (defaults merged with overrides).
   *
   * @public
   * @readonly
   * @returns {ContractAddresses} Contract addresses
   */
  get addresses() { return this.config.addresses; }

  /**
   * Provider explicitly passed to the constructor (does not include the auto-created RPC provider).
   *
   * @public
   * @readonly
   * @returns {EthersProvider|null} Provider instance or {@code null}
   */
  get provider() { return this.config.provider; }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Whether this SDK instance has a wrapped write signer and can submit transactions.
   *
   * @public
   * @returns {boolean} {@code true} when a Sapphire-wrapped signer is configured
   */
  hasWriteAccess() {
    return this.writeSigner !== null;
  }

  /**
   * Get the address of the configured write signer.
   *
   * @public
   * @async
   * @returns {Promise<Address|null>} Signer address, or {@code null} when no signer is configured
   * @throws {Error} If the underlying signer's {@code getAddress()} rejects (rare; e.g. hardware-wallet failures)
   */
  async getSignerAddr() {
    if (!this.writeSigner) return null;
    return await this.writeSigner.getAddress();
  }

  /**
   * Whether this SDK instance was connected with end-user credentials.
   *
   * @public
   * @returns {boolean}
   */
  hasCredentials() {
    return this._vaultPipeline.hasCredentials();
  }

  /**
   * Inject {@code walletAddr} from the credentials session when omitted.
   *
   * @private
   * @async
   * @param {Record<string, unknown>} options
   * @returns {Promise<Record<string, unknown>>}
   */
  async _resolveWalletProxyOptions(options = {}) {
    if (options.walletAddr || !this.hasCredentials()) {
      return options;
    }

    return {
      ...options,
      walletAddr: await this._vaultPipeline.getCredentialsSession().getWalletAddr()
    };
  }

  /**
   * Inject {@code walletOrKeyVaultAddr} from resolved {@code keyVaultAddr} when omitted.
   *
   * @private
   * @async
   * @param {Record<string, unknown>} options
   * @returns {Promise<Record<string, unknown>>}
   */
  async _resolveWalletOrKeyVaultScope(options = {}) {
    if (options.walletOrKeyVaultAddr) {
      return options;
    }

    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    return { ...options, ...resolved, walletOrKeyVaultAddr: resolved.keyVaultAddr };
  }

  /**
   * Merge ApiKeySession call options with connect credentials and SDK config defaults.
   *
   * @private
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @param {import('../internal/auth/session/CredentialsSession.js').ResolveVaultOptionsFlags} [flags]
   * @returns {Promise<Record<string, unknown>>}
   */
  async _resolveApiKeySessionProofOptions(options = {}, flags = { defaultApiKeySecret: true }) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options, flags);
    return {
      ...resolved,
      chainId: resolved.chainId ?? this.config.chainId
    };
  }

  /**
   * Get the wallet proxy address for the connect-time username.
   * 
   * @returns {Promise<Address>} Wallet proxy address
   * @throws {CredentialsRequiredError} If no credentials session is configured
   * @throws {ValidationError} If no wallet is registered for the session username
   * @throws {NetworkError} If factory lookups fail over RPC
   * @throws {WalletError} For other unrecognised failures
   */
  async getSessionWalletAddr() {
    this._vaultPipeline.requireUserAccess('getSessionWalletAddr');
    return this._vaultPipeline.getCredentialsSession().getWalletAddr();
  }

  /**
   * Resolve the cached KeyVault address for the connect-time username.
   *
   * Uses the same {@link CredentialsSession} → {@link WalletFactoryClient#getKeyVaultAddr} path as
   * vault-scoped facade methods ({@link VaultCallPipeline#resolveVaultOptions}).
   *
   * @public
   * @async
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {CredentialsRequiredError} If no credentials session is configured
   * @throws {ValidationError} If no wallet is registered for the session username
   * @throws {NetworkError} If factory lookups fail over RPC
   * @throws {WalletError} For other unrecognised failures
   */
  async getSessionKeyVaultAddr() {
    const { keyVaultAddr } = await this._vaultPipeline.resolveVaultOptions({});
    return keyVaultAddr;
  }

  /**
   * Get a specific authenticator client by type, e.g. {@code 'walletSignature'} or {@code 'password'}.
   *
   * @public
   * @param {string} type - Authenticator type ({@code 'walletSignature'}, {@code 'password'}, {@code 'dualFactor'}, {@code 'passwordMinuteSignature'})
   * @returns {AuthenticatorClientInstance} The matching authenticator client instance
   * @throws {ValidationError} If {@code type} is missing, not a string, or not a registered authenticator type
   */
  getAuthClient(type) {
    return this.auth.getClient(type);
  }

  /**
   * List the authenticator types registered on this SDK instance.
   *
   * @public
   * @returns {string[]} Array of authenticator type names (suitable for {@link Monstera#getAuthClient})
   */
  getAvailableAuthTypes() {
    return this.auth.getAvailableTypes();
  }

  /**
   * Build the EIP-712 {@code authProof} for {@code WalletSignatureAuthenticator}.
   *
   * Signs {@code WalletAuth(wallet, actionHash, deadline)} typed data with the supplied {@code signer} and ABI-encodes
   * {@code (uint256 deadline, bytes signature)}. {@code authenticatorAddr}, {@code chainId} and {@code deadline}
   * default from the SDK config (deadline = now + 1 hour).
   *
   * @public
   * @async
   * @param {CreateAuthProofWalletSignatureOptions} options - Inputs for the proof ({@code action} or {@code actionHash} required)
   * @returns {Promise<EncodedAuthProofWalletSignature>} ABI-encoded auth proof bytes
   * @throws {ValidationError} If {@code signer} is not a {@link EthersWallet}/{@link EthersHDNodeWallet}, addresses or {@code chainId}/{@code deadline} are invalid, or neither {@code action} nor {@code actionHash} is supplied
   * @throws {NetworkError} If the signer's transport fails during typed-data signing
   * @throws {WalletError} For other unrecognised signing failures
   */
  async createAuthProofWalletSignature(options = {}) {
    const { authProof } = await this._authenticatorPipeline.encodeAuthProof('walletSignature', options);
    return authProof;
  }

  /**
   * Build the {@code authProof} for {@code PasswordMinuteSignatureAuthenticator}.
   *
   * Reads the latest block from the SDK read provider to derive the current minute bucket,
   * derives an ephemeral signer from {@code keccak256(passwordHash || minuteBucket)},
   * signs the EIP-191 digest of {@code keccak256(wallet, authenticator, chainId, minuteBucket, actionHash)},
   * and ABI-encodes {@code (bytes signature)}.
   *
   * @public
   * @async
   * @param {CreateAuthProofMinuteSignatureOptions} options - Inputs ({@code keyVaultAddr}, {@code passwordHash}, {@code action} or {@code actionHash}, optional {@code chainId} / {@code authenticatorAddr})
   * @returns {Promise<CreateAuthProofMinuteSignatureResult>} Encoded auth proof, minute bucket, and derived signer address
   * @throws {ValidationError} If {@code keyVaultAddr}, {@code authenticatorAddr}, {@code chainId} are missing/invalid, {@code passwordHash} is not a 32-byte hex string, or neither {@code action} nor {@code actionHash} is supplied
   * @throws {NetworkError} If the read provider fails to return the latest block
   */
  async createAuthProofMinuteSignature(options = {}) {
    const { authProof, minuteBucket, derivedAddress } = await this._authenticatorPipeline.encodeAuthProof(
      'minuteSignature',
      options
    );
    return { authProof, minuteBucket, derivedAddress };
  }

  /**
   * Build the {@code authProof} for {@code DualFactorAuthenticator}.
   *
   * @public
   * @async
   * @param {CreateAuthProofDualFactorOptions} options
   * @returns {Promise<EncodedAuthProofDualFactor>}
   */
  async createAuthProofDualFactor(options = {}) {
    const { authProof } = await this._authenticatorPipeline.encodeAuthProof('dualFactor', options);
    return authProof;
  }

  // /**
  //  * Build the {@code authProof} for {@code ApiKeySessionAuthenticator}.
  //  *
  //  * MAC computation and ABI encoding delegate to the on-chain pure helpers
  //  * ({@code computeTokenMac}/{@code computeActionMac} + {@code buildTokenAuthProof}/{@code buildActionAuthProof}).
  //  *
  //  * ACTION mode (default): binds the proof to {@code action} or {@code actionHash}.
  //  * TOKEN mode: mint a bearer token when {@code mode === 'token'} or {@code expiry}/{@code scopeMask}
  //  * are set — {@code expiry} defaults to now + 1 hour, {@code scopeMask} defaults to
  //  * {@code SCOPE_SIGN_ALL} (0x1F).
  //  *
  //  * @public
  //  * @async
  //  * @param {CreateAuthProofApiKeySessionOptions} options
  //  * @returns {Promise<EncodedAuthProofApiKeySession>} ABI-encoded auth proof bytes
  //  * @throws {ValidationError} If required parameters are missing or invalid
  //  */
  // async createAuthProofApiKeySession(options = {}) {
  //   const { authProof } = await this._authenticatorPipeline.encodeAuthProof('apiKeySession', options, {
  //     flags: { defaultApiKeySecret: true }
  //   });
  //   return authProof;
  // }

  // ============================================================================
  // Initialize Methods (Write)
  // ============================================================================

  /**
   * Initialize a freshly deployed KeyVault contract by wiring its storage, authenticator, and access token.
   *
   * Delegates to {@link KeyVaultClient#initialize}.
   *
   * @public
   * @async
   * @param {InitializeOptions} options - {@code keyVaultAddr}, {@code storageAddr}, {@code authenticatorAddr}, {@code accessToken}, {@code authConfig}
   * @returns {Promise<BaseTransactionResult>} Standard write result ({@code success}, {@code transactionHash}, {@code blockNumber}, {@code gasUsed})
   * @throws {ValidationError} If any address is invalid, {@code authConfig} is missing, or {@code accessToken} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC call to broadcast the transaction or fetch its receipt fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Most callers should use a {@code createWallet*} factory method instead, which wires the KeyVault for you.
   */
  async initialize(options = {}) {
    return this.keyVault.initialize(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Initialize a KeyVault with an explicit policy registry (factory-managed policy).
   *
   * Delegates to {@link KeyVaultClient#initializeExplicit}.
   *
   * @public
   * @async
   * @param {InitializeExplicitOptions} options - Same as {@link Monstera#initialize} plus required {@code policyRegistry}
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If any address is invalid, {@code authConfig} is missing, or {@code accessToken} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC call to broadcast the transaction or fetch its receipt fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {WalletError} For other unrecognised failures
   */
  async initializeExplicit(options = {}) {
    return this.keyVault.initializeExplicit(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Initialize a freshly deployed WalletLogic proxy by binding it to a {@code keyVaultAddr}.
   *
   * Delegates to {@link WalletLogicClient#initialize}.
   *
   * @public
   * @async
   * @param {InitializeWalletLogicOptions} options - {@code walletAddr} (proxy) and {@code keyVaultAddr}
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If {@code walletAddr} or {@code keyVaultAddr} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {WalletError} For other unrecognised failures
   */
  async initializeWalletLogic(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    if (!resolved.walletAddr) {
      Object.assign(resolved, await this._resolveWalletProxyOptions(options));
    }
    return this.logic.initialize(resolved);
  }

  // ============================================================================
  // Configure Methods (Write)
  // ============================================================================

  /**
   * Configure {@code PasswordAuthenticator} for a wallet by storing the password hash on-chain.
   *
   * The {@code passwordHash} is forwarded directly as the encoded {@code authConfig} (bytes32).
   * Delegates to {@link PasswordAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigurePasswordOptions} options - Optional {@code keyVaultAddr} (resolved from credentials when omitted) and 32-byte {@code passwordHash}
   * @returns {Promise<ConfigurePasswordResult>} Standard write result with the parsed {@code wallet} field
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code passwordHash} is not a 32-byte hex string
   * @throws {CredentialsRequiredError} If neither credentials nor {@code keyVaultAddr} is available
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code PasswordConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configurePassword(options = {}) {
    const { keyVaultAddr, passwordHash } = await this._vaultPipeline.resolveVaultOptions(options);
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: { passwordHash },
      authenticatorAddr: this.config.addresses.passwordAuth
    });
    return this.auth.password.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure {@code WalletSignatureAuthenticator} for a wallet by ABI-encoding {@code initialWhitelist}.
   *
   * Delegates to {@link WalletSignatureAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigureWalletSignatureOptions} options - Optional {@code keyVaultAddr} and {@code initialWhitelist} (at least one address)
   * @returns {Promise<ConfigureWalletSignatureResult>} Standard write result with parsed {@code wallet} and {@code initialWhitelist}
   * @throws {ValidationError} If {@code keyVaultAddr} or any whitelist address is invalid, or {@code initialWhitelist} is empty
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configureWalletSignature(options = {}) {
    const { keyVaultAddr, initialWhitelist } = await this._vaultPipeline.resolveVaultOptions(options);
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: { initialWhitelist },
      authenticatorAddr: this.config.addresses.walletSignatureAuth
    });
    return this.auth.walletSignature.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure {@code DualFactorAuthenticator} for a wallet by ABI-encoding {@code (passwordHash, guardianAddr)}.
   *
   * Delegates to {@link DualFactorAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigureDualFactorOptions} options - Optional {@code keyVaultAddr}, 32-byte {@code passwordHash}, guardian {@code guardianAddr}
   * @returns {Promise<ConfigurePasswordDualFactorResult>} Standard write result with parsed {@code wallet} and {@code guardian}
   * @throws {ValidationError} If {@code keyVaultAddr}/{@code guardianAddr} are invalid or {@code passwordHash} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configureDualFactor(options = {}) {
    const { keyVaultAddr, passwordHash, guardianAddr } = await this._vaultPipeline.resolveVaultOptions(options);
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: { passwordHash, guardianAddr },
      authenticatorAddr: this.config.addresses.dualFactorAuth
    });
    return this.auth.dualFactor.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure {@code PasswordMinuteSignatureAuthenticator} for a wallet by storing the password hash on-chain.
   *
   * Delegates to {@link PasswordMinuteSignatureAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigurePasswordMinuteOptions} options - Optional {@code keyVaultAddr} and 32-byte {@code passwordHash}
   * @returns {Promise<ConfigurePasswordResult>} Standard write result with the parsed {@code wallet} field
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code passwordHash} is not a 32-byte hex string
   * @throws {CredentialsRequiredError} If neither credentials nor {@code keyVaultAddr} is available
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code PasswordConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configurePasswordMinuteSignature(options = {}) {
    const { keyVaultAddr, passwordHash } = await this._vaultPipeline.resolveVaultOptions(options);
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: { passwordHash },
      authenticatorAddr: this.config.addresses.passwordMinuteSignatureAuth
    });
    return this.auth.passwordMinuteSignature.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure {@code ApiKeySessionAuthenticator} for a wallet by storing the API key hash on-chain.
   *
   * Delegates to {@link ApiKeySessionAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigureApiKeySessionOptions} options - Optional {@code keyVaultAddr} and 32-byte {@code apiKeySecret} (defaults from connect credentials when omitted)
   * @returns {Promise<ConfigureApiKeySessionResult>} Standard write result with the parsed {@code wallet} field
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code apiKeySecret} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code ApiKeySessionConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configureApiKeySession(options = {}) {
    const { keyVaultAddr, apiKeySecret } = await this._vaultPipeline.resolveVaultOptions(options, {
      defaultApiKeySecret: true
    });
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: { apiKeySecret },
      authenticatorAddr: this.config.addresses.apiKeySessionAuth
    });
    return this.auth.apiKeySession.configure({ keyVaultAddr, authConfig });
  }

  // ============================================================================
  // Create Methods (Write)
  // ============================================================================

  /**
   * Create a new HD wallet (full stack) and store its mnemonic on the result.
   *
   * Deploys WalletStorage, KeyVault, and a WalletLogic BeaconProxy. Encodes structured {@code authConfig}
   * via {@link AuthConfigBuilder} before delegating to {@link WalletFactoryClient#createWallet}.
   *
   * @public
   * @async
   * @param {CreateWalletBaseOptions} options - {@code authConfig} (structured or pre-encoded) and optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Write result plus addresses ({@code wallet}, {@code keyVault}, {@code storage}, {@code authenticator}) and the generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig} is missing/invalid for the resolved authenticator, or {@code authenticatorAddr} is set but not a built-in authenticator
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * Mnemonic memory handling: see {@link WalletFactoryClient#createWallet}. Treat {@link WalletCreationResult.mnemonic} as a high-value secret.
   */
  async createWallet(options = {}) {
    return this.factory.createWallet(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (full stack) deterministically from a caller-supplied mnemonic.
   *
   * Same deployment shape as {@link Monstera#createWallet}; the seed is derived from {@code options.mnemonic}
   * via PBKDF2-SHA512 instead of being generated. The mnemonic is echoed back on the result.
   *
   * @public
   * @async
   * @param {CreateWalletFromMnemonicOptions} options - {@code authConfig}, {@code mnemonic}, optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Write result plus addresses and the supplied {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig} is invalid or {@code mnemonic} is not a valid BIP39 phrase
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mnemonic on the result: see {@link WalletFactoryClient#createWalletFromMnemonic}.
   */
  async createWalletFromMnemonic(options = {}) {
    return this.factory.createWalletFromMnemonic(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (full stack) and execute a post-creation hook.
   *
   * The hook contract at {@code hookAddr} must implement {@code IWalletCreationHook}; the SDK does not
   * enforce that interface — passing a non-conforming address will revert on-chain.
   *
   * @public
   * @async
   * @param {CreateWalletWithHookOptions} options - {@code authConfig}, {@code hookAddr}, {@code hookData}, optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Write result plus addresses and generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig}, {@code hookAddr}, or {@code hookData} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction (or the hook itself) reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletWithHook(options = {}) {
    return this.factory.createWalletWithHook(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (core stack only — WalletStorage + KeyVault, no WalletLogic proxy).
   *
   * Use when you intend to interact with KeyVault directly or deploy a custom logic contract later.
   * In the returned event, {@code wallet} and {@code keyVault} are the same address by design.
   *
   * @public
   * @async
   * @param {CreateWalletBaseOptions} options - {@code authConfig} (structured or pre-encoded) and optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Write result with addresses ({@code wallet} === {@code keyVault}) and generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig} is invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletCore(options = {}) {
    return this.factory.createWalletCore(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet using a minimal-proxy (clone) of a custom WalletLogic implementation.
   *
   * Custom-logic wallets are independent of the factory's beacon — admin upgrades to the default
   * WalletLogic do not affect them.
   *
   * @public
   * @async
   * @param {CreateWalletWithCustomLogicOptions} options - {@code authConfig}, {@code customLogicImplAddr}, {@code logicData}, optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Write result plus addresses and generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig}, {@code customLogicImplAddr}, or {@code logicData} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletWithCustomLogic(options = {}) {
    return this.factory.createWalletWithCustomLogic(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (full stack) and register it to a normalised username.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameOptions} options - {@code authConfig}, {@code username}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, generated {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If {@code authConfig} or {@code username} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Usernames are normalised (trim + lowercase) before hashing. The factory stores only the hash.
   */
  async createWalletForUsername(options = {}) {
    return this.factory.createWalletForUsername(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (full stack) for a normalised username from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameFromMnemonicOptions} options - {@code authConfig}, {@code username}, {@code mnemonic}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, supplied {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async createWalletForUsernameFromMnemonic(options = {}) {
    return this.factory.createWalletForUsernameFromMnemonic(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (full stack) and register it to a precomputed username hash.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameHashOptions} options - {@code authConfig}, {@code usernameHash}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, generated {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async createWalletForUsernameHash(options = {}) {
    return this.factory.createWalletForUsernameHash(
      this._encodeAuthConfig.encode(options)
    );
  }

  /**
   * Create a new HD wallet (full stack) for a username hash from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameHashFromMnemonicOptions} options - {@code authConfig}, {@code usernameHash}, {@code mnemonic}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, supplied {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async createWalletForUsernameHashFromMnemonic(options = {}) {
    return this.factory.createWalletForUsernameHashFromMnemonic(
      this._encodeAuthConfig.encode(options)
    );
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  // --- Factory Reads ---

  /**
   * Check whether a given address was deployed by the configured factory.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr} (proxy address)
   * @returns {Promise<boolean>} {@code true} if the address is a wallet created by this factory
   * @throws {ValidationError} If {@code walletAddr} is missing or not a valid address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWallet(options = {}) {
    return this.factory.isWallet(await this._resolveWalletProxyOptions(options));
  }

  /**
   * Get the current factory admin address.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context (no required fields)
   * @returns {Promise<Address>} Admin address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAdmin(options = {}) {
    return this.factory.getAdmin(options);
  }

  /**
   * Get the current WalletLogic implementation address (the contract behind the beacon).
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Current WalletLogic implementation
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWalletLogicImplAddr(options = {}) {
    return this.factory.getWalletLogicImplAddr(options);
  }

  /**
   * Resolve the KeyVault contract for a wallet proxy via the factory mapping.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultAddr(options = {}) {
    return this.factory.getKeyVaultAddr(await this._resolveWalletProxyOptions(options));
  }

  /**
   * Resolve the WalletStorage contract address for a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getStorageAddr(options = {}) {
    return this.factory.getStorageAddr(await this._resolveWalletProxyOptions(options));
  }

  /**
   * Get the beacon contract address that controls WalletLogic upgrades.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Beacon address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getBeaconAddr(options = {}) {
    return this.factory.getBeaconAddr(options);
  }

  /**
   * Resolve the secret-vault contract address mapped to a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} Secret vault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getSecretVaultAddr(options = {}) {
    return this.factory.getSecretVaultAddr(await this._resolveWalletProxyOptions(options));
  }

  /**
   * Get the KeyVault implementation used as the minimal-proxy clone template.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} KeyVault template implementation address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultTemplate(options = {}) {
    return this.factory.getKeyVaultTemplate(options);
  }

  /**
   * Check whether an authenticator is globally allowed for new wallet creation.
   *
   * @public
   * @async
   * @param {FactoryAllowedAuthenticatorsOptions} options - {@code authenticatorAddr}
   * @returns {Promise<boolean>} {@code true} if the authenticator is on the factory allowlist
   * @throws {ValidationError} If {@code authenticatorAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async allowedAuthenticators(options = {}) {
    return this.factory.allowedAuthenticators(options);
  }

  /**
   * Check whether a KeyVault implementation is globally recommended for new wallets.
   *
   * @public
   * @async
   * @param {FactoryAllowedKeyVaultImplementationsOptions} options - {@code implementationAddr}
   * @returns {Promise<boolean>} {@code true} if the implementation is on the factory allowlist
   * @throws {ValidationError} If {@code implementationAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async allowedKeyVaultImplementations(options = {}) {
    return this.factory.allowedKeyVaultImplementations(options);
  }

  /**
   * Check whether a KeyVault implementation is approved via the factory policy registry.
   *
   * Distinct from {@link Monstera#isImplementationApproved}, which reads the KeyVault's local allowlist.
   * Equivalent to {@link WalletFactoryClient#isImplementationApproved}.
   *
   * @public
   * @async
   * @param {FactoryIsImplementationApprovedOptions} options - {@code keyVaultAddr}, {@code implementationAddr}
   * @returns {Promise<boolean>}
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isFactoryImplementationApproved(options = {}) {
    return this.factory.isImplementationApproved(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Check whether an authenticator is approved via the factory policy registry.
   *
   * Distinct from {@link Monstera#isAuthenticatorApproved}, which reads the KeyVault's local allowlist.
   * Equivalent to {@link WalletFactoryClient#isAuthenticatorApproved}.
   *
   * @public
   * @async
   * @param {FactoryIsAuthenticatorApprovedOptions} options - {@code keyVaultAddr}, {@code authenticatorAddr}
   * @returns {Promise<boolean>}
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isFactoryAuthenticatorApproved(options = {}) {
    return this.factory.isAuthenticatorApproved(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Hash a normalised username the same way the factory does.
   *
   * @public
   * @async
   * @param {FactoryHashUsernameOptions} options - {@code username}
   * @returns {Promise<Bytes32>} {@code keccak256(bytes(normalizedUsername))}
   * @throws {ValidationError} If {@code username} is missing or empty after normalisation
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async hashUsername(options = {}) {
    return this.factory.hashUsername(options);
  }

  /**
   * Resolve a username hash to its registered wallet proxy address.
   *
   * @public
   * @async
   * @param {FactoryWalletOfUsernameOptions} options - {@code usernameHash}
   * @returns {Promise<Address>} Wallet proxy address, or the zero address if unregistered
   * @throws {ValidationError} If {@code usernameHash} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async walletOfUsername(options = {}) {
    return this.factory.walletOfUsername(options);
  }

  /**
   * Resolve the username hash registered for a wallet proxy.
   *
   * @public
   * @async
   * @param {FactoryWalletUsernameHashOptions} options - {@code walletAddr}
   * @returns {Promise<Bytes32>} Username hash, or zero bytes32 if none
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWalletUsernameHash(options = {}) {
    return this.factory.getWalletUsernameHash(await this._resolveWalletProxyOptions(options));
  }

  // --- KeyVault Reads ---

  /**
   * Get the WalletStorage contract address bound to a KeyVault (where keys actually live).
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultStorageAddr(options = {}) {
    return this.keyVault.getStorageAddr(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get the authenticator contract currently bound to a KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAuthenticatorAddr(options = {}) {
    return this.keyVault.getAuthenticatorAddr(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get the current KeyVault implementation address (proxy → impl).
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>} Implementation address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultImplAddr(options = {}) {
    return this.keyVault.getKeyVaultImplAddr(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Check whether a KeyVault has been initialized.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if the KeyVault is initialized
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isInitialized(options = {}) {
    return this.keyVault.isInitialized(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Compute the canonical {@code actionHash} for a vault-authenticated call.
   *
   * @public
   * @async
   * @param {ComputeActionHashOptions} options - {@code keyVaultAddr}, 4-byte {@code selector}, and {@code paramsHash}
   * @returns {Promise<Bytes32>} Action hash bound into auth proofs
   * @throws {ValidationError} If {@code keyVaultAddr}, {@code selector}, or {@code paramsHash} are invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeActionHash(options = {}) {
    return this.keyVault.computeActionHash(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Compute the custom implementation acknowledgement hash for {@code upgradeImplementationCustom}.
   *
   * @public
   * @async
   * @param {ComputeCustomImplementationAckHashOptions} options - {@code keyVaultAddr} and {@code newImplementation}
   * @returns {Promise<Bytes32>}
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeCustomImplementationAckHash(options = {}) {
    return this.keyVault.computeCustomImplementationAckHash(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Compute the custom authenticator acknowledgement hash for {@code changeAuthenticatorCustom}.
   *
   * @public
   * @async
   * @param {ComputeCustomAuthenticatorAckHashOptions} options - {@code keyVaultAddr}, {@code newAuthenticator}, {@code configHash}
   * @returns {Promise<Bytes32>}
   * @throws {ValidationError} If addresses or {@code configHash} are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeCustomAuthenticatorAckHash(options = {}) {
    return this.keyVault.computeCustomAuthenticatorAckHash(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Read the policy registry address configured for a KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>}
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getPolicyRegistry(options = {}) {
    return this.keyVault.getPolicyRegistry(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Check whether an implementation is locally approved on a KeyVault.
   *
   * @public
   * @async
   * @param {IsImplementationApprovedOptions} options - {@code keyVaultAddr} and {@code implementation}
   * @returns {Promise<boolean>}
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isImplementationApproved(options = {}) {
    return this.keyVault.isImplementationApproved(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Check whether an authenticator is locally approved on a KeyVault.
   *
   * @public
   * @async
   * @param {IsAuthenticatorApprovedOptions} options - {@code keyVaultAddr} and {@code authenticator}
   * @returns {Promise<boolean>}
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isAuthenticatorApproved(options = {}) {
    return this.keyVault.isAuthenticatorApproved(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get the wallet's HD account address at a given index.
   *
   * @public
   * @async
   * @param {KeyVaultAddrIndexOptions} options - {@code keyVaultAddr} and {@code index}
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code index} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddr(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    return this.keyVault.getAccountAddr(withDefaultAccountIndex(resolved));
  }

  /**
   * Get a contiguous slice of HD account addresses from the wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAccountSliceOptions} options - {@code keyVaultAddr}, {@code fromIndex}, {@code count}
   * @returns {Promise<Address[]>} Array of account addresses (length {@code count})
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, or {@code fromIndex}/{@code count} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddresses(options = {}) {
    return this.keyVault.getAccountAddresses(await this._vaultPipeline.resolveVaultOptions(options));
  }

  // --- Signing Reads ---

  /**
   * Sign a raw EVM transaction with the wallet's HD account at {@code index} (authenticated view).
   *
   * Encodes the structured {@code authProof} via {@link AuthProofBuilder} when needed, then delegates to
   * {@link KeyVaultClient#signTransaction}.
   *
   * @public
   * @async
   * @param {SignTransactionOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, plus EVM tx fields
   * @returns {Promise<Bytes>} RLP-encoded signed transaction
   * @throws {ValidationError} If addresses, {@code authProof}, or numeric tx fields are missing/invalid
   * @throws {NetworkError} If the RPC view call fails (e.g. provider failure during minute-bucket leg)
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signTransaction(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) =>
        buildSignTransactionAction({
          index: o.index,
          nonce: o.nonce,
          gasPrice: o.gasPrice,
          gasLimit: o.gasLimit,
          to: o.to,
          value: o.value,
          txData: o.txData,
          chainId: o.chainId
        }),
      (encoded) => this.keyVault.signTransaction(encoded)
    );
  }

  /**
   * Sign an EIP-191 personal message with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {SignMessageOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, {@code message}
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signMessage(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildSignMessageAction({ index: o.index, message: o.message }),
      (encoded) => this.keyVault.signMessage(encoded)
    );
  }

  /**
   * Sign an arbitrary 32-byte hash with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {SignHashOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, 32-byte {@code hash}
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async sign(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildSignAction({ index: o.index, digest: o.hash }),
      (encoded) => this.keyVault.sign(encoded)
    );
  }


  /**
   * Sign an EIP-7702-style authorization tuple via KeyVault (same digest as ethers {@code hashAuthorization}).
   *
   * Resolves missing {@code chainId} / {@code nonce} from {@code options.provider} (preferred), the SDK
   * {@code readProvider}, or the signer's provider. The internal {@code implCall} is built and forwarded to
   * {@link KeyVaultClient#executeWithAuth}; the raw return is decoded into an ethers-style split signature.
   *
   * @public
   * @async
   * @param {SignAuthorizationOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code delegateAddr}, optional {@code index}/{@code chainId}/{@code nonce}/{@code provider}
   * @returns {Promise<SignedAuthorizationResult>} Ethers-compatible signed authorization
   * @throws {ValidationError} If required addresses are invalid, {@code chainId} or {@code nonce} can't be resolved (no provider), or numeric values are out of range
   * @throws {NetworkError} If chain id / nonce resolution or the underlying RPC call fails
   * @throws {ContractRevertError} If the underlying view call reverts (e.g. invalid auth proof or yParity)
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * For an authorization targeting a chain different from the SDK's RPC, pass {@code provider} connected to that chain
   * so nonce and chain id stay consistent.
   * Orchestration lives in {@code internal/crypto/signAuthorization.js}; hashing / verification / encoding helpers in
   * {@code internal/crypto/authorization.js} (barrel: {@code internal/crypto/index.js}).
   */
  async signAuthorization(options = {}) {
    return executeSignAuthorization(
      {
        keyVault: this.keyVault,
        fallbackProvider: this.readProvider ?? this.writeSigner?.provider ?? null,
        credentialsSession: this._vaultPipeline.getCredentialsSession(),
        encodeVaultAuthProof: (opts, buildAction) => this._vaultPipeline.encodeAuthProof(opts, buildAction)
      },
      options,
      buildExecuteWithAuthAction
    );
  }

  /**
   * Execute an arbitrary KeyVault implementation function gated by an auth proof (authenticated view).
   *
   * Used internally by {@link Monstera#signAuthorization}; advanced callers can supply their own
   * {@code implCall} bytes when extending KeyVault.
   *
   * @public
   * @async
   * @param {ExecuteWithAuthOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code implCall}
   * @returns {Promise<Bytes>} Raw return bytes from the implementation function
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof or implementation revert)
   * @throws {WalletError} For other unrecognised failures
   */
  async executeWithAuth(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildExecuteWithAuthAction({ implCall: o.implCall }),
      (encoded) => this.keyVault.executeWithAuth(encoded)
    );
  }

  /**
   * List the IDs of all keys imported into a KeyVault (V2).
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Bytes32[]>} Imported key IDs
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getImportedKeyIds(options = {}) {
    return this.keyVault.getImportedKeyIds(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get metadata for an imported key (V2). Does not return private key material.
   *
   * @public
   * @async
   * @param {KeyVaultImportedKeyOptions} options - {@code keyVaultAddr} and {@code keyId}
   * @returns {Promise<KeyMetadataResult>} {@code curve}, {@code chain}, {@code active}, {@code labelHash}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code keyId} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts (e.g. unknown {@code keyId})
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyMetadata(options = {}) {
    return this.keyVault.getKeyMetadata(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Check whether an imported key exists in a KeyVault (V2).
   *
   * @public
   * @async
   * @param {KeyVaultImportedKeyOptions} options - {@code keyVaultAddr} and {@code keyId}
   * @returns {Promise<boolean>} {@code true} if the key exists
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code keyId} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async keyExists(options = {}) {
    return this.keyVault.keyExists(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Sign a digest with an imported key (V2, authenticated view).
   *
   * @public
   * @async
   * @param {SignWithImportedKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}, 32-byte {@code digest}
   * @returns {Promise<Bytes>} Signature bytes (format depends on the imported key's curve)
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async signWithImportedKey(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildSignWithImportedKeyAction({ keyId: o.keyId, digest: o.digest }),
      (encoded) => this.keyVault.signWithImportedKey(encoded)
    );
  }

  /**
   * Get the address (Ethereum address, Solana pubkey, etc.) corresponding to an imported key (V2).
   *
   * @public
   * @async
   * @param {KeyVaultImportedKeyOptions} options - {@code keyVaultAddr} and {@code keyId}
   * @returns {Promise<Bytes>} Address bytes (curve/chain-dependent encoding)
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code keyId} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getImportedKeyAddr(options = {}) {
    return this.keyVault.getImportedKeyAddr(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get the Solana public key for an HD account at {@code index} (V2).
   *
   * @public
   * @async
   * @param {KeyVaultAddrIndexOptions} options - {@code keyVaultAddr} and {@code index}
   * @returns {Promise<Bytes>} Solana public key bytes
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code index} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts (e.g. Solana base keys not configured)
   * @throws {WalletError} For other unrecognised failures
   */
  async getSolanaAddr(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    return this.keyVault.getSolanaAddr(withDefaultAccountIndex(resolved));
  }

  /**
   * Sign a Solana message with the HD account at {@code index} (V2, authenticated view).
   *
   * @public
   * @async
   * @param {SignSolanaOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, {@code message}
   * @returns {Promise<Bytes>} Solana signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async signSolana(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildSignSolanaAction({ index: o.index, message: o.message }),
      (encoded) => this.keyVault.signSolana(encoded)
    );
  }

  // --- Auth Reads ---

  /**
   * Check whether {@code PasswordAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordConfigured(options = {}) {
    return this.auth.password.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Verify a UTF-8 password buffer against the stored hash via {@code PasswordAuthenticator.verify}.
   *
   * @public
   * @async
   * @param {VerifyPasswordOptions} options - {@code keyVaultAddr} and {@code currentPassword} (raw UTF-8 {@link Uint8Array})
   * @returns {Promise<boolean>} {@code true} if the password matches
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code currentPassword} is not a non-empty Uint8Array
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordValid(options = {}) {
    const { keyVaultAddr, authProof, action } = await this._authenticatorPipeline.encodeAuthProof(
      'password',
      options,
      {
        flags: { defaultCurrentPassword: true },
        flowOptions: { includeAuthContext: true, useVerifyProbe: true }
      }
    );
    return this.auth.password.verify({ keyVaultAddr, authProof, action });
  }

  /**
   * Check whether {@code WalletSignatureAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWalletSignatureConfigured(options = {}) {
    return this.auth.walletSignature.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Check whether an address is on a wallet's whitelist.
   *
   * @public
   * @async
   * @param {WhitelistCheckOptions} options - {@code keyVaultAddr} and {@code addressToCheck}
   * @returns {Promise<boolean>} {@code true} if {@code addressToCheck} is whitelisted
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWhitelisted(options = {}) {
    return this.auth.walletSignature.isWhitelisted(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get all whitelisted addresses for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address[]>} Whitelisted addresses
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWhitelist(options = {}) {
    return this.auth.walletSignature.getWhitelist(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get the EIP-712 domain separator for {@code WalletSignatureAuthenticator}.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Bytes32>} 32-byte domain separator
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getDomainSeparator(options = {}) {
    return this.auth.walletSignature.getDomainSeparator(options);
  }

  /**
   * Build a wallet-signature auth proof and verify it on-chain.
   *
   * Useful as a sanity check that a wallet's authenticator accepts a freshly produced proof.
   *
   * @public
   * @async
   * @param {CreateAuthProofWalletSignatureOptions} options - Same inputs as {@link Monstera#createAuthProofWalletSignature}
   * @returns {Promise<boolean>} {@code true} if the on-chain verifier accepts the proof
   * @throws {ValidationError} If required parameters are missing or invalid (proof builder)
   * @throws {NetworkError} If signing or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWalletSignatureValid(options = {}) {
    const { keyVaultAddr, authProof, action } = await this._authenticatorPipeline.encodeAuthProof(
      'walletSignature',
      options,
      {
        flowOptions: { includeAuthContext: true, useVerifyProbe: true }
      }
    );
    return this.auth.walletSignature.verify({
      keyVaultAddr,
      authProof,
      action
    });
  }

  /**
   * Check whether {@code DualFactorAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isDualFactorConfigured(options = {}) {
    return this.auth.dualFactor.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Build and verify a dual-factor auth proof (minute password signature + guardian EIP-712).
   *
   * @public
   * @async
   * @param {CreateAuthProofDualFactorOptions} options - Same inputs as {@link Monstera#createAuthProofDualFactor}
   * @returns {Promise<boolean>} {@code true} if both factors verify
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If provider/signer transports fail or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordDualFactorValid(options = {}) {
    const { keyVaultAddr, authProof, action } = await this._authenticatorPipeline.encodeAuthProof(
      'dualFactor',
      options,
      {
        flowOptions: { includeAuthContext: true, useVerifyProbe: true }
      }
    );
    return this.auth.dualFactor.verify({
      keyVaultAddr,
      authProof,
      action
    });
  }

  /**
   * Get the configured guardian address for a dual-factor wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>} Guardian address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getGuardian(options = {}) {
    return this.auth.dualFactor.getGuardian(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Get the EIP-712 domain separator for {@code DualFactorAuthenticator}.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Bytes32>} 32-byte domain separator
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getDomainSeparatorDualFactor(options = {}) {
    return this.auth.dualFactor.getDomainSeparator(options);
  }

  /**
   * Check whether {@code PasswordMinuteSignatureAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordMinuteSignatureConfigured(options = {}) {
    return this.auth.passwordMinuteSignature.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Build a minute-bucket ECDSA proof from {@code passwordHash} and verify it on-chain.
   *
   * @public
   * @async
   * @param {CreateAuthProofMinuteSignatureOptions} options - Same inputs as {@link Monstera#createAuthProofMinuteSignature}
   * @returns {Promise<boolean>} {@code true} if the signature matches the derived signer for the current minute bucket and action
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read provider fails to return the latest block, or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordMinuteSignatureValid(options = {}) {
    const { keyVaultAddr, authProof, action } = await this._authenticatorPipeline.encodeAuthProof(
      'minuteSignature',
      options,
      {
        flowOptions: { includeAuthContext: true, useVerifyProbe: true } // TODO: should i not add the flag to use password? 
      }
    );
    return this.auth.passwordMinuteSignature.verify({ keyVaultAddr, authProof, action });
  }

  /**
   * Check whether {@code ApiKeySessionAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isApiKeySessionConfigured(options = {}) {
    return this.auth.apiKeySession.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  }

  /**
   * Build and verify an API key session auth proof and verify it on-chain.
   *
   * @public
   * @async
   * @param {import('../types/index.js').CreateAuthProofApiKeySessionVerifyOptions} [options={}] - Optional overrides; defaults from connect credentials and SDK config
   * @returns {Promise<boolean>} {@code true} if the on-chain verifier accepts the proof
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read provider fails to return the latest block, or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isApiKeySessionValid(options = {}) {
    const { keyVaultAddr, authProof, action } = await this._authenticatorPipeline.encodeAuthProof(
      'apiKeySession',
      options,
      {
        flags: { defaultApiKeySecret: true },
        flowOptions: { includeAuthContext: true, useVerifyProbe: true }
      }
    );
    return this.auth.apiKeySession.verify({ keyVaultAddr, authProof, action });
  }

  /**
   * Compute a TOKEN-mode MAC for an API key session via the on-chain pure helper.
   *
   * @public
   * @async
   * @param {ComputeTokenMacOptions} [options={}] - {@code keyVaultAddr} and {@code apiKeySecret} default from connect credentials; {@code chainId} from SDK config; {@code expiry} now + 1h; {@code scopeMask} {@code SCOPE_SIGN_ALL}
   * @returns {Promise<Bytes32>} Token MAC
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code apiKeySecret} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   */
  async computeTokenMac(options = {}) {
    const resolved = await this._resolveApiKeySessionProofOptions(options);
    const expiry = resolved.expiry ?? defaultProofDeadline();
    const scopeMask = resolved.scopeMask ?? SCOPE_SIGN_ALL;

    return this.auth.apiKeySession.computeTokenMac({
      keyVaultAddr: /** @type {Address} */ (resolved.keyVaultAddr),
      apiKeySecret: /** @type {Bytes32} */ (resolved.apiKeySecret),
      chainId: /** @type {ChainId} */ (resolved.chainId),
      expiry,
      scopeMask
    });
  }

  /**
   * Compute an ACTION-mode MAC for an API key session via the on-chain pure helper.
   *
   * @public
   * @async
   * @param {ComputeActionMacOptions} [options={}] - {@code apiKeySecret} defaults from connect credentials; supply {@code action} or {@code actionHash}
   * @returns {Promise<Bytes32>} Action MAC
   * @throws {ValidationError} If {@code apiKeySecret} is not a 32-byte hex string or neither {@code action} nor {@code actionHash} is supplied
   * @throws {NetworkError} If the read call fails over RPC
   */
  async computeActionMac(options = {}) {
    const resolved = await this._resolveApiKeySessionProofOptions(options);
    const actionHash = await resolveActionHash(
      {
        readProvider: this.readProvider,
        chainId: /** @type {ChainId} */ (resolved.chainId),
        keyVaultAddr: /** @type {Address} */ (resolved.keyVaultAddr)
      },
      { action: resolved.action, actionHash: resolved.actionHash }
    );

    return this.auth.apiKeySession.computeActionMac({
      apiKeySecret: /** @type {Bytes32} */ (resolved.apiKeySecret),
      actionHash
    });
  }

  /**
   * Build a TOKEN-mode auth proof via on-chain {@code computeTokenMac} + {@code buildTokenAuthProof}.
   *
   * @public
   * @async
   * @param {BuildTokenAuthProofOptions} [options={}]
   * @returns {Promise<EncodedAuthProofApiKeySession>} ABI-encoded auth proof bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   */
  async buildTokenAuthProof(options = {}) {
    const resolved = await this._resolveApiKeySessionProofOptions(options);
    const expiry = resolved.expiry ?? defaultProofDeadline();
    const scopeMask = resolved.scopeMask ?? SCOPE_SIGN_ALL;
    const mac = await this.computeTokenMac({ ...resolved, expiry, scopeMask });

    return this.auth.apiKeySession.buildTokenAuthProof({
      expiry,
      scopeMask,
      mac
    });
  }

  /**
   * Build an ACTION-mode auth proof via on-chain {@code computeActionMac} + {@code buildActionAuthProof}.
   *
   * @public
   * @async
   * @param {BuildActionAuthProofOptions} [options={}] - Supply {@code action} or {@code actionHash}
   * @returns {Promise<EncodedAuthProofApiKeySession>} ABI-encoded auth proof bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   */
  async buildActionAuthProof(options = {}) {
    const resolved = await this._resolveApiKeySessionProofOptions(options);
    const actionHash = await resolveActionHash(
      {
        readProvider: this.readProvider,
        chainId: /** @type {ChainId} */ (resolved.chainId),
        keyVaultAddr: /** @type {Address} */ (resolved.keyVaultAddr)
      },
      { action: resolved.action, actionHash: resolved.actionHash }
    );
    const mac = await this.auth.apiKeySession.computeActionMac({
      apiKeySecret: /** @type {Bytes32} */ (resolved.apiKeySecret),
      actionHash
    });

    return this.auth.apiKeySession.buildActionAuthProof({ mac });
  }

  /**
   * Get the selector bit for an API key session.
   *
   * @public
   * @async
   * @param {SelectorBitOptions} options - {@code selector}
   * @returns {Promise<SelectorBitResult>} {@code ok} and {@code bit}
   * @throws {ValidationError} If {@code selector} is not a 4-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async selectorBit(options = {}) {
    return this.auth.apiKeySession.selectorBit(await this._vaultPipeline.resolveVaultOptions(options));
  }


  // ============================================================================
  // Write Methods
  // ============================================================================

  // --- Factory Writes ---

  /**
   * Point the factory beacon at a new WalletLogic implementation (admin only).
   *
   * Affects the orchestration layer of every wallet that uses the default beacon — not the
   * KeyVault security layer.
   *
   * @public
   * @async
   * @param {UpdateWalletLogicImplOptions} options - {@code newLogicAddr}
   * @returns {Promise<UpdateWalletLogicImplAddrResult>} Standard write result with parsed {@code newImplAddr}
   * @throws {ValidationError} If {@code newLogicAddr} is missing or invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the factory admin)
   * @throws {EventNotFoundError} If the implementation-update event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Wallets created via {@link Monstera#createWalletWithCustomLogic} do not follow this beacon.
   */
  async updateWalletLogicImplAddr(options = {}) {
    return this.factory.updateWalletLogicImplAddr(options);
  }

  /**
   * Transfer the factory admin role to a new address (admin only).
   *
   * @public
   * @async
   * @param {TransferAdminOptions} options - {@code newAdminAddr}
   * @returns {Promise<TransferAdminResult>} Standard write result with parsed {@code newAdminAddr}
   * @throws {ValidationError} If {@code newAdminAddr} is missing or invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the current admin)
   * @throws {EventNotFoundError} If the {@code AdminTransferred} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async transferAdmin(options = {}) {
    return this.factory.transferAdmin(options);
  }

  /**
   * Allow or disallow an authenticator for new wallet creation (factory admin only).
   *
   * @public
   * @async
   * @param {SetAuthenticatorAllowedOptions} options - {@code authenticatorAddr}, {@code allowed}
   * @returns {Promise<SetAuthenticatorAllowedResult>}
   * @throws {ValidationError} If {@code authenticatorAddr} is missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the factory admin)
   * @throws {EventNotFoundError} If the {@code AuthenticatorAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setAuthenticatorAllowed(options = {}) {
    return this.factory.setAuthenticatorAllowed(options);
  }

  /**
   * Allow or disallow a KeyVault implementation for new wallet creation (factory admin only).
   *
   * @public
   * @async
   * @param {SetKeyVaultImplementationAllowedOptions} options - {@code implementationAddr}, {@code allowed}
   * @returns {Promise<SetKeyVaultImplementationAllowedResult>}
   * @throws {ValidationError} If {@code implementationAddr} is missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the factory admin)
   * @throws {EventNotFoundError} If the {@code KeyVaultImplementationAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setKeyVaultImplementationAllowed(options = {}) {
    return this.factory.setKeyVaultImplementationAllowed(options);
  }

  /**
   * Allow or disallow a KeyVault implementation for a specific wallet via the factory policy registry (factory admin only).
   *
   * @public
   * @async
   * @param {SetWalletImplementationAllowedOptions} options - {@code walletOrKeyVaultAddr}, {@code implementationAddr}, {@code allowed}
   * @returns {Promise<SetWalletImplementationAllowedResult>}
   * @throws {ValidationError} If addresses are missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the factory admin)
   * @throws {EventNotFoundError} If the {@code WalletImplementationAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setWalletImplementationAllowed(options = {}) {
    return this.factory.setWalletImplementationAllowed(await this._resolveWalletOrKeyVaultScope(options));
  }

  /**
   * Allow or disallow an authenticator for a specific wallet via the factory policy registry (factory admin only).
   *
   * @public
   * @async
   * @param {SetWalletAuthenticatorAllowedOptions} options - {@code walletOrKeyVaultAddr}, {@code authenticatorAddr}, {@code allowed}
   * @returns {Promise<SetWalletAuthenticatorAllowedResult>}
   * @throws {ValidationError} If addresses are missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the factory admin)
   * @throws {EventNotFoundError} If the {@code WalletAuthenticatorAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setWalletAuthenticatorAllowed(options = {}) {
    return this.factory.setWalletAuthenticatorAllowed(await this._resolveWalletOrKeyVaultScope(options));
  }

  // --- KeyVault Writes ---

  /**
   * Upgrade a KeyVault proxy to a new implementation address (authenticated write).
   *
   * @public
   * @async
   * @param {UpdateKeyVaultImplOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newKeyVaultImplAddr}
   * @returns {Promise<UpdateKeyVaultImplAddrResult>} Standard write result with parsed {@code newImplAddr}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code KeyVaultImplUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateKeyVaultImplAddr(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildUpgradeImplementationAction({ newImplAddr: o.newImplAddr }),
      (encoded) => this.keyVault.updateKeyVaultImplAddr(encoded)
    );
  }

  /**
   * Upgrade a KeyVault implementation via the custom acknowledgement path.
   *
   * @public
   * @async
   * @param {UpdateKeyVaultImplCustomOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newImplAddr}, {@code customAckHash}
   * @returns {Promise<UpdateKeyVaultImplAddrCustomResult>}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code customAckHash} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code CustomImplementationUpgraded} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateKeyVaultImplAddrCustom(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) =>
        buildUpgradeImplementationCustomAction({
          newImplAddr: o.newImplAddr,
          customAckHash: o.customAckHash
        }),
      (encoded) => this.keyVault.updateKeyVaultImplAddrCustom(encoded)
    );
  }

  /**
   * Swap the authenticator contract bound to a KeyVault (authenticated write).
   *
   * @public
   * @async
   * @param {UpdateAuthenticatorOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newAuthenticatorAddr}
   * @returns {Promise<UpdateAuthenticatorAddrResult>} Standard write result with parsed {@code newAuthenticator}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code AuthenticatorUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateAuthenticatorAddr(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) =>
        buildChangeAuthenticatorAction({
          newAuthenticatorAddr: o.newAuthenticatorAddr,
          newAuthConfig: o.newAuthConfig
        }),
      (encoded) => this.keyVault.updateAuthenticatorAddr(encoded)
    );
  }

  /**
   * Swap the authenticator via the custom acknowledgement path.
   *
   * @public
   * @async
   * @param {UpdateAuthenticatorCustomOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newAuthenticatorAddr}, {@code newAuthConfig}, {@code customAckHash}
   * @returns {Promise<UpdateAuthenticatorAddrCustomResult>}
   * @throws {ValidationError} If addresses, {@code authProof}, {@code newAuthConfig}, or {@code customAckHash} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code CustomAuthenticatorChanged} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateAuthenticatorAddrCustom(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) =>
        buildChangeAuthenticatorCustomAction({
          newAuthenticatorAddr: o.newAuthenticatorAddr,
          newAuthConfig: o.newAuthConfig,
          customAckHash: o.customAckHash
        }),
      (encoded) => this.keyVault.updateAuthenticatorAddrCustom(encoded)
    );
  }

  /**
   * Import an external private key into the KeyVault (V2, authenticated write).
   *
   * @public
   * @async
   * @param {ImportKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code privateKey}, {@code curve}, {@code chain}, {@code labelHash}
   * @returns {Promise<ImportKeyResult>} Standard write result with parsed {@code keyId}
   * @throws {ValidationError} If addresses, {@code authProof}, {@code privateKey}, or metadata fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or duplicate key)
   * @throws {EventNotFoundError} If the {@code KeyImported} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async importKey(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) =>
        buildImportKeyAction({
          keyId: o.keyId,
          privateKey: o.privateKey,
          publicKey: o.publicKey,
          curve: o.curve,
          chain: o.chain,
          label: o.label
        }),
      (encoded) => this.keyVault.importKey(encoded)
    );
  }

  /**
   * Deactivate an imported key (V2, soft delete; authenticated write).
   *
   * The key remains stored but cannot sign until reactivated via {@link Monstera#activateKey}.
   *
   * @public
   * @async
   * @param {DeactivateActivateKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}
   * @returns {Promise<DeactivateKeyResult>} Standard write result with parsed {@code keyId}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code keyId} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or unknown {@code keyId})
   * @throws {EventNotFoundError} If the {@code KeyDeactivated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async deactivateKey(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildDeactivateKeyAction({ keyId: o.keyId }),
      (encoded) => this.keyVault.deactivateKey(encoded)
    );
  }

  /**
   * Reactivate a previously deactivated key (V2, authenticated write).
   *
   * @public
   * @async
   * @param {DeactivateActivateKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}
   * @returns {Promise<ActivateKeyResult>} Standard write result with parsed {@code keyId}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code keyId} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or unknown {@code keyId})
   * @throws {EventNotFoundError} If the {@code KeyActivated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async activateKey(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) => buildActivateKeyAction({ keyId: o.keyId }),
      (encoded) => this.keyVault.activateKey(encoded)
    );
  }

  /**
   * Set HD base keys for a chain (V2, authenticated write).
   *
   * Used to provision deterministic Ed25519 / EVM base keys for chains that derive accounts via index.
   *
   * @public
   * @async
   * @param {SetChainBaseKeysOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code chain}, {@code privateKey} / chain-specific seed material
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If addresses, {@code authProof}, {@code chain}, or seed material are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or already provisioned)
   * @throws {WalletError} For other unrecognised failures
   */
  async setChainBaseKeys(options = {}) {
    return this._vaultPipeline.invokeWithAuthProof(
      options,
      (o) =>
        buildSetChainBaseKeysAction({
          chain: o.chain,
          basePrivateKey: o.basePrivateKey,
          baseChainCode: o.baseChainCode
        }),
      (encoded) => this.keyVault.setChainBaseKeys(encoded)
    );
  }

  // --- Auth Writes ---

  /**
   * Replace the password hash on {@code PasswordAuthenticator} (current password bytes must match the stored hash).
   *
   * @public
   * @async
   * @param {UpdatePasswordOptions} options - {@code keyVaultAddr}, {@code currentPassword} (UTF-8 {@link Uint8Array}), {@code newPasswordHash}
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If {@code keyVaultAddr}/{@code newPasswordHash} are invalid or {@code currentPassword} is not a non-empty Uint8Array
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. wrong current password)
   * @throws {EventNotFoundError} If the {@code PasswordUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePassword(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'password',
      options,
      { defaultCurrentPassword: true },
      (resolved, authenticatorAddr) =>
        buildChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.password.updatePassword({
          keyVaultAddr,
          currentPassword: authProof,
          newPasswordHash
        })
    );
  }

  /**
   * Add an address to a wallet's whitelist using a freshly built wallet-signature proof.
   *
   * Internally calls {@link Monstera#createAuthProofWalletSignature} with the same {@code options}, then forwards
   * to {@link WalletSignatureAuthenticatorClient#addToWhitelist}.
   *
   * @public
   * @async
   * @param {AddWhitelistOptions} options - {@code keyVaultAddr}, {@code signer} (whitelisted), {@code addressToAdd}, optional EIP-712 fields
   * @returns {Promise<AddToWhitelistResult>} Standard write result with parsed {@code addedAddress}
   * @throws {ValidationError} If addresses, {@code signer}, or proof inputs are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or address already whitelisted)
   * @throws {EventNotFoundError} If the {@code AddressAddedToWhitelist} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async addToWhitelist(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'walletSignature',
      options,
      {},
      (resolved, authenticatorAddr) =>
        buildAddToWhitelistAction(authenticatorAddr, resolved.addressToAdd),
      ({ keyVaultAddr, authProof, addressToAdd }) =>
        this.auth.walletSignature.addToWhitelist({ keyVaultAddr, authProof, addressToAdd })
    );
  }

  /**
   * Remove an address from a wallet's whitelist using a freshly built wallet-signature proof.
   *
   * @public
   * @async
   * @param {RemoveWhitelistOptions} options - {@code keyVaultAddr}, {@code signer} (whitelisted), {@code addressToRemove}, optional EIP-712 fields
   * @returns {Promise<RemoveFromWhitelistResult>} Standard write result with parsed {@code removedAddress}
   * @throws {ValidationError} If addresses, {@code signer}, or proof inputs are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof, last whitelisted address)
   * @throws {EventNotFoundError} If the {@code AddressRemovedFromWhitelist} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async removeFromWhitelist(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'walletSignature',
      options,
      {},
      (resolved, authenticatorAddr) =>
        buildRemoveFromWhitelistAction(authenticatorAddr, resolved.addressToRemove),
      ({ keyVaultAddr, authProof, addressToRemove }) =>
        this.auth.walletSignature.removeFromWhitelist({ keyVaultAddr, authProof, addressToRemove })
    );
  }

  /**
   * Replace the password hash on {@code DualFactorAuthenticator} (dual-factor auth required).
   *
   * Internally calls {@link Monstera#createAuthProofDualFactor} with the same {@code options}, then forwards
   * to {@link DualFactorAuthenticatorClient#updatePassword}.
   *
   * @public
   * @async
   * @param {UpdatePasswordDualFactorOptions} options - {@code keyVaultAddr}, {@code passwordHash} (current), {@code newPasswordHash}, guardian {@code signer}, optional {@code deadline}/{@code chainId}/{@code authenticatorAddr}
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If addresses, password hashes, {@code signer}, or {@code deadline} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code PasswordUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePasswordDualFactor(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'dualFactor',
      options,
      {},
      (resolved, authenticatorAddr) =>
        buildDualFactorChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.dualFactor.updatePassword({ keyVaultAddr, authProof, newPasswordHash })
    );
  }

  /**
   * Replace the guardian address on {@code DualFactorAuthenticator} (dual-factor auth required).
   *
   * @public
   * @async
   * @param {UpdateGuardianOptions} options - {@code keyVaultAddr}, {@code passwordHash} (current), {@code newGuardian}, current guardian {@code signer}, optional {@code deadline}/{@code chainId}/{@code authenticatorAddr}
   * @returns {Promise<UpdateGuardianResult>} Standard write result with parsed {@code newGuardian}
   * @throws {ValidationError} If addresses, {@code passwordHash}, {@code signer}, or {@code deadline} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code GuardianUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateGuardian(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'dualFactor',
      options,
      {},
      (resolved, authenticatorAddr) =>
        buildChangeGuardianAction(authenticatorAddr, resolved.newGuardian),
      ({ keyVaultAddr, authProof, newGuardian }) =>
        this.auth.dualFactor.updateGuardian({ keyVaultAddr, authProof, newGuardian })
    );
  }

  /**
   * Replace the password hash on {@code PasswordMinuteSignatureAuthenticator}
   * (current password bytes must match the stored hash).
   *
   * @public
   * @async
   * @param {UpdatePasswordOptions} options - {@code keyVaultAddr}, {@code currentPassword} (UTF-8 {@link Uint8Array}), {@code newPasswordHash}
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If {@code keyVaultAddr}/{@code newPasswordHash} are invalid or {@code currentPassword} is not a non-empty Uint8Array
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. wrong current password)
   * @throws {EventNotFoundError} If the {@code PasswordUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePasswordMinuteSignature(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'password',
      options,
      { defaultCurrentPassword: true },
      (resolved, authenticatorAddr) =>
        buildMinuteSignatureChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.passwordMinuteSignature.updatePassword({
          keyVaultAddr,
          currentPassword: authProof,
          newPasswordHash
        }),
      { authenticatorAddr: this.config.addresses.passwordMinuteSignatureAuth }
    );
  }

  /**
   * Rotate the API key for an API key session.
   *
   * @public
   * @async
   * @param {RotateApiKeyOptions} options - {@code newApiKeySecret} required; {@code keyVaultAddr} and current {@code apiKeySecret} default from connect credentials; ACTION-mode {@code authProof} built internally
   * @returns {Promise<RotateApiKeyResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If addresses or {@code newApiKeySecret} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or new API key hash is zero)
   * @throws {EventNotFoundError} If the {@code ApiKeyRotated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async rotateApiKey(options = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      'apiKeySession',
      options,
      { defaultApiKeySecret: true },
      (resolved, authenticatorAddr) => buildRotateApiKeyAction(authenticatorAddr, resolved.newApiKeySecret),
      ({ keyVaultAddr, authProof, newApiKeySecret }) =>
        this.auth.apiKeySession.rotateApiKey({
          keyVaultAddr,
          authProof,
          newApiKeySecret
        })
    );
  }
}

export default Monstera;
