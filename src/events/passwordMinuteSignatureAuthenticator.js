/**
 * PasswordMinuteSignatureAuthenticator Events
 * 
 * All event definitions for the PasswordMinuteSignatureAuthenticator contract
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
  