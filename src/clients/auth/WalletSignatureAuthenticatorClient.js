/**
 * WalletSignatureAuthenticatorClient
 * 
 * Client for interacting with WalletSignatureAuthenticator contract methods.
 * Handles wallet signature authentication, whitelist management, and configuration.
 */

const BaseContractClient = require('../../internal/BaseContractClient');
const { getWalletSignatureAuthenticatorContract } = require('../../contracts/authenticators/WalletSignatureAuthenticator');
const { WalletSignatureAuthenticatorEvents } = require('../../events');
const { requireAddress, requireBytes } = require('../../internal/assert');

class WalletSignatureAuthenticatorClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // TODO: add configure method and verify method

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

    const walletSigAuth = this.contract('write', getWalletSignatureAuthenticatorContract, this.addresses.walletSignatureAuth);

    try {
      const result = await this.sendTx(
        () => walletSigAuth.addToWhitelist(keyVaultAddress, authProof, newAddress),
        {
          parseEvents: [{
            eventDef: WalletSignatureAuthenticatorEvents.AddressAdded,
            contract: walletSigAuth
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('add to whitelist', error, { keyVaultAddress, newAddress });
    }
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

    const walletSigAuth = this.contract('write', getWalletSignatureAuthenticatorContract, this.addresses.walletSignatureAuth);

    try {
      const result = await this.sendTx(
        () => walletSigAuth.removeFromWhitelist(keyVaultAddress, authProof, addressToRemove),
        {
          parseEvents: [{
            eventDef: WalletSignatureAuthenticatorEvents.AddressRemoved,
            contract: walletSigAuth
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('remove from whitelist', error, { keyVaultAddress, addressToRemove });
    }
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

    const walletSigAuth = this.contract('read', getWalletSignatureAuthenticatorContract, this.addresses.walletSignatureAuth);
    
    try {
      const isConfigured = await walletSigAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw this.wrapError('check if wallet is configured', error, { keyVaultAddress });
    }
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

    const walletSigAuth = this.contract('read', getWalletSignatureAuthenticatorContract, this.addresses.walletSignatureAuth);

    try {
      const isWhitelisted = await walletSigAuth.isWhitelisted(keyVaultAddress, addressToCheck);
      return isWhitelisted;
    } catch (error) {
      throw this.wrapError('check if address is whitelisted', error, { keyVaultAddress, addressToCheck });
    }
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
    
    const walletSigAuth = this.contract('read', getWalletSignatureAuthenticatorContract, this.addresses.walletSignatureAuth);

    try {
      const whitelist = await walletSigAuth.getWhitelist(keyVaultAddress);
      return whitelist;
    } catch (error) {
      throw this.wrapError('get whitelist', error, { keyVaultAddress });
    }
  }

  /**
   * Get the EIP-712 domain separator
   * 
   * @returns {Promise<Bytes32>} EIP-712 domain separator
   */
  async getDomainSeparator() {
    const walletSigAuth = this.contract('read', getWalletSignatureAuthenticatorContract, this.addresses.walletSignatureAuth);

    try {
      const domainSeparator = await walletSigAuth.domainSeparator();
      return domainSeparator;
    } catch (error) {
      throw this.wrapError('get domain separator', error);
    }
  }
}

module.exports = WalletSignatureAuthenticatorClient;

