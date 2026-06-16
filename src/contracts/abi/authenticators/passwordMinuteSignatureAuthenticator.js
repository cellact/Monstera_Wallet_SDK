/**
 * Solidity ABI for the {@code PasswordMinuteSignatureAuthenticator} contract.
 *
 * Used by {@link PasswordMinuteSignatureAuthenticatorClient}; covers configure / verify, password
 * change, and every relevant event / custom error.
 *
 * @module contracts/abi/authenticators/passwordMinuteSignatureAuthenticator
 */

/**
 * Frozen ABI fragment array for {@code PasswordMinuteSignatureAuthenticator}.
 *
 * @public
 * @readonly
 * @type {ReadonlyArray<object>}
 */
export const PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI = [
	{
		"inputs": [],
		"name": "AlreadyConfigured",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidPassword",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidProof",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidPublicKey",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ModexpFailed",
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
