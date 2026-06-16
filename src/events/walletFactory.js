/**
 * Event definition records for the {@code WalletFactory} contract.
 *
 * Each entry is consumed by {@code parseEventFromReceipt} and projects ABI event args onto
 * SDK-friendly field names (e.g. {@code storage_} → {@code storage}).
 *
 * @module events/walletFactory
 */

/**
 * @public
 * @readonly
 * @type {Record<string, { eventName: string, fieldMapping: Record<string, string>, description: string }>}
 */
export default {
  WalletCreated: {
    eventName: 'WalletCreated',
    fieldMapping: {
      wallet: 'wallet',
      keyVault: 'keyVault',
      storage: 'storage_', // Note: contract uses storage_, we normalize to storage
      authenticator: 'authenticator'
    },
    description: 'Emitted when a new wallet is created by the factory'
  },

  BeaconUpgraded: {
    eventName: 'BeaconUpgraded',
    fieldMapping: {
      oldImpl: 'oldImpl',
      newImpl: 'newImpl'
    },
    description: 'Emitted when the factory beacon is upgraded'
  },

  AuthenticatorAllowed: {
    eventName: 'AuthenticatorAllowed',
    fieldMapping: {
      authenticator: 'authenticator',
      allowed: 'allowed'
    },
    description: 'Emitted when an authenticator is allowed'
  },

  KeyVaultImplementationAllowed: {
    eventName: 'KeyVaultImplementationAllowed',
    fieldMapping: {
      implementation: 'implementation_',
      allowed: 'allowed'
    },
    description: 'Emitted when a key vault implementation is allowed'
  },

  WalletImplementationAllowed: {
    eventName: 'WalletImplementationAllowed',
    fieldMapping: {
      keyVault: 'keyVault',
      implementation: 'implementation',
      allowed: 'allowed'
    },
    description: 'Emitted when a wallet implementation is allowed'
  },

  WalletAuthenticatorAllowed: {
    eventName: 'WalletAuthenticatorAllowed',
    fieldMapping: {
      keyVault: 'keyVault',
      authenticator: 'authenticator',
      allowed: 'allowed'
    },
    description: 'Emitted when a wallet authenticator is allowed'
  },

  UsernameRegistered: {
    eventName: 'UsernameRegistered',
    fieldMapping: {
      usernameHash: 'usernameHash',
      wallet: 'wallet',
      keyVault: 'keyVault'
    },
    description: 'Emitted when a wallet is registered to a normalized username hash'
  }
};
