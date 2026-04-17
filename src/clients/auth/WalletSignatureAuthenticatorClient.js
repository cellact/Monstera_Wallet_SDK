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
 * @typedef {import('../../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../../types/index.js').MonsteraWhitelistCheckSdkOptions} MonsteraWhitelistCheckSdkOptions
 * @typedef {import('../../types/index.js').SdkLoggingAndVersionOptions} SdkLoggingAndVersionOptions
 * @typedef {import('../../types/index.js').WalletSignatureAuthenticatorVerifySdkOptions} WalletSignatureAuthenticatorVerifySdkOptions
 * @typedef {import('../../types/index.js').WalletSignatureAddToWhitelistSdkOptions} WalletSignatureAddToWhitelistSdkOptions
 * @typedef {import('../../types/index.js').WalletSignatureAuthenticatorConfigureSdkOptions} WalletSignatureAuthenticatorConfigureSdkOptions
 * @typedef {import('../../types/index.js').WalletSignatureRemoveFromWhitelistSdkOptions} WalletSignatureRemoveFromWhitelistSdkOptions
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
   * @param {KeyVaultAddrOptions} options - Is configured options
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletSignatureAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', { keyVaultAddr });

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
   * @param {MonsteraWhitelistCheckSdkOptions} options - Is whitelisted options
   * @returns {Promise<boolean>} True if address is whitelisted, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddr, addressToCheck } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(addressToCheck, 'addressToCheck');
    log.info('WalletSignatureAuthenticator: isWhitelisted');
    log.debug('Checking if address is whitelisted for keyVault', { keyVaultAddr, addressToCheck });

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
   * @param {KeyVaultAddrOptions} options - Get whitelist options
   * @returns {Promise<Address[]>} Whitelist addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletSignatureAuthenticator: getWhitelist');
    log.debug('Getting whitelist for keyVault', { keyVaultAddr });

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
   * @param {WalletSignatureAuthenticatorVerifySdkOptions} options - Verify options
   * @returns {Promise<boolean>} True if signature is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */ 
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    log.info('WalletSignatureAuthenticator: verify');
    log.debug('Verifying auth proof for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

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
   * @param {WalletSignatureAddToWhitelistSdkOptions} options - Add to whitelist options
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
    log.debug('Adding address to whitelist for keyVault', { keyVaultAddr, addressToAdd }); // TODO: log the options leaving out sensitive data

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
   * @param {WalletSignatureAuthenticatorConfigureSdkOptions} options - Configure options
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
    log.debug('Configuring wallet signature authenticator for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

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
   * @param {WalletSignatureRemoveFromWhitelistSdkOptions} options - Remove from whitelist options
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
    log.debug('Removing address from whitelist for keyVault', { keyVaultAddr, addressToRemove }); // TODO: log the options leaving out sensitive data

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
