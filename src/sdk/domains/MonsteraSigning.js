/**
 * MonsteraSigning domain methods for {@link Monstera}.
 * Mixed onto {@link Monstera} prototype at construction time.
 *
 * @module sdk/domains/MonsteraSigning
 */

import {
  buildSignAction,
  buildSignMessageAction,
  buildSignTransactionAction,
  buildExecuteWithAuthAction,
  buildSignWithImportedKeyAction,
  buildSignSolanaAction,
} from '../../internal/vault/actions/index.js';
import { executeSignAuthorization } from '../../internal/vault/signEip7702Authorization.js';
import { defineDomainMethods } from './defineDomainMethods.js';
import { getSdkInternals } from '../sdkInternals.js';
import { invokeVaultAuthenticated } from './MonsteraRecipes.js';

export const monsteraSigningMethods = defineDomainMethods({
  // --- Signing Reads ---

  /**
   * Sign a raw EVM transaction with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {SignTransactionOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, plus EVM tx fields
   * @returns {Promise<Bytes>} RLP-encoded signed transaction
   * @throws {ValidationError} If addresses, {@code authProof}, or numeric tx fields are missing/invalid
   */
  async signTransaction(options = {}) {
    return invokeVaultAuthenticated(this, {
      options,
      buildAction: (o) =>
        buildSignTransactionAction({
          index: o.index,
          nonce: o.nonce,
          gasPrice: o.gasPrice,
          gasLimit: o.gasLimit,
          to: o.to,
          value: o.value,
          txData: o.txData,
          chainId: o.chainId
        }),
      invoke: (encoded) => this.keyVault.signTransaction(encoded)
    });
  },

  /**
   * Sign an EIP-191 personal message with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {SignMessageOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, {@code message},
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    return invokeVaultAuthenticated(this, {
      options,
      buildAction: (o) => buildSignMessageAction({ index: o.index, message: o.message }),
      invoke: (encoded) => this.keyVault.signMessage(encoded)
    });
  },

  /**
   * Sign an arbitrary 32-byte hash with the wallet's HD account at {@code index} (authenticated view).
   *
   * @public
   * @async
   * @param {SignHashOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, 32-byte {@code hash},
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    return invokeVaultAuthenticated(this, {
      options,
      buildAction: (o) => buildSignAction({ index: o.index, digest: o.hash }),
      invoke: (encoded) => this.keyVault.sign(encoded)
    });
  },


  /**
   * Sign an EIP-7702-style authorization tuple via KeyVault (same digest as ethers {@code hashAuthorization}).
   *
   * @public
   * @async
   * @param {SignAuthorizationOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code delegateAddr}, optional {@code index}/{@code chainId}/{@code nonce}/{@code provider},
   * @returns {Promise<SignedAuthorizationResult>} Ethers-compatible signed authorization
   * @throws {ValidationError} If required addresses are invalid, {@code chainId} or {@code nonce} can't be resolved (no provider), or numeric values are out of range
   *
   * @remarks For a chain other than the SDK RPC, pass {@code provider} for that chain so {@code nonce} and {@code chainId} match.
   */
  async signAuthorization(options = {}) {
    return executeSignAuthorization(
      {
        keyVault: this.keyVault,
        fallbackProvider: this.readProvider ?? this.writeSigner?.provider ?? null,
        connectSession: getSdkInternals(this).keyVaultAuthPipeline.getConnectSession(),
        encodeVaultAuthProof: (opts, buildAction) => getSdkInternals(this).keyVaultAuthPipeline.encodeAuthProof(opts, buildAction)
      },
      options,
      buildExecuteWithAuthAction
    );
  },

  /**
   * Execute an arbitrary KeyVault implementation function gated by an auth proof (authenticated view).
   *
   * Used internally by {@link Monstera#signAuthorization}; advanced callers can supply their own
   * {@code implCall} bytes when extending KeyVault.
   *
   * @public
   * @async
   * @param {ExecuteWithAuthOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code implCall},
   * @returns {Promise<Bytes>} Raw return bytes from the implementation function
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async executeWithAuth(options = {}) {
    return invokeVaultAuthenticated(this, {
      options,
      buildAction: (o) => buildExecuteWithAuthAction({ implCall: o.implCall }),
      invoke: (encoded) => this.keyVault.executeWithAuth(encoded)
    });
  },

  /**
   * Sign a digest with an imported key (V2, authenticated view).
   *
   * @public
   * @async
   * @param {SignWithImportedKeyOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code keyId}, 32-byte {@code digest},
   * @returns {Promise<Bytes>} Signature bytes (format depends on the imported key's curve)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signWithImportedKey(options = {}) {
    return invokeVaultAuthenticated(this, {
      options,
      buildAction: (o) => buildSignWithImportedKeyAction({ keyId: o.keyId, digest: o.digest }),
      invoke: (encoded) => this.keyVault.signWithImportedKey(encoded)
    });
  },

  /**
   * Sign a Solana message with the HD account at {@code index} (V2, authenticated view).
   *
   * @public
   * @async
   * @param {SignSolanaOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, {@code message},
   * @returns {Promise<Bytes>} Solana signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signSolana(options = {}) {
    return invokeVaultAuthenticated(this, {
      options,
      buildAction: (o) => buildSignSolanaAction({ index: o.index, message: o.message }),
      invoke: (encoded) => this.keyVault.signSolana(encoded)
    });
  }
});
