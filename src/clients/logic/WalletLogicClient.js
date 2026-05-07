/**
 * WalletLogicClient
 * 
 * Client for interacting with WalletLogic contract methods.
 * Handles wallet operations, signing, and account management.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').SignTransactionWalletOptions} SignTransactionWalletOptions
 * @typedef {import('../../types/index.js').SignMessageWalletOptions} SignMessageWalletOptions
 * @typedef {import('../../types/index.js').SignHashWalletOptions} SignHashWalletOptions
 * @typedef {import('../../types/index.js').UpdateAuthenticatorWalletOptions} UpdateAuthenticatorWalletOptions
 * @typedef {import('../../types/index.js').UpdateResult} UpdateResult
 * @typedef {import('../../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../../types/index.js').UpdateKeyVaultImplAddrResult} UpdateKeyVaultImplAddrResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').WalletProxyOptions} WalletProxyOptions
 * @typedef {import('../../types/index.js').WalletProxyIndexOptions} WalletProxyIndexOptions
 * @typedef {import('../../types/index.js').WalletProxyAccountSliceOptions} WalletProxyAccountSliceOptions
 * @typedef {import('../../types/index.js').InitializeWalletLogicOptions} InitializeWalletLogicOptions
 * @typedef {import('../../types/index.js').WalletLogicUpdateKeyVaultImplOptions} WalletLogicUpdateKeyVaultImplOptions
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletLogicContract } from '../../contracts/core/walletLogic.js';
import { KeyVaultEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireBytes32, requireNonNegativeInteger } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

class WalletLogicClient extends BaseContractClient {
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
   * Get the keyVault contract address for a wallet 
   * 
   * @param {WalletProxyOptions} options - KeyVault options
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletLogic: getKeyVaultAddr');
    log.debug('Getting keyVault address for wallet', sanitizer.forLog(options));

    const logic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => logic.getKeyVault(),
        methodName: 'get key vault address',
        ...options
      }
    );
  }

  /**
   * Get the keyVault contract address for a wallet
   * 
   * @param {WalletProxyOptions} options - KeyVault options
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async get_key_vault_addr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletLogic: get_key_vault_addr');
    log.debug('Getting keyVault address for wallet', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.keyVault(),
        methodName: 'get key vault address',
        ...options
      }
    );
  }

  /**
   * Get the current authenticator contract address for a wallet
   * 
   * @param {WalletProxyOptions} options - Get authenticator options
   * @returns {Promise<Address>} Authenticator address 
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletLogic: getAuthenticatorAddr');
    log.debug('Getting authenticator address for wallet', sanitizer.forLog(options));

    const logic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => logic.getAuthenticator(),
        methodName: 'get authenticator',
        ...options
      }
    );
  }

  /**
   * Check if a wallet is initialized
   * 
   * @param {WalletProxyOptions} options - Is initialized options
   * @returns {Promise<boolean>} True if wallet is initialized, false otherwise
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletLogic: isInitialized');
    log.debug('Checking if wallet is initialized', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.initialized(),
        methodName: 'check if wallet is initialized',
        ...options
      }
    );
  }

  /**
   * Get account address at an index from wallet
   * 
   * @param {WalletProxyIndexOptions} options - Account address options
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If walletAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    const { walletAddr, index } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonNegativeInteger(index, 'index');
    log.info('WalletLogic: getAccountAddr');
    log.debug('Getting account address for wallet at index', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.getAccountAddress(index),
        methodName: 'get account address',
        ...options
      }
    );
  }

  /**
   * Get account addresses from wallet
   * 
   * @param {WalletProxyAccountSliceOptions} options - Account addresses options
   * @returns {Promise<Address[]>} Array of account addresses
   * @throws {ValidationError} If walletAddr is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    const { walletAddr, fromIndex, count } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    log.info('WalletLogic: getAccountAddresses');
    log.debug('Getting account addresses for wallet for index range', sanitizer.forLog(options));
    
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.getAccountAddresses(fromIndex, count),
        methodName: 'get account addresses',
        ...options
      }
    );
  }

  /**
   * Sign a raw transaction (authenticated function)
   * 
   * @dev Delegates to KeyVault which enforces authentication.
   * 
   * @param {SignTransactionWalletOptions} options - Sign transaction options
   * @returns {Promise<Bytes>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signTransaction(options = {}) {
    const { walletAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireBytes(data, 'data');
    requireNonNegativeInteger(chainId, 'chainId');
    log.info('WalletLogic: signTransaction');
    log.debug('Signing transaction for wallet at index to address', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId),
        methodName: 'sign transaction',
        ...options
      }
    );
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @dev Delegates to KeyVault which enforces authentication.
   * 
   * @param {SignMessageWalletOptions} options - Sign message options
   * @returns {Promise<Bytes>} Signed message
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    const { walletAddr, authProof, index, message } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');
    log.info('WalletLogic: signMessage');
    log.debug('Signing Ethereum EIP-191 message for wallet at index', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.signMessage(authProof, index, message),
        methodName: 'sign message',
        ...options
      }
    );
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @dev Delegates to KeyVault which enforces authentication.
   * 
   * @param {SignHashWalletOptions} options - Sign hash options
   * @returns {Promise<Bytes>} Signed hash
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    const { walletAddr, authProof, index, hash } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes32(hash, 'hash');
    log.info('WalletLogic: sign');
    log.debug('Signing Ethereum hash for wallet at index', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.sign(authProof, index, hash),
        methodName: 'sign hash',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Initialize a wallet logic with a new keyVault 
   * 
   * @param {InitializeWalletLogicOptions} options - Initialize wallet logic options
   * @returns {Promise<BaseTransactionResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initialize(options = {}) {
    const { walletAddr, keyVaultAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletLogic: initialize');
    log.debug('Initializing wallet logic with keyVault', sanitizer.forLog(options));

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);
  
    return this.executeWrite(
      {
        operation: () => walletLogic.initialize(keyVaultAddr),
        methodName: 'initialize wallet logic',
        ...options
      }
    );
  }

  /**
   * Update the authenticator (authenticated function)
   * 
   * @dev Delegates to KeyVault which enforces authentication.
   * 
   * @param {UpdateAuthenticatorWalletOptions} options - Update authenticator options
   * @returns {Promise<UpdateResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateAuthenticatorAddr(options = {}) {
    const { walletAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireBytes(newAuthConfig, 'newAuthConfig');
    log.info('WalletLogic: updateAuthenticatorAddr');
    log.debug('Updating authenticator for wallet to new address', sanitizer.forLog(options));
    
    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);

    return this.executeWrite(
      {
        operation: () => walletLogic.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
        methodName: 'change authenticator',
        parseEvents: [{
          eventDef: KeyVaultEvents.AuthenticatorChanged, // Is actually a KeyVault contract event
          contract: walletLogic
        }],
        ...options
      }
    );
  }

  /**
   * Update the keyVaultImplementation (authenticated function)
   * 
   * @dev Delegates to KeyVault which enforces authentication.
   * 
   * @param {WalletLogicUpdateKeyVaultImplOptions} options - Update keyVault implementation options
   * @returns {Promise<UpdateKeyVaultImplAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateKeyVaultImplAddr(options = {}) {
    const { walletAddr, authProof, newImplAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');
    log.info('WalletLogic: updateKeyVaultImplAddr');
    log.debug('Updating keyVault implementation for wallet', sanitizer.forLog(options));

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);

    return this.executeWrite(
      {
        operation: () => walletLogic.upgradeKeyVault(authProof, newImplAddr),
        methodName: 'upgrade key vault implementation',
        parseEvents: [{
          eventDef: KeyVaultEvents.ImplementationUpgraded, // Is actually a KeyVault contract event
          contract: walletLogic
        }],
        ...options
      }
    );
  }
}

export default WalletLogicClient;
