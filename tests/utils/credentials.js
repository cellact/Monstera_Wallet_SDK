/**
 * Test helpers for end-user credentials sessions (offline unit tests).
 */

import { ConnectSession } from '../../src/internal/auth/session/ConnectSession.js';
import { VALID_TEST_ADDRESS } from './fixtures.js';

/**
 * Attach a pre-resolved credentials session to an SDK instance for offline vault tests.
 *
 * @param {import('../../src/sdk/Monstera.js').default} sdk
 * @param {{ keyVaultAddr?: string; walletAddr?: string; username?: string; password?: string }} [overrides]
 */
export function attachTestConnectSession(sdk, overrides = {}) {
  const keyVaultAddr = overrides.keyVaultAddr ?? VALID_TEST_ADDRESS;
  const walletAddr = overrides.walletAddr ?? VALID_TEST_ADDRESS;

  const session = new ConnectSession(
    {
      username: overrides.username ?? 'test-user',
      password: overrides.password ?? 'test-password'
    },
    {
      hashUsername: async () => '0x' + 'ab'.repeat(32),
      walletOfUsername: async () => walletAddr,
      getKeyVaultAddr: async () => keyVaultAddr
    }
  );

  session._walletAddr = walletAddr;
  session._keyVaultAddr = keyVaultAddr;
  sdk._connectSession = session;
  sdk._keyVaultAuthPipeline?.setConnectSession(session);
}
