/**
 * Typecheck for the published app API. Run with `npm run test:types`.
 */
import MonsteraDefault, {
  Monstera,
  ValidationError,
  WalletError
} from '../../dist/types/index.js';

const sameClass: typeof Monstera = MonsteraDefault;

const signer = {
  signTypedData: async () => '0x' + 'ab'.repeat(65)
};

async function firstSession(): Promise<void> {
  const username = 'alice';
  const password = 'your-secure-password';

  const sdk = sameClass.connect({
    mainnet: false,
    signer: '0x' + '11'.repeat(32),
    credentials: { username, password }
  });

  const wallet = await sdk.createWalletForUsername({
    authenticatorAddr: sdk.addresses.passwordAuth,
    authConfig: { passwordHash: '0x' + '22'.repeat(32) },
    username
  });

  const signature = await sdk.signMessage({
    index: 0,
    message: new Uint8Array([1, 2, 3])
  });

  const keyVaultAddr = await sdk.getKeyVaultAddr({ walletAddr: wallet.wallet });
  const account = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
  const usernameHash = await sdk.hashUsername({ username });
  const resolved = await sdk.walletOfUsername({ usernameHash });

  await sdk.signMessage({
    keyVaultAddr,
    index: 0,
    message: new Uint8Array([4]),
    authProof: { signer }
  });

  if (signature.length === 0 || account.length === 0 || resolved.length === 0) {
    throw new ValidationError('empty result', 'signature');
  }
}

function errorCode(error: unknown): string | undefined {
  if (error instanceof ValidationError) {
    return error.code;
  }
  if (error instanceof WalletError) {
    return error.code;
  }
  return undefined;
}

// A private-key string pays gas. It is not an auth-proof signer.
Monstera.connect({ mainnet: false, signer: '0x' + '33'.repeat(32) });

// @ts-expect-error authProof.signer must provide signTypedData
const rejected = Monstera.connect({ mainnet: false }).signMessage({ index: 0, message: new Uint8Array([1]), authProof: { signer: '0xabc' } });

void firstSession();
void rejected;
void errorCode(new ValidationError('bad', 'username'));
