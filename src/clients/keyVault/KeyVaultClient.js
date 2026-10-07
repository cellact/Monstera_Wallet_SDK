/**
 * Low-level client for the {@code KeyVault} contract.
 *
 * KeyVault is the Sapphire-confidential signing and account-management layer of a Monstera wallet:
 * it stores HD seeds, imported keys, and the authenticator binding, and runs all signing operations
 * inside an authenticated context. Most {@link Monstera} read/write methods funnel through this client.
 *
 * @remarks
 * Among the contract clients, this is the one the facade uses for signing and accounts (`keyVaultAddr`).
 * WalletLogic exposes parallel proxy methods that forward here. Application code should call the facade, not this client.
 *
 * Advanced. Application signing and account reads go through {@link Monstera}.
 * Use this client for a KeyVault method that is not on the app API.
 *
 * @module clients/keyVault/KeyVaultClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getKeyVaultContract } from '../../contracts/core/keyVault.js';
import { KeyVaultEvents } from '../../events/index.js';
import {
  requireAddress,
  requireBytes,
  requireNonEmptyBytes,
  requireBytes32,
  requireNonNegativeInteger,
  requireString,
  requireBytes4
} from '../../internal/validation/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class KeyVaultClient extends BaseContractClient {
  /**
   * Forward provider/signer/config to {@link BaseContractClient}.
   *
   * @public
   * @param {EthersProvider} readProvider - Read provider for view calls
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped write signer ({@code null} for read-only)
   * @param {NetworkConfig} config - Resolved network configuration
   */
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Get the {@code WalletStorage} contract bound to a KeyVault (where keys actually live).
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
  async getStorageAddr(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.debug('Getting storage address for keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.storage_(),
        methodName: 'get storage address',
        ...options
      }
    );
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
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.debug('Getting authenticator address for keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.authenticator(),
        methodName: 'get authenticator',
        ...options
      }
    );
  }

  /**
   * Compute the canonical {@code actionHash} for a vault-authenticated call.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions & { selector: string; paramsHash: Bytes32 }} options -
   *   {@code keyVaultAddr}, 4-byte {@code selector}, and {@code paramsHash}
   * @returns {Promise<Bytes32>} Action hash bound into auth proofs
   * @throws {ValidationError} If {@code keyVaultAddr}, {@code selector}, or {@code paramsHash} are invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeActionHash(options = {}) {
    const { keyVaultAddr, selector, paramsHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes4(selector, 'selector');
    requireBytes32(paramsHash, 'paramsHash');
    log.debug('Computing action hash for keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead({
      operation: () => keyVault.computeActionHash(selector, paramsHash),
      methodName: 'compute action hash',
      ...options
    });
  }

  /**
   * Compute the custom implementation acknowledgement hash for {@code upgradeImplementationCustom}.
   *
   * @public
   * @async
   * @param {KeyVaultClientComputeCustomImplementationAckHashOptions} options -
   *   {@code keyVaultAddr} and {@code newImplementation}
   * @returns {Promise<Bytes32>}
   */
  async computeCustomImplementationAckHash(options = {}) {
    const { keyVaultAddr, newImplementation } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(newImplementation, 'newImplementation');
    log.debug('KeyVault: computeCustomImplementationAckHash', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead({
      operation: () => keyVault.computeCustomImplementationAckHash(newImplementation),
      methodName: 'compute custom implementation acknowledgement hash',
      ...options
    });
  }

  /**
   * Compute the custom authenticator acknowledgement hash for {@code changeAuthenticatorCustom}.
   *
   * @public
   * @async
   * @param {KeyVaultClientComputeCustomAuthenticatorAckHashOptions} options -
   *   {@code keyVaultAddr}, {@code newAuthenticator}, and {@code configHash}
   * @returns {Promise<Bytes32>}
   */
  async computeCustomAuthenticatorAckHash(options = {}) {
    const { keyVaultAddr, newAuthenticator, configHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(newAuthenticator, 'newAuthenticator');
    requireBytes32(configHash, 'configHash');
    log.debug('KeyVault: computeCustomAuthenticatorAckHash', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead({
      operation: () => keyVault.computeCustomAuthenticatorAckHash(newAuthenticator, configHash),
      methodName: 'compute custom authenticator acknowledgement hash',
      ...options
    });
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
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.debug('Getting keyVault implementation address for keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.implementation(),
        methodName: 'get key vault implementation',
        ...options
      }
    );
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
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.debug('Checking if keyVault is initialized', sanitizer.forLog(options)); 

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.initialized(),
        methodName: 'check if key vault is initialized',
        ...options
      }
    );
  }

  /**
   * Read the policy registry address configured for this KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>}
   */
  async getPolicyRegistry(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.debug('KeyVault: getPolicyRegistry', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead({
      operation: () => keyVault.policyRegistry(),
      methodName: 'get policy registry',
      ...options
    });
  }

  /**
   * Check whether an implementation is locally approved on this KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultClientIsImplementationApprovedOptions} options -
   *   {@code keyVaultAddr} and {@code implementation}
   * @returns {Promise<boolean>}
   */
  async isImplementationApproved(options = {}) {
    const { keyVaultAddr, implementation } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(implementation, 'implementation');
    log.debug('KeyVault: isImplementationApproved', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead({
      operation: () => keyVault.approvedImplementations(implementation),
      methodName: 'check if implementation is approved',
      ...options
    });
  }

  /**
   * Check whether an authenticator is locally approved on this KeyVault.
   *
   * @public
   * @async
   * @param {KeyVaultClientIsAuthenticatorApprovedOptions} options -
   *   {@code keyVaultAddr} and {@code authenticator}
   * @returns {Promise<boolean>}
   */
  async isAuthenticatorApproved(options = {}) {
    const { keyVaultAddr, authenticator } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(authenticator, 'authenticator');
    log.debug('KeyVault: isAuthenticatorApproved', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead({
      operation: () => keyVault.approvedAuthenticators(authenticator),
      methodName: 'check if authenticator is approved',
      ...options
    });
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
    const { keyVaultAddr, index } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonNegativeInteger(index, 'index');
    log.debug('Getting account address for keyVault at index', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.getAccountAddress(index),
        methodName: 'get account address',
        ...options
      }
    );
  }

  /**
   * Get a contiguous slice of HD account addresses from the wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAccountSliceOptions} options - {@code keyVaultAddr}, {@code fromIndex}, {@code count}
   * @returns {Promise<Address[]>} Array of account addresses (length {@code count})
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code fromIndex}/{@code count} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddresses(options = {}) {
    const { keyVaultAddr, fromIndex, count } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    log.debug('Getting account addresses for keyVault for index range', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);
    
    return this.executeRead(
      {
        operation: () => keyVault.getAccountAddresses(fromIndex, count),
        methodName: 'get account addresses',
        ...options
      }
    );
  }

  /**
   * Sign a raw EVM transaction with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {KeyVaultClientSignTransactionOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, plus tx fields
   * @returns {Promise<Bytes>} RLP-encoded signed transaction
   * @throws {ValidationError} If addresses, {@code authProof}, or numeric tx fields are missing/invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signTransaction(options = {}) {
    const { keyVaultAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireBytes(txData, 'txData');
    requireNonNegativeInteger(chainId, 'chainId');
    log.info('KeyVault: signTransaction');
    log.debug('Signing transaction for keyVault at index to address', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId),
        methodName: 'sign transaction',
        ...options
      }
    );
  }

  /**
   * Sign an EIP-191 personal message with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {KeyVaultClientSignMessageOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, {@code message}
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signMessage(options = {}) {
    const { keyVaultAddr, authProof, index, message } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');
    log.info('KeyVault: signMessage');
    log.debug('Signing Ethereum EIP-191 message for keyVault at index', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.signMessage(authProof, index, message),
        methodName: 'sign message',
        ...options
      }
    );
  }

  /**
   * Sign a 32-byte hash with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {KeyVaultClientSignHashOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, 32-byte {@code hash}
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async sign(options = {}) {
    const { keyVaultAddr, authProof, index, hash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes32(hash, 'hash');
    log.info('KeyVault: sign');
    log.debug('Signing Ethereum hash for keyVault at index', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.sign(authProof, index, hash),
        methodName: 'sign hash',
        ...options
      }
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
   * @param {KeyVaultClientExecuteWithAuthOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code implCall}
   * @returns {Promise<Bytes>} Raw return bytes from the implementation function
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof or implementation revert)
   * @throws {WalletError} For other unrecognised failures
   */
  async executeWithAuth(options = {}) {
    const { keyVaultAddr, authProof, implCall } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyBytes(implCall, 'implCall');
    log.info('KeyVault: executeWithAuth');
    log.debug('Executing function with auth for keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.executeWithAuth(authProof, implCall),
        methodName: 'execute with auth',
        ...options
      }
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
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.debug('Getting imported key IDs for keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.getImportedKeyIds(),
        methodName: 'get imported key ids',
        ...options
      }
    );
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
    const { keyVaultAddr, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(keyId, 'keyId');
    log.debug('Getting metadata for imported key in keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.getKeyMetadata(keyId),
        methodName: 'get key metadata',
        ...options
      }
    );
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
    const { keyVaultAddr, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(keyId, 'keyId');
    log.debug('Checking if key exists in keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.keyExists(keyId),
        methodName: 'check if key exists',
        ...options
      }
    );
  }

  /**
   * Sign a digest with an imported key (V2, authenticated view).
   *
   * @public
   * @async
   * @param {KeyVaultClientSignWithImportedKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}, 32-byte {@code digest}
   * @returns {Promise<Bytes>} Signature bytes (format depends on the imported key's curve)
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async signWithImportedKey(options = {}) {
    const { keyVaultAddr, authProof, keyId, digest } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(keyId, 'keyId');
    requireBytes32(digest, 'digest');
    log.info('KeyVault: signWithImportedKey');
    log.debug('Signing with imported key in keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.signWithImportedKey(authProof, keyId, digest),
        methodName: 'sign with imported key',
        ...options
      }
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
    const { keyVaultAddr, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(keyId, 'keyId');
    log.debug('Getting address for imported key in keyVault', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.getImportedKeyAddress(keyId),
        methodName: 'get imported key address',
        ...options
      }
    );
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
    const { keyVaultAddr, index } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonNegativeInteger(index, 'index');
    log.debug('Getting Solana address for keyVault at index', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.getSolanaAddress(index),
        methodName: 'get solana address',
        ...options
      }
    );
  }

  /**
   * Sign a Solana message with the HD account at {@code index} (V2, authenticated view).
   *
   * @public
   * @async
   * @param {KeyVaultClientSignSolanaOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, {@code message}
   * @returns {Promise<Bytes>} Solana signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async signSolana(options = {}) {
    const { keyVaultAddr, authProof, index, message } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');
    log.info('KeyVault: signSolana');
    log.debug('Signing Solana message for keyVault at index', sanitizer.forLog(options));

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.signSolana(authProof, index, message),
        methodName: 'sign solana',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Initialize a freshly deployed KeyVault (policy registry defaults to {@code msg.sender} on-chain).
   *
   * @public
   * @async
   * @param {InitializeOptions} options - {@code keyVaultAddr}, {@code storageAddr}, {@code authenticatorAddr}, {@code accessToken}, {@code authConfig}
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If any address is invalid, {@code authConfig} is missing, or {@code accessToken} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. already initialized)
   * @throws {WalletError} For other unrecognised failures
   */
  async initialize(options = {}) {
    const { keyVaultAddr, storageAddr, authenticatorAddr, accessToken, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(storageAddr, 'storageAddr');
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    requireBytes32(accessToken, 'accessToken');
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('KeyVault: initialize');
    log.debug('Initializing keyVault with storage and authenticator addresses', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite({
      operation: () => keyVault.initialize(storageAddr, authenticatorAddr, accessToken, authConfig),
      methodName: 'initialize key vault',
      ...options
    });
  }

  /**
   * Initialize a KeyVault with an explicit policy registry address.
   *
   * @public
   * @async
   * @param {InitializeExplicitOptions} options - Same as {@link KeyVaultClient#initialize} plus required {@code policyRegistry}
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If any address is invalid, {@code authConfig} is missing, or {@code accessToken} is not a 32-byte hex string
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. already initialized)
   * @throws {WalletError} For other unrecognised failures
   */
  async initializeExplicit(options = {}) {
    const { keyVaultAddr, storageAddr, authenticatorAddr, accessToken, authConfig, policyRegistry } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(storageAddr, 'storageAddr');
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    requireBytes32(accessToken, 'accessToken');
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireAddress(policyRegistry, 'policyRegistry');
    log.info('KeyVault: initializeExplicit');
    log.debug('Initializing keyVault with explicit policy registry', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite({
      operation: () => keyVault.initialize(
        storageAddr,
        authenticatorAddr,
        accessToken,
        authConfig,
        policyRegistry
      ),
      methodName: 'initialize key vault with explicit policy registry',
      ...options
    });
  }

  /**
   * Upgrade a KeyVault proxy to a new implementation (authenticated write).
   *
   * @public
   * @async
   * @param {KeyVaultClientUpdateKeyVaultImplOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newImplAddr}
   * @returns {Promise<UpdateKeyVaultImplAddrResult>} Standard write result with parsed {@code oldImpl}/{@code newImpl}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code ImplementationUpgraded} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr, authProof, newImplAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');
    log.info('KeyVault: updateKeyVaultImplAddr');
    log.debug('Updating keyVault implementation address', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.upgradeImplementation(authProof, newImplAddr),
        methodName: 'upgrade key vault implementation',
        parseEvents: [{
          eventDef: KeyVaultEvents.ImplementationUpgraded,
          contract: keyVault
        }],
        ...options
      }
    );
  }

  /**
   * Upgrade a KeyVault implementation via the custom acknowledgement path.
   *
   * @public
   * @async
   * @param {KeyVaultClientUpdateKeyVaultImplCustomOptions} options -
   *   {@code keyVaultAddr}, {@code authProof}, {@code newImplAddr}, {@code customAckHash}
   * @returns {Promise<UpdateKeyVaultImplAddrCustomResult>}
   */
  async updateKeyVaultImplAddrCustom(options = {}) {
    const { keyVaultAddr, authProof, newImplAddr, customAckHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');
    requireBytes32(customAckHash, 'customAckHash');
    log.info('KeyVault: updateKeyVaultImplAddrCustom');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite({
      operation: () => keyVault.upgradeImplementationCustom(authProof, newImplAddr, customAckHash),
      methodName: 'upgrade key vault implementation (custom)',
      parseEvents: [{
        eventDef: KeyVaultEvents.CustomImplementationUpgraded,
        contract: keyVault
      }],
      ...options
    });
  }

  /**
   * Swap the authenticator contract bound to a KeyVault (authenticated write).
   *
   * @public
   * @async
   * @param {KeyVaultClientUpdateAuthenticatorOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newAuthenticatorAddr}, {@code newAuthConfig}
   * @returns {Promise<UpdateAuthenticatorAddrResult>} Standard write result with parsed {@code oldAuth}/{@code newAuth}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code newAuthConfig} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code AuthenticatorChanged} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateAuthenticatorAddr(options = {}) {
    const { keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireNonEmptyBytes(newAuthConfig, 'newAuthConfig');
    log.info('KeyVault: updateAuthenticatorAddr');
    log.debug('Updating authenticator address for keyVault', sanitizer.forLog(options));
    
    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
        methodName: 'change authenticator',
        parseEvents: [{
          eventDef: KeyVaultEvents.AuthenticatorChanged,
          contract: keyVault
        }],
        ...options
      }
    );
  }

  /**
   * Swap the authenticator via the custom acknowledgement path.
   *
   * @public
   * @async
   * @param {KeyVaultClientUpdateAuthenticatorCustomOptions} options -
   *   {@code keyVaultAddr}, {@code authProof}, {@code newAuthenticatorAddr}, {@code newAuthConfig}, {@code customAckHash}
   * @returns {Promise<UpdateAuthenticatorAddrCustomResult>}
   */
  async updateAuthenticatorAddrCustom(options = {}) {
    const { keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig, customAckHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireNonEmptyBytes(newAuthConfig, 'newAuthConfig');
    requireBytes32(customAckHash, 'customAckHash');
    log.info('KeyVault: updateAuthenticatorAddrCustom');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite({
      operation: () => keyVault.changeAuthenticatorCustom(
        authProof,
        newAuthenticatorAddr,
        newAuthConfig,
        customAckHash
      ),
      methodName: 'change authenticator (custom)',
      parseEvents: [{
        eventDef: KeyVaultEvents.CustomAuthenticatorChanged,
        contract: keyVault
      }],
      ...options
    });
  }

  /**
   * Import an external private key into the KeyVault (V2, authenticated write).
   *
   * @public
   * @async
   * @param {KeyVaultClientImportKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}, {@code privateKey}, optional {@code publicKey}, {@code curve}, {@code chain}, {@code label}
   * @returns {Promise<ImportKeyResult>} Standard write result with parsed {@code keyId}/{@code curve}/{@code chain}
   * @throws {ValidationError} If addresses, {@code authProof}, key material, or metadata fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or duplicate key)
   * @throws {EventNotFoundError} If the {@code KeyImported} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async importKey(options = {}) {
    const { keyVaultAddr, authProof, keyId, privateKey, publicKey, curve, chain, label } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(keyId, 'keyId');
    requireNonEmptyBytes(privateKey, 'privateKey');
    requireBytes(publicKey ?? '0x', 'publicKey');
    requireNonNegativeInteger(curve, 'curve');
    requireNonNegativeInteger(chain, 'chain');
    requireString(label, 'label');
    log.info('KeyVault: importKey');
    log.debug('Importing key into keyVault', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.importKey(authProof, keyId, privateKey, publicKey ?? '0x', curve, chain, label),
        methodName: 'import key',
        parseEvents: [{
          eventDef: KeyVaultEvents.KeyImported,
          contract: keyVault
        }],
        ...options
      }
    );
  }

  /**
   * Deactivate an imported key (V2, soft delete; authenticated write).
   *
   * The key is preserved on-chain but cannot sign until reactivated via {@link KeyVaultClient#activateKey}.
   *
   * @public
   * @async
   * @param {KeyVaultClientDeactivateActivateKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}
   * @returns {Promise<DeactivateKeyResult>} Standard write result with parsed {@code keyId}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code keyId} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or unknown {@code keyId})
   * @throws {EventNotFoundError} If the {@code KeyDeactivated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async deactivateKey(options = {}) {
    const { keyVaultAddr, authProof, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(keyId, 'keyId');
    log.info('KeyVault: deactivateKey');
    log.debug('Deactivating key in keyVault', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.deactivateKey(authProof, keyId),
        methodName: 'deactivate key',
        parseEvents: [{
          eventDef: KeyVaultEvents.KeyDeactivated,
          contract: keyVault
        }],
        ...options
      }
    );
  }

  /**
   * Reactivate a previously deactivated imported key (V2, authenticated write).
   *
   * @public
   * @async
   * @param {KeyVaultClientDeactivateActivateKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}
   * @returns {Promise<ActivateKeyResult>} Standard write result with parsed {@code keyId}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code keyId} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or unknown {@code keyId})
   * @throws {EventNotFoundError} If the {@code KeyActivated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async activateKey(options = {}) {
    const { keyVaultAddr, authProof, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(keyId, 'keyId');
    log.info('KeyVault: activateKey');
    log.debug('Activating key in keyVault', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.activateKey(authProof, keyId),
        methodName: 'activate key',
        parseEvents: [{
          eventDef: KeyVaultEvents.KeyActivated,
          contract: keyVault
        }],
        ...options
      }
    );
  }

  /**
   * Provision HD base keys for a chain (V2, authenticated write).
   *
   * Used to install deterministic Ed25519 / EVM base keys for chains that derive accounts via index.
   *
   * @public
   * @async
   * @param {KeyVaultClientSetChainBaseKeysOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code chain}, {@code basePrivateKey}, {@code baseChainCode}
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If addresses, {@code authProof}, {@code chain}, or seed material are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or already provisioned)
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks {@code requireEvents} is set to {@code false}: missing events do not fail this call.
   */
  async setChainBaseKeys(options = {}) {
    const { keyVaultAddr, authProof, chain, basePrivateKey, baseChainCode } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(chain, 'chain');
    requireNonEmptyBytes(basePrivateKey, 'basePrivateKey');
    requireNonEmptyBytes(baseChainCode, 'baseChainCode');
    log.info('KeyVault: setChainBaseKeys');
    log.debug('Setting chain base keys for keyVault', sanitizer.forLog(options));

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.setChainBaseKeys(authProof, chain, basePrivateKey, baseChainCode),
        methodName: 'set chain base keys',
        requireEvents: false,
        ...options
      }
    );
  }
}

export default KeyVaultClient;
