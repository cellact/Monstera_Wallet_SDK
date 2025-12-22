/**
 * BeaconUpgraded Event Definition
 * 
 * Emitted when the factory beacon is upgraded
 */
module.exports = {
    eventName: 'BeaconUpgraded',
    fieldMapping: {
        oldImpl: 'oldImpl',
        newImpl: 'newImpl'
    },
    description: 'Emitted when the factory beacon is upgraded'
};

