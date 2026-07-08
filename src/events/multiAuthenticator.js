/**
 * Event definition records for the {@code MultiAuthenticator} contract.
 *
 * @module events/multiAuthenticator
 */

/**
 * @public
 * @readonly
 * @type {Record<string, { eventName: string, fieldMapping: Record<string, string>, description: string }>}
 */
export default {
    WalletConfigured: {
      eventName: 'WalletConfigured',
      fieldMapping: {
        wallet: 'wallet'
      },
      description: 'Emitted when a wallet is configured'
    },
  
    AuthenticatorAdded: {
      eventName: 'AuthenticatorAdded',
      fieldMapping: {
        wallet: 'wallet',
        child: 'child'
      },
      description: 'Emitted when a wallet authenticator is added'
    },
    
    AuthenticatorRemoved: {
      eventName: 'AuthenticatorRemoved',
      fieldMapping: {
        wallet: 'wallet',
        child: 'child'
      },
      description: 'Emitted when a wallet authenticator is removed'
    }
  };
    