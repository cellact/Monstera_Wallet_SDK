/**
 * Minimal ABI for {@code IAuthenticator} ({@code contracts/interfaces/IAuthenticator.sol}).
 *
 * Shared by all built-in authenticator contracts. Use this for interface-level selectors
 * (e.g. {@code verify}) instead of a concrete implementation ABI.
 *
 * @module contracts/abi/interfaces/iAuthenticator
 */

/**
 * Frozen ABI fragment array for {@code IAuthenticator}.
 *
 * @public
 * @readonly
 * @type {ReadonlyArray<object>}
 */
export const I_AUTHENTICATOR_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'wallet', type: 'address' },
      { internalType: 'bytes', name: 'config', type: 'bytes' }
    ],
    name: 'configure',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'wallet', type: 'address' }],
    name: 'isConfigured',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'wallet', type: 'address' },
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'bytes4', name: 'selector', type: 'bytes4' },
          { internalType: 'bytes32', name: 'paramsHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'actionHash', type: 'bytes32' }
        ],
        internalType: 'struct IAuthenticator.AuthContext',
        name: 'context',
        type: 'tuple'
      },
      { internalType: 'bytes', name: 'authProof', type: 'bytes' }
    ],
    name: 'verify',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
];
