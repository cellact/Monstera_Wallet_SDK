/**
 * Solidity ABI for the {@code MultiAuthenticator} contract.
 *
 * Used by {@link MultiAuthenticatorClient};
 *
 * @module contracts/abi/authenticators/multiAuthenticator
 */

/**
 * Frozen ABI fragment array for {@code MultiAuthenticator}.
 *
 * @public
 * @readonly
 * @type {ReadonlyArray<object>}
 */
export const MULTI_AUTHENTICATOR_ABI = [
	{
		"inputs": [],
		"name": "AlreadyConfigured",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "AlreadyEnabled",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ChildNotEnabled",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidChild",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidConfig",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "LastAuthenticator",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotConfigured",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "Unauthorized",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "child",
				"type": "address"
			}
		],
		"name": "AuthenticatorAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "child",
				"type": "address"
			}
		],
		"name": "AuthenticatorRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "children",
				"type": "address[]"
			}
		],
		"name": "WalletConfigured",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "authProof",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "child",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "childConfig",
				"type": "bytes"
			}
		],
		"name": "addAuthenticator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "bytes4",
				"name": "selector",
				"type": "bytes4"
			},
			{
				"internalType": "bytes32",
				"name": "paramsHash",
				"type": "bytes32"
			}
		],
		"name": "computeActionHash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "config",
				"type": "bytes"
			}
		],
		"name": "configure",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			}
		],
		"name": "getAuthenticators",
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
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			}
		],
		"name": "isConfigured",
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
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "child",
				"type": "address"
			}
		],
		"name": "isEnabled",
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
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "authProof",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "child",
				"type": "address"
			}
		],
		"name": "removeAuthenticator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"components": [
					{
						"internalType": "address",
						"name": "target",
						"type": "address"
					},
					{
						"internalType": "bytes4",
						"name": "selector",
						"type": "bytes4"
					},
					{
						"internalType": "bytes32",
						"name": "paramsHash",
						"type": "bytes32"
					},
					{
						"internalType": "bytes32",
						"name": "actionHash",
						"type": "bytes32"
					}
				],
				"internalType": "struct IAuthenticator.AuthContext",
				"name": "context",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "authProof",
				"type": "bytes"
			}
		],
		"name": "verify",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
