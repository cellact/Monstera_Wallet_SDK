/**
 * Low-level client for the {@code WalletLogic} contract (wallet-proxy orchestration).
 *
 * The WalletLogic contract is the user-facing proxy for full-stack wallets created by the factory.
 * Most signing methods here forward to the wallet's KeyVault under the hood, so the same
 * behaviour is reachable from {@link KeyVaultClient} with one less hop.
 *
 * @remarks
 * Authenticated reads and writes here delegate to KeyVault under the hood. {@link Monstera} exposes the KeyVault-shaped
 * API on the main class ({@code keyVaultAddr}); use this client when you need the WalletLogic contract surface with
 * {@code walletAddr} (proxy address), e.g. {@link WalletLogicClient#initialize} after deployment.
 *
 * Advanced. Application signing goes through {@link Monstera} (`signMessage`, `sign`, `signTransaction`).
 * Use this client when you already hold proof bytes and you are calling the WalletLogic proxy.
 *
 * @module clients/logic/WalletLogicClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletLogicContract } from '../../contracts/core/walletLogic.js';
import { KeyVaultEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireBytes32, requireNonNegativeInteger, requireNonEmptyBytes } from '../../internal/validation/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class WalletLogicClient extends BaseContractClient {
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
   * Resolve the KeyVault contract for a wallet proxy via {@code WalletLogic.getKeyVault()}.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.debug('Getting keyVault address for wallet', sanitizer.forLog(options));

    const logic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => logic.getKeyVault(),
        methodName: 'get key vault address',
        ...options
      }
    );
  }

  /**
   * Resolve the KeyVault contract for a wallet proxy via the storage slot directly ({@code WalletLogic.keyVault()}).
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mirrors {@link WalletLogicClient#getKeyVaultAddr} but reads the public state variable instead of the getter.
   */
  async get_key_vault_addr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.debug('Getting keyVault address for wallet', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.keyVault(),
        methodName: 'get key vault address',
        ...options
      }
    );
  }

  /**
   * Get the authenticator contract currently bound to a wallet (via WalletLogic).
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAuthenticatorAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.debug('Getting authenticator address for wallet', sanitizer.forLog(options));

    const logic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => logic.getAuthenticator(),
        methodName: 'get authenticator',
        ...options
      }
    );
  }

  /**
   * Check whether a wallet's WalletLogic proxy has been initialized.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<boolean>} {@code true} if initialized
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isInitialized(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.debug('Checking if wallet is initialized', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.initialized(),
        methodName: 'check if wallet is initialized',
        ...options
      }
    );
  }

  /**
   * Get an HD account address from a wallet proxy at {@code index}.
   *
   * @public
   * @async
   * @param {WalletProxyIndexOptions} options - {@code walletAddr} and {@code index}
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If {@code walletAddr} is invalid or {@code index} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddr(options = {}) {
    const { walletAddr, index } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonNegativeInteger(index, 'index');
    log.debug('Getting account address for wallet at index', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.getAccountAddress(index),
        methodName: 'get account address',
        ...options
      }
    );
  }

  /**
   * Get a contiguous slice of HD account addresses from a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyAccountSliceOptions} options - {@code walletAddr}, {@code fromIndex}, {@code count}
   * @returns {Promise<Address[]>} Array of account addresses (length {@code count})
   * @throws {ValidationError} If {@code walletAddr} is invalid or {@code fromIndex}/{@code count} is not a non-negative integer
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAccountAddresses(options = {}) {
    const { walletAddr, fromIndex, count } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    log.debug('Getting account addresses for wallet for index range', sanitizer.forLog(options));
    
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.getAccountAddresses(fromIndex, count),
        methodName: 'get account addresses',
        ...options
      }
    );
  }

  /**
   * Sign a raw EVM transaction via WalletLogic (forwards to KeyVault, authenticated view).
   *
   * @public
   * @async
   * @param {SignTransactionWalletOptions} options - {@code walletAddr}, {@code authProof}, {@code index}, plus tx fields
   * @returns {Promise<Bytes>} RLP-encoded signed transaction
   * @throws {ValidationError} If addresses, {@code authProof}, or numeric tx fields are missing/invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signTransaction(options = {}) {
    const { walletAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireBytes(data, 'data');
    requireNonNegativeInteger(chainId, 'chainId');
    log.info('WalletLogic: signTransaction');
    log.debug('Signing transaction for wallet at index to address', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId),
        methodName: 'sign transaction',
        ...options
      }
    );
  }

  /**
   * Sign an EIP-191 personal message via WalletLogic (forwards to KeyVault, authenticated view).
   *
   * @public
   * @async
   * @param {SignMessageWalletOptions} options - {@code walletAddr}, {@code authProof}, {@code index}, {@code message}
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async signMessage(options = {}) {
    const { walletAddr, authProof, index, message } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');
    log.info('WalletLogic: signMessage');
    log.debug('Signing Ethereum EIP-191 message for wallet at index', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.signMessage(authProof, index, message),
        methodName: 'sign message',
        ...options
      }
    );
  }

  /**
   * Sign a 32-byte hash via WalletLogic (forwards to KeyVault, authenticated view).
   *
   * @public
   * @async
   * @param {SignHashWalletOptions} options - {@code walletAddr}, {@code authProof}, {@code index}, 32-byte {@code hash}
   * @returns {Promise<Bytes>} Signature bytes
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If the RPC view call fails
   * @throws {ContractRevertError} If the underlying call reverts (e.g. invalid auth proof)
   * @throws {WalletError} For other unrecognised failures
   */
  async sign(options = {}) {
    const { walletAddr, authProof, index, hash } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes32(hash, 'hash');
    log.info('WalletLogic: sign');
    log.debug('Signing Ethereum hash for wallet at index', sanitizer.forLog(options));

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      {
        operation: () => walletLogic.sign(authProof, index, hash),
        methodName: 'sign hash',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Initialize a freshly deployed WalletLogic proxy by binding it to a {@code keyVaultAddr}.
   *
   * @public
   * @async
   * @param {InitializeWalletLogicOptions} options - {@code walletAddr} (proxy) and {@code keyVaultAddr}
   * @returns {Promise<BaseTransactionResult>} Standard write result
   * @throws {ValidationError} If {@code walletAddr} or {@code keyVaultAddr} is missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. already initialized)
   * @throws {WalletError} For other unrecognised failures
   */
  async initialize(options = {}) {
    const { walletAddr, keyVaultAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('WalletLogic: initialize');
    log.debug('Initializing wallet logic with keyVault', sanitizer.forLog(options));

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);
  
    return this.executeWrite(
      {
        operation: () => walletLogic.initialize(keyVaultAddr),
        methodName: 'initialize wallet logic',
        ...options
      }
    );
  }

  /**
   * Swap the authenticator via WalletLogic (forwards to KeyVault, authenticated write).
   *
   * @public
   * @async
   * @param {UpdateAuthenticatorWalletOptions} options - {@code walletAddr}, {@code authProof}, {@code newAuthenticatorAddr}, {@code newAuthConfig}
   * @returns {Promise<UpdateResult>} Standard write result with parsed authenticator change fields
   * @throws {ValidationError} If addresses, {@code authProof}, or {@code newAuthConfig} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code AuthenticatorChanged} event (KeyVault) is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateAuthenticatorAddr(options = {}) {
    const { walletAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireNonEmptyBytes(newAuthConfig, 'newAuthConfig');
    log.info('WalletLogic: updateAuthenticatorAddr');
    log.debug('Updating authenticator for wallet to new address', sanitizer.forLog(options));
    
    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);

    return this.executeWrite(
      {
        operation: () => walletLogic.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
        methodName: 'change authenticator',
        parseEvents: [{
          eventDef: KeyVaultEvents.AuthenticatorChanged, // Event is emitted by the underlying KeyVault contract
          contract: walletLogic
        }],
        ...options
      }
    );
  }

  /**
   * Upgrade the wallet's KeyVault implementation via WalletLogic (forwards to KeyVault, authenticated write).
   *
   * @public
   * @async
   * @param {WalletLogicUpdateKeyVaultImplOptions} options - {@code walletAddr}, {@code authProof}, {@code newImplAddr}
   * @returns {Promise<UpdateKeyVaultImplAddrResult>} Standard write result with parsed {@code oldImpl}/{@code newImpl}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code ImplementationUpgraded} event (KeyVault) is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateKeyVaultImplAddr(options = {}) {
    const { walletAddr, authProof, newImplAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');
    log.info('WalletLogic: updateKeyVaultImplAddr');
    log.debug('Updating keyVault implementation for wallet', sanitizer.forLog(options));

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);

    return this.executeWrite(
      {
        operation: () => walletLogic.upgradeKeyVault(authProof, newImplAddr),
        methodName: 'upgrade key vault implementation',
        parseEvents: [{
          eventDef: KeyVaultEvents.ImplementationUpgraded, // Event is emitted by the underlying KeyVault contract
          contract: walletLogic
        }],
        ...options
      }
    );
  }
}

export default WalletLogicClient;
