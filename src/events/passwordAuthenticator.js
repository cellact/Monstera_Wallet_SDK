/**
 * PasswordAuthenticator Events
 * 
 * All event definitions for the PasswordAuthenticator contract
 */

module.exports = {
  PasswordChanged: {
    eventName: 'PasswordChanged',
    fieldMapping: {
      wallet: 'wallet'
    },
    description: 'Emitted when a wallet password is changed'
  },
  PasswordConfigured: {
    eventName: 'PasswordConfigured',
    fieldMapping: {
      wallet: 'wallet'
    },
    description: 'Emitted when a wallet password is configured'
  }
};

