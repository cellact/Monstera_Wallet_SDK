/**
 * Event definition records for the {@code PasswordMinuteSignatureAuthenticator} contract.
 *
 * @module events/passwordMinuteSignatureAuthenticator
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
    
    PasswordConfigured: {
      eventName: 'PasswordConfigured',
      fieldMapping: {
        wallet: 'wallet'
      },
      description: 'Emitted when a wallet password is configured'
    }
  };
  