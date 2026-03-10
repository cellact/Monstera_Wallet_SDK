/**
 * KeyVaultClient
 * 
 * Client for interacting with KeyVault contract methods.
 * Handles key vault operations, signing, and account management.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').SignTransactionOptions} SignTransactionOptions
 * @typedef {import('../../types/index.js').SignMessageOptions} SignMessageOptions
 * @typedef {import('../../types/index.js').SignHashOptions} SignHashOptions
 * @typedef {import('../../types/index.js').InitializeOptions} InitializeOptions
 * @typedef {import('../../types/index.js').UpdateAuthenticatorOptions} UpdateAuthenticatorOptions
 * @typedef {import('../../types/index.js').TransactionResult} TransactionResult
 * @typedef {import('../../types/index.js').UpdateAuthenticatorAddrResult} UpdateAuthenticatorAddrResult
 * @typedef {import('../../types/index.js').UpdateKeyVaultImplAddrResult} UpdateKeyVaultImplAddrResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').KeyMetadataResult} KeyMetadataResult
 * @typedef {import('../../types/index.js').SignWithImportedKeyOptions} SignWithImportedKeyOptions
 * @typedef {import('../../types/index.js').SignSolanaOptions} SignSolanaOptions
 * @typedef {import('../../types/index.js').ImportKeyOptions} ImportKeyOptions
 * @typedef {import('../../types/index.js').SetChainBaseKeysOptions} SetChainBaseKeysOptions
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getKeyVaultContract } from '../../contracts/core/keyVault.js';
import { KeyVaultEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireNonNegativeInteger, requireString } from '../../internal/assert.js';
import log from '../../internal/logger.js';

class KeyVaultClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
   */
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Get the storage contract address holding the keys
   * 
   * @param {Record<string, unknown>} options - Get storage address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { keyVaultAddr } = options;
    log.info('KeyVault: getStorageAddr');
    log.debug('Getting storage address for:', { keyVaultAddr });

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
   * Get the current authenticator contract address for a wallet 
   * 
   * @param {Record<string, unknown>} options - Get authenticator options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    const { keyVaultAddr } = options;
    log.info('KeyVault: getAuthenticatorAddr');
    log.debug('Getting authenticator address for:', { keyVaultAddr });

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
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {Record<string, unknown>} options - Get implementation options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Implementation address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr } = options;
    log.info('KeyVault: getKeyVaultImplAddr');
    log.debug('Getting keyVault implementation address for:', { keyVaultAddr });

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
   * Check if a given keyVault is initialized 
   * 
   * @param {Record<string, unknown>} options - Check if keyVault is initialized options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if keyVault is initialized, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    const { keyVaultAddr } = options;
    log.info('KeyVault: isInitialized');
    log.debug('Checking if keyVault ' + keyVaultAddr + ' is initialized'); 

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
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {Record<string, unknown>} options - Get account address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {number} options.index - Account index (uint32)
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    const { keyVaultAddr, index } = options;
    requireNonNegativeInteger(index, 'index');
    log.info('KeyVault: getAccountAddr');
    log.debug('Getting account address for keyVault ' + keyVaultAddr + ' at index ' + index);

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
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {Record<string, unknown>} options - Get account addresses options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {number} options.fromIndex - From index (uint32)
   * @param {number} options.count - Count (uint32)
   * @returns {Promise<Address[]>} Array of account addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    const { keyVaultAddr, fromIndex, count } = options;
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    log.info('KeyVault: getAccountAddresses');
    log.debug('Getting account addresses for keyVault ' + keyVaultAddr + ' from index ' + fromIndex + ' to index ' + (fromIndex + count));

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
   * Sign a raw transaction (authenticated function)
   * 
   * @param {SignTransactionOptions} options - Sign transaction options
   * @returns {Promise<Bytes>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signTransaction(options = {}) {
    const { keyVaultAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireBytes(txData, 'txData');
    requireNonNegativeInteger(chainId, 'chainId');
    log.info('KeyVault: signTransaction');
    log.debug('Signing transaction for keyVault ' + keyVaultAddr + ' at index ' + index + ' to address ' + to); // TODO: log the options leaving out sensitive data 

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
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {SignMessageOptions} options - Sign message options
   * @returns {Promise<Bytes>} Signed message (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    const { keyVaultAddr, authProof, index, message } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');
    log.info('KeyVault: signMessage');
    log.debug('Signing Ethereum EIP-191 message for keyVault ' + keyVaultAddr + ' at index ' + index); // TODO: log the options leaving out sensitive data 

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
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {SignHashOptions} options - Sign hash options
   * @returns {Promise<Bytes>} Signed hash (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    const { keyVaultAddr, authProof, index, hash } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(hash, 'hash');
    log.info('KeyVault: sign');
    log.debug('Signing an Ethereum hash for keyVault ' + keyVaultAddr + ' at index ' + index); // TODO: log the options leaving out sensitive data 

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
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {Record<string, unknown>} options - Execute function options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Bytes} options.implCall - Implementation call (bytes)
   * @returns {Promise<Bytes>} Execute function result (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async executeWithAuth(options = {}) {
    const { keyVaultAddr, authProof, implCall } = options;
    requireBytes(authProof, 'authProof');
    requireBytes(implCall, 'implCall');
    log.info('KeyVault: executeWithAuth');
    log.debug('Executing function with auth for keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
   * Get all imported key IDs (V2)
   *
   * @param {Record<string, unknown>} options - Get imported key IDs options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @returns {Promise<Bytes32[]>} Array of imported key IDs
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getImportedKeyIds(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('KeyVault: getImportedKeyIds');
    log.debug('Getting imported key IDs for keyVault ' + keyVaultAddr);

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
   * Get metadata for an imported key (V2)
   * 
   * @dev Returns curve, chain, active status, etc. Not the private key.
   *
   * @param {Record<string, unknown>} options - Get key metadata options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes32} options.keyId - Imported key ID
   * @returns {Promise<KeyMetadataResult>} Key metadata (curve, chain, active, labelHash)
   * @throws {ValidationError} If keyVaultAddr or keyId is missing or invalid
   */
  async getKeyMetadata(options = {}) {
    const { keyVaultAddr, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(keyId, 'keyId');
    log.info('KeyVault: getKeyMetadata');
    log.debug('Getting metadata for imported key ' + keyId + ' in keyVault ' + keyVaultAddr);

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
   * Check if a key exists (V2)
   *
   * @param {Record<string, unknown>} options - Key exists options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes32} options.keyId - Key ID to check
   * @returns {Promise<boolean>} True if key exists, false otherwise
   * @throws {ValidationError} If keyVaultAddr or keyId is missing or invalid
   */
  async keyExists(options = {}) {
    const { keyVaultAddr, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(keyId, 'keyId');
    log.info('KeyVault: keyExists');
    log.debug('Checking if key ' + keyId + ' exists in keyVault ' + keyVaultAddr);

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
   * Sign a hash with an imported key (V2, authenticated view)
   *
   * @param {SignWithImportedKeyOptions} options - Sign with imported key options
   * @returns {Promise<Bytes>} Signature (format depends on curve)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signWithImportedKey(options = {}) {
    const { keyVaultAddr, authProof, keyId, digest } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireBytes(keyId, 'keyId');
    requireBytes(digest, 'digest');
    log.info('KeyVault: signWithImportedKey');
    log.debug('Signing with imported key ' + keyId + ' in keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
   * Get the address for an imported key (V2)
   *
   * @param {Record<string, unknown>} options - Get imported key address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes32} options.keyId - Imported key ID
   * @returns {Promise<Bytes>} Address (Ethereum address, Solana pubkey, etc. as bytes)
   * @throws {ValidationError} If keyVaultAddr or keyId is missing or invalid
   */
  async getImportedKeyAddr(options = {}) {
    const { keyVaultAddr, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(keyId, 'keyId');
    log.info('KeyVault: getImportedKeyAddr');
    log.debug('Getting address for imported key ' + keyId + ' in keyVault ' + keyVaultAddr);

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
   * Get Solana address at HD index (V2)
   *
   * @param {Record<string, unknown>} options - Get Solana address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {number} options.index - HD index (uint32)
   * @returns {Promise<Bytes>} Solana public key (bytes)
   * @throws {ValidationError} If keyVaultAddr or index is missing or invalid
   */
  async getSolanaAddr(options = {}) {
    const { keyVaultAddr, index } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonNegativeInteger(index, 'index');
    log.info('KeyVault: getSolanaAddr');
    log.debug('Getting Solana address for keyVault ' + keyVaultAddr + ' at index ' + index);

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
   * Sign a Solana message (V2, authenticated view)
   *
   * @param {SignSolanaOptions} options - Sign Solana options
   * @returns {Promise<Bytes>} Signature
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signSolana(options = {}) {
    const { keyVaultAddr, authProof, index, message } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');
    log.info('KeyVault: signSolana');
    log.debug('Signing Solana message for keyVault ' + keyVaultAddr + ' at index ' + index); // TODO: log the options leaving out sensitive data 

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
   * Initialize a KeyVault contract
   * 
   * @param {InitializeOptions} options - Initialize key vault options
   * @returns {Promise<TransactionResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initialize(options = {}) {
    const { keyVaultAddr, storageAddr, authenticatorAddr, accessToken } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(storageAddr, 'storageAddr');
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    requireBytes(accessToken, 'accessToken');
    log.info('KeyVault: initialize');
    log.debug('Initializing keyVault ' + keyVaultAddr + ' with storage address ' + storageAddr + ' and authenticator address ' + authenticatorAddr); // TODO: log the options leaving out sensitive data 

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite({
      operation: () => keyVault.initialize(storageAddr, authenticatorAddr, accessToken),
      methodName: 'initialize key vault',
      ...options
    });
  }

  /**
   * Update the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {Record<string, unknown>} options - Update keyVaultImplementation options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Address} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<UpdateKeyVaultImplAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr, authProof, newImplAddr } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');
    log.info('KeyVault: updateKeyVaultImplAddr');
    log.debug('Updating keyVault implementation to ' + newImplAddr + ' for keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
   * Update the authenticator (Authenticated function)
   * 
   * @param {UpdateAuthenticatorOptions} options - Update authenticator options
   * @returns {Promise<UpdateAuthenticatorAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateAuthenticatorAddr(options = {}) {
    const { keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireBytes(newAuthConfig, 'newAuthConfig');
    log.info('KeyVault: updateAuthenticatorAddr');
    log.debug('Updating authenticator to ' + newAuthenticatorAddr + ' for keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 
    
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
   * Import an external private key (V2)
   *
   * @param {ImportKeyOptions} options - Import key options
   * @returns {Promise<TransactionResult & { keyId: Bytes32; curve: number; chain: number }>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async importKey(options = {}) {
    const { keyVaultAddr, authProof, keyId, privateKey, publicKey, curve, chain, label } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireBytes(keyId, 'keyId');
    requireBytes(privateKey, 'privateKey');
    requireBytes(publicKey ?? '0x', 'publicKey');
    requireNonNegativeInteger(curve, 'curve');
    requireNonNegativeInteger(chain, 'chain');
    requireString(label, 'label');
    log.info('KeyVault: importKey');
    log.debug('Importing key ' + keyId + ' into keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
   * Deactivate an imported key (V2, soft delete)
   *
   * @param {Record<string, unknown>} options - Deactivate key options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - Authentication proof
   * @param {Bytes32} options.keyId - Key ID to deactivate
   * @returns {Promise<TransactionResult & { keyId: Bytes32 }>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async deactivateKey(options = {}) {
    const { keyVaultAddr, authProof, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireBytes(keyId, 'keyId');
    log.info('KeyVault: deactivateKey');
    log.debug('Deactivating key ' + keyId + ' in keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
   * Reactivate a previously deactivated key (V2)
   *
   * @param {Record<string, unknown>} options - Activate key options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - Authentication proof
   * @param {Bytes32} options.keyId - Key ID to activate
   * @returns {Promise<TransactionResult & { keyId: Bytes32 }>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async activateKey(options = {}) {
    const { keyVaultAddr, authProof, keyId } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireBytes(keyId, 'keyId');
    log.info('KeyVault: activateKey');
    log.debug('Activating key ' + keyId + ' in keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
   * Set base keys for a chain's HD derivation (V2)
   *
   * @param {SetChainBaseKeysOptions} options - Set chain base keys options
   * @returns {Promise<TransactionResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async setChainBaseKeys(options = {}) {
    const { keyVaultAddr, authProof, chain, basePrivateKey, baseChainCode } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(chain, 'chain');
    requireBytes(basePrivateKey, 'basePrivateKey');
    requireBytes(baseChainCode, 'baseChainCode');
    log.info('KeyVault: setChainBaseKeys');
    log.debug('Setting chain base keys for chain ' + chain + ' in keyVault ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

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
