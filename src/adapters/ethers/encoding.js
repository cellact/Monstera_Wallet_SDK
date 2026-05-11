/**
 * Single import boundary for ABI encode/decode primitives from {@code ethers}.
 *
 * Used by every component that needs to encode {@code authConfig} / {@code authProof}, decode
 * structured revert reasons, or build {@link Interface} instances for event parsing.
 *
 * @module adapters/ethers/encoding
 */

import { AbiCoder, Interface } from 'ethers';

/**
 * Process-wide singleton {@link AbiCoder} instance.
 *
 * Equivalent to {@code AbiCoder.defaultAbiCoder()} but cached so callers can avoid the repeated
 * factory lookup on hot paths (auth proof encoding, revert decoding).
 *
 * @public
 * @readonly
 * @type {AbiCoder}
 */
const defaultAbiCoder = AbiCoder.defaultAbiCoder();

export { AbiCoder, Interface, defaultAbiCoder };
