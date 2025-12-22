/**
 * WalletCreated Event Definition
 * 
 * Emitted when a new wallet is created by the factory
 */
module.exports = {
    eventName: 'WalletCreated',
    fieldMapping: {
        wallet: 'wallet',
        keyVault: 'keyVault',
        storage: 'storage_', // Note: contract uses storage_, we normalize to storage
        authenticator: 'authenticator'
    },
    description: 'Emitted when a new wallet is created by the factory'
};

