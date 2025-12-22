/**
 * AuthenticatorChanged Event Definition
 * 
 * Emitted when the authenticator is changed
 */
module.exports = {
    eventName: 'AuthenticatorChanged',
    fieldMapping: {
        oldAuth: 'oldAuth',
        newAuth: 'newAuth'
    },
    description: 'Emitted when the authenticator is changed'
};

