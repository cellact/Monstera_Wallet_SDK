/**
 * Event Registry
 * 
 * Central registry for all contract events organized by contract
 */
const WalletSignatureAuthenticatorEvents = require('./WalletSignatureAuthenticator');
const WalletFactoryEvents = require('./WalletFactory');
const PasswordAuthenticatorEvents = require('./PasswordAuthenticator');
const KeyVaultEvents = require('./KeyVault');

const { parseEvent } = require('./parseEvent');

/**
 * Parse an event from a transaction receipt using an event definition
 * 
 * @param {Object} eventDef - Event definition object (e.g., WalletSignatureAuthenticatorEvents.AddressAdded)
 * @param {Object} receipt - Transaction receipt
 * @param {Object} contract - Contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseEventFromReceipt(eventDef, receipt, contract) {
    if (!eventDef || !eventDef.eventName || !eventDef.fieldMapping) {
        throw new Error('Invalid event definition. Must have eventName and fieldMapping properties.');
    }

    return parseEvent(receipt, contract, eventDef.eventName, eventDef.fieldMapping);
}

module.exports = {
    WalletSignatureAuthenticatorEvents,
    WalletFactoryEvents,
    PasswordAuthenticatorEvents,
    KeyVaultEvents,
    parseEventFromReceipt
};
