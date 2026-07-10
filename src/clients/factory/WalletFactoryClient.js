/**
 * Low-level client for the {@code WalletFactory} contract.
 *
 * Handles wallet creation (full stack, core-only, with hook, with custom logic) and admin operations
 * (beacon upgrade, admin transfer). All creation methods accept already-encoded {@link EncodedAuthConfigOptions}
 * — the {@link Monstera} facade uses {@link AuthConfigBuilder} to encode structured input before delegating here.
 *
 * @module clients/factory/WalletFactoryClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletFactoryContract } from '../../contracts/core/walletFactory.js';
import { WalletFactoryEvents } from '../../events/index.js';
import { generateMnemonic, deriveSeed } from '../../internal/crypto/index.js';
import { requireAddress, requireBoolean, requireBytes, requireBytes32, requireMnemonic, requireNonEmptyBytes, requireNormalizedUsername } from '../../internal/assert.js';
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

  /**
   * Event parsers used by username wallet creation flows.
   *
   * @private
   * @param {EthersContract} factory - Factory write contract
   * @returns {Array<{ eventDef: object; contract: EthersContract }>}
   */
  _usernameWalletCreateEvents(factory) {
    return [
      {
        eventDef: WalletFactoryEvents.WalletCreated,
        contract: factory
      },
      {
        eventDef: WalletFactoryEvents.UsernameRegistered,
        contract: factory
      }
    ];
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

  /**
   * Get the KeyVault implementation used as the minimal-proxy clone template.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Address>} KeyVault template implementation address
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getKeyVaultTemplate(options = {}) {
    log.info('WalletFactory: getKeyVaultTemplate');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.keyVaultTemplate(),
        methodName: 'get key vault template',
        ...options
      }
    );
  }

  /**
   * Check whether an authenticator is approved for a wallet via the factory policy registry.
   *
   * @public
   * @async
   * @param {FactoryAllowedAuthenticatorsOptions} options - {@code authenticatorAddr}
   * @returns {Promise<boolean>} {@code true} if the authenticator is on the factory allowlist
   * @throws {ValidationError} If {@code authenticator} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async allowedAuthenticators(options = {}) {
    const { authenticatorAddr } = options;
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    log.info('WalletFactory: allowedAuthenticators');
    log.debug('Checking factory authenticator allowlist', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.allowedAuthenticators(authenticatorAddr),
        methodName: 'check allowed authenticator',
        ...options
      }
    );
  }

  /**
   * Check whether a KeyVault implementation is globally recommended for new wallets.
   *
   * @public
   * @async
   * @param {FactoryAllowedKeyVaultImplementationsOptions} options - {@code implementationAddr}
   * @returns {Promise<boolean>} {@code true} if the implementation is on the factory allowlist
   * @throws {ValidationError} If {@code implementationAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async allowedKeyVaultImplementations(options = {}) {
    const { implementationAddr } = options;
    requireAddress(implementationAddr, 'implementationAddr');
    log.info('WalletFactory: allowedKeyVaultImplementations');
    log.debug('Checking factory key vault implementation allowlist', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.allowedKeyVaultImplementations(implementationAddr),
        methodName: 'check allowed key vault implementation',
        ...options
      }
    );
  }

  /**
   * Check whether a KeyVault implementation is approved for a wallet via the factory policy registry.
   *
   * @public
   * @async
   * @param {FactoryIsImplementationApprovedOptions} options - {@code keyVaultAddr}, {@code implementationAddr}
   * @returns {Promise<boolean>} {@code true} if the factory policy registry approves the implementation for the KeyVault
   * @throws {ValidationError} If {@code keyVaultAddr} or {@code implementationAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isImplementationApproved(options = {}) {
    const { keyVaultAddr, implementationAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(implementationAddr, 'implementationAddr');
    log.info('WalletFactory: isImplementationApproved');
    log.debug('Checking factory implementation policy', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.isImplementationApproved(keyVaultAddr, implementationAddr),
        methodName: 'check factory implementation policy',
        ...options
      }
    );
  }

  /**
   * Check whether an authenticator is approved for a wallet via the factory policy registry.
   *
   * @public
   * @async
   * @param {FactoryIsAuthenticatorApprovedOptions} options - {@code keyVaultAddr}, {@code authenticatorAddr}
   * @returns {Promise<boolean>} {@code true} if the factory policy registry approves the authenticator for the KeyVault
   * @throws {ValidationError} If {@code keyVaultAddr} or {@code authenticatorAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isAuthenticatorApproved(options = {}) {
    const { keyVaultAddr, authenticatorAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    log.info('WalletFactory: isAuthenticatorApproved');
    log.debug('Checking factory authenticator policy', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.isAuthenticatorApproved(keyVaultAddr, authenticatorAddr),
        methodName: 'check factory authenticator policy',
        ...options
      }
    );
  }

  /**
   * Hash a normalised username the same way the factory does.
   *
   * @public
   * @async
   * @param {FactoryHashUsernameOptions} options - {@code username} (normalised via trim + lowercase before hashing)
   * @returns {Promise<Bytes32>} {@code keccak256(bytes(normalizedUsername))}
   * @throws {ValidationError} If {@code username} is missing or empty after normalisation
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts (e.g. empty username)
   * @throws {WalletError} For other unrecognised failures
   */
  async hashUsername(options = {}) {
    const { username } = options;
    const normalized = requireNormalizedUsername(username, 'username');
    log.info('WalletFactory: hashUsername');
    log.debug('Hashing normalized username', sanitizer.forLog({ username: normalized }));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.hashUsername(normalized),
        methodName: 'hash username',
        ...options
      }
    );
  }

  /**
   * Resolve a username hash to its registered wallet proxy address.
   *
   * @public
   * @async
   * @param {FactoryWalletOfUsernameOptions} options - {@code usernameHash}
   * @returns {Promise<Address>} Wallet proxy address, or the zero address if unregistered
   * @throws {ValidationError} If {@code usernameHash} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async walletOfUsername(options = {}) {
    const { usernameHash } = options;
    requireBytes32(usernameHash, 'usernameHash');
    log.info('WalletFactory: walletOfUsername');
    log.debug('Resolving wallet for username hash', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletOfUsername(usernameHash),
        methodName: 'resolve wallet for username hash',
        ...options
      }
    );
  }

  /**
   * Resolve the username hash registered for a wallet proxy.
   *
   * @public
   * @async
   * @param {FactoryWalletUsernameHashOptions} options - {@code walletAddr}
   * @returns {Promise<Bytes32>} Username hash, or zero bytes32 if none
   * @throws {ValidationError} If {@code walletAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getWalletUsernameHash(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getWalletUsernameHash');
    log.debug('Getting username hash for wallet', sanitizer.forLog(options));

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletUsernameHash(walletAddr),
        methodName: 'get wallet username hash',
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
   * Create a new HD wallet (full stack) and register it to a normalised username.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletForUsernameOptions} options - {@code authConfig} (encoded), {@code username}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Standard write result plus addresses, generated {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If {@code authConfig} or {@code username} is missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain (e.g. username already registered)
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * Usernames are normalised (trim + lowercase) before being sent on-chain. The factory stores only
   * the hash, not the plaintext username.
   */
  async createWalletForUsername(options = {}) {
    const { authConfig, username } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    const normalized = requireNormalizedUsername(username, 'username');
    log.info('WalletFactory: createWalletForUsername');
    log.debug('Creating wallet for username', sanitizer.forLog({ ...options, username: normalized }));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.createWalletForUsername(normalized, seed, authenticatorAddr, authConfig),
        methodName: 'create wallet for username',
        parseEvents: this._usernameWalletCreateEvents(factory),
        extraData: {
          mnemonic
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet (full stack) for a normalised username from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletForUsernameFromMnemonicOptions} options - {@code authConfig}, {@code username}, {@code mnemonic}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Standard write result plus addresses, supplied {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If {@code authConfig}, {@code username}, or {@code mnemonic} is missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async createWalletForUsernameFromMnemonic(options = {}) {
    const { authConfig, username, mnemonic } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    const normalized = requireNormalizedUsername(username, 'username');
    requireMnemonic(mnemonic, 'mnemonic');
    log.info('WalletFactory: createWalletForUsernameFromMnemonic');
    log.debug('Creating wallet for username from mnemonic', sanitizer.forLog({ ...options, username: normalized }));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const seed = deriveSeed(mnemonic);
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.createWalletForUsername(normalized, seed, authenticatorAddr, authConfig),
        methodName: 'create wallet for username',
        parseEvents: this._usernameWalletCreateEvents(factory),
        extraData: {
          mnemonic
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet (full stack) and register it to a precomputed username hash.
   *
   * Prefer this when the SDK should avoid sending plaintext usernames on-chain.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletForUsernameHashOptions} options - {@code authConfig} (encoded), {@code usernameHash}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Standard write result plus addresses, generated {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If {@code authConfig} or {@code usernameHash} is missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async createWalletForUsernameHash(options = {}) {
    const { authConfig, usernameHash } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireBytes32(usernameHash, 'usernameHash');
    log.info('WalletFactory: createWalletForUsernameHash');
    log.debug('Creating wallet for username hash', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.createWalletForUsernameHash(usernameHash, seed, authenticatorAddr, authConfig),
        methodName: 'create wallet for username hash',
        parseEvents: this._usernameWalletCreateEvents(factory),
        extraData: {
          mnemonic
        },
        ...options
      }
    );
  }

  /**
   * Create a new HD wallet (full stack) for a username hash from a caller-supplied mnemonic.
   *
   * @public
   * @async
   * @param {FactoryClientCreateWalletForUsernameHashFromMnemonicOptions} options - {@code authConfig}, {@code usernameHash}, {@code mnemonic}, optional {@code authenticatorAddr}
   * @returns {Promise<UsernameWalletCreationResult>} Standard write result plus addresses, supplied {@code mnemonic}, and {@code usernameHash}
   * @throws {ValidationError} If required fields are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts on-chain
   * @throws {EventNotFoundError} If a required event is missing from the receipt
   * @throws {EventParseError} If an event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async createWalletForUsernameHashFromMnemonic(options = {}) {
    const { authConfig, usernameHash, mnemonic } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireBytes32(usernameHash, 'usernameHash');
    requireMnemonic(mnemonic, 'mnemonic');
    log.info('WalletFactory: createWalletForUsernameHashFromMnemonic');
    log.debug('Creating wallet for username hash from mnemonic', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
    const seed = deriveSeed(mnemonic);
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.createWalletForUsernameHash(usernameHash, seed, authenticatorAddr, authConfig),
        methodName: 'create wallet for username hash',
        parseEvents: this._usernameWalletCreateEvents(factory),
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

  /**
   * Allow or disallow an authenticator for new wallet creation (admin-only).
   *
   * @public
   * @async
   * @param {SetAuthenticatorAllowedOptions} options - {@code authenticator}, {@code allowed}
   * @returns {Promise<SetAuthenticatorAllowedResult>} Standard write result with parsed allowlist event fields
   * @throws {ValidationError} If {@code authenticator} is missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not admin)
   * @throws {EventNotFoundError} If the {@code AuthenticatorAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setAuthenticatorAllowed(options = {}) {
    const { authenticatorAddr, allowed } = options;
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    requireBoolean(allowed, 'allowed');
    log.info('WalletFactory: setAuthenticatorAllowed');
    log.debug('Updating factory authenticator allowlist', sanitizer.forLog(options));

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.setAuthenticatorAllowed(authenticatorAddr, allowed),
        methodName: 'set authenticator allowed',
        parseEvents: [{
          eventDef: WalletFactoryEvents.AuthenticatorAllowed,
          contract: factory
        }],
        ...options
      }
    );
  }

  /**
   * Allow or disallow a KeyVault implementation for new wallet creation (admin-only).
   *
   * @public
   * @async
   * @param {SetKeyVaultImplementationAllowedOptions} options - {@code implementation}, {@code allowed}
   * @returns {Promise<SetKeyVaultImplementationAllowedResult>} Standard write result with parsed allowlist event fields
   * @throws {ValidationError} If {@code implementation} is missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not admin)
   * @throws {EventNotFoundError} If the {@code KeyVaultImplementationAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setKeyVaultImplementationAllowed(options = {}) {
    const { implementationAddr, allowed } = options;
    requireAddress(implementationAddr, 'implementationAddr');
    requireBoolean(allowed, 'allowed');
    log.info('WalletFactory: setKeyVaultImplementationAllowed');
    log.debug('Updating factory key vault implementation allowlist', sanitizer.forLog(options));

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.setKeyVaultImplementationAllowed(implementationAddr, allowed),
        methodName: 'set key vault implementation allowed',
        parseEvents: [{
          eventDef: WalletFactoryEvents.KeyVaultImplementationAllowed,
          contract: factory
        }],
        ...options
      }
    );
  }

  /**
   * Allow or disallow a KeyVault implementation for a specific wallet via the factory policy registry (admin-only).
   *
   * @public
   * @async
   * @param {SetWalletImplementationAllowedOptions} options - {@code walletOrKeyVaultAddr}, {@code implementation}, {@code allowed}
   * @returns {Promise<SetWalletImplementationAllowedResult>} Standard write result with parsed policy event fields
   * @throws {ValidationError} If addresses are missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not admin)
   * @throws {EventNotFoundError} If the {@code WalletImplementationAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setWalletImplementationAllowed(options = {}) {
    const { walletOrKeyVaultAddr, implementationAddr, allowed } = options;
    requireAddress(walletOrKeyVaultAddr, 'walletOrKeyVaultAddr');
    requireAddress(implementationAddr, 'implementationAddr');
    requireBoolean(allowed, 'allowed');
    log.info('WalletFactory: setWalletImplementationAllowed');
    log.debug('Updating wallet implementation policy', sanitizer.forLog(options));

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.setWalletImplementationAllowed(walletOrKeyVaultAddr, implementationAddr, allowed),
        methodName: 'set wallet implementation allowed',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletImplementationAllowed,
          contract: factory
        }],
        ...options
      }
    );
  }

  /**
   * Allow or disallow an authenticator for a specific wallet via the factory policy registry (admin-only).
   *
   * @public
   * @async
   * @param {SetWalletAuthenticatorAllowedOptions} options - {@code walletOrKeyVaultAddr}, {@code authenticator}, {@code allowed}
   * @returns {Promise<SetWalletAuthenticatorAllowedResult>} Standard write result with parsed policy event fields
   * @throws {ValidationError} If addresses are missing/invalid or {@code allowed} is not a boolean
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. caller is not admin)
   * @throws {EventNotFoundError} If the {@code WalletAuthenticatorAllowed} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async setWalletAuthenticatorAllowed(options = {}) {
    const { walletOrKeyVaultAddr, authenticatorAddr, allowed } = options;
    requireAddress(walletOrKeyVaultAddr, 'walletOrKeyVaultAddr');
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    requireBoolean(allowed, 'allowed');
    log.info('WalletFactory: setWalletAuthenticatorAllowed');
    log.debug('Updating wallet authenticator policy', sanitizer.forLog(options));

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.setWalletAuthenticatorAllowed(walletOrKeyVaultAddr, authenticatorAddr, allowed),
        methodName: 'set wallet authenticator allowed',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletAuthenticatorAllowed,
          contract: factory
        }],
        ...options
      }
    );
  }

}

export default WalletFactoryClient;
