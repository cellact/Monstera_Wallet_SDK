/**
 * Low-level client for the {@code WalletFactory} contract.
 *
 * Handles wallet creation (full stack, core-only, with hook, with custom logic) and admin operations
 * (beacon upgrade, admin transfer). All creation methods accept already-encoded {@link EncodedAuthConfigOptions}
 * — the {@link Monstera} facade uses {@link AuthConfigBuilder} to encode structured input before delegating here.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').WalletCreationResult} WalletCreationResult
 * @typedef {import('../../types/index.js').TransferAdminResult} TransferAdminResult
 * @typedef {import('../../types/index.js').UpdateWalletLogicImplAddrResult} UpdateWalletLogicImplAddrResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../../types/index.js').EncodedAuthConfigOptions} EncodedAuthConfigOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletBaseOptions} FactoryClientCreateWalletBaseOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletFromMnemonicOptions} FactoryClientCreateWalletFromMnemonicOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletWithHookOptions} FactoryClientCreateWalletWithHookOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletWithCustomLogicOptions} FactoryClientCreateWalletWithCustomLogicOptions
 * @typedef {import('../../types/index.js').WalletProxyOptions} WalletProxyOptions
 * @typedef {import('../../types/index.js').UpdateWalletLogicImplOptions} UpdateWalletLogicImplOptions
 * @typedef {import('../../types/index.js').TransferAdminOptions} TransferAdminOptions
 *
 * @module clients/factory/WalletFactoryClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletFactoryContract } from '../../contracts/core/walletFactory.js';
import { WalletFactoryEvents } from '../../events/index.js';
import { generateMnemonic, deriveSeed } from '../../internal/crypto/index.js';
import { requireAddress, requireBytes, requireMnemonic, requireNonEmptyBytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class WalletFactoryClient extends BaseContractClient {
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
  // Private Helpers
  // ============================================================================

  /**
   * Generate a fresh BIP39 mnemonic and derive its seed for wallet creation.
   *
   * @private
   * @returns {{ mnemonic: Mnemonic; seed: Bytes }} Fresh mnemonic phrase and 64-byte seed (hex)
   * @throws {Error} If the underlying RNG fails (e.g. {@code crypto.randomBytes} unavailable)
   *
   * @remarks
   * The mnemonic string stays reachable while {@link BaseContractClient#executeWrite} runs (submit tx, wait for receipt, parse events).
   * Callers attach it to the result via {@code extraData} so integrators can back up the phrase — intentional, not accidental exposure through the pipeline.
   * JavaScript cannot reliably zero-fill string secrets; minimising retention is limited to not holding the result longer than necessary.
   */
  _prepareWalletCreation() {
    const mnemonic = generateMnemonic();
    const seed = deriveSeed(mnemonic);
    return { mnemonic, seed };
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check whether {@code walletAddr} was deployed by this factory.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr} (proxy address)
   * @returns {Promise<boolean>} {@code true} if {@code walletAddr} is a wallet created by this factory
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isWallet(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: isWallet');
    log.debug('Checking if address is a wallet created by this factory', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.isWallet(walletAddr),
        methodName: 'check if address is wallet',
        ...options
      }
    );
  }

  /**
   * Get the current factory admin address.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Admin address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAdmin(options = {}) {
    log.info('WalletFactory: getAdmin');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.admin(),
        methodName: 'get admin',
        ...options
      }
    );
  }

  /**
   * Get the current WalletLogic implementation address (beacon target).
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Current WalletLogic implementation
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWalletLogicImplAddr(options = {}) {
    log.info('WalletFactory: getWalletLogicImplAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.implementation(),
        methodName: 'get wallet logic implementation',
        ...options
      }
    );
  }

  /**
   * Resolve the KeyVault contract for a wallet proxy.
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
    log.info('WalletFactory: getKeyVaultAddr');
    log.debug('Getting keyVault address for wallet', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletKeyVault(walletAddr),
        methodName: 'get wallet key vault address',
        ...options
      }
    );
  }

  /**
   * Resolve the WalletStorage contract address for a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getStorageAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getStorageAddr');
    log.debug('Getting storage address for wallet', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletStorage(walletAddr),
        methodName: 'get storage address',
        ...options
      }
    );
  }

  /**
   * Get the beacon contract that controls WalletLogic upgrades.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} Beacon address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getBeaconAddr(options = {}) {
    log.info('WalletFactory: getBeaconAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.beacon(),
        methodName: 'get beacon address',
        ...options
      }
    );
  }

  /**
   * Resolve the secret-vault contract address mapped to a wallet proxy.
   *
   * @public
   * @async
   * @param {WalletProxyOptions} options - {@code walletAddr}
   * @returns {Promise<Address>} Secret vault contract address
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getSecretVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getSecretVaultAddr');
    log.debug('Getting secretVault address for wallet', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletSecretVault(walletAddr),
        methodName: 'get secret vault address',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Create a new HD wallet (full stack: WalletStorage + KeyVault + WalletLogic BeaconProxy).
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletBaseOptions} options - {@code authConfig} (encoded), optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Standard write result plus {@code wallet}, {@code keyVault}, {@code storage}, {@code authenticator}, and the generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig} is missing or not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@link WalletCreationResult.mnemonic} is the generated phrase, returned on purpose for backup (see {@link WalletCreationResult}).
   * It exists in memory until this write settles and while the caller retains the result; handle and store it as a high-value secret.
   */
  async createWallet(options = {}) {
    const { authConfig } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('WalletFactory: createWallet');
    log.debug('Creating wallet', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWallet(seed, authenticatorAddr, authConfig),
        methodName: 'create wallet',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: {
          mnemonic 
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet (full stack) deterministically from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletFromMnemonicOptions} options - {@code authConfig} (encoded), {@code mnemonic}, optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Standard write result plus addresses and the supplied {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig} is missing or {@code mnemonic} is not a valid BIP39 phrase
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@link WalletCreationResult.mnemonic} echoes the caller-supplied phrase for a uniform result shape (same security expectations as {@link WalletFactoryClient#createWallet}).
   */
  async createWalletFromMnemonic(options = {}) {
    const { authConfig, mnemonic } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireMnemonic(mnemonic, 'mnemonic');
    log.info('WalletFactory: createWalletFromMnemonic');
    log.debug('Creating wallet from mnemonic', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const seed = deriveSeed(mnemonic);
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWallet(seed, authenticatorAddr, authConfig),
        methodName: 'create wallet',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic 
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet (full stack) and call a post-creation hook contract.
   *
   * The hook contract at {@code hookAddr} must implement {@code IWalletCreationHook}; the SDK does not
   * enforce that interface — passing a non-conforming address will revert on-chain.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletWithHookOptions} options - {@code authConfig} (encoded), {@code hookAddr}, {@code hookData}, optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Standard write result plus addresses and generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig}, {@code hookAddr}, or {@code hookData} is missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction (or the hook itself) reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletWithHook(options = {}) {
    const { authConfig, hookAddr, hookData } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireAddress(hookAddr, 'hookAddr');
    requireBytes(hookData, 'hookData');
    log.info('WalletFactory: createWalletWithHook');
    log.debug('Creating wallet with post-creation hook', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWalletWithHook(seed, authenticatorAddr, authConfig, hookAddr, hookData),
        methodName: 'create wallet with hook',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic 
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet (core stack only — WalletStorage + KeyVault, no WalletLogic proxy).
   *
   * Use when you intend to interact with KeyVault directly or deploy a custom logic contract later.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletBaseOptions} options - {@code authConfig} (encoded), optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Standard write result with addresses and generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig} is missing or not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * The returned {@link WalletCreationResult} is parsed from the same {@code WalletCreated} event as full wallet creation.
   * For this core-only path the factory records the KeyVault address as both {@code wallet} and {@code keyVault};
   * identical values are intentional (KeyVault is the wallet address here), not an event-parsing mistake.
   * Mnemonic in the result: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletCore(options = {}) {
    const { authConfig } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('WalletFactory: createWalletCore');
    log.debug('Creating wallet core (storage + keyVault only)', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWalletCore(seed, authenticatorAddr, authConfig),
        methodName: 'create wallet core',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet using a minimal-proxy (clone) of a custom WalletLogic implementation.
   *
   * Custom-logic wallets are independent of the factory's beacon — admin upgrades to the default
   * WalletLogic do not affect them.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletWithCustomLogicOptions} options - {@code authConfig} (encoded), {@code customLogicImplAddr}, {@code logicData}, optional {@code authenticatorAddr}
   * @returns {Promise<WalletCreationResult>} Standard write result plus addresses and generated {@code mnemonic}
   * @throws {ValidationError} If {@code authConfig}, {@code customLogicImplAddr}, or {@code logicData} is missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If the {@code WalletCreated} event is missing
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletWithCustomLogic(options = {}) {
    const { authConfig, customLogicImplAddr, logicData } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireAddress(customLogicImplAddr, 'customLogicImplAddr');
    requireNonEmptyBytes(logicData, 'logicData');
    log.info('WalletFactory: createWalletWithCustomLogic');
    log.debug('Creating wallet with custom logic implementation', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite( 
      {
        operation: () => factory.createWalletWithCustomLogic(seed, authenticatorAddr, authConfig, customLogicImplAddr, logicData),
        methodName: 'create wallet with custom logic',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic
        },
        ...options
      }
    );
  }

  /**
   * Point the factory beacon at a new WalletLogic implementation (admin-only).
   *
   * Affects the orchestration layer of every wallet using the default beacon — not the KeyVault security layer.
   *
   * @public
   * @async
   * @param {UpdateWalletLogicImplOptions} options - {@code newLogicAddr}
   * @returns {Promise<UpdateWalletLogicImplAddrResult>} Standard write result with parsed {@code oldImpl}/{@code newImpl}
   * @throws {ValidationError} If {@code newLogicAddr} is missing or invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not admin)
   * @throws {EventNotFoundError} If the {@code BeaconUpgraded} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateWalletLogicImplAddr(options = {}) {
    const { newLogicAddr } = options;
    requireAddress(newLogicAddr, 'newLogicAddr');
    log.info('WalletFactory: updateWalletLogicImplAddr');
    log.debug('Updating wallet logic implementation address', sanitizer.forLog(options));
    
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.upgradeLogic(newLogicAddr),
        methodName: 'update wallet logic',
        parseEvents: [{
          eventDef: WalletFactoryEvents.BeaconUpgraded,
          contract: factory
        }],
        ...options
      }
    );
  }

  /**
   * Transfer the factory admin role (admin-only).
   *
   * @public
   * @async
   * @param {TransferAdminOptions} options - {@code newAdminAddr}
   * @returns {Promise<TransferAdminResult>} Standard write result with {@code newAdmin} / {@code factoryAddress}
   * @throws {ValidationError} If {@code newAdminAddr} is missing or invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not the current admin)
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks {@code requireEvents} is set to {@code false}: missing {@code AdminTransferred}-style events do not fail this call.
   */
  async transferAdmin(options = {}) {
    const { newAdminAddr } = options;
    requireAddress(newAdminAddr, 'newAdminAddr');
    log.info('WalletFactory: transferAdmin');
    log.debug('Transferring admin to new address', sanitizer.forLog(options));

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.transferAdmin(newAdminAddr),
        methodName: 'transfer admin',
        requireEvents: false,
        extraData: { 
          newAdmin: newAdminAddr, 
          factoryAddress: this.config.addresses.factory 
        },
        ...options
      }
    );
  }

}

export default WalletFactoryClient;
