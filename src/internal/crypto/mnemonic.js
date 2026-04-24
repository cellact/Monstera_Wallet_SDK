/**
 * BIP39 mnemonic generation and PBKDF2 seed derivation for factory flows.
 *
 * @typedef {import('../../types/index.js').Mnemonic} Mnemonic
 */

import crypto from 'crypto';
import { ethers } from 'ethers';
import { requireMnemonic } from '../assert.js';
import { ValidationError } from '../../errors/index.js';
import log from '../logger.js';

/**
 * Generate a new mnemonic phrase (12 words)
 *
 * @returns {Mnemonic} BIP39 mnemonic phrase
 */
function generateMnemonic() {
  const wallet = ethers.Wallet.createRandom();
  log.debug('generateMnemonic', { phraseLength: wallet.mnemonic.phrase.length });
  return wallet.mnemonic.phrase;
}

/**
 * Derive seed from mnemonic using PBKDF2
 *
 * @param {Mnemonic} mnemonic - BIP39 mnemonic phrase
 * @param {string} [password=''] - Optional password for seed derivation
 * @returns {Buffer} Derived seed (64 bytes)
 * @throws {ValidationError} If mnemonic is not a valid BIP39 mnemonic
 */
function deriveSeed(mnemonic, password = '') {
  requireMnemonic(mnemonic, 'mnemonic');
  const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
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
