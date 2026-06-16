/**
 * Solidity ABI for the {@code PasswordAuthenticator} contract.
 *
 * Used by {@link PasswordAuthenticatorClient}; covers configure / verify / changePassword and the
 * full set of events and custom errors needed by {@code sdkErrorPipeline}.
 *
 * @module contracts/abi/authenticators/passwordAuthenticator
 */

/**
 * Frozen ABI fragment array for {@code PasswordAuthenticator}.
 *
 * @public
 * @readonly
 * @type {ReadonlyArray<object>}
 */
export const PASSWORD_AUTHENTICATOR_ABI = [
	{
		"inputs": [],
		"name": "AlreadyConfigured",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidPassword",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotConfigured",
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
			}
		],
		"name": "PasswordChanged",
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
			}
		],
		"name": "PasswordConfigured",
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
				"name": "currentPassword",
				"type": "bytes"
			},
			{
				"internalType": "bytes32",
				"name": "newPasswordHash",
				"type": "bytes32"
			}
		],
		"name": "changePassword",
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
