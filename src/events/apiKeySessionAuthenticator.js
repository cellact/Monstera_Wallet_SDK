/**
 * Event definition records for the {@code ApiKeySessionAuthenticator} contract.
 *
 * @module events/apiKeySessionAuthenticator
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
  
    ApiKeyRotated: {
      eventName: 'ApiKeyRotated',
      fieldMapping: {
        wallet: 'wallet'
      },
      description: 'Emitted when a wallet API key is rotated'
    }
  };
    