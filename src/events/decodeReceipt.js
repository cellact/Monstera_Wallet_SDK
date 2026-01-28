/**
 * Receipt Decoding Utilities
 * 
 * Generic event parsing logic for transaction receipts
 * 
 * @typedef {import('../types/index.js').TransactionHash} TransactionHash
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../types/index.js').EthersContract} EthersContract
 */

import { ValidationError, EventParseError } from '../errors/index.js';

/**
 * Generic event parser
 * 
 * @param {TransactionReceipt} receipt - Transaction receipt
 * @param {EthersContract} contract - Contract instance with interface
 * @param {string} eventName - Name of the event to parse
 * @param {Record<string, string>} fieldMapping - Map of contract args to return fields
 * @returns {Record<string, unknown>|null} Parsed event data or null if not found
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
    throw new EventParseError(
      eventName,
      receipt?.hash || null,
      error
    );
  }
}

/**
 * Parse an event from a transaction receipt using an event definition
 * 
 * @param {Record<string, unknown>} eventDef - Event definition object (e.g., WalletFactoryEvents.WalletCreated)
 * @param {TransactionReceipt} receipt - Transaction receipt
 * @param {EthersContract} contract - Contract instance
 * @returns {Record<string, unknown>|null} Parsed event data or null if not found
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

export {
  parseEvent,
  parseEventFromReceipt
};
