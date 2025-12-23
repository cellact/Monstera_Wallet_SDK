/**
 * Receipt Decoding Utilities
 * 
 * Generic event parsing logic for transaction receipts
 */

const { ValidationError } = require('../errors');

/**
 * Generic event parser
 * 
 * @param {Object} receipt - Transaction receipt
 * @param {Object} contract - Contract instance with interface
 * @param {String} eventName - Name of the event to parse
 * @param {Object} fieldMapping - Map of contract args to return fields
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseEvent(receipt, contract, eventName, fieldMapping) {
  if (!receipt || !receipt.logs) {
    return null;
  }

  const iface = contract.interface;

  // Find the event log
  const eventLog = receipt.logs.find((log) => {
    try {
      const parsed = iface.parseLog(log);
      return parsed?.name === eventName;
    } catch {
      return false;
    }
  });

  if (!eventLog) {
    return null;
  }

  // Parse the event
  try {
    const parsedEvent = iface.parseLog(eventLog);

    if (!parsedEvent || parsedEvent.name !== eventName) {
      return null;
    }

    // Map contract args to return fields
    const result = {};
    for (const [returnField, contractArg] of Object.entries(fieldMapping)) {
      result[returnField] = parsedEvent.args?.[contractArg];
    }

    return result;
  } catch (error) {
    console.error(`[parseEvent] Error parsing ${eventName}:`, error.message);
    return null;
  }
}

/**
 * Parse an event from a transaction receipt using an event definition
 * 
 * @param {Object} eventDef - Event definition object (e.g., WalletFactoryEvents.WalletCreated)
 * @param {Object} receipt - Transaction receipt
 * @param {Object} contract - Contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseEventFromReceipt(eventDef, receipt, contract) {
  if (!eventDef || !eventDef.eventName || !eventDef.fieldMapping) {
    throw new ValidationError(
      'Invalid event definition. Must have eventName and fieldMapping properties.',
      'eventDef',
      eventDef
    );
  }

  return parseEvent(receipt, contract, eventDef.eventName, eventDef.fieldMapping);
}

module.exports = {
  parseEvent,
  parseEventFromReceipt
};

