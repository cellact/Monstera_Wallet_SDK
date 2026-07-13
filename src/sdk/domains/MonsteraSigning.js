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
} from '../../internal/crypto/index.js';
import { executeSignAuthorization } from '../../internal/vault/signAuthorization.js';
import { defineDomainMethods } from './defineDomainMethods.js';

export const monsteraSigningMethods = defineDomainMethods({
  // --- Signing Reads ---

  /**
   * Sign a raw EVM transaction with the wallet's HD account at {@code index} (authenticated view).
   *
   * Encodes the structured {@code authProof} via {@link AuthProofBuilder} when needed, then delegates to
   * {@link KeyVaultClient#signTransaction}.
   *
   * @public
   * @async
   * @param {SignTransactionOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code index}, plus EVM tx fields
   * @returns {Promise<Bytes>} RLP-encoded signed transaction
   * @throws {ValidationError} If addresses, {@code authProof}, or numeric tx fields are missing/invalid
   * @throws {NetworkError} If the RPC view call fails (e.g. provider failure during minute-bucket leg)
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signTransaction(options = {}) {
    return this._invokeVaultAuthenticated({
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
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signMessage(options = {}) {
    return this._invokeVaultAuthenticated({
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
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async sign(options = {}) {
    return this._invokeVaultAuthenticated({
      options,
      buildAction: (o) => buildSignAction({ index: o.index, digest: o.hash }),
      invoke: (encoded) => this.keyVault.sign(encoded)
    });
  },


  /**
   * Sign an EIP-7702-style authorization tuple via KeyVault (same digest as ethers {@code hashAuthorization}).
   *
   * Resolves missing {@code chainId} / {@code nonce} from {@code options.provider} (preferred), the SDK
   * {@code readProvider}, or the signer's provider. The internal {@code implCall} is built and forwarded to
   * {@link KeyVaultClient#executeWithAuth}; the raw return is decoded into an ethers-style split signature.
   *
   * @public
   * @async
   * @param {SignAuthorizationOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code delegateAddr}, optional {@code index}/{@code chainId}/{@code nonce}/{@code provider},
   * @returns {Promise<SignedAuthorizationResult>} Ethers-compatible signed authorization
   * @throws {ValidationError} If required addresses are invalid, {@code chainId} or {@code nonce} can't be resolved (no provider), or numeric values are out of range
   * @throws {NetworkError} If chain id / nonce resolution or the underlying RPC call fails
   * @throws {ContractRevertError} If the underlying view call reverts (e.g. invalid auth proof or yParity)
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * For an authorization targeting a chain different from the SDK's RPC, pass {@code provider} connected to that chain
   * so nonce and chain id stay consistent.
   * Orchestration lives in {@code internal/crypto/signAuthorization.js}; hashing / verification / encoding helpers in
   * {@code internal/crypto/authorization.js} (barrel: {@code internal/crypto/index.js}).
   */
  async signAuthorization(options = {}) {
    return executeSignAuthorization(
      {
        keyVault: this.keyVault,
        fallbackProvider: this.readProvider ?? this.writeSigner?.provider ?? null,
        credentialsSession: this._vaultPipeline.getCredentialsSession(),
        encodeVaultAuthProof: (opts, buildAction) => this._vaultPipeline.encodeAuthProof(opts, buildAction)
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
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof or implementation revert)
   * @throws {WalletError} For other unrecognised failures
   */
  async executeWithAuth(options = {}) {
    return this._invokeVaultAuthenticated({
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
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async signWithImportedKey(options = {}) {
    return this._invokeVaultAuthenticated({
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
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async signSolana(options = {}) {
    return this._invokeVaultAuthenticated({
      options,
      buildAction: (o) => buildSignSolanaAction({ index: o.index, message: o.message }),
      invoke: (encoded) => this.keyVault.signSolana(encoded)
    });
  }
});
