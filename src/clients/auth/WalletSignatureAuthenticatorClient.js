/**
 * Low-level client for the {@code WalletSignatureAuthenticator} contract.
 *
 * Backs the wallet-signature flow: an EIP-712 {@code WalletAuth(wallet, actionHash, deadline)} signature from
 * a whitelisted address proves identity for KeyVault calls and whitelist administration.
 * {@link Monstera} talks to this client via {@code monstera.auth.walletSignature}.
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
 * @typedef {import('../../types/index.js').WhitelistCheckOptions} WhitelistCheckOptions
 * @typedef {import('../../types/index.js').AuthContext} AuthContext
 * @typedef {import('../../types/index.js').WalletSignatureClientVerifyOptions} WalletSignatureClientVerifyOptions
 * @typedef {import('../../types/index.js').WalletSignatureClientAddToWhitelistOptions} WalletSignatureClientAddToWhitelistOptions
 * @typedef {import('../../types/index.js').WalletSignatureClientConfigureOptions} WalletSignatureClientConfigureOptions
 * @typedef {import('../../types/index.js').WalletSignatureClientRemoveFromWhitelistOptions} WalletSignatureClientRemoveFromWhitelistOptions
 *
 * @module clients/auth/WalletSignatureAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletSignatureAuthenticatorContract } from '../../contracts/authenticators/WalletSignatureAuthenticator.js';
import { WalletSignatureAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireNonEmptyBytes, requireNonEmptyObject } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class WalletSignatureAuthenticatorClient extends BaseContractClient {
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
   * Check whether {@code WalletSignatureAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletSignatureAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

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
   * Check whether an address is on a wallet's whitelist.
   *
   * @public
   * @async
   * @param {WhitelistCheckOptions} options - {@code keyVaultAddr} and {@code addressToCheck}
   * @returns {Promise<boolean>} {@code true} if {@code addressToCheck} is whitelisted
   * @throws {ValidationError} If addresses are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddr, addressToCheck } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(addressToCheck, 'addressToCheck');
    log.info('WalletSignatureAuthenticator: isWhitelisted');
    log.debug('Checking if address is whitelisted for keyVault', sanitizer.forLog(options));

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
   * Get all whitelisted addresses for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address[]>} Whitelisted addresses
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletSignatureAuthenticator: getWhitelist');
    log.debug('Getting whitelist for keyVault', sanitizer.forLog(options));

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
   * Read the EIP-712 domain separator advertised by the authenticator contract.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Bytes32>} 32-byte domain separator
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
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
   * Verify an ABI-encoded {@code (uint256 deadline, bytes signature)} proof bound to an action.
   *
   * @public
   * @async
   * @param {WalletSignatureClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and {@code authProof}
   * @returns {Promise<boolean>} {@code true} if the proof is accepted (recovered signer is whitelisted, {@code actionHash} matches, and {@code deadline} not expired)
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, {@code action} is missing, or {@code authProof} is not non-empty bytes
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */ 
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyObject(action, 'action');
    log.info('WalletSignatureAuthenticator: verify');
    log.debug('Verifying auth proof for keyVault', sanitizer.forLog(options));

    const walletSigAuth = this.getReadContract(getWalletSignatureAuthenticatorContract, this.config.addresses.walletSignatureAuth);

    return this.executeRead(
      {
        operation: () => walletSigAuth.verify(keyVaultAddr, action, authProof),
        methodName: 'verify signature',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Add an address to the wallet's whitelist (authenticated by an existing whitelist signature).
   *
   * @public
   * @async
   * @param {WalletSignatureClientAddToWhitelistOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code addressToAdd}
   * @returns {Promise<AddToWhitelistResult>} Standard write result with parsed {@code added} and {@code wallet}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof or address already whitelisted)
   * @throws {EventNotFoundError} If the {@code AddressAdded} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async addToWhitelist(options = {}) {
    const { keyVaultAddr, authProof, addressToAdd } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(addressToAdd, 'addressToAdd');
    log.info('WalletSignatureAuthenticator: addToWhitelist');
    log.debug('Adding address to whitelist for keyVault', sanitizer.forLog(options));

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
   * Configure the authenticator with an ABI-encoded initial whitelist ({@code abi.encode(address[])}).
   *
   * @public
   * @async
   * @param {WalletSignatureClientConfigureOptions} options - {@code keyVaultAddr} and {@code authConfig}
   * @returns {Promise<ConfigureWalletSignatureResult>} Standard write result with parsed {@code wallet} and {@code initialWhitelist}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('WalletSignatureAuthenticator: configure');
    log.debug('Configuring wallet signature authenticator for keyVault', sanitizer.forLog(options));

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
   * Remove an address from the wallet's whitelist (authenticated by an existing whitelist signature).
   *
   * @public
   * @async
   * @param {WalletSignatureClientRemoveFromWhitelistOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code addressToRemove}
   * @returns {Promise<RemoveFromWhitelistResult>} Standard write result with parsed {@code removed} and {@code wallet}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof, last whitelisted address)
   * @throws {EventNotFoundError} If the {@code AddressRemoved} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async removeFromWhitelist(options = {}) {
    const { keyVaultAddr, authProof, addressToRemove } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(addressToRemove, 'addressToRemove');
    log.info('WalletSignatureAuthenticator: removeFromWhitelist');
    log.debug('Removing address from whitelist for keyVault', sanitizer.forLog(options));

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
