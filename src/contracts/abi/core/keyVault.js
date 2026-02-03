/**
 * KeyVault Contract ABI
 */
export const KEYVAULT_ABI = [
  {
    "inputs": [],
    "name": "AlreadyInitialized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AuthenticationFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ChainNotConfigured",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DelegateCallFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAccessToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAuthenticator",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCallData",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "KeyNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitialized",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldAuth",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAuth",
        "type": "address"
      }
    ],
    "name": "AuthenticatorChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldImpl",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newImpl",
        "type": "address"
      }
    ],
    "name": "ImplementationUpgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "KeyActivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "KeyDeactivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum WalletStorageV2.CurveType",
        "name": "curve",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum WalletStorageV2.ChainType",
        "name": "chain",
        "type": "uint8"
      }
    ],
    "name": "KeyImported",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "activateKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "authenticator",
    "outputs": [
      {
        "internalType": "contract IAuthenticator",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "newAuthenticator",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "newAuthConfig",
        "type": "bytes"
      }
    ],
    "name": "changeAuthenticator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "deactivateKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "implCall",
        "type": "bytes"
      }
    ],
    "name": "executeWithAuth",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      }
    ],
    "name": "getAccountAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "fromIndex",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "count",
        "type": "uint32"
      }
    ],
    "name": "getAccountAddresses",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "getImportedKeyAddress",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "addr",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getImportedKeyIds",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "getKeyMetadata",
    "outputs": [
      {
        "components": [
          {
            "internalType": "enum WalletStorageV2.CurveType",
            "name": "curve",
            "type": "uint8"
          },
          {
            "internalType": "enum WalletStorageV2.KeySource",
            "name": "source",
            "type": "uint8"
          },
          {
            "internalType": "enum WalletStorageV2.ChainType",
            "name": "chain",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "hdIndex",
            "type": "uint32"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          },
          {
            "internalType": "bytes32",
            "name": "labelHash",
            "type": "bytes32"
          }
        ],
        "internalType": "struct WalletStorageV2.KeyMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      }
    ],
    "name": "getSolanaAddress",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "pubkey",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "implementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "privateKey",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "publicKey",
        "type": "bytes"
      },
      {
        "internalType": "enum WalletStorageV2.CurveType",
        "name": "curve",
        "type": "uint8"
      },
      {
        "internalType": "enum WalletStorageV2.ChainType",
        "name": "chain",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "importKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_storage",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_authenticator",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "accessToken",
        "type": "bytes32"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialized",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      }
    ],
    "name": "keyExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "enum WalletStorageV2.ChainType",
        "name": "chain",
        "type": "uint8"
      },
      {
        "internalType": "bytes",
        "name": "basePrivateKey",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "baseChainCode",
        "type": "bytes"
      }
    ],
    "name": "setChainBaseKeys",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "bytes32",
        "name": "digest",
        "type": "bytes32"
      }
    ],
    "name": "sign",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "message",
        "type": "bytes"
      }
    ],
    "name": "signMessage",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "message",
        "type": "bytes"
      }
    ],
    "name": "signSolana",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gasPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gasLimit",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "txData",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      }
    ],
    "name": "signTransaction",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "signedTx",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "keyId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "digest",
        "type": "bytes32"
      }
    ],
    "name": "signWithImportedKey",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "storage_",
    "outputs": [
      {
        "internalType": "contract WalletStorageV2",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      }
    ],
    "name": "upgradeImplementation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
