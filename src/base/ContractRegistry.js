/**
 * Contract instance factory for read and write operations.
 *
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../types/index.js').Address} Address
 */

import { requireAddress } from '../internal/assert.js';
import { WriteRequiresSignerError } from '../errors/index.js';
import log from '../internal/logger.js';

export default class ContractRegistry {
  /**
   * @param {EthersProvider} readProvider
   * @param {WrappedEthersSigner | null} writeSigner
   */
  constructor(readProvider, writeSigner) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
  }

  /**
   * @template TContract
   * @param {(provider: EthersProvider, address: string) => TContract} contractGetter
   * @param {Address} contractAddress
   * @returns {TContract}
   */
  getReadContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    log.debug('getReadContract', { contractAddress });
    return contractGetter(this.readProvider, contractAddress);
  }

  /**
   * @template TContract
   * @param {(signer: WrappedEthersSigner, address: string) => TContract} contractGetter
   * @param {Address} contractAddress
   * @returns {TContract}
   * @throws {WriteRequiresSignerError} If writeSigner is not available
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
