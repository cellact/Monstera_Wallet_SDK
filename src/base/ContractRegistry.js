/**
 * Stateless factory that hands out read-only and write-capable ethers contract instances
 * to {@link BaseContractClient} subclasses.
 *
 * Validates the supplied address via {@link requireAddress} and enforces the presence of a
 * write signer for write contracts (raising {@link WriteRequiresSignerError} otherwise).
 *
 * @module base/ContractRegistry
 */

import { requireAddress } from '../internal/validation/assert.js';
import { WriteRequiresSignerError } from '../errors/index.js';
import log from '../internal/logger.js';

/**
 * @public
 */
export default class ContractRegistry {
  /**
   * Hold references to the read provider and (optional) write signer for later contract construction.
   *
   * @public
   * @param {EthersProvider} readProvider - Provider used by every {@link ContractRegistry#getReadContract} call
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer used by {@link ContractRegistry#getWriteContract} ({@code null} for read-only clients)
   */
  constructor(readProvider, writeSigner) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
  }

  /**
   * Build a read-only contract instance via the supplied {@code contractGetter}.
   *
   * @public
   * @template TContract
   * @param {(provider: EthersProvider, address: string) => TContract} contractGetter - Factory function from {@code src/contracts/*}
   * @param {Address} contractAddress - Address of the deployed contract
   * @returns {TContract} Read-bound contract instance
   * @throws {ValidationError} If {@code contractAddress} is missing or not a valid 20-byte address
   */
  getReadContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    log.debug('getReadContract', { contractAddress });
    return contractGetter(this.readProvider, contractAddress);
  }

  /**
   * Build a write-capable contract instance via the supplied {@code contractGetter}.
   *
   * @public
   * @template TContract
   * @param {(signer: WrappedEthersSigner, address: string) => TContract} contractGetter - Factory function from {@code src/contracts/*}
   * @param {Address} contractAddress - Address of the deployed contract
   * @returns {TContract} Write-bound contract instance
   * @throws {ValidationError} If {@code contractAddress} is missing or not a valid 20-byte address
   * @throws {WriteRequiresSignerError} If the registry was constructed without a {@code writeSigner}
   */
  getWriteContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    log.debug('getWriteContract', { contractAddress });
    if (!this.writeSigner) {
      log.warn('Write signer missing, throwing WriteRequiresSignerError', {});
      throw new WriteRequiresSignerError('write operation');
    }
    return contractGetter(this.writeSigner, contractAddress);
  }
}
