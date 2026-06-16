/**
 * Solidity ABI for the {@code WalletFactory} contract.
 *
 * Hand-checked subset used by {@link WalletFactoryClient}: every wallet creation entry point,
 * factory administration calls, and all events / custom errors needed by {@code sdkErrorPipeline}
 * to translate reverts.
 *
 * @module contracts/abi/core/walletFactory
 */

/**
 * Frozen ABI fragment array for {@code WalletFactory}.
 *
 * @public
 * @readonly
 * @type {ReadonlyArray<object>}
 */
export const WALLET_FACTORY_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ERC1167FailedCreateClone",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidAddress",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidSeedLength",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "AuthenticatorAllowed",
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
		"name": "BeaconUpgraded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "implementation_",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "KeyVaultImplementationAllowed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "keyVault",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "WalletAuthenticatorAllowed",
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
				"name": "keyVault",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "storage_",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			}
		],
		"name": "WalletCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "keyVault",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "implementation",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "WalletImplementationAllowed",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "admin",
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
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "allowedAuthenticators",
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
				"name": "",
				"type": "address"
			}
		],
		"name": "allowedKeyVaultImplementations",
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
		"inputs": [],
		"name": "beacon",
		"outputs": [
			{
				"internalType": "contract UpgradeableBeacon",
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
				"name": "seed",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "authConfig",
				"type": "bytes"
			}
		],
		"name": "createWallet",
		"outputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "seed",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "authConfig",
				"type": "bytes"
			}
		],
		"name": "createWalletCore",
		"outputs": [
			{
				"internalType": "address",
				"name": "keyVault",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "storage_",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "seed",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "authConfig",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "customLogicImpl",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "logicData",
				"type": "bytes"
			}
		],
		"name": "createWalletWithCustomLogic",
		"outputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "keyVault",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "seed",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "authConfig",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "hook",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "hookData",
				"type": "bytes"
			}
		],
		"name": "createWalletWithHook",
		"outputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
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
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "authenticator_",
				"type": "address"
			}
		],
		"name": "isAuthenticatorApproved",
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
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "implementation_",
				"type": "address"
			}
		],
		"name": "isImplementationApproved",
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
			}
		],
		"name": "isWallet",
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
		"inputs": [],
		"name": "keyVaultTemplate",
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
				"internalType": "address",
				"name": "authenticator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "setAuthenticatorAllowed",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "implementation_",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "setKeyVaultImplementationAllowed",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "walletOrKeyVault",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "authenticator_",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "setWalletAuthenticatorAllowed",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "walletOrKeyVault",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "implementation_",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "setWalletImplementationAllowed",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "transferAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newLogic",
				"type": "address"
			}
		],
		"name": "upgradeLogic",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "walletKeyVault",
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
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "walletSecretVault",
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
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "walletStorage",
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
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "wallets",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
