/**
 * MonsteraAuth domain methods for {@link Monstera}.
 * Mixed onto {@link Monstera} prototype at construction time.
 *
 * @module sdk/domains/MonsteraAuth
 */

import {
  buildChangePasswordAction,
  buildDualFactorChangePasswordAction,
  buildChangeGuardianAction,
  buildAddToWhitelistAction,
  buildRemoveFromWhitelistAction,
  buildMinuteSignatureChangePasswordAction,
  buildRotateApiKeyAction,
  buildAddAuthenticatorAction,
  buildRemoveAuthenticatorAction,
  buildPasswordOrWalletChangePasswordAction,
  buildPasswordOrWalletAddToWhitelistAction,
  buildPasswordOrWalletRemoveFromWhitelistAction,
  buildPasswordOrWalletAddToWhitelistWithProofAction,
} from '../../internal/auth/context/actions/index.js';
import { createLinkWalletSignature } from '../../internal/auth/proof/createAuthProof.js';
import { resolveActionHash } from '../../internal/auth/context/createAuthContext.js';
import { defaultProofDeadline } from '../../internal/auth/authenticators/deadline.js';
import { SCOPE_SIGN_ALL } from '../../internal/auth/apiKeySession/constants.js';
import { hexlify, keccak256, randomBytes } from '../../adapters/ethers/hashing.js';
import { defineDomainMethods } from './defineDomainMethods.js';

