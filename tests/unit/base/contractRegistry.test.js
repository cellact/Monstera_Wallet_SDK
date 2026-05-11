/**
 * Unit tests for {@link ContractRegistry#getWriteContract}.
 */

import { describe, test, expect, jest } from '@jest/globals';
import ContractRegistry from '../../../src/base/ContractRegistry.js';
import { WriteRequiresSignerError } from '../../../src/errors/index.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

describe('ContractRegistry', () => {
  const readProvider = /** @type {import('../../../src/types/index.js').EthersProvider} */ ({});
  const dummyGetter = () => ({});

  test('getWriteContract throws WriteRequiresSignerError when writeSigner is null', () => {
    const registry = new ContractRegistry(readProvider, null);
    expect(() => registry.getWriteContract(dummyGetter, VALID_TEST_ADDRESS)).toThrow(
      WriteRequiresSignerError
    );
  });

  test('getWriteContract invokes factory when writeSigner is present', () => {
    const signer = /** @type {import('../../../src/types/index.js').WrappedEthersSigner} */ ({});
    const registry = new ContractRegistry(readProvider, signer);
    const contract = {};
    const getter = jest.fn(() => contract);
    const out = registry.getWriteContract(getter, VALID_TEST_ADDRESS);
    expect(getter).toHaveBeenCalledWith(signer, VALID_TEST_ADDRESS);
    expect(out).toBe(contract);
  });
});
