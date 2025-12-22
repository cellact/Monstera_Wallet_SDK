/**
 * AddressAdded Event Definition
 * 
 * Emitted when an address is added to the whitelist
 */
module.exports = {
    eventName: 'AddressAdded',
    fieldMapping: {
        wallet: 'wallet',
        added: 'added'
    },
    description: 'Emitted when an address is added to the wallet signature authenticator whitelist'
};

