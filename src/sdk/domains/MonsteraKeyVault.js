/**
 * MonsteraKeyVault domain methods for {@link Monstera}.
 * Mixed onto {@link Monstera} prototype at construction time.
 *
 * @module sdk/domains/MonsteraKeyVault
 */

import {
  buildUpgradeImplementationAction,
  buildUpgradeImplementationCustomAction,
  buildChangeAuthenticatorAction,
  buildChangeAuthenticatorCustomAction,
  buildImportKeyAction,
  buildDeactivateKeyAction,
  buildActivateKeyAction,
  buildSetChainBaseKeysAction,
} from '../../internal/crypto/index.js';
import { withDefaultAccountIndex } from '../../internal/vault/accountIndex.js';
import { defineDomainMethods } from './defineDomainMethods.js';

export const monsteraKeyVaultMethods = defineDomainMethods({
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
   * @param {InitializeOptions} options - {@code keyVaultAddr}, {@code storageAddr}, {@code authenticatorAddr}, {@code accessToken}, {@code authConfig},
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
  },

  /**
   * Initialize a KeyVault with an explicit policy registry (factory-managed policy).
   *
   * Delegates to {@link KeyVaultClient#initializeExplicit}.
   *
   * @public
   * @async
   * @param {InitializeExplicitOptions} options - Same as {@link Monstera#initialize} plus required {@code policyRegistry},
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If any address is invalid, {@code authConfig} is missing, or {@code accessToken} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no signer is configured
   * @throws {NetworkError} If the RPC call to broadcast the transaction or fetch its receipt fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {WalletError} For other unrecognised failures
   */
  async initializeExplicit(options = {}) {
    return this.keyVault.initializeExplicit(await this._vaultPipeline.resolveVaultOptions(options));
  },

  // --- KeyVault Reads ---

  /**
   * Get the WalletStorage contract address bound to a KeyVault (where keys actually live).
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultStorageAddr(options = {}) {
    return this.keyVault.getStorageAddr(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get the authenticator contract currently bound to a KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAuthenticatorAddr(options = {}) {
    return this.keyVault.getAuthenticatorAddr(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get the current KeyVault implementation address (proxy → impl).
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Address>} Implementation address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultImplAddr(options = {}) {
    return this.keyVault.getKeyVaultImplAddr(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether a KeyVault has been initialized.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<boolean>} {@code true} if the KeyVault is initialized
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isInitialized(options = {}) {
    return this.keyVault.isInitialized(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Compute the canonical {@code actionHash} for a vault-authenticated call.
   *
   * @public
   * @async
   * @param {ComputeActionHashOptions} options - {@code keyVaultAddr}, 4-byte {@code selector}, and {@code paramsHash},
   * @returns {Promise<Bytes32>} Action hash bound into auth proofs
   * @throws {ValidationError} If {@code keyVaultAddr}, {@code selector}, or {@code paramsHash} are invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeActionHash(options = {}) {
    return this.keyVault.computeActionHash(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Compute the action hash for a {@code MultiAuthenticator} management call.
   *
   * Delegates to {@link MultiAuthenticatorClient#computeActionHash}.
   *
   * @public
   * @async
   * @param {ComputeMultiAuthenticatorActionHashOptions} options - {@code keyVaultAddr}, 4-byte {@code selector}, and {@code paramsHash},
   * @returns {Promise<Bytes32>} Action hash bound into routed child auth proofs
   * @throws {ValidationError} If {@code keyVaultAddr}, {@code selector}, or {@code paramsHash} are invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeMultiAuthenticatorActionHash(options = {}) {
    return this.auth.multi.computeActionHash(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Compute the custom implementation acknowledgement hash for {@code upgradeImplementationCustom}.
   *
   * @public
   * @async
   * @param {ComputeCustomImplementationAckHashOptions} options - {@code keyVaultAddr} and {@code newImplementation},
   * @returns {Promise<Bytes32>},
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeCustomImplementationAckHash(options = {}) {
    return this.keyVault.computeCustomImplementationAckHash(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Compute the custom authenticator acknowledgement hash for {@code changeAuthenticatorCustom}.
   *
   * @public
   * @async
   * @param {ComputeCustomAuthenticatorAckHashOptions} options - {@code keyVaultAddr}, {@code newAuthenticator}, {@code configHash},
   * @returns {Promise<Bytes32>},
   * @throws {ValidationError} If addresses or {@code configHash} are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeCustomAuthenticatorAckHash(options = {}) {
    return this.keyVault.computeCustomAuthenticatorAckHash(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Read the policy registry address configured for a KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Address>},
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getPolicyRegistry(options = {}) {
    return this.keyVault.getPolicyRegistry(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether an implementation is locally approved on a KeyVault.
   *
   * @public
   * @async
   * @param {IsImplementationApprovedOptions} options - {@code keyVaultAddr} and {@code implementation},
   * @returns {Promise<boolean>},
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isImplementationApproved(options = {}) {
    return this.keyVault.isImplementationApproved(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether an authenticator is locally approved on a KeyVault.
   *
   * @public
   * @async
   * @param {IsAuthenticatorApprovedOptions} options - {@code keyVaultAddr} and {@code authenticator},
   * @returns {Promise<boolean>},
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isAuthenticatorApproved(options = {}) {
    return this.keyVault.isAuthenticatorApproved(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get the wallet's HD account address at a given index.
   *
   * @public
   * @async
   * @param {KeyVaultAddrIndexOptions} options - {@code keyVaultAddr} and {@code index},
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code index} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddr(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    return this.keyVault.getAccountAddr(withDefaultAccountIndex(resolved));
  },

  /**
   * Get a contiguous slice of HD account addresses from the wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAccountSliceOptions} options - {@code keyVaultAddr}, {@code fromIndex}, {@code count},
   * @returns {Promise<Address[]>} Array of account addresses (length {@code count})
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, or {@code fromIndex}/{@code count} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddresses(options = {}) {
    return this.keyVault.getAccountAddresses(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * List the IDs of all keys imported into a KeyVault (V2).
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr},
   * @returns {Promise<Bytes32[]>} Imported key IDs
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getImportedKeyIds(options = {}) {
    return this.keyVault.getImportedKeyIds(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get metadata for an imported key (V2). Does not return private key material.
   *
   * @public
   * @async
   * @param {KeyVaultImportedKeyOptions} options - {@code keyVaultAddr} and {@code keyId},
   * @returns {Promise<KeyMetadataResult>} {@code curve}, {@code chain}, {@code active}, {@code labelHash},
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code keyId} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts (e.g. unknown {@code keyId})
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyMetadata(options = {}) {
    return this.keyVault.getKeyMetadata(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Check whether an imported key exists in a KeyVault (V2).
   *
   * @public
   * @async
   * @param {KeyVaultImportedKeyOptions} options - {@code keyVaultAddr} and {@code keyId},
   * @returns {Promise<boolean>} {@code true} if the key exists
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code keyId} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async keyExists(options = {}) {
    return this.keyVault.keyExists(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get the address (Ethereum address, Solana pubkey, etc.) corresponding to an imported key (V2).
   *
   * @public
   * @async
   * @param {KeyVaultImportedKeyOptions} options - {@code keyVaultAddr} and {@code keyId},
   * @returns {Promise<Bytes>} Address bytes (curve/chain-dependent encoding)
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code keyId} is not a 32-byte hex string
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getImportedKeyAddr(options = {}) {
    return this.keyVault.getImportedKeyAddr(await this._vaultPipeline.resolveVaultOptions(options));
  },

  /**
   * Get the Solana public key for an HD account at {@code index} (V2).
   *
   * @public
   * @async
   * @param {KeyVaultAddrIndexOptions} options - {@code keyVaultAddr} and {@code index},
   * @returns {Promise<Bytes>} Solana public key bytes
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code index} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts (e.g. Solana base keys not configured)
   * @throws {WalletError} For other unrecognised failures
   */
  async getSolanaAddr(options = {}) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    return this.keyVault.getSolanaAddr(withDefaultAccountIndex(resolved));
  },

  /**
   * Upgrade a KeyVault proxy to a new implementation address (authenticated write).
   *
   * @public
   * @async
   * @param {UpdateKeyVaultImplOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newKeyVaultImplAddr},
   * @returns {Promise<UpdateKeyVaultImplAddrResult>} Standard write result with parsed {@code newImplAddr},
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
  },

  /**
   * Upgrade a KeyVault implementation via the custom acknowledgement path.
   *
   * @public
   * @async
   * @param {UpdateKeyVaultImplCustomOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newImplAddr}, {@code customAckHash},
   * @returns {Promise<UpdateKeyVaultImplAddrCustomResult>},
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
  },

  /**
   * Swap the authenticator contract bound to a KeyVault (authenticated write).
   *
   * @public
   * @async
   * @param {UpdateAuthenticatorOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newAuthenticatorAddr},
   * @returns {Promise<UpdateAuthenticatorAddrResult>} Standard write result with parsed {@code newAuthenticator},
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
  },

  /**
   * Swap the authenticator via the custom acknowledgement path.
   *
   * @public
   * @async
   * @param {UpdateAuthenticatorCustomOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newAuthenticatorAddr}, {@code newAuthConfig}, {@code customAckHash},
   * @returns {Promise<UpdateAuthenticatorAddrCustomResult>},
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
  },

  /**
   * Import an external private key into the KeyVault (V2, authenticated write).
   *
   * @public
   * @async
   * @param {ImportKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code privateKey}, {@code curve}, {@code chain}, {@code labelHash},
   * @returns {Promise<ImportKeyResult>} Standard write result with parsed {@code keyId},
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
  },

  /**
   * Deactivate an imported key (V2, soft delete; authenticated write).
   *
   * The key remains stored but cannot sign until reactivated via {@link Monstera#activateKey}.
   *
   * @public
   * @async
   * @param {DeactivateActivateKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId},
   * @returns {Promise<DeactivateKeyResult>} Standard write result with parsed {@code keyId},
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
  },

  /**
   * Reactivate a previously deactivated key (V2, authenticated write).
   *
   * @public
   * @async
   * @param {DeactivateActivateKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId},
   * @returns {Promise<ActivateKeyResult>} Standard write result with parsed {@code keyId},
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
  },

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
});
