/**
 * Pure EIP-712 typed-data signing primitive.
 *
 * Domain-specific structs (auth proofs, etc.) live outside this module and call
 * {@link signTypedData} with their own domain / types / value.
 *
 * @module internal/crypto/eip712
 */

/**
 * Sign EIP-712 typed data with an ethers {@code Wallet} / {@code HDNodeWallet}.
 *
 * @public
 * @param {Object} params
 * @param {EthersWallet | EthersHDNodeWallet} params.signer
 * @param {Record<string, unknown>} params.domain - EIP-712 domain
 * @param {Record<string, Array<{ name: string, type: string }>>} params.types - Primary type map
 * @param {Record<string, unknown>} params.value - Message value
 * @returns {Promise<string>} Hex signature
 */
export async function signTypedData({ signer, domain, types, value }) {
  return signer.signTypedData(domain, types, value);
}
