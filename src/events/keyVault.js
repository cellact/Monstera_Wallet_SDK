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

  CustomImplementationUpgraded: {
    eventName: 'CustomImplementationUpgraded',
    fieldMapping: {
      oldImpl: 'oldImpl',
      newImpl: 'newImpl',
      customAckHash: 'customAckHash'
    },
    description: 'Emitted when the KeyVault custom implementation is upgraded with a custom action hash'
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
  },

  ImplementationApprovalChanged: {
    eventName: 'ImplementationApprovalChanged',
    fieldMapping: {
      implementation_: 'implementation_',
      approved: 'approved'
    },
    description: 'Emitted when the KeyVault implementation approval is changed'
  },

  AuthenticatorApprovalChanged: {
    eventName: 'AuthenticatorApprovalChanged',
    fieldMapping: {
      authenticator_: 'authenticator_',
      approved: 'approved'
    },
    description: 'Emitted when the KeyVault authenticator approval is changed'
  },

  CustomAuthenticatorChanged: {
    eventName: 'CustomAuthenticatorChanged',
    fieldMapping: {
      oldAuth: 'oldAuth',
      newAuth: 'newAuth',
      customAckHash: 'customAckHash'
    },
    description: 'Emitted when the KeyVault custom authenticator is changed with a custom action hash'
  }
};
