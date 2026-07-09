/**
 * Event definition records for the {@code PasswordOrWalletSignatureAuthenticator} contract.
 *
 * @module events/passwordOrWalletSignatureAuthenticator
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
        wallet: 'wallet',
        initialWhitelist: 'initialWhitelist',
      },
      description: 'Emitted when a wallet is configured'
    },
  
    PasswordChanged: {
      eventName: 'PasswordChanged',
      fieldMapping: {
        wallet: 'wallet',
      },
      description: 'Emitted when a wallet password is changed'
    },
    
    AddressAdded: {
      eventName: 'AddressAdded',
      fieldMapping: {
        wallet: 'wallet',
        added: 'added'
      },
      description: 'Emitted when a wallet address is added'
    },

    AddressRemoved: {
      eventName: 'AddressRemoved',
      fieldMapping: {
        wallet: 'wallet',
        removed: 'removed'
      },
      description: 'Emitted when a wallet address is removed'
    },

    WalletLinkApproved: {
      eventName: 'WalletLinkApproved',
      fieldMapping: {
        wallet: 'wallet',
        linkedWallet: 'linkedWallet',
        nonce: 'nonce'
      },
      description: 'Emitted when a wallet link is approved'
    }
  };
    