/**
 * DualFactorAuthenticatorClient
 * 
 * Client for interacting with DualFactorAuthenticator contract methods.
 * Handles dual factor authentication and configuration.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ConfigurePasswordDualFactorResult} ConfigurePasswordDualFactorResult
 * @typedef {import('../../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../../types/index.js').UpdateGuardianResult} UpdateGuardianResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getDualFactorAuthenticatorContract } from '../../contracts/authenticators/DualFactorAuthenticator.js';
import { DualFactorAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';

class DualFactorAuthenticatorClient extends BaseContractClient {
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
   * @param {Record<string, unknown>} options - Check if wallet is configured options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('DualFactorAuthenticator: isConfigured');
    log.debug('Checking if ' + keyVaultAddr + ' is configured');

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Verify password with dual factor auth proof
   * 
   * @param {Record<string, unknown>} options - Verify auth proof options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - The raw auth proof bytes (utf8 encoded string) authProof = abi.encode(bytes password, uint256 deadline, bytes signature)
   * @returns {Promise<boolean>} True if auth proof is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    log.info('DualFactorAuthenticator: verify');
    log.debug('Verifying auth proof for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.verify(keyVaultAddr, authProof),
        methodName: 'verify auth proof',
        ...options
      }
    );
  }

  /**
   * Get the guardian of a wallet
   * 
   * @param {Record<string, unknown>} options - Get guardian options 
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @returns {Promise<Address>} Guardian address
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async getGuardian(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('DualFactorAuthenticator: getGuardian');
    log.debug('Getting guardian for ' + keyVaultAddr);

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.getGuardian(keyVaultAddr),
        methodName: 'get guardian',
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
    log.info('DualFactorAuthenticator: getDomainSeparator');

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.domainSeparator(),
        methodName: 'get domain separator',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Update the password of a wallet using valid dual factor auth proof
   * 
   * @param {Record<string, unknown>} options - Update password options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @param {Bytes} options.authProof - The raw auth proof bytes (utf8 encoded string) authProof = abi.encode(bytes password, uint256 deadline, bytes signature)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePassword(options = {}) {
    const { keyVaultAddr, authProof, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireBytes(newPasswordHash, 'newPasswordHash');
    log.info('DualFactorAuthenticator: updatePassword');
    log.debug('Updating password for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const dualFactorAuth = this.getWriteContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    const result = await this.executeWrite(
      {
        operation: () => dualFactorAuth.changePassword(keyVaultAddr, authProof, newPasswordHash),
        methodName: 'change password dual factor',
        parseEvents: [{
          eventDef: DualFactorAuthenticatorEvents.PasswordChanged,
          contract: dualFactorAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.dualFactorAuth },
        ...options
      }
    );
    
    // Map wallet to walletAddr for consistency with original API
    if (result.wallet) {
      result.walletAddr = result.wallet;
      delete result.wallet; // Remove wallet field to match original API
    }

    return result;
  }

  /**
   * Configure password dual factor 
   * 
   * @param {Record<string, unknown>} options - Configure password options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config = abi.encode(bytes32 passwordHash, address guardian)
   * @returns {Promise<ConfigurePasswordDualFactorResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authConfig, 'authConfig');
    log.info('DualFactorAuthenticator: configure');
    log.debug('Configuring password dual factor for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const dualFactorAuth = this.getWriteContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);
    
    return this.executeWrite(
      {
        operation: () => dualFactorAuth.configure(keyVaultAddr, authConfig),
        methodName: 'configure password dual factor',
        parseEvents: [{
          eventDef: DualFactorAuthenticatorEvents.WalletConfigured,
          contract: dualFactorAuth
        }],  
        extraData: { authenticatorAddress: this.config.addresses.dualFactorAuth },
        ...options
      }
    );
  }

  /**
   * Update the guardian of a wallet
   * 
   * @param {Record<string, unknown>} options - Update guardian options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - The raw auth proof bytes (utf8 encoded string) authProof = abi.encode(bytes password, uint256 deadline, bytes signature)
   * @param {Address} options.newGuardian - New guardian address
   * @returns {Promise<UpdateGuardianResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateGuardian(options = {}) {
    const { keyVaultAddr, authProof, newGuardian } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    requireAddress(newGuardian, 'newGuardian');
    log.info('DualFactorAuthenticator: updateGuardian');
    log.debug('Updating guardian for ' + keyVaultAddr + ' to ' + newGuardian); // TODO: log the options leaving out sensitive data 

    const dualFactorAuth = this.getWriteContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);
    
    return this.executeWrite(
      {
        operation: () => dualFactorAuth.changeGuardian(keyVaultAddr, authProof, newGuardian),
        methodName: 'update guardian',
        parseEvents: [{
          eventDef: DualFactorAuthenticatorEvents.GuardianChanged,
          contract: dualFactorAuth
        }],  
        extraData: { authenticatorAddress: this.config.addresses.dualFactorAuth },
        ...options
      }
    );
  }
}

export default DualFactorAuthenticatorClient;
