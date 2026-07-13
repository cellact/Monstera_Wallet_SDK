/**
 * Monstera Wallet SDK — top-level facade ({@link Monstera}).
 *
 * Public entry point that wires the read provider and Sapphire-wrapped write signer to the
 * four domain clients and offers high-level helpers that accept structured options.
 *
 * Domain methods live in {@code src/sdk/domains/} and are composed onto this class at load time.
 * Operation recipes ({@code MonsteraRecipes}) are mixed first so all domains share the same call patterns.
 * See {@code docs/architecture.md} for the execution map.
 *
 * @module sdk/Monstera
 */

/// <reference path="./Monstera.domain-methods.d.ts" />

import MonsteraConfig from '../config/monstera.js';
import MonsteraUtils from './MonsteraUtils.js';
import log from '../internal/logger.js';
import WalletFactoryClient from '../clients/factory/index.js';
import WalletLogicClient from '../clients/logic/index.js';
import KeyVaultClient from '../clients/keyVault/index.js';
import { AuthenticatorClient } from '../clients/auth/index.js';
import { createProvider, createWriteSigner } from '../providers/sapphire.js';
import { assertValidResolvedConfig } from '../internal/validators/networkConfig.js';
import { EncodeAuthConfig } from '../internal/auth/config/EncodeAuthConfig.js';
import { AuthProofPipeline } from '../internal/auth/proof/AuthProofPipeline.js';
import { CredentialsSession } from '../internal/auth/session/CredentialsSession.js';
import { parseConnectCredentials } from '../internal/validators/connectOptions.js';
import { VaultCallPipeline } from '../internal/auth/session/VaultCallPipeline.js';
import { AuthenticatorCallPipeline } from '../internal/auth/session/AuthenticatorCallPipeline.js';
import { SCOPE_ALL, SCOPE_SIGN_ALL } from '../internal/auth/apiKeySession/constants.js';
import { monsteraRecipeMethods } from './domains/MonsteraRecipes.js';
import { monsteraSessionMethods } from './domains/MonsteraSession.js';
import { monsteraAuthMethods } from './domains/MonsteraAuth.js';
import { monsteraFactoryMethods } from './domains/MonsteraFactory.js';
import { monsteraKeyVaultMethods } from './domains/MonsteraKeyVault.js';
import { monsteraSigningMethods } from './domains/MonsteraSigning.js';

/**
 * Main entry point for Monstera wallet operations on Oasis Sapphire.
 *
 * Domain methods are mixed onto the prototype from {@code src/sdk/domains/} at load time.
 *
 * @public
 * @property {MonsteraConfigOptions} config - Resolved network and contract configuration
 * @property {string} version - SDK version string
 * @property {EthersAbstractProvider} readProvider - Provider for read-only RPC calls
 * @property {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for writes, or null
 * @property {WalletFactoryClient} factory - WalletFactory client
 * @property {WalletLogicClient} logic - WalletLogic client
 * @property {KeyVaultClient} keyVault - KeyVault client
 * @property {AuthenticatorClient} auth - Authenticator client
 * @property {CredentialsSession | null} _credentialsSession - End-user credentials session, if connected with credentials
 * @property {AuthProofPipeline} _authProofPipeline - Auth-proof encoding pipeline
 * @property {VaultCallPipeline} _vaultPipeline - Vault-authenticated write pipeline
 * @property {AuthenticatorCallPipeline} _authenticatorPipeline - Authenticator management write pipeline
 * @property {EncodeAuthConfig} _encodeAuthConfig - Auth config encoder
 */
class Monstera {
  constructor(config) {
    const parsedCredentials = parseConnectCredentials(config?.credentials);
    const { credentials: _credentials, ...resolvedConfig } = config ?? {};

    assertValidResolvedConfig(resolvedConfig);
    /** @type {MonsteraConfigOptions} */
    this.config = resolvedConfig;
    /** @type {string} */
    this.version = MonsteraConfig.version;

    // Initialize read provider (for read operations)
    /** @type {EthersAbstractProvider} */
    this.readProvider = resolvedConfig.provider ?? createProvider(resolvedConfig.rpcUrl, 'read');
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    /** @type {WrappedEthersSigner | null} */
    this.writeSigner = resolvedConfig.signer ? createWriteSigner(resolvedConfig.signer, resolvedConfig.rpcUrl, 'write') : null;

    // Wire domain clients
    /** @type {WalletFactoryClient} */
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, resolvedConfig);
    /** @type {WalletLogicClient} */
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, resolvedConfig);
    /** @type {KeyVaultClient} */
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, resolvedConfig);
    /** @type {AuthenticatorClient} */
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, resolvedConfig);

    /** @type {CredentialsSession | null} */
    this._credentialsSession = parsedCredentials
      ? new CredentialsSession(parsedCredentials, {
          hashUsername: (opts) => this.factory.hashUsername(opts),
          walletOfUsername: (opts) => this.factory.walletOfUsername(opts),
          getKeyVaultAddr: (opts) => this.factory.getKeyVaultAddr(opts)
        })
      : null;

    /** @type {AuthProofPipeline} */
    this._authProofPipeline = new AuthProofPipeline({
      config: resolvedConfig,
      readProvider: this.readProvider,
      getAuthenticatorAddr: (keyVaultAddr) => this.getAuthenticatorAddr({ keyVaultAddr })
    });

    /** @type {VaultCallPipeline} */
    this._vaultPipeline = new VaultCallPipeline({
      credentialsSession: this._credentialsSession,
      authProofPipeline: this._authProofPipeline
    });

    /** @type {AuthenticatorCallPipeline} */
    this._authenticatorPipeline = new AuthenticatorCallPipeline({
      credentialsSession: this._credentialsSession,
      authProofPipeline: this._authProofPipeline
    });
    /** @type {EncodeAuthConfig} */
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
  // Instance Properties (Convenience Getters)
  // ============================================================================

  /** @returns {string} Network name */
  get network() { return this.config.network; }

  /** @returns {ChainId} Chain ID */
  get chainId() { return this.config.chainId; }

  /** @returns {string} RPC URL */
  get rpcUrl() { return this.config.rpcUrl; }

  /** @returns {ContractAddresses} Contract addresses */
  get addresses() { return this.config.addresses; }

  /** @returns {EthersProvider|null} Provider instance or null */
  get provider() { return this.config.provider; }

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
}

Object.assign(
  Monstera.prototype,
  monsteraRecipeMethods,
  monsteraSessionMethods,
  monsteraAuthMethods,
  monsteraFactoryMethods,
  monsteraKeyVaultMethods,
  monsteraSigningMethods
);

export default Monstera;
