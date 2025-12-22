/**
 * ImplementationUpgraded Event Definition
 * 
 * Emitted when the KeyVault implementation is upgraded
 */
module.exports = {
    eventName: 'ImplementationUpgraded',
    fieldMapping: {
        oldImpl: 'oldImpl',
        newImpl: 'newImpl'
    },
    description: 'Emitted when the KeyVault implementation is upgraded'
};

