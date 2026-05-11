/**
 * Event definition records for the {@code DualFactorAuthenticator} contract.
 *
 * @module events/dualFactorAuthenticator
 */

/**
 * @public
 * @readonly
 * @type {Record<string, { eventName: string, fieldMapping: Record<string, string>, description: string }>}
 */
export default {
  PasswordChanged: {
    eventName: 'PasswordChanged',
    fieldMapping: {
      wallet: 'wallet'
    },
    description: 'Emitted when a wallet password is changed'
  },

  WalletConfigured: {
    eventName: 'WalletConfigured',
    fieldMapping: {
      wallet: 'wallet',
      guardian: 'guardian'
    },
    description: 'Emitted when a wallet password is configured'
  },

  GuardianChanged: {
    eventName: 'GuardianChanged',
    fieldMapping: {
      wallet: 'wallet',
      newGuardian: 'newGuardian'
    },
    description: 'Emitted when a wallet guardian is changed'
  }
};
  