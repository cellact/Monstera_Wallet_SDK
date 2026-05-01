/**
 * Signing helpers — EIP-191 verification and EIP-7702 authorization digests.
 */

export {
  verifyMessage,
  recoverAddress,
  hashAuthorization,
  verifyAuthorization
} from 'ethers';
