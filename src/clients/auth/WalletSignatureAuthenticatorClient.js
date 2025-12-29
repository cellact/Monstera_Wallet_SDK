/**
 * WalletSignatureAuthenticatorClient
 * 
 * Client for interacting with WalletSignatureAuthenticator contract methods.
 * Handles wallet signature authentication, whitelist management, and configuration.
 */

const BaseContractClient = require('../../base/BaseContractClient');
const { getWalletSignatureAuthenticatorContract } = require('../../contracts/authenticators/WalletSignatureAuthenticator');
const { WalletSignatureAuthenticatorEvents } = require('../../events');
const { requireAddress, requireBytes } = require('../../internal/assert');

class WalletSignatureAuthenticatorClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  /**
   * Add a new address to the whitelist
   * 
   * @param {Object} options - Add to whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.newAddress - New address to add to the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async addToWhitelist(options = {}) {
    const { keyVaultAddress, authProof, newAddress } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authProof, 'authProof');
    requireAddress(newAddress, 'newAddress');

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      () => walletSigAuth.addToWhitelist(keyVaultAddress, authProof, newAddress),
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
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the whitelist addresses 
   * @returns {Promise<Object>} Configure wallet result
   */
  async configure(options = {}) {
    const { keyVaultAddress, authConfig } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authConfig, 'authConfig');

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      () => walletSigAuth.configure(keyVaultAddress, authConfig),
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
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async removeFromWhitelist(options = {}) {
    const { keyVaultAddress, authProof, addressToRemove } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authProof, 'authProof');
    requireAddress(addressToRemove, 'addressToRemove');

    const walletSigAuth = this.getWriteContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeWrite(
      () => walletSigAuth.removeFromWhitelist(keyVaultAddress, authProof, addressToRemove),
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

  /**
   * Check if a wallet is configured
   * 
   * @param {Object} options - Is configured options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   */
  async isConfigured(options = {}) {
    const { keyVaultAddress } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);
    
    return this.executeRead(
      () => walletSigAuth.isConfigured(keyVaultAddress),
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
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {String} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<Boolean>} True if address is whitelisted, false otherwise
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddress, addressToCheck } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireAddress(addressToCheck, 'addressToCheck');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.isWhitelisted(keyVaultAddress, addressToCheck),
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
   * @param {String} options.keyVaultAddress - Key vault address 
   * @returns {Promise<Array<String>>} Whitelist addresses
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddress } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    
    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.getWhitelist(keyVaultAddress),
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
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature), Signature is over EIP-712 typed data: WalletAuth(wallet, deadline)
   * @returns {Promise<Boolean>} True if signature is valid, false otherwise
   */ 
  async verify(options = {}) {
    const { keyVaultAddress, authProof } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authProof, 'authProof');

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      () => walletSigAuth.verify(keyVaultAddress, authProof),
      'verify signature',
      {
        ...options,
        authenticatorAddress: this.config.addresses.walletSignatureAuth
      }
    );
  }
}

module.exports = WalletSignatureAuthenticatorClient;