export const monsteraAuthMethods = defineDomainMethods({
  /**
   * Build the EIP-712 {@code authProof} for {@code WalletSignatureAuthenticator}.
   *
   * Signs {@code WalletAuth(wallet, actionHash, deadline)} typed data with the supplied {@code signer} and ABI-encodes
   * {@code (uint256 deadline, bytes signature)}. {@code authenticatorAddr} and {@code deadline},
   * default from the SDK config (deadline = now + 1 hour). Sapphire {@code chainId} always comes from SDK config.
   *
   * @public
   * @async
   * @param {CreateAuthProofWalletSignatureOptions} options - Inputs for the proof ({@code action} or {@code actionHash} required)
   * @returns {Promise<EncodedAuthProofWalletSignature>} ABI-encoded auth proof bytes
   * @throws {ValidationError} If {@code signer} is not a {@link EthersWallet}/{@link EthersHDNodeWallet}, addresses or {@code deadline} are invalid, or neither {@code action} nor {@code actionHash} is supplied
   * @throws {NetworkError} If the signer's transport fails during typed-data signing
   * @throws {WalletError} For other unrecognised signing failures
   */
  async createAuthProofWalletSignature(options = {}) {
    const { authProof } = await this._encodeAuthenticatorManaged({ flowId: 'walletSignature', options });
    return authProof;
  },

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
   * @param {CreateAuthProofMinuteSignatureOptions} options - Inputs ({@code keyVaultAddr}, {@code passwordHash}, {@code action} or {@code actionHash}, optional {@code authenticatorAddr})
   * @returns {Promise<CreateAuthProofMinuteSignatureResult>} Encoded auth proof, minute bucket, and derived signer address
   * @throws {ValidationError} If {@code keyVaultAddr}, {@code authenticatorAddr} are missing/invalid, {@code passwordHash} is not a 32-byte hex string, or neither {@code action} nor {@code actionHash} is supplied
   * @throws {NetworkError} If the read provider fails to return the latest block
   */
  async createAuthProofMinuteSignature(options = {}) {
    const { authProof, minuteBucket, derivedAddress } = await this._encodeAuthenticatorManaged({
      flowId: 'minuteSignature',
      options
    });
    return { authProof, minuteBucket, derivedAddress };
  },

  /**
   * Build the {@code authProof} for {@code DualFactorAuthenticator}.
   *
   * @public
   * @async
   * @param {CreateAuthProofDualFactorOptions} options
   * @returns {Promise<EncodedAuthProofDualFactor>},
   */
  async createAuthProofDualFactor(options = {}) {
    const { authProof } = await this._encodeAuthenticatorManaged({ flowId: 'dualFactor', options });
    return authProof;
  },

  /**
   * Build the routed {@code authProof} for {@code MultiAuthenticator}.
   *
   * ABI-encodes {@code (address child, bytes childProof)} by delegating proof construction to the
   * selected child authenticator ({@code childFlowId} or {@code child}). Session password and API
   * key material are merged when connect credentials are active.
   *
   * @public
   * @async
   * @param {CreateAuthProofMultiOptions} options
   * @returns {Promise<EncodedAuthProofMulti>},
   */
  async createAuthProofMulti(options = {}) {
    const { authProof } = await this._encodeAuthenticatorManaged({
      flowId: 'multi',
      options,
      config: { flags: { defaultCurrentPassword: true, defaultApiKeySecret: true } }
    });
    return authProof;
  },

  /**
   * Build the unified {@code authProof} for {@code PasswordOrWalletSignatureAuthenticator}.
   *
   * ABI-encodes {@code (uint8 method, bytes methodProof)} using password (session default) or a
   * whitelisted wallet signature. Method is inferred from {@code signer} vs {@code password} when omitted.
   *
   * @public
   * @async
   * @param {CreateAuthProofPasswordOrWalletSignatureOptions} options
   * @returns {Promise<EncodedAuthProofPasswordOrWalletSignature>},
   */
  async createAuthProofPasswordOrWalletSignature(options = {}) {
    const { authProof } = await this._encodeAuthenticatorManaged({
      flowId: 'passwordOrWalletSignature',
      options,
      config: { flags: { defaultCurrentPassword: true } }
    });
    return authProof;
  },

  // /**
  //  * Build the {@code authProof} for {@code ApiKeySessionAuthenticator}.
  //  *
  //  * MAC computation and ABI encoding delegate to the on-chain pure helpers
  //  * ({@code computeTokenMac}/{@code computeActionMac} + {@code buildTokenAuthProof}/{@code buildActionAuthProof}).
  //  *
  //  * ACTION mode (default): binds the proof to {@code action} or {@code actionHash}.
  //  * TOKEN mode: mint a bearer token when {@code mode === 'token'} or {@code expiry}/{@code scopeMask},
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
  // },

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
   * @param {ConfigurePasswordOptions} options - Optional {@code keyVaultAddr} (resolved from credentials when omitted) and 32-byte {@code passwordHash},
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
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.passwordAuth,
      buildAuthConfigInput: (resolved) => ({ passwordHash: resolved.passwordHash }),
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.password.configure({ keyVaultAddr, authConfig })
    });
  },

  /**
   * Configure {@code WalletSignatureAuthenticator} for a wallet by ABI-encoding {@code initialWhitelist}.
   *
   * Delegates to {@link WalletSignatureAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigureWalletSignatureOptions} options - Optional {@code keyVaultAddr} and {@code initialWhitelist} (at least one address)
   * @returns {Promise<ConfigureWalletSignatureResult>} Standard write result with parsed {@code wallet} and {@code initialWhitelist},
   * @throws {ValidationError} If {@code keyVaultAddr} or any whitelist address is invalid, or {@code initialWhitelist} is empty
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configureWalletSignature(options = {}) {
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.walletSignatureAuth,
      buildAuthConfigInput: (resolved) => ({ initialWhitelist: resolved.initialWhitelist }),
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.walletSignature.configure({ keyVaultAddr, authConfig })
    });
  },

  /**
   * Configure {@code DualFactorAuthenticator} for a wallet by ABI-encoding {@code (passwordHash, guardianAddr)}.
   *
   * Delegates to {@link DualFactorAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigureDualFactorOptions} options - Optional {@code keyVaultAddr}, 32-byte {@code passwordHash}, guardian {@code guardianAddr},
   * @returns {Promise<ConfigurePasswordDualFactorResult>} Standard write result with parsed {@code wallet} and {@code guardian},
   * @throws {ValidationError} If {@code keyVaultAddr}/{@code guardianAddr} are invalid or {@code passwordHash} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configureDualFactor(options = {}) {
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.dualFactorAuth,
      buildAuthConfigInput: (resolved) => ({
        passwordHash: resolved.passwordHash,
        guardianAddr: resolved.guardianAddr
      }),
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.dualFactor.configure({ keyVaultAddr, authConfig })
    });
  },

  /**
   * Configure {@code PasswordMinuteSignatureAuthenticator} for a wallet by storing the password hash on-chain.
   *
   * Delegates to {@link PasswordMinuteSignatureAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigurePasswordMinuteOptions} options - Optional {@code keyVaultAddr} and 32-byte {@code passwordHash},
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
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.passwordMinuteSignatureAuth,
      buildAuthConfigInput: (resolved) => ({ passwordHash: resolved.passwordHash }),
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.passwordMinuteSignature.configure({ keyVaultAddr, authConfig })
    });
  },

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
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.apiKeySessionAuth,
      resolveFlags: { defaultApiKeySecret: true },
      buildAuthConfigInput: (resolved) => ({ apiKeySecret: resolved.apiKeySecret }),
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.apiKeySession.configure({ keyVaultAddr, authConfig })
    });
  },

  /**
   * Configure {@code PasswordOrWalletSignatureAuthenticator} for a wallet.
   *
   * Encodes {@code abi.encode(bytes32 passwordHash, address[] initialWhitelist)}. {@code passwordHash},
   * defaults from connect credentials when omitted.
   *
   * @public
   * @async
   * @param {ConfigurePasswordOrWalletSignatureOptions} options - Optional {@code keyVaultAddr}, {@code passwordHash}, {@code initialWhitelist},
   * @returns {Promise<ConfigurePasswordOrWalletSignatureResult>},
   */
  async configurePasswordOrWalletSignature(options = {}) {
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.passwordOrWalletSigAuth,
      resolveFlags: { defaultCurrentPassword: true },
      buildAuthConfigInput: (resolved) => {
        const passwordHash =
          resolved.passwordHash ??
          (resolved.currentPassword ? keccak256(resolved.currentPassword) : undefined) ??
          (this._credentialsSession?.hasPassword()
            ? this._credentialsSession.getPasswordHash()
            : undefined);

        return { passwordHash, initialWhitelist: resolved.initialWhitelist };
      },
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.passwordOrWalletSignature.configure({ keyVaultAddr, authConfig })
    });
  },

  /**
   * Configure {@code MultiAuthenticator} for a wallet.
   *
   * Encodes structured {@code authConfig.children} entries into
   * {@code abi.encode(address[] children, bytes[] childConfigs)} before delegating to
   * {@link MultiAuthenticatorClient#configure}.
   *
   * @public
   * @async
   * @param {ConfigureMultiAuthenticatorOptions} options - {@code keyVaultAddr} and structured multi {@code authConfig},
   * @returns {Promise<ConfigureMultiAuthenticatorResult>},
   */
  async configureMultiAuthenticator(options = {}) {
    return this._configureAuthenticator({
      options,
      authenticatorAddr: this.config.addresses.multiAuthenticator,
      buildAuthConfigInput: (resolved) => resolved.authConfig,
      invoke: ({ keyVaultAddr, authConfig }) =>
        this.auth.multi.configure({ keyVaultAddr, authConfig })
    });
  },


  // --- Auth Reads ---

  /**
   * Check whether {@code PasswordAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordConfigured(options = {}) {
    return this.auth.password.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  },

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
    return this._verifyAuthenticatorManaged({
      flowId: 'password',
      options,
      flags: { defaultCurrentPassword: true },
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.password.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Check whether {@code WalletSignatureAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWalletSignatureConfigured(options = {}) {
    return this.auth.walletSignature.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether an address is on a wallet's whitelist.
   *
   * @public
   * @async
   * @param {WhitelistCheckOptions} options - {@code keyVaultAddr} and {@code addressToCheck},
   * @returns {Promise<boolean>} {@code true} if {@code addressToCheck} is whitelisted
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWhitelisted(options = {}) {
    return this.auth.walletSignature.isWhitelisted(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get all whitelisted addresses for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Address[]>} Whitelisted addresses
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWhitelist(options = {}) {
    return this.auth.walletSignature.getWhitelist(await this._vaultPipeline.resolveVaultOptions(options));
  },

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
  },

  /**
   * Build a wallet-signature auth proof and verify it on-chain.
   *
   * Useful as a sanity check that a wallet's authenticator accepts a freshly produced proof.
   *
   * @public
   * @async
   * @param {CreateAuthProofWalletSignatureOptions} options - Same inputs as {@link Monstera#createAuthProofWalletSignature},
   * @returns {Promise<boolean>} {@code true} if the on-chain verifier accepts the proof
   * @throws {ValidationError} If required parameters are missing or invalid (proof builder)
   * @throws {NetworkError} If signing or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWalletSignatureValid(options = {}) {
    return this._verifyAuthenticatorManaged({
      flowId: 'walletSignature',
      options,
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.walletSignature.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Check whether {@code DualFactorAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isDualFactorConfigured(options = {}) {
    return this.auth.dualFactor.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Build and verify a dual-factor auth proof (minute password signature + guardian EIP-712).
   *
   * @public
   * @async
   * @param {CreateAuthProofDualFactorOptions} options - Same inputs as {@link Monstera#createAuthProofDualFactor},
   * @returns {Promise<boolean>} {@code true} if both factors verify
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If provider/signer transports fail or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordDualFactorValid(options = {}) {
    return this._verifyAuthenticatorManaged({
      flowId: 'dualFactor',
      options,
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.dualFactor.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Get the configured guardian address for a dual-factor wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Address>} Guardian address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getGuardian(options = {}) {
    return this.auth.dualFactor.getGuardian(await this._vaultPipeline.resolveVaultOptions(options));
  },

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
  },

  /**
   * Check whether {@code PasswordMinuteSignatureAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordMinuteSignatureConfigured(options = {}) {
    return this.auth.passwordMinuteSignature.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Build a minute-bucket ECDSA proof from {@code passwordHash} and verify it on-chain.
   *
   * @public
   * @async
   * @param {CreateAuthProofMinuteSignatureOptions} options - Same inputs as {@link Monstera#createAuthProofMinuteSignature},
   * @returns {Promise<boolean>} {@code true} if the signature matches the derived signer for the current minute bucket and action
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read provider fails to return the latest block, or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isPasswordMinuteSignatureValid(options = {}) {
    return this._verifyAuthenticatorManaged({
      flowId: 'minuteSignature',
      options,
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.passwordMinuteSignature.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Check whether {@code ApiKeySessionAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isApiKeySessionConfigured(options = {}) {
    return this.auth.apiKeySession.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether {@code MultiAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>},
   */
  async isMultiAuthenticatorConfigured(options = {}) {
    return this.auth.multi.isConfigured(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * List enabled child authenticators for a multi-authenticated wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address[]>},
   */
  async getMultiAuthenticators(options = {}) {
    return this.auth.multi.getAuthenticators(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether a child authenticator is enabled for a multi-authenticated wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions & { child: Address }} options
   * @returns {Promise<boolean>},
   */
  async isMultiAuthenticatorChildEnabled(options = {}) {
    return this.auth.multi.isEnabled(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Build a routed multi-authenticator proof and verify it on-chain.
   *
   * @public
   * @async
   * @param {CreateAuthProofMultiOptions} [options={}] - {@code childFlowId} or {@code child} required; session password/API key defaults apply
   * @returns {Promise<boolean>} {@code true} if the on-chain verifier accepts the routed child proof
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read provider fails to return the latest block, or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isMultiValid(options = {}) {
    return this._verifyAuthenticatorManaged({
      flowId: 'multi',
      options,
      flags: { defaultCurrentPassword: true, defaultApiKeySecret: true },
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.multi.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Check whether {@code PasswordOrWalletSignatureAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>},
   */
  async isPasswordOrWalletSignatureConfigured(options = {}) {
    return this.auth.passwordOrWalletSignature.isConfigured(
      await this._vaultPipeline.resolveVaultOptions(options)
    );
  },

  /**
   * Check whether an address is whitelisted on a password-or-wallet-signature wallet.
   *
   * @public
   * @async
   * @param {WhitelistCheckOptions} options
   * @returns {Promise<boolean>},
   */
  async isPasswordOrWalletSignatureWhitelisted(options = {}) {
    return this.auth.passwordOrWalletSignature.isWhitelisted(
      await this._vaultPipeline.resolveVaultOptions(options)
    );
  },

  /**
   * Get all whitelisted addresses for a password-or-wallet-signature wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address[]>},
   */
  async getPasswordOrWalletSignatureWhitelist(options = {}) {
    return this.auth.passwordOrWalletSignature.getWhitelist(
      await this._vaultPipeline.resolveVaultOptions(options)
    );
  },

  /**
   * Check whether a wallet-link nonce has already been consumed.
   *
   * @public
   * @async
   * @param {IsPasswordOrWalletSignatureLinkNonceUsedOptions} options
   * @returns {Promise<boolean>},
   */
  async isPasswordOrWalletSignatureLinkNonceUsed(options = {}) {
    return this.auth.passwordOrWalletSignature.isLinkNonceUsed(
      await this._vaultPipeline.resolveVaultOptions(options)
    );
  },

  /**
   * Get the EIP-712 domain separator for {@code PasswordOrWalletSignatureAuthenticator}.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @returns {Promise<Bytes32>},
   */
  async getPasswordOrWalletSignatureDomainSeparator(options = {}) {
    return this.auth.passwordOrWalletSignature.getDomainSeparator(options);
  },

  /**
   * Compute the params hash for wallet-link operations on {@code PasswordOrWalletSignatureAuthenticator}.
   *
   * @public
   * @async
   * @param {ComputePasswordOrWalletSignatureLinkParamsHashOptions} options - {@code deadline} defaults to now + 1 hour
   * @returns {Promise<Bytes32>},
   */
  async computePasswordOrWalletSignatureLinkParamsHash(options = {}) {
    const { addressToAdd, nonce, deadline = defaultProofDeadline() } = options;
    return this.auth.passwordOrWalletSignature.computeLinkParamsHash({
      addressToAdd,
      nonce,
      deadline,
    });
  },

  /**
   * Compute the action hash for {@code addToWhitelistWithProof} on {@code PasswordOrWalletSignatureAuthenticator}.
   *
   * @public
   * @async
   * @param {ComputePasswordOrWalletSignatureLinkActionHashOptions} options - {@code keyVaultAddr} defaults from session; {@code deadline} defaults to now + 1 hour
   * @returns {Promise<Bytes32>},
   */
  async computePasswordOrWalletSignatureLinkActionHash(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    const { keyVaultAddr, addressToAdd, nonce, deadline = defaultProofDeadline() } = resolved;
    return this.auth.passwordOrWalletSignature.computeLinkActionHash({
      keyVaultAddr,
      addressToAdd,
      nonce,
      deadline,
    });
  },

  /**
   * Build a password-or-wallet-signature auth proof and verify it on-chain.
   *
   * @public
   * @async
   * @param {CreateAuthProofPasswordOrWalletSignatureOptions} [options={}]
   * @returns {Promise<boolean>},
   */
  async isPasswordOrWalletSignatureValid(options = {}) {
    return this._verifyAuthenticatorManaged({
      flowId: 'passwordOrWalletSignature',
      options,
      flags: { defaultCurrentPassword: true },
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.passwordOrWalletSignature.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Build and verify an API key session auth proof and verify it on-chain.
   *
   * @public
   * @async
   * @param {CreateAuthProofApiKeySessionVerifyOptions} [options={}] - Optional overrides; defaults from connect credentials and SDK config
   * @returns {Promise<boolean>} {@code true} if the on-chain verifier accepts the proof
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the read provider fails to return the latest block, or the verify RPC call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isApiKeySessionValid(options = {}) {
    return this._verifyAuthenticatorManaged({
      flowId: 'apiKeySession',
      options,
      flags: { defaultApiKeySecret: true },
      verify: ({ keyVaultAddr, authProof, action }) =>
        this.auth.apiKeySession.verify({ keyVaultAddr, authProof, action })
    });
  },

  /**
   * Compute a TOKEN-mode MAC for an API key session via the on-chain pure helper.
   *
   * @public
   * @async
   * @param {ComputeTokenMacOptions} [options={}] - {@code keyVaultAddr} and {@code apiKeySecret} default from connect credentials; {@code chainId} from SDK config; {@code expiry} now + 1h; {@code scopeMask} {@code SCOPE_SIGN_ALL},
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
  },

  /**
   * Compute an ACTION-mode MAC for an API key session via the on-chain pure helper.
   *
   * @public
   * @async
   * @param {ComputeActionMacOptions} [options={}] - {@code apiKeySecret} defaults from connect credentials; supply {@code action} or {@code actionHash},
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
  },

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
  },

  /**
   * Build an ACTION-mode auth proof via on-chain {@code computeActionMac} + {@code buildActionAuthProof}.
   *
   * @public
   * @async
   * @param {BuildActionAuthProofOptions} [options={}] - Supply {@code action} or {@code actionHash},
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
  },

  /**
   * Get the selector bit for an API key session.
   *
   * @public
   * @async
   * @param {SelectorBitOptions} options - {@code selector},
   * @returns {Promise<SelectorBitResult>} {@code ok} and {@code bit},
   * @throws {ValidationError} If {@code selector} is not a 4-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async selectorBit(options = {}) {
    return this.auth.apiKeySession.selectorBit(await this._vaultPipeline.resolveVaultOptions(options));
  },

  // --- Auth Writes ---

  /**
   * Replace the password hash on {@code PasswordAuthenticator} (current password bytes must match the stored hash).
   *
   * @public
   * @async
   * @param {UpdatePasswordOptions} options - {@code keyVaultAddr}, {@code currentPassword} (UTF-8 {@link Uint8Array}), {@code newPasswordHash},
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet},
   * @throws {ValidationError} If {@code keyVaultAddr}/{@code newPasswordHash} are invalid or {@code currentPassword} is not a non-empty Uint8Array
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. wrong current password)
   * @throws {EventNotFoundError} If the {@code PasswordUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePassword(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'password',
      options,
      flags: { defaultCurrentPassword: true },
      buildAction: (resolved, authenticatorAddr) =>
        buildChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      invoke: ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.password.updatePassword({
          keyVaultAddr,
          currentPassword: authProof,
          newPasswordHash
        })
    });
  },

  /**
   * Add an address to a wallet's whitelist using a freshly built wallet-signature proof.
   *
   * Internally calls {@link Monstera#createAuthProofWalletSignature} with the same {@code options}, then forwards
   * to {@link WalletSignatureAuthenticatorClient#addToWhitelist}.
   *
   * @public
   * @async
   * @param {AddWhitelistOptions} options - {@code keyVaultAddr}, {@code signer} (whitelisted), {@code addressToAdd}, optional EIP-712 fields
   * @returns {Promise<AddToWhitelistResult>} Standard write result with parsed {@code addedAddress},
   * @throws {ValidationError} If addresses, {@code signer}, or proof inputs are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or address already whitelisted)
   * @throws {EventNotFoundError} If the {@code AddressAddedToWhitelist} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async addToWhitelist(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'walletSignature',
      options,
      buildAction: (resolved, authenticatorAddr) =>
        buildAddToWhitelistAction(authenticatorAddr, resolved.addressToAdd),
      invoke: ({ keyVaultAddr, authProof, addressToAdd }) =>
        this.auth.walletSignature.addToWhitelist({ keyVaultAddr, authProof, addressToAdd })
    });
  },

  /**
   * Remove an address from a wallet's whitelist using a freshly built wallet-signature proof.
   *
   * @public
   * @async
   * @param {RemoveWhitelistOptions} options - {@code keyVaultAddr}, {@code signer} (whitelisted), {@code addressToRemove}, optional EIP-712 fields
   * @returns {Promise<RemoveFromWhitelistResult>} Standard write result with parsed {@code removedAddress},
   * @throws {ValidationError} If addresses, {@code signer}, or proof inputs are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof, last whitelisted address)
   * @throws {EventNotFoundError} If the {@code AddressRemovedFromWhitelist} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async removeFromWhitelist(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'walletSignature',
      options,
      buildAction: (resolved, authenticatorAddr) =>
        buildRemoveFromWhitelistAction(authenticatorAddr, resolved.addressToRemove),
      invoke: ({ keyVaultAddr, authProof, addressToRemove }) =>
        this.auth.walletSignature.removeFromWhitelist({ keyVaultAddr, authProof, addressToRemove })
    });
  },

  /**
   * Replace the password hash on {@code DualFactorAuthenticator} (dual-factor auth required).
   *
   * Internally calls {@link Monstera#createAuthProofDualFactor} with the same {@code options}, then forwards
   * to {@link DualFactorAuthenticatorClient#updatePassword}.
   *
   * @public
   * @async
   * @param {UpdatePasswordDualFactorOptions} options - {@code keyVaultAddr}, {@code passwordHash} (current), {@code newPasswordHash}, guardian {@code signer}, optional {@code deadline}/{@code authenticatorAddr},
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet},
   * @throws {ValidationError} If addresses, password hashes, {@code signer}, or {@code deadline} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code PasswordUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePasswordDualFactor(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'dualFactor',
      options,
      buildAction: (resolved, authenticatorAddr) =>
        buildDualFactorChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      invoke: ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.dualFactor.updatePassword({ keyVaultAddr, authProof, newPasswordHash })
    });
  },

  /**
   * Replace the guardian address on {@code DualFactorAuthenticator} (dual-factor auth required).
   *
   * @public
   * @async
   * @param {UpdateGuardianOptions} options - {@code keyVaultAddr}, {@code passwordHash} (current), {@code newGuardian}, current guardian {@code signer}, optional {@code deadline}/{@code authenticatorAddr},
   * @returns {Promise<UpdateGuardianResult>} Standard write result with parsed {@code newGuardian},
   * @throws {ValidationError} If addresses, {@code passwordHash}, {@code signer}, or {@code deadline} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured for broadcasting
   * @throws {NetworkError} If proof signing or the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code GuardianUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateGuardian(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'dualFactor',
      options,
      buildAction: (resolved, authenticatorAddr) =>
        buildChangeGuardianAction(authenticatorAddr, resolved.newGuardian),
      invoke: ({ keyVaultAddr, authProof, newGuardian }) =>
        this.auth.dualFactor.updateGuardian({ keyVaultAddr, authProof, newGuardian })
    });
  },

  /**
   * Replace the password hash on {@code PasswordMinuteSignatureAuthenticator},
   * (current password bytes must match the stored hash).
   *
   * @public
   * @async
   * @param {UpdatePasswordOptions} options - {@code keyVaultAddr}, {@code currentPassword} (UTF-8 {@link Uint8Array}), {@code newPasswordHash},
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet},
   * @throws {ValidationError} If {@code keyVaultAddr}/{@code newPasswordHash} are invalid or {@code currentPassword} is not a non-empty Uint8Array
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. wrong current password)
   * @throws {EventNotFoundError} If the {@code PasswordUpdated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePasswordMinuteSignature(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'password',
      options,
      flags: { defaultCurrentPassword: true },
      buildAction: (resolved, authenticatorAddr) =>
        buildMinuteSignatureChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      invoke: ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.passwordMinuteSignature.updatePassword({
          keyVaultAddr,
          currentPassword: authProof,
          newPasswordHash
        }),
      overrides: { authenticatorAddr: this.config.addresses.passwordMinuteSignatureAuth }
    });
  },

  /**
   * Rotate the API key for an API key session.
   *
   * @public
   * @async
   * @param {RotateApiKeyOptions} options - {@code newApiKeySecret} required; {@code keyVaultAddr} and current {@code apiKeySecret} default from connect credentials; ACTION-mode {@code authProof} built internally
   * @returns {Promise<RotateApiKeyResult>} Standard write result with parsed {@code wallet},
   * @throws {ValidationError} If addresses or {@code newApiKeySecret} are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC interaction or proof builder transports fail
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or new API key hash is zero)
   * @throws {EventNotFoundError} If the {@code ApiKeyRotated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async rotateApiKey(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'apiKeySession',
      options,
      flags: { defaultApiKeySecret: true },
      buildAction: (resolved, authenticatorAddr) =>
        buildRotateApiKeyAction(authenticatorAddr, resolved.newApiKeySecret),
      invoke: ({ keyVaultAddr, authProof, newApiKeySecret }) =>
        this.auth.apiKeySession.rotateApiKey({
          keyVaultAddr,
          authProof,
          newApiKeySecret
        })
    });
  },

  /**
   * Enable an additional child authenticator on a multi-authenticated wallet.
   *
   * Builds an action-bound routed proof via an existing child ({@code viaChildFlowId}) and calls
   * {@link MultiAuthenticatorClient#addAuthenticator}.
   *
   * @public
   * @async
   * @param {AddMultiAuthenticatorOptions} options
   * @returns {Promise<AddMultiAuthenticatorResult>},
   */
  async addMultiAuthenticator(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options, {
      defaultCurrentPassword: true,
      defaultApiKeySecret: true
    });
    const { child, childAuthConfig } = resolved;
    const { authConfig: childConfig } = this._encodeAuthConfig.encode({
      authConfig: childAuthConfig,
      authenticatorAddr: child
    });

    const {
      keyVaultAddr: _kv,
      child: _contractChild,
      childAuthConfig: _childAuthConfig,
      ...proofOptions
    } = options;

    return this._invokeAuthenticatorManaged({
      flowId: 'multi',
      options: {
        ...proofOptions,
        keyVaultAddr: resolved.keyVaultAddr,
        viaChildFlowId: options.viaChildFlowId ?? options.childFlowId
      },
      flags: { defaultCurrentPassword: true, defaultApiKeySecret: true },
      buildAction: (_, authenticatorAddr) => buildAddAuthenticatorAction(authenticatorAddr, child, childConfig),
      invoke: ({ keyVaultAddr: vaultAddr, authProof }) =>
        this.auth.multi.addAuthenticator({
          keyVaultAddr: vaultAddr,
          authProof,
          child,
          childConfig
        }),
      overrides: { authenticatorAddr: this.config.addresses.multiAuthenticator }
    });
  },

  /**
   * Replace the password hash on {@code PasswordOrWalletSignatureAuthenticator}.
   *
   * Builds a unified password-or-wallet-signature admin proof internally.
   *
   * @public
   * @async
   * @param {UpdatePasswordOrWalletSignatureOptions} options
   * @returns {Promise<UpdatePasswordResult>},
   */
  async updatePasswordOrWalletSignature(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'passwordOrWalletSignature',
      options,
      flags: { defaultCurrentPassword: true },
      buildAction: (resolved, authenticatorAddr) =>
        buildPasswordOrWalletChangePasswordAction(authenticatorAddr, resolved.newPasswordHash),
      invoke: ({ keyVaultAddr, authProof, newPasswordHash }) =>
        this.auth.passwordOrWalletSignature.changePassword({
          keyVaultAddr,
          authProof,
          newPasswordHash,
        })
    });
  },

  /**
   * Add an address to a password-or-wallet-signature wallet whitelist.
   *
   * @public
   * @async
   * @param {AddPasswordOrWalletSignatureWhitelistOptions} options
   * @returns {Promise<AddToWhitelistResult>},
   */
  async addToPasswordOrWalletSignatureWhitelist(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'passwordOrWalletSignature',
      options,
      flags: { defaultCurrentPassword: true },
      buildAction: (resolved, authenticatorAddr) =>
        buildPasswordOrWalletAddToWhitelistAction(authenticatorAddr, resolved.addressToAdd),
      invoke: ({ keyVaultAddr, authProof, addressToAdd }) =>
        this.auth.passwordOrWalletSignature.addToWhitelist({
          keyVaultAddr,
          authProof,
          addressToAdd,
        })
    });
  },

  /**
   * Remove an address from a password-or-wallet-signature wallet whitelist.
   *
   * @public
   * @async
   * @param {RemovePasswordOrWalletSignatureWhitelistOptions} options
   * @returns {Promise<RemoveFromWhitelistResult>},
   */
  async removeFromPasswordOrWalletSignatureWhitelist(options = {}) {
    return this._invokeAuthenticatorManaged({
      flowId: 'passwordOrWalletSignature',
      options,
      flags: { defaultCurrentPassword: true },
      buildAction: (resolved, authenticatorAddr) =>
        buildPasswordOrWalletRemoveFromWhitelistAction(authenticatorAddr, resolved.addressToRemove),
      invoke: ({ keyVaultAddr, authProof, addressToRemove }) =>
        this.auth.passwordOrWalletSignature.removeFromWhitelist({
          keyVaultAddr,
          authProof,
          addressToRemove,
        })
    });
  },

  /**
   * Add a wallet to the whitelist using a link signature from the new wallet.
   *
   * Generates {@code nonce} and {@code deadline} when omitted, computes the link action hash
   * on-chain, signs {@code LinkWallet} when {@code newWalletSignature} is omitted, and builds the
   * admin auth proof via password (session default) or wallet signature.
   *
   * @public
   * @async
   * @param {AddPasswordOrWalletSignatureWhitelistWithProofOptions} options
   * @returns {Promise<AddToWhitelistWithProofResult>},
   */
  async addToPasswordOrWalletSignatureWhitelistWithProof(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options, {
      defaultCurrentPassword: true,
    });
    const nonce = resolved.nonce ?? hexlify(randomBytes(32));
    const deadline = resolved.deadline ?? defaultProofDeadline();
    const { keyVaultAddr, addressToAdd } = resolved;

    const actionHash = await this.auth.passwordOrWalletSignature.computeLinkActionHash({
      keyVaultAddr,
      addressToAdd,
      nonce,
      deadline,
    });

    let newWalletSignature = resolved.newWalletSignature;
    if (!newWalletSignature) {
      newWalletSignature = await createLinkWalletSignature({
        linkSigner: resolved.linkSigner,
        keyVaultAddr,
        newAddress: addressToAdd,
        nonce,
        deadline,
        actionHash,
        authenticatorAddr: this.config.addresses.passwordOrWalletSigAuth,
        chainId: this.config.chainId,
      });
    }

    return this._invokeAuthenticatorManaged({
      flowId: 'passwordOrWalletSignature',
      options: {
        ...options,
        keyVaultAddr,
        addressToAdd,
        nonce,
        deadline,
      },
      flags: { defaultCurrentPassword: true },
      buildAction: (_, authenticatorAddr) =>
        buildPasswordOrWalletAddToWhitelistWithProofAction(
          authenticatorAddr,
          addressToAdd,
          nonce,
          deadline
        ),
      invoke: ({ keyVaultAddr: vaultAddr, authProof }) =>
        this.auth.passwordOrWalletSignature.addToWhitelistWithProof({
          keyVaultAddr: vaultAddr,
          authProof,
          addressToAdd,
          nonce,
          deadline,
          newWalletSignature,
        })
    });
  },

  /**
   * Disable a child authenticator on a multi-authenticated wallet.
   *
   * @public
   * @async
   * @param {RemoveMultiAuthenticatorOptions} options
   * @returns {Promise<RemoveMultiAuthenticatorResult>},
   */
  async removeMultiAuthenticator(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options, {
      defaultCurrentPassword: true,
      defaultApiKeySecret: true
    });
    const { child, keyVaultAddr } = resolved;
    const {
      child: _contractChild,
      keyVaultAddr: _kv,
      ...proofOptions
    } = options;

    return this._invokeAuthenticatorManaged({
      flowId: 'multi',
      options: {
        ...proofOptions,
        keyVaultAddr,
        viaChildFlowId: options.viaChildFlowId ?? options.childFlowId
      },
      flags: { defaultCurrentPassword: true, defaultApiKeySecret: true },
      buildAction: (_, authenticatorAddr) => buildRemoveAuthenticatorAction(authenticatorAddr, child),
      invoke: ({ keyVaultAddr: vaultAddr, authProof }) =>
        this.auth.multi.removeAuthenticator({ keyVaultAddr: vaultAddr, authProof, child }),
      overrides: { authenticatorAddr: this.config.addresses.multiAuthenticator }
    });
  }
});
