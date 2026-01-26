/**
 * KeyVault Events
 * 
 * All event definitions for the KeyVault contract
 */

export default {
  AuthenticatorChanged: {
    eventName: 'AuthenticatorChanged',
    fieldMapping: {
      oldAuth: 'oldAuth',
      newAuth: 'newAuth'
    },
    description: 'Emitted when the authenticator is changed'
  },

  ImplementationUpgraded: {
    eventName: 'ImplementationUpgraded',
    fieldMapping: {
      oldImpl: 'oldImpl',
      newImpl: 'newImpl'
    },
    description: 'Emitted when the KeyVault implementation is upgraded'
  }
};
