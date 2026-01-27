/**
 * WalletSignatureAuthenticatorClient
 * 
 * Client for interacting with WalletSignatureAuthenticator contract methods.
 * Handles wallet signature authentication, whitelist management, and configuration.
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletSignatureAuthenticatorContract } from '../../contracts/authenticators/WalletSignatureAuthenticator.js';
import { WalletSignatureAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes } from '../../internal/assert.js';

class WalletSignatureAuthenticatorClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {Object} readProvider - Ethers provider for read operations
   * @param {Object} writeSigner - Ethers signer for write operations
   * @param {Object} config - Configuration object
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
   * @param {Object} options - Is configured options
   * @param {String} options.keyVaultAddr - KeyVault address of the wallet
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);
    
    return this.executeRead(
      () => walletSigAuth.isConfigured(keyVaultAddr),
      'check if wallet is configured',
      {
        ...options,
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {Object} options - Is whitelisted options
   * @param {String} options.keyVaultAddr - Key vault address 
   * @param {String} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<Boolean>} True if address is whitelisted, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddr, addressToCheck } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(addressToCheck, 'addressToCheck');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.isWhitelisted(keyVaultAddr, addressToCheck),
      'check if address is whitelisted',
      {
        ...options,
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {Object} options - Get whitelist options
   * @param {String} options.keyVaultAddr - Key vault address 
   * @returns {Promise<Array<String>>} Whitelist addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    
    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.getWhitelist(keyVaultAddr),
      'get whitelist',
      {
        ...options,
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  /**
   * Get the EIP-712 domain separator
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<Bytes32>} EIP-712 domain separator
   */
  async getDomainSeparator(options = {}) {
    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.domainSeparator(),
      'get domain separator',
      {
        ...options,
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  /**
   * Verify a signature
   * 
   * @param {Object} options - Verify options
   * @param {String} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature), Signature is over EIP-712 typed data: WalletAuth(wallet, deadline)
   * @returns {Promise<Boolean>} True if signature is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */ 
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.verify(keyVaultAddr, authProof),
      'verify signature',
      {
        ...options,
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Add a new address to the whitelist
   * 
   * @param {Object} options - Add to whitelist options
   * @param {String} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {String} options.addressToAdd - Address to add to the whitelist
   * @returns {Promise<Object>} Transaction receipt
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

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      () => walletSigAuth.addToWhitelist(keyVaultAddr, authProof, addressToAdd),
      'add to whitelist',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletSignatureAuthenticatorEvents.AddressAdded,
          contract: walletSigAuth
        }],
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  /**
   * Configure the wallet signature authenticator
   * 
   * @param {Object} options - Configure options
   * @param {String} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the whitelist addresses 
   * @returns {Promise<Object>} Configure wallet result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authConfig, 'authConfig');

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      () => walletSigAuth.configure(keyVaultAddr, authConfig),
      'configure wallet signature authenticator',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletSignatureAuthenticatorEvents.WalletConfigured,
          contract: walletSigAuth
        }],
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {Object} options - Remove from whitelist options
   * @param {String} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {String} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<Object>} Transaction receipt
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

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      () => walletSigAuth.removeFromWhitelist(keyVaultAddr, authProof, addressToRemove),
      'remove from whitelist',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletSignatureAuthenticatorEvents.AddressRemoved,
          contract: walletSigAuth
        }],
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }

}

export default WalletSignatureAuthenticatorClient;
