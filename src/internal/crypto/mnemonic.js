/**
 * BIP-39 mnemonic generation and PBKDF2 seed derivation.
 *
 * Used by the {@code WalletFactoryClient.createWallet*} flows to either generate a fresh seed for
 * the user or derive a deterministic seed from a caller-supplied mnemonic.
 *
 * @typedef {import('../../types/index.js').Mnemonic} Mnemonic
 *
 * @module internal/crypto/mnemonic
 */

import crypto from 'crypto';
import { Wallet } from '../../adapters/ethers/index.js';
import { requireMnemonic } from '../assert.js';
import { normalizeMnemonic } from '../utils/normalize.js';
import { ValidationError } from '../../errors/index.js';
import log from '../logger.js';

/**
 * Generate a fresh BIP-39 mnemonic.
 *
 * @description Delegates to {@code ethers.Wallet.createRandom()} which uses the platform CSPRNG.
 * Returns a 12-word phrase by default (ethers v6 default entropy).
 *
 * @public
 * @returns {Mnemonic} BIP-39 mnemonic phrase
 */
function generateMnemonic() {
  const wallet = Wallet.createRandom();
  log.debug('generateMnemonic', { phraseLength: wallet.mnemonic.phrase.length });
  return wallet.mnemonic.phrase;
}

/**
 * Derive a 64-byte BIP-39 seed from a mnemonic via PBKDF2-HMAC-SHA512.
 *
 * @description Validates the mnemonic via {@link requireMnemonic}, normalises whitespace and
 * casing, then runs the standard PBKDF2 iteration count (2048) against the BIP-39 salt prefix
 * {@code "mnemonic" + password}.
 *
 * @public
 * @param {Mnemonic} mnemonic - BIP-39 mnemonic phrase
 * @param {string} [password=''] - Optional BIP-39 passphrase
 * @returns {Buffer} Derived seed (64 bytes)
 * @throws {ValidationError} If {@code mnemonic} is not a valid BIP-39 mnemonic
 *   (raised by {@link requireMnemonic})
 */
function deriveSeed(mnemonic, password = '') {
  requireMnemonic(mnemonic, 'mnemonic');
  const normalizedMnemonic = normalizeMnemonic(mnemonic);
  log.debug('deriveSeed', { phraseLength: normalizedMnemonic.length });

  const seed = crypto.pbkdf2Sync(
    normalizedMnemonic,
    `mnemonic${password}`,
    2048,
    64,
    'sha512'
  );
  log.debug('deriveSeed', { seedLength: seed.length });
  return seed;
}

export { generateMnemonic, deriveSeed };
