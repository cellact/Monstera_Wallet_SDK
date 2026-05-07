/**
 * Unit tests for {@link ExecutionPipeline}: write error-context extraction (mirrors {@code executeWrite})
 * and {@link ExecutionPipeline#_enrichMinedTransactionRevert}.
 */

import { describe, test, expect } from '@jest/globals';
import ExecutionPipeline from '../../../src/base/ExecutionPipeline.js';
import { Interface } from '../../../src/adapters/ethers/encoding.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

function createPipeline(overrides = {}) {
  return new ExecutionPipeline({
    readProvider: null,
    writeSigner: null,
    config: { rpcUrl: 'https://example.invalid' },
    ...overrides
  });
}

/** Mirrors {@link ExecutionPipeline#executeWrite} context extraction (lines 88–96). */
function sdkContextFromExecuteWriteOptions(options) {
  const { parseEvents, requireEvents, extraData, methodName, revertInterface, ...errorContext } = options;
  return { ...errorContext, methodName };
}

describe('ExecutionPipeline executeWrite error context (WalletFactory mnemonic)', () => {
  test('extraData.mnemonic does not reach sdkContext — stripped before buildErrorContext', () => {
    const pipeline = createPipeline();
    const options = {
      parseEvents: [{ eventDef: {}, contract: {} }],
      extraData: { mnemonic: 'never leak this phrase' },
      methodName: 'create wallet',
      client: 'WalletFactoryClient',
      keyVaultAddr: VALID_TEST_ADDRESS
    };
    const bag = sdkContextFromExecuteWriteOptions(options);
    expect(bag.extraData).toBeUndefined();
    expect(bag.mnemonic).toBeUndefined();

    const sdkContext = pipeline.buildErrorContext(bag);
    expect(sdkContext.mnemonic).toBeUndefined();
    expect(sdkContext.extraData).toBeUndefined();
  });

  test('defense in depth: if extraData were present on context bag, nested mnemonic is redacted', () => {
    const pipeline = createPipeline();
    const sdkContext = pipeline.buildErrorContext({
      methodName: 'create wallet',
      client: 'WalletFactoryClient',
      extraData: { mnemonic: 'backup phrase words' }
    });
    expect(sdkContext.extraData).toBeDefined();
    expect(sdkContext.extraData.mnemonic).toMatchObject({
      redacted: true,
      valueKind: 'string'
    });
    expect(String(sdkContext.extraData.mnemonic)).not.toContain('backup');
  });
});

describe('ExecutionPipeline._enrichMinedTransactionRevert', () => {
  test('returns empty enrichment when readProvider is null', async () => {
    const pipeline = createPipeline({ readProvider: null });
    const receipt = { blockNumber: 1, to: VALID_TEST_ADDRESS, from: VALID_TEST_ADDRESS };
    const out = await pipeline._enrichMinedTransactionRevert(null, receipt, '0x' + 'ab'.repeat(32), null);
    expect(out.revertData).toBeNull();
    expect(out.revertReason).toBeNull();
  });

  test('returns empty enrichment when receipt.blockNumber is null', async () => {
    const pipeline = createPipeline({
      readProvider: {
        getTransaction: async () => ({}),
        call: async () => ''
      }
    });
    const receipt = { blockNumber: null, hash: '0x' + 'cd'.repeat(32) };
    const out = await pipeline._enrichMinedTransactionRevert(
      /** @type {import('../../../src/types/index.js').EthersProvider} */ (
        pipeline._readProvider
      ),
      receipt,
      '0x' + 'ab'.repeat(32),
      null
    );
    expect(out.revertData).toBeNull();
  });

  test('returns empty enrichment when calldata missing after getTransaction', async () => {
    const readProvider = {
      async getTransaction() {
        return { to: VALID_TEST_ADDRESS, from: VALID_TEST_ADDRESS, data: '0x' };
      },
      async call() {
        return '0x';
      }
    };
    const pipeline = createPipeline({ readProvider });
    const receipt = {
      blockNumber: 100,
      to: VALID_TEST_ADDRESS,
      from: VALID_TEST_ADDRESS,
      hash: '0x' + 'ef'.repeat(32)
    };
    const out = await pipeline._enrichMinedTransactionRevert(
      readProvider,
      receipt,
      receipt.hash,
      null
    );
    expect(out.revertData).toBeNull();
  });

  test('extracts revertData when eth_call fails with revert payload', async () => {
    const iface = new Interface(['error UnitTestRevert(string reason)']);
    const revertHex = iface.encodeErrorResult('UnitTestRevert', ['unit test reason']);
    const readProvider = {
      async getTransaction() {
        return {
          to: VALID_TEST_ADDRESS,
          from: VALID_TEST_ADDRESS,
          data: '0xdeadbeef'
        };
      },
      async call() {
        const err = new Error('execution reverted');
        /** @type {{ data?: string }} */ (err).data = revertHex;
        throw err;
      }
    };
    const pipeline = createPipeline({ readProvider });
    const receipt = {
      blockNumber: 5,
      to: VALID_TEST_ADDRESS,
      from: VALID_TEST_ADDRESS,
      hash: '0x' + '12'.repeat(32)
    };
    const out = await pipeline._enrichMinedTransactionRevert(
      readProvider,
      receipt,
      receipt.hash,
      iface
    );
    expect(out.revertData).toBe(revertHex);
    expect(out.revertReason).toBe('UnitTestRevert');
  });
});
