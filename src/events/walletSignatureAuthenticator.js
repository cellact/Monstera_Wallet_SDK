/**
 * WalletSignatureAuthenticator Events
 * 
 * All event definitions for the WalletSignatureAuthenticator contract
 */

export default {
  AddressAdded: {
    eventName: 'AddressAdded',
    fieldMapping: {
      wallet: 'wallet',
      added: 'added'
    },
    description: 'Emitted when an address is added to the wallet signature authenticator whitelist'
  },

  AddressRemoved: {
    eventName: 'AddressRemoved',
    fieldMapping: {
      wallet: 'wallet',
      removed: 'removed'
    },
    description: 'Emitted when an address is removed from the wallet signature authenticator whitelist'
  },

  WalletConfigured: {
    eventName: 'WalletConfigured',
    fieldMapping: {
      wallet: 'wallet',
      initialWhitelist: 'initialWhitelist'
    },
    description: 'Emitted when a wallet signature authenticator is configured'
  }
};
