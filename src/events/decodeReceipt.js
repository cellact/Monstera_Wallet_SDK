/**
 * Generic transaction-receipt event decoding utilities.
 *
 * Used by {@code BaseContractClient.executeWrite} (via the {@code expectEvent} option) to extract
 * a single named event out of a {@link TransactionReceipt}. This module holds two layers:
 * - {@link parseEvent} — low-level helper that walks {@code receipt.logs}, decodes each log
 *   against a contract's {@code Interface}, and returns a field-mapped result object
 * - {@link parseEventFromReceipt} — public wrapper that takes a per-event definition record
 *   (produced by the per-contract event modules in this folder) and validates it
 *
 * @module events/decodeReceipt
 */

import { EventParseError } from '../errors/index.js';
import { requireDefined, requirePlainObject, requireString } from '../internal/assert.js';
import log from '../internal/logger.js';
import { sanitizer } from '../internal/sanitization/index.js';

/**
 * Walk a receipt's logs and return the first matching event mapped onto a result object.
 *
 * @description Uses {@code contract.interface.parseLog} on each log; logs that don't belong to the
 * contract's interface are silently skipped (debug-logged with sanitised data). When a matching
 * log is found, the event {@code args} are projected into a fresh object using
 * {@code fieldMapping}.
 *
 * @public
 * @param {TransactionReceipt} receipt - Transaction receipt
 * @param {EthersContract} contract - Contract instance providing the {@code Interface}
 * @param {string} eventName - Name of the event to look for
 * @param {Record<string, string>} fieldMapping - Map of return-field name → on-chain arg key /
 *   index (e.g. {@code { walletAddr: "wallet" }})
 * @returns {Record<string, unknown> | null} Mapped event data or {@code null} if no matching log
 *   is present in {@code receipt.logs}
 * @throws {EventParseError} If a matching log is found but field mapping fails (typically because
 *   {@code fieldMapping} references an arg the ABI does not expose)
 */
function parseEvent(receipt, contract, eventName, fieldMapping) {
  if (!receipt || !receipt.logs) {
    return null;
  }

  const iface = contract.interface;

  let parsedEvent = null;
  for (const logEntry of receipt.logs) {
    try {
      const parsed = iface.parseLog(logEntry);
      if (parsed?.name === eventName) {
        parsedEvent = parsed;
        break;
      }
    } catch {
      log.debug('parseEvent: log does not belong to this interface or does not decode cleanly', { logEntry: sanitizer.forLog(logEntry) });
    }
  }

  if (!parsedEvent) {
    log.debug('parseEvent: event not found in receipt', { eventName, receiptHash: receipt?.hash });
    return null;
  }

  try {
    const result = {};
    for (const [returnField, contractArg] of Object.entries(fieldMapping)) {
      result[returnField] = parsedEvent.args?.[contractArg];
    }

    return result;
  } catch (error) {
    log.debug('parseEvent: parse failed', { eventName, receiptHash: receipt?.hash, error: error?.message });
    throw new EventParseError(
      eventName,
      receipt?.hash || null,
      error
    );
  }
}

/**
 * Decode a single named event from a receipt using a per-event definition record.
 *
 * @description Validates that {@code eventDef} carries the expected {@code eventName} and
 * {@code fieldMapping} keys (the schema used by every {@code …Events.*} record exported from this
 * folder), then defers to {@link parseEvent}.
 *
 * @public
 * @param {Record<string, unknown>} eventDef - Event definition record (e.g.
 *   {@code WalletFactoryEvents.WalletCreated})
 * @param {TransactionReceipt} receipt - Transaction receipt
 * @param {EthersContract} contract - Contract instance providing the {@code Interface}
 * @returns {Record<string, unknown> | null} Mapped event data, or {@code null} if not present
 * @throws {ValidationError} If {@code eventDef} is missing {@code eventName} or {@code fieldMapping}
 * @throws {EventParseError} If the matching log is found but field mapping fails
 *   (forwarded from {@link parseEvent})
 */
function parseEventFromReceipt(eventDef, receipt, contract) {
  requireDefined(eventDef, 'eventDef');
  requireString(eventDef.eventName, 'eventDef.eventName');
  requirePlainObject(eventDef.fieldMapping, 'eventDef.fieldMapping');

  return parseEvent(receipt, contract, eventDef.eventName, eventDef.fieldMapping);
}

export {
  parseEvent,
  parseEventFromReceipt
};
