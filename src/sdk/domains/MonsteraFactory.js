/**
 * MonsteraFactory domain methods for {@link Monstera}.
 * Mixed onto {@link Monstera} prototype at construction time.
 *
 * @module sdk/domains/MonsteraFactory
 */

import { defineDomainMethods } from './defineDomainMethods.js';
import { getSdkInternals } from '../sdkInternals.js';
import { resolveWalletOrKeyVaultScope, resolveWalletProxyOptions } from './MonsteraSession.js';

export const monsteraFactoryMethods = defineDomainMethods({
  // ============================================================================
  // Create Methods (Write)
  // ============================================================================

  /**
   * Create a new HD wallet (full stack) and store its mnemonic on the result.
   *
   * @public
   * @async
   * @param {CreateWalletBaseOptions} options - {@code authConfig} (structured or pre-encoded) and optional {@code authenticatorAddr},
   * @returns {Promise<WalletCreationResult>} Write result plus addresses ({@code wallet}, {@code keyVault}, {@code storage}, {@code authenticator}) and the generated {@code mnemonic},
   * @throws {ValidationError} If {@code authConfig} is missing/invalid for the resolved authenticator, or {@code authenticatorAddr} is set but not a built-in authenticator
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks The returned mnemonic is a secret. Do not log it.
   */
  async createWallet(options = {}) {
    return this.factory.createWallet(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (full stack) deterministically from a caller-supplied mnemonic.
   *
   * Same deployment shape as {@link Monstera#createWallet}; the seed is derived from {@code options.mnemonic},
   * via PBKDF2-SHA512 instead of being generated. The mnemonic is echoed back on the result.
   *
   * @public
   * @async
   * @param {CreateWalletFromMnemonicOptions} options - {@code authConfig}, {@code mnemonic}, optional {@code authenticatorAddr},
   * @returns {Promise<WalletCreationResult>} Write result plus addresses and the supplied {@code mnemonic},
   * @throws {ValidationError} If {@code authConfig} is invalid or {@code mnemonic} is not a valid BIP39 phrase
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks The returned mnemonic is the one you passed. Do not log it.
   */
  async createWalletFromMnemonic(options = {}) {
    return this.factory.createWalletFromMnemonic(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (full stack) and execute a post-creation hook.
   *
   * The hook contract at {@code hookAddr} must implement {@code IWalletCreationHook}; the SDK does not
   * enforce that interface — passing a non-conforming address will revert on-chain.
   *
   * @public
   * @async
   * @param {CreateWalletWithHookOptions} options - {@code authConfig}, {@code hookAddr}, {@code hookData}, optional {@code authenticatorAddr},
   * @returns {Promise<WalletCreationResult>} Write result plus addresses and generated {@code mnemonic},
   * @throws {ValidationError} If {@code authConfig}, {@code hookAddr}, or {@code hookData} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks The returned mnemonic is a secret. Do not log it.
   */
  async createWalletWithHook(options = {}) {
    return this.factory.createWalletWithHook(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (core stack only — WalletStorage + KeyVault, no WalletLogic proxy).
   *
   * Use when you intend to interact with KeyVault directly or deploy a custom logic contract later.
   * In the returned event, {@code wallet} and {@code keyVault} are the same address by design.
   *
   * @public
   * @async
   * @param {CreateWalletBaseOptions} options - {@code authConfig} (structured or pre-encoded) and optional {@code authenticatorAddr},
   * @returns {Promise<WalletCreationResult>} Write result with addresses ({@code wallet} === {@code keyVault}) and generated {@code mnemonic},
   * @throws {ValidationError} If {@code authConfig} is invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks The returned mnemonic is a secret. Do not log it.
   */
  async createWalletCore(options = {}) {
    return this.factory.createWalletCore(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet using a minimal-proxy (clone) of a custom WalletLogic implementation.
   *
   * Custom-logic wallets are independent of the factory's beacon — admin upgrades to the default
   * WalletLogic do not affect them.
   *
   * @public
   * @async
   * @param {CreateWalletWithCustomLogicOptions} options - {@code authConfig}, {@code customLogicImplAddr}, {@code logicData}, optional {@code authenticatorAddr},
   * @returns {Promise<WalletCreationResult>} Write result plus addresses and generated {@code mnemonic},
   * @throws {ValidationError} If {@code authConfig}, {@code customLogicImplAddr}, or {@code logicData} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks The returned mnemonic is a secret. Do not log it.
   */
  async createWalletWithCustomLogic(options = {}) {
    return this.factory.createWalletWithCustomLogic(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (full stack) and register it to a normalised username.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameOptions} options - {@code authConfig}, {@code username}, optional {@code authenticatorAddr},
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, generated {@code mnemonic}, and {@code usernameHash},
   * @throws {ValidationError} If {@code authConfig} or {@code username} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks Usernames are normalised (trim + lowercase) before hashing. The factory stores only the hash.
   */
  async createWalletForUsername(options = {}) {
    return this.factory.createWalletForUsername(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (full stack) for a normalised username from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameFromMnemonicOptions} options - {@code authConfig}, {@code username}, {@code mnemonic}, optional {@code authenticatorAddr},
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, supplied {@code mnemonic}, and {@code usernameHash},
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async createWalletForUsernameFromMnemonic(options = {}) {
    return this.factory.createWalletForUsernameFromMnemonic(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (full stack) and register it to a precomputed username hash.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameHashOptions} options - {@code authConfig}, {@code usernameHash}, optional {@code authenticatorAddr},
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, generated {@code mnemonic}, and {@code usernameHash},
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async createWalletForUsernameHash(options = {}) {
    return this.factory.createWalletForUsernameHash(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Create a new HD wallet (full stack) for a username hash from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {CreateWalletForUsernameHashFromMnemonicOptions} options - {@code authConfig}, {@code usernameHash}, {@code mnemonic}, optional {@code authenticatorAddr},
   * @returns {Promise<UsernameWalletCreationResult>} Write result plus addresses, supplied {@code mnemonic}, and {@code usernameHash},
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async createWalletForUsernameHashFromMnemonic(options = {}) {
    return this.factory.createWalletForUsernameHashFromMnemonic(
      getSdkInternals(this).authConfigEncoder.encode(options)
    );
  },

  /**
   * Initialize a freshly deployed WalletLogic proxy by binding it to a {@code keyVaultAddr}.
   *
   * @public
   * @async
   * @param {InitializeWalletLogicOptions} options - {@code walletAddr} (proxy) and {@code keyVaultAddr},
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If {@code walletAddr} or {@code keyVaultAddr} is missing/invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async initializeWalletLogic(options = {}) {
    const resolved = await getSdkInternals(this).keyVaultAuthPipeline.mergeVaultOptions(options);
    if (!resolved.walletAddr) {
      Object.assign(resolved, await resolveWalletProxyOptions(this, options));
    }
    return this.logic.initialize(resolved);
  },

 // --- Factory Reads ---

  /**
   * Check whether a given address was deployed by the configured factory.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr} (proxy address)
   * @returns {Promise<boolean>} {@code true} if the address is a wallet created by this factory
   * @throws {ValidationError} If {@code walletAddr} is missing or not a valid address
   */
  async isWallet(options = {}) {
    return this.factory.isWallet(await resolveWalletProxyOptions(this, options));
  },

  /**
   * Get the current factory admin address.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context (no required fields)
   * @returns {Promise<Address>} Admin address
   */
  async getAdmin(options = {}) {
    return this.factory.getAdmin(options);
  },

  /**
   * Get the current WalletLogic implementation address (the contract behind the beacon).
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr(options = {}) {
    return this.factory.getWalletLogicImplAddr(options);
  },

  /**
   * Resolve the KeyVault contract for a wallet proxy via the factory mapping.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr},
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    return this.factory.getKeyVaultAddr(await resolveWalletProxyOptions(this, options));
  },

  /**
   * Resolve the WalletStorage contract address for a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr},
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   */
  async getStorageAddr(options = {}) {
    return this.factory.getStorageAddr(await resolveWalletProxyOptions(this, options));
  },

  /**
   * Get the beacon contract address that controls WalletLogic upgrades.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Beacon address
   */
  async getBeaconAddr(options = {}) {
    return this.factory.getBeaconAddr(options);
  },

  /**
   * Resolve the secret-vault contract address mapped to a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr},
   * @returns {Promise<Address>} Secret vault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   */
  async getSecretVaultAddr(options = {}) {
    return this.factory.getSecretVaultAddr(await resolveWalletProxyOptions(this, options));
  },

  /**
   * Get the KeyVault implementation used as the minimal-proxy clone template.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} KeyVault template implementation address
   */
  async getKeyVaultTemplate(options = {}) {
    return this.factory.getKeyVaultTemplate(options);
  },

  /**
   * Check whether an authenticator is globally allowed for new wallet creation.
   *
   * @public
   * @async
   * @param {FactoryAllowedAuthenticatorsOptions} options - {@code authenticatorAddr},
   * @returns {Promise<boolean>} {@code true} if the authenticator is on the factory allowlist
   * @throws {ValidationError} If {@code authenticatorAddr} is missing or invalid
   */
  async allowedAuthenticators(options = {}) {
    return this.factory.allowedAuthenticators(options);
  },

  /**
   * Check whether a KeyVault implementation is globally recommended for new wallets.
   *
   * @public
   * @async
   * @param {FactoryAllowedKeyVaultImplementationsOptions} options - {@code implementationAddr},
   * @returns {Promise<boolean>} {@code true} if the implementation is on the factory allowlist
   * @throws {ValidationError} If {@code implementationAddr} is missing or invalid
   */
  async allowedKeyVaultImplementations(options = {}) {
    return this.factory.allowedKeyVaultImplementations(options);
  },

  /**
   * Check whether a KeyVault implementation is approved via the factory policy registry.
   *
   * @public
   * @async
   * @param {FactoryIsImplementationApprovedOptions} options - {@code keyVaultAddr}, {@code implementationAddr},
   * @returns {Promise<boolean>},
   * @throws {ValidationError} If addresses are missing or invalid
   */
  async isFactoryImplementationApproved(options = {}) {
    return this.factory.isImplementationApproved(await getSdkInternals(this).keyVaultAuthPipeline.mergeVaultOptions(options));
  },

  /**
   * Check whether an authenticator is approved via the factory policy registry.
   *
   * @public
   * @async
   * @param {FactoryIsAuthenticatorApprovedOptions} options - {@code keyVaultAddr}, {@code authenticatorAddr},
   * @returns {Promise<boolean>},
   * @throws {ValidationError} If addresses are missing or invalid
   */
  async isFactoryAuthenticatorApproved(options = {}) {
    return this.factory.isAuthenticatorApproved(await getSdkInternals(this).keyVaultAuthPipeline.mergeVaultOptions(options));
  },

  /**
   * Hash a normalised username the same way the factory does.
   *
   * @public
   * @async
   * @param {FactoryHashUsernameOptions} options - {@code username},
   * @returns {Promise<Bytes32>} {@code keccak256(bytes(normalizedUsername))},
   * @throws {ValidationError} If {@code username} is missing or empty after normalisation
   */
  async hashUsername(options = {}) {
    return this.factory.hashUsername(options);
  },

  /**
   * Resolve a username hash to its registered wallet proxy address.
   *
   * @public
   * @async
   * @param {FactoryWalletOfUsernameOptions} options - {@code usernameHash},
   * @returns {Promise<Address>} Wallet proxy address, or the zero address if unregistered
   * @throws {ValidationError} If {@code usernameHash} is missing or invalid
   */
  async walletOfUsername(options = {}) {
    return this.factory.walletOfUsername(options);
  },

  /**
   * Resolve the username hash registered for a wallet proxy.
   *
   * @public
   * @async
   * @param {FactoryWalletUsernameHashOptions} options - {@code walletAddr},
   * @returns {Promise<Bytes32>} Username hash, or zero bytes32 if none
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   */
  async getWalletUsernameHash(options = {}) {
    return this.factory.getWalletUsernameHash(await resolveWalletProxyOptions(this, options));
  },

  // --- Factory Writes ---

  /**
   * Point the factory beacon at a new WalletLogic implementation (admin only).
   *
   * Affects the orchestration layer of every wallet that uses the default beacon — not the
   * KeyVault security layer.
   *
   * @public
   * @async
   * @param {UpdateWalletLogicImplOptions} options - {@code newLogicAddr},
   * @returns {Promise<UpdateWalletLogicImplAddrResult>} Standard write result with parsed {@code newImplAddr},
   * @throws {ValidationError} If {@code newLogicAddr} is missing or invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   *
   * @remarks Wallets created via {@link Monstera#createWalletWithCustomLogic} do not follow this beacon.
   */
  async updateWalletLogicImplAddr(options = {}) {
    return this.factory.updateWalletLogicImplAddr(options);
  },

  /**
   * Transfer the factory admin role to a new address (admin only).
   *
   * @public
   * @async
   * @param {TransferAdminOptions} options - {@code newAdminAddr},
   * @returns {Promise<TransferAdminResult>} Standard write result with parsed {@code newAdminAddr},
   * @throws {ValidationError} If {@code newAdminAddr} is missing or invalid
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async transferAdmin(options = {}) {
    return this.factory.transferAdmin(options);
  },

  /**
   * Allow or disallow an authenticator for new wallet creation (factory admin only).
   *
   * @public
   * @async
   * @param {SetAuthenticatorAllowedOptions} options - {@code authenticatorAddr}, {@code allowed},
   * @returns {Promise<SetAuthenticatorAllowedResult>},
   * @throws {ValidationError} If {@code authenticatorAddr} is missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async setAuthenticatorAllowed(options = {}) {
    return this.factory.setAuthenticatorAllowed(options);
  },

  /**
   * Allow or disallow a KeyVault implementation for new wallet creation (factory admin only).
   *
   * @public
   * @async
   * @param {SetKeyVaultImplementationAllowedOptions} options - {@code implementationAddr}, {@code allowed},
   * @returns {Promise<SetKeyVaultImplementationAllowedResult>},
   * @throws {ValidationError} If {@code implementationAddr} is missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async setKeyVaultImplementationAllowed(options = {}) {
    return this.factory.setKeyVaultImplementationAllowed(options);
  },

  /**
   * Allow or disallow a KeyVault implementation for a specific wallet via the factory policy registry (factory admin only).
   *
   * @public
   * @async
   * @param {SetWalletImplementationAllowedOptions} options - {@code walletOrKeyVaultAddr}, {@code implementationAddr}, {@code allowed},
   * @returns {Promise<SetWalletImplementationAllowedResult>},
   * @throws {ValidationError} If addresses are missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async setWalletImplementationAllowed(options = {}) {
    return this.factory.setWalletImplementationAllowed(await resolveWalletOrKeyVaultScope(this, options));
  },

  /**
   * Allow or disallow an authenticator for a specific wallet via the factory policy registry (factory admin only).
   *
   * @public
   * @async
   * @param {SetWalletAuthenticatorAllowedOptions} options - {@code walletOrKeyVaultAddr}, {@code authenticatorAddr}, {@code allowed},
   * @returns {Promise<SetWalletAuthenticatorAllowedResult>},
   * @throws {ValidationError} If addresses are missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no signer is configured
   */
  async setWalletAuthenticatorAllowed(options = {}) {
    return this.factory.setWalletAuthenticatorAllowed(await resolveWalletOrKeyVaultScope(this, options));
  }
});
