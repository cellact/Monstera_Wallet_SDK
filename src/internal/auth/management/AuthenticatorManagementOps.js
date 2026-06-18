/**
 * Authenticator management writes: password / guardian / whitelist updates.
 *
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../../clients/auth/AuthenticatorClient.js').default} AuthenticatorClient
 *
 * @module internal/auth/management/AuthenticatorManagementOps
 */

import {
  buildChangePasswordAction,
  buildDualFactorChangePasswordAction,
  buildChangeGuardianAction,
  buildAddToWhitelistAction,
  buildRemoveFromWhitelistAction,
  buildMinuteSignatureChangePasswordAction
} from '../context/actions/index.js';
import { requireAddress, requireBytes32, requireUtf8Bytes, requireWalletOrHdNode } from '../../assert.js';

/**
 * @public
 */
export class AuthenticatorManagementOps {
  /**
   * @public
   * @param {Object} deps
   * @param {MonsteraConfigOptions} deps.config
   * @param {import('../proof/AuthProofPipeline.js').AuthProofPipeline} deps.authProofPipeline
   * @param {AuthenticatorClient} deps.auth
   */
  constructor({ config, authProofPipeline, auth }) {
    this._config = config;
    this._authProofPipeline = authProofPipeline;
    this._auth = auth;
  }

  /**
   * @public
   * @param {import('../../types/index.js').UpdatePasswordOptions} options
   */
  async updatePassword(options = {}) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    requireUtf8Bytes(options.currentPassword, 'currentPassword');
    requireBytes32(options.newPasswordHash, 'newPasswordHash');

    const authenticatorAddr = this._config.addresses.passwordAuth;
    const { authProof: currentPassword } = await this._authProofPipeline.prepare('password', {
      keyVaultAddr: options.keyVaultAddr,
      password: options.currentPassword,
      action: buildChangePasswordAction(authenticatorAddr, options.newPasswordHash)
    });

    return this._auth.password.updatePassword({
      keyVaultAddr: options.keyVaultAddr,
      currentPassword,
      newPasswordHash: options.newPasswordHash
    });
  }

  /**
   * @public
   * @param {import('../../types/index.js').AddWhitelistOptions} options
   */
  async addToWhitelist(options = {}) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    requireAddress(options.addressToAdd, 'addressToAdd');
    requireWalletOrHdNode(options.signer, 'signer');

    const authenticatorAddr = this._config.addresses.walletSignatureAuth;
    const { authProof } = await this._authProofPipeline.prepare('walletSignature', {
      ...options,
      action: buildAddToWhitelistAction(authenticatorAddr, options.addressToAdd)
    });

    return this._auth.walletSignature.addToWhitelist({
      keyVaultAddr: options.keyVaultAddr,
      authProof,
      addressToAdd: options.addressToAdd
    });
  }

  /**
   * @public
   * @param {import('../../types/index.js').RemoveWhitelistOptions} options
   */
  async removeFromWhitelist(options = {}) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    requireAddress(options.addressToRemove, 'addressToRemove');
    requireWalletOrHdNode(options.signer, 'signer');

    const authenticatorAddr = this._config.addresses.walletSignatureAuth;
    const { authProof } = await this._authProofPipeline.prepare('walletSignature', {
      ...options,
      action: buildRemoveFromWhitelistAction(authenticatorAddr, options.addressToRemove)
    });

    return this._auth.walletSignature.removeFromWhitelist({
      keyVaultAddr: options.keyVaultAddr,
      authProof,
      addressToRemove: options.addressToRemove
    });
  }

  /**
   * @public
   * @param {import('../../types/index.js').UpdatePasswordDualFactorOptions} options
   */
  async updatePasswordDualFactor(options = {}) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    requireBytes32(options.newPasswordHash, 'newPasswordHash');
    requireBytes32(options.passwordHash, 'passwordHash');
    requireWalletOrHdNode(options.signer, 'signer');

    const authenticatorAddr = this._config.addresses.dualFactorAuth;
    const { authProof } = await this._authProofPipeline.prepare('dualFactor', {
      ...options,
      action: buildDualFactorChangePasswordAction(authenticatorAddr, options.newPasswordHash)
    });

    return this._auth.dualFactor.updatePassword({
      keyVaultAddr: options.keyVaultAddr,
      authProof,
      newPasswordHash: options.newPasswordHash
    });
  }

  /**
   * @public
   * @param {import('../../types/index.js').UpdateGuardianOptions} options
   */
  async updateGuardian(options = {}) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    requireBytes32(options.passwordHash, 'passwordHash');
    requireAddress(options.newGuardian, 'newGuardian');
    requireWalletOrHdNode(options.signer, 'signer');

    const authenticatorAddr = this._config.addresses.dualFactorAuth;
    const { authProof } = await this._authProofPipeline.prepare('dualFactor', {
      ...options,
      action: buildChangeGuardianAction(authenticatorAddr, options.newGuardian)
    });

    return this._auth.dualFactor.updateGuardian({
      keyVaultAddr: options.keyVaultAddr,
      authProof,
      newGuardian: options.newGuardian
    });
  }

  /**
   * @public
   * @param {import('../../types/index.js').UpdatePasswordOptions} options
   */
  async updatePasswordMinuteSignature(options = {}) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    requireUtf8Bytes(options.currentPassword, 'currentPassword');
    requireBytes32(options.newPasswordHash, 'newPasswordHash');

    const authenticatorAddr = this._config.addresses.passwordMinuteSignatureAuth;
    const { authProof: currentPassword } = await this._authProofPipeline.prepare('password', {
      keyVaultAddr: options.keyVaultAddr,
      password: options.currentPassword,
      authenticatorAddr,
      action: buildMinuteSignatureChangePasswordAction(authenticatorAddr, options.newPasswordHash)
    });

    return this._auth.passwordMinuteSignature.updatePassword({
      keyVaultAddr: options.keyVaultAddr,
      currentPassword,
      newPasswordHash: options.newPasswordHash
    });
  }
}
