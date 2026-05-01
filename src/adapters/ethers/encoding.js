/**
 * ABI encode/decode — single boundary for {@link AbiCoder} and {@link Interface}.
 */

import { AbiCoder, Interface } from 'ethers';

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

export { AbiCoder, Interface, defaultAbiCoder };
