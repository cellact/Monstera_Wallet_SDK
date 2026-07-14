import { describe, expect, test } from '@jest/globals';
import {
  buildAuthenticatorVerifyProbeAction,
  getVerifySelector,
  VERIFY_PROBE_PARAMS_HASH
} from '../../../src/internal/auth/actions/verifyProbe.js';
import { getSelector } from '../../../src/internal/vault/getSelector.js';
import { PASSWORD_AUTHENTICATOR_ABI } from '../../../src/contracts/abi/authenticators/passwordAuthenticator.js';
import { WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../../../src/contracts/abi/authenticators/walletSignatureAuthenticator.js';
import { DUAL_FACTOR_AUTHENTICATOR_ABI } from '../../../src/contracts/abi/authenticators/dualFactorAuthenticator.js';
import { PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI } from '../../../src/contracts/abi/authenticators/passwordMinuteSignatureAuthenticator.js';

describe('authenticatorProbe', () => {
  const authenticatorAddr = '0x1234567890123456789012345678901234567890';

  test('buildAuthenticatorVerifyProbeAction uses verify selector and zero params hash', () => {
    const action = buildAuthenticatorVerifyProbeAction(authenticatorAddr);

    expect(action).toEqual({
      target: authenticatorAddr,
      selector: getVerifySelector(),
      paramsHash: VERIFY_PROBE_PARAMS_HASH
    });
  });

  test('getVerifySelector matches all built-in authenticator verify selectors', () => {
    const verifySelector = getVerifySelector();

    expect(getSelector(PASSWORD_AUTHENTICATOR_ABI, 'verify')).toBe(verifySelector);
    expect(getSelector(WALLET_SIGNATURE_AUTHENTICATOR_ABI, 'verify')).toBe(verifySelector);
    expect(getSelector(DUAL_FACTOR_AUTHENTICATOR_ABI, 'verify')).toBe(verifySelector);
    expect(getSelector(PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI, 'verify')).toBe(verifySelector);
  });
});
