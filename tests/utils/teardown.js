/**
 * Shared teardown for integration tests that use {@link Monstera} (ethers providers).
 * Destroys JsonRpcProvider instances so background retries do not run after Jest finishes.
 */

/**
 * Best-effort destroy of ethers providers held by an SDK instance.
 *
 * @param {import('../../src/index.js').Monstera | null | undefined} sdkInstance
 * @returns {Promise<void>}
 */
export async function closeSdkConnections(sdkInstance) {
  if (!sdkInstance) return;

  /** @type {Array<unknown>} */
  const candidates = [sdkInstance.readProvider, sdkInstance.writeSigner?.provider];

  for (const candidate of candidates) {
    if (candidate && typeof candidate.destroy === 'function') {
      try {
        await candidate.destroy();
      } catch {
        // Best-effort cleanup; ignore teardown errors.
      }
    }
  }
}

/**
 * Registers Jest {@code afterAll} to close the SDK returned by {@code getSdk}.
 * Use one line per suite: {@code registerSdkTeardown(afterAll, () => sdk)}.
 *
 * @param {(fn: () => void | Promise<void>) => void} afterAllFn - Jest's {@code afterAll}
 * @param {() => import('../../src/index.js').Monstera | null | undefined} getSdk
 */
export function registerSdkTeardown(afterAllFn, getSdk) {
  afterAllFn(async () => {
    await closeSdkConnections(getSdk());
  });
}
