import { createTestSDK, getTestConfig, createTestWallet, setupTestWallet } from '../../utils/setup.js';

/** Shared wallet + SDK fixtures for authentication integration suites. */
export async function loadAuthenticationFixtures() {
  const config = getTestConfig();
  const sdk = createTestSDK();
  const { wallet, address: testWalletAddr } = createTestWallet();
  const walletData = await setupTestWallet(sdk, config.passwordHash);

  return {
    sdk,
    password: config.password,
    passwordHash: config.passwordHash,
    keyVaultAddr: walletData.keyVault,
    testWallet: wallet,
    testWalletAddr,
    walletAddr: walletData.wallet
  };
}
