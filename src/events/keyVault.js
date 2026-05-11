/**
 * Event definition records for the {@code KeyVault} contract.
 *
 * @module events/keyVault
 */

/**
 * @public
 * @readonly
 * @type {Record<string, { eventName: string, fieldMapping: Record<string, string>, description: string }>}
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
  },

  KeyImported: {
    eventName: 'KeyImported',
    fieldMapping: {
      keyId: 'keyId',
      curve: 'curve',
      chain: 'chain'
    },
    description: 'Emitted when a key is imported'
  },

  KeyDeactivated: {
    eventName: 'KeyDeactivated',
    fieldMapping: {
      keyId: 'keyId'
    },
    description: 'Emitted when a key is deactivated'
  },

  KeyActivated: {
    eventName: 'KeyActivated',
    fieldMapping: {
      keyId: 'keyId'
    },
    description: 'Emitted when a key is activated'
  }
};
