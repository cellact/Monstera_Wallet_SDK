/**
 * WalletSignatureAuthenticatorClient
 * 
 * Client for interacting with WalletSignatureAuthenticator contract methods.
 * Handles wallet signature authentication, whitelist management, and configuration.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ConfigureWalletSignatureResult} ConfigureWalletSignatureResult
 * @typedef {import('../../types/index.js').RemoveFromWhitelistResult} RemoveFromWhitelistResult
 * @typedef {import('../../types/index.js').AddToWhitelistResult} AddToWhitelistResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletSignatureAuthenticatorContract } from '../../contracts/authenticators/WalletSignatureAuthenticator.js';
import { WalletSignatureAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';

class WalletSignatureAuthenticatorClient extends BaseContractClient {
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
   * Check if a wallet is configured
   * 
   * @param {Record<string, unknown>} options - Is configured options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletSignatureAuthenticator: isConfigured');
    log.debug('Checking if ' + keyVaultAddr + ' is configured');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);
    
    return this.executeRead(
      {
        operation: () => walletSigAuth.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {Record<string, unknown>} options - Is whitelisted options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Address} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<boolean>} True if address is whitelisted, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddr, addressToCheck } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(addressToCheck, 'addressToCheck');
    log.info('WalletSignatureAuthenticator: isWhitelisted');
    log.debug('Checking if ' + addressToCheck + ' is whitelisted for ' + keyVaultAddr);

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      {
        operation: () => walletSigAuth.isWhitelisted(keyVaultAddr, addressToCheck),
        methodName: 'check if address is whitelisted',
        ...options
      }
    );
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {Record<string, unknown>} options - Get whitelist options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @returns {Promise<Address[]>} Whitelist addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletSignatureAuthenticator: getWhitelist');
    log.debug('Getting whitelist for ' + keyVaultAddr);

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      {
        operation: () => walletSigAuth.getWhitelist(keyVaultAddr),
        methodName: 'get whitelist',
        ...options
      }
    );
  }

  /**
   * Get the EIP-712 domain separator
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Bytes32>} EIP-712 domain separator
   */
  async getDomainSeparator(options = {}) {
    log.info('WalletSignatureAuthenticator: getDomainSeparator');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead( 
      {
        operation: () => walletSigAuth.domainSeparator(),
        methodName: 'get domain separator',
        ...options
      }
    );
  }

  /**
   * Verify a signature
   * 
   * @param {Record<string, unknown>} options - Verify options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature), Signature is over EIP-712 typed data: WalletAuth(wallet, deadline)
   * @returns {Promise<boolean>} True if signature is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */ 
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    log.info('WalletSignatureAuthenticator: verify');
    log.debug('Verifying auth proof for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      {
        operation: () => walletSigAuth.verify(keyVaultAddr, authProof),
        methodName: 'verify signature',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Add a new address to the whitelist
   * 
   * @param {Record<string, unknown>} options - Add to whitelist options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {Address} options.addressToAdd - Address to add to the whitelist
   * @returns {Promise<AddToWhitelistResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async addToWhitelist(options = {}) {
    const { keyVaultAddr, authProof, addressToAdd } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireAddress(addressToAdd, 'addressToAdd');
    log.info('WalletSignatureAuthenticator: addToWhitelist');
    log.debug('Adding ' + addressToAdd + ' to whitelist for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      {
        operation: () => walletSigAuth.addToWhitelist(keyVaultAddr, authProof, addressToAdd),
        methodName: 'add to whitelist',
        parseEvents: [{
          eventDef: WalletSignatureAuthenticatorEvents.AddressAdded,
          contract: walletSigAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.walletSignatureAuth },
        ...options
      }
    );
  }

  /**
   * Configure the wallet signature authenticator
   * 
   * @param {Record<string, unknown>} options - Configure options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the whitelist addresses 
   * @returns {Promise<ConfigureWalletSignatureResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authConfig, 'authConfig');
    log.info('WalletSignatureAuthenticator: configure');
    log.debug('Configuring wallet signature authenticator for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      {
        operation: () => walletSigAuth.configure(keyVaultAddr, authConfig),
        methodName: 'configure wallet signature authenticator',
        parseEvents: [{
          eventDef: WalletSignatureAuthenticatorEvents.WalletConfigured,
          contract: walletSigAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.walletSignatureAuth },
        ...options
      }
    );
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {Record<string, unknown>} options - Remove from whitelist options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {Address} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<RemoveFromWhitelistResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async removeFromWhitelist(options = {}) {
    const { keyVaultAddr, authProof, addressToRemove } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireAddress(addressToRemove, 'addressToRemove');
    log.info('WalletSignatureAuthenticator: removeFromWhitelist');
    log.debug('Removing ' + addressToRemove + ' from whitelist for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      {
        operation: () => walletSigAuth.removeFromWhitelist(keyVaultAddr, authProof, addressToRemove),
        methodName: 'remove from whitelist',
        parseEvents: [{
          eventDef: WalletSignatureAuthenticatorEvents.AddressRemoved,
          contract: walletSigAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.walletSignatureAuth },
        ...options
      }
    );
  }
}

export default WalletSignatureAuthenticatorClient;
