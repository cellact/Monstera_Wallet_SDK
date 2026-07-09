/**
 * Low-level client for the {@code PasswordOrWalletSignatureAuthenticator} contract.
 *
 * Supports password OR wallet-signature proofs via a unified {@code abi.encode(uint8 method, bytes methodProof)}
 * envelope. Password method uses {@code abi.encode(bytes password, bytes32 actionHash)}; wallet-signature method
 * uses {@code abi.encode(uint256 deadline, bytes signature)} over EIP-712 {@code WalletAuth}. Also supports
 * whitelist administration and wallet linking via {@code addToWhitelistWithProof}.
 * {@link Monstera} talks to this client via {@code monstera.auth.passwordOrWalletSignature}.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ConfigurePasswordOrWalletSignatureResult} ConfigurePasswordOrWalletSignatureResult
 * @typedef {import('../../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../../types/index.js').AddToWhitelistResult} AddToWhitelistResult
 * @typedef {import('../../types/index.js').RemoveFromWhitelistResult} RemoveFromWhitelistResult
 * @typedef {import('../../types/index.js').AddToWhitelistWithProofResult} AddToWhitelistWithProofResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../../types/index.js').WhitelistCheckOptions} WhitelistCheckOptions
 * @typedef {import('../../types/index.js').AuthContext} AuthContext
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientVerifyOptions} PasswordOrWalletSignatureClientVerifyOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientConfigureOptions} PasswordOrWalletSignatureClientConfigureOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientChangePasswordOptions} PasswordOrWalletSignatureClientChangePasswordOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientAddToWhitelistOptions} PasswordOrWalletSignatureClientAddToWhitelistOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientRemoveFromWhitelistOptions} PasswordOrWalletSignatureClientRemoveFromWhitelistOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientAddToWhitelistWithProofOptions} PasswordOrWalletSignatureClientAddToWhitelistWithProofOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientComputeLinkActionHashOptions} PasswordOrWalletSignatureClientComputeLinkActionHashOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientComputeLinkParamsHashOptions} PasswordOrWalletSignatureClientComputeLinkParamsHashOptions
 * @typedef {import('../../types/index.js').PasswordOrWalletSignatureClientIsLinkNonceUsedOptions} PasswordOrWalletSignatureClientIsLinkNonceUsedOptions
 *
 * @module clients/auth/PasswordOrWalletSignatureAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordOrWalletSignatureAuthenticatorContract } from '../../contracts/authenticators/PasswordOrWalletSignatureAuthenticator.js';
import { PasswordOrWalletSignatureAuthenticatorEvents } from '../../events/index.js';
import {
  requireAddress,
  requireBytes32,
  requireNonEmptyBytes,
  requireNonEmptyObject,
  requireNumber,
} from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class PasswordOrWalletSignatureAuthenticatorClient extends BaseContractClient {
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

  /**
   * @private
   * @returns {Address}
   */
  get _contractAddress() {
    return this.config.addresses.passwordOrWalletSigAuth;
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check whether {@code PasswordOrWalletSignatureAuthenticator} has been configured for a wallet.
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
    log.info('PasswordOrWalletSignatureAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.isConfigured(keyVaultAddr),
      methodName: 'check if wallet is configured',
      ...options,
    });
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
    log.info('PasswordOrWalletSignatureAuthenticator: isWhitelisted');
    log.debug('Checking if address is whitelisted for keyVault', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.isWhitelisted(keyVaultAddr, addressToCheck),
      methodName: 'check if address is whitelisted',
      ...options,
    });
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
    log.info('PasswordOrWalletSignatureAuthenticator: getWhitelist');
    log.debug('Getting whitelist for keyVault', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.getWhitelist(keyVaultAddr),
      methodName: 'get whitelist',
      ...options,
    });
  }

  /**
   * Check whether a wallet-link nonce has already been consumed.
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientIsLinkNonceUsedOptions} options - {@code keyVaultAddr} and {@code nonce}
   * @returns {Promise<boolean>} {@code true} if the nonce was already used
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isLinkNonceUsed(options = {}) {
    const { keyVaultAddr, nonce } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(nonce, 'nonce');
    log.info('PasswordOrWalletSignatureAuthenticator: isLinkNonceUsed');
    log.debug('Checking if link nonce is used', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.isLinkNonceUsed(keyVaultAddr, nonce),
      methodName: 'check if link nonce is used',
      ...options,
    });
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
    log.info('PasswordOrWalletSignatureAuthenticator: getDomainSeparator');

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.domainSeparator(),
      methodName: 'get domain separator',
      ...options,
    });
  }

  /**
   * Compute the params hash for wallet-link operations ({@code keccak256(abi.encode(newAddress, nonce, deadline))}).
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientComputeLinkParamsHashOptions} options - {@code addressToAdd}, {@code nonce}, {@code deadline}
   * @returns {Promise<Bytes32>} Params hash used in link action context
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeLinkParamsHash(options = {}) {
    const { addressToAdd, nonce, deadline } = options;
    requireAddress(addressToAdd, 'addressToAdd');
    requireBytes32(nonce, 'nonce');
    requireNumber(deadline, 'deadline', { allowBigInt: true });
    log.info('PasswordOrWalletSignatureAuthenticator: computeLinkParamsHash');
    log.debug('Computing link params hash', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.computeLinkParamsHash(addressToAdd, nonce, deadline),
      methodName: 'compute link params hash',
      ...options,
    });
  }

  /**
   * Compute the action hash for {@code addToWhitelistWithProof} given link parameters.
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientComputeLinkActionHashOptions} options - {@code keyVaultAddr}, {@code addressToAdd}, {@code nonce}, {@code deadline}
   * @returns {Promise<Bytes32>} Action hash to sign for the new wallet link
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeLinkActionHash(options = {}) {
    const { keyVaultAddr, addressToAdd, nonce, deadline } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(addressToAdd, 'addressToAdd');
    requireBytes32(nonce, 'nonce');
    requireNumber(deadline, 'deadline', { allowBigInt: true });
    log.info('PasswordOrWalletSignatureAuthenticator: computeLinkActionHash');
    log.debug('Computing link action hash', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.computeLinkActionHash(keyVaultAddr, addressToAdd, nonce, deadline),
      methodName: 'compute link action hash',
      ...options,
    });
  }

  /**
   * Verify a unified password-or-wallet-signature proof ({@code IAuthenticator.verify}).
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and ABI-encoded {@code authProof}
   * @returns {Promise<boolean>} {@code true} if the proof is accepted for the given action
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(uint8 method, bytes methodProof)} where {@code method} is
   * {@code 1} (password) or {@code 2} (wallet signature).
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyObject(action, 'action');
    log.info('PasswordOrWalletSignatureAuthenticator: verify');
    log.debug('Verifying auth proof for keyVault', sanitizer.forLog(options));

    const auth = this.getReadContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeRead({
      operation: () => auth.verify(keyVaultAddr, action, authProof),
      methodName: 'verify auth proof',
      ...options,
    });
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Configure the authenticator with password hash and initial whitelist ({@code IAuthenticator.configure}).
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientConfigureOptions} options - {@code keyVaultAddr} and {@code authConfig}
   * @returns {Promise<ConfigurePasswordOrWalletSignatureResult>} Standard write result with parsed {@code wallet} and {@code initialWhitelist}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authConfig = abi.encode(bytes32 passwordHash, address[] initialWhitelist)}.
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('PasswordOrWalletSignatureAuthenticator: configure');
    log.debug('Configuring password-or-wallet-signature authenticator for keyVault', sanitizer.forLog(options));

    const auth = this.getWriteContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeWrite({
      operation: () => auth.configure(keyVaultAddr, authConfig),
      methodName: 'configure password-or-wallet-signature authenticator',
      parseEvents: [{
        eventDef: PasswordOrWalletSignatureAuthenticatorEvents.WalletConfigured,
        contract: auth,
      }],
      extraData: { authenticatorAddress: this._contractAddress },
      ...options,
    });
  }

  /**
   * Replace the stored password hash. Caller must supply a valid unified {@code authProof} (password or wallet signature).
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientChangePasswordOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newPasswordHash}
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code newPasswordHash} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code PasswordChanged} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   * 
   * @remarks 
   * {@code authProof = abi.encode(uint8 method, bytes methodProof)} where {@code method} is
   * {@code 1} (password) or {@code 2} (wallet signature). 
   * methodProof is 1} {@code abi.encode(bytes, bytes32)} for password 
   * or 2} {@code abi.encode(unit256, bytes)} for wallet signature.
   */
  async changePassword(options = {}) {
    const { keyVaultAddr, authProof, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(newPasswordHash, 'newPasswordHash');
    log.info('PasswordOrWalletSignatureAuthenticator: changePassword');
    log.debug('Changing password for keyVault', sanitizer.forLog(options));

    const auth = this.getWriteContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeWrite({
      operation: () => auth.changePassword(keyVaultAddr, authProof, newPasswordHash),
      methodName: 'change password',
      parseEvents: [{
        eventDef: PasswordOrWalletSignatureAuthenticatorEvents.PasswordChanged,
        contract: auth,
      }],
      extraData: { authenticatorAddress: this._contractAddress },
      ...options,
    });
  }

  /**
   * Add an address to the wallet's whitelist (authenticated by password or wallet signature).
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientAddToWhitelistOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code addressToAdd}
   * @returns {Promise<AddToWhitelistResult>} Standard write result with parsed {@code added} and {@code wallet}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code AddressAdded} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   * 
   * @remarks 
   * {@code authProof = abi.encode(uint8 method, bytes methodProof)} where {@code method} is
   * {@code 1} (password) or {@code 2} (wallet signature). 
   * methodProof is 1} {@code abi.encode(bytes, bytes32)} for password 
   * or 2} {@code abi.encode(unit256, bytes)} for wallet signature.
   */
  async addToWhitelist(options = {}) {
    const { keyVaultAddr, authProof, addressToAdd } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(addressToAdd, 'addressToAdd');
    log.info('PasswordOrWalletSignatureAuthenticator: addToWhitelist');
    log.debug('Adding address to whitelist for keyVault', sanitizer.forLog(options));

    const auth = this.getWriteContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeWrite({
      operation: () => auth.addToWhitelist(keyVaultAddr, authProof, addressToAdd),
      methodName: 'add to whitelist',
      parseEvents: [{
        eventDef: PasswordOrWalletSignatureAuthenticatorEvents.AddressAdded,
        contract: auth,
      }],
      extraData: { authenticatorAddress: this._contractAddress },
      ...options,
    });
  }

  /**
   * Remove an address from the wallet's whitelist (authenticated by password or wallet signature).
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientRemoveFromWhitelistOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code addressToRemove}
   * @returns {Promise<RemoveFromWhitelistResult>} Standard write result with parsed {@code removed} and {@code wallet}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. last whitelisted address)
   * @throws {EventNotFoundError} If the {@code AddressRemoved} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   * 
   * @remarks 
   * {@code authProof = abi.encode(uint8 method, bytes methodProof)} where {@code method} is
   * {@code 1} (password) or {@code 2} (wallet signature). 
   * methodProof is 1} {@code abi.encode(bytes, bytes32)} for password 
   * or 2} {@code abi.encode(unit256, bytes)} for wallet signature.
   * 
   */
  async removeFromWhitelist(options = {}) {
    const { keyVaultAddr, authProof, addressToRemove } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(addressToRemove, 'addressToRemove');
    log.info('PasswordOrWalletSignatureAuthenticator: removeFromWhitelist');
    log.debug('Removing address from whitelist for keyVault', sanitizer.forLog(options));

    const auth = this.getWriteContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeWrite({
      operation: () => auth.removeFromWhitelist(keyVaultAddr, authProof, addressToRemove),
      methodName: 'remove from whitelist',
      parseEvents: [{
        eventDef: PasswordOrWalletSignatureAuthenticatorEvents.AddressRemoved,
        contract: auth,
      }],
      extraData: { authenticatorAddress: this._contractAddress },
      ...options,
    });
  }

  /**
   * Add a new wallet to the whitelist using a link signature from the new wallet plus admin auth proof.
   *
   * @public
   * @async
   * @param {PasswordOrWalletSignatureClientAddToWhitelistWithProofOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code addressToAdd}, {@code nonce}, {@code deadline}, {@code newWalletSignature}
   * @returns {Promise<AddToWhitelistWithProofResult>} Standard write result with parsed {@code wallet}, {@code linkedWallet}, and {@code nonce}
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. expired or invalid link signature)
   * @throws {EventNotFoundError} If the {@code WalletLinkApproved} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   * 
   * @remarks 
   * {@code authProof = abi.encode(uint8 method, bytes methodProof)} where {@code method} is
   * {@code 1} (password) or {@code 2} (wallet signature). 
   * {@code methodProof} is 1} {@code abi.encode(bytes, bytes32)} for password 
   * or 2} {@code abi.encode(unit256, bytes)} for wallet signature.
   */
  async addToWhitelistWithProof(options = {}) {
    const { keyVaultAddr, authProof, addressToAdd, nonce, deadline, newWalletSignature } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(addressToAdd, 'addressToAdd');
    requireBytes32(nonce, 'nonce');
    requireNumber(deadline, 'deadline', { allowBigInt: true });
    requireNonEmptyBytes(newWalletSignature, 'newWalletSignature');
    log.info('PasswordOrWalletSignatureAuthenticator: addToWhitelistWithProof');
    log.debug('Adding address to whitelist with link proof for keyVault', sanitizer.forLog(options));

    const auth = this.getWriteContract(getPasswordOrWalletSignatureAuthenticatorContract, this._contractAddress);

    return this.executeWrite({
      operation: () => auth.addToWhitelistWithProof(
        keyVaultAddr,
        authProof,
        addressToAdd,
        nonce,
        deadline,
        newWalletSignature,
      ),
      methodName: 'add to whitelist with proof',
      parseEvents: [{
        eventDef: PasswordOrWalletSignatureAuthenticatorEvents.WalletLinkApproved,
        contract: auth,
      }],
      extraData: { authenticatorAddress: this._contractAddress },
      ...options,
    });
  }
}

export default PasswordOrWalletSignatureAuthenticatorClient;
