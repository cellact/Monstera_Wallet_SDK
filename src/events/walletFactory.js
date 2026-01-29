/**
 * WalletFactory Events
 * 
 * All event definitions for the WalletFactory contract
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
  }
};
