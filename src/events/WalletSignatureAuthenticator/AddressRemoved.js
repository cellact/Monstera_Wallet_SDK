/**
 * AddressRemoved Event Definition
 * 
 * Emitted when an address is removed from the whitelist
 */
module.exports = {
    eventName: 'AddressRemoved',
    fieldMapping: {
        wallet: 'wallet',
        removed: 'removed'
    },
    description: 'Emitted when an address is removed from the wallet signature authenticator whitelist'
};

