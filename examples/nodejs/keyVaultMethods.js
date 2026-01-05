/**
 * Step X: KeyVault method examples
 * 
 * Run: node examples/nodejs/keyVaultMethods.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 *   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
 *   COUNTER_BYTECODE=0x... (your counter contract bytecode)
 * 
 * Tests:
 * 1. get the storage contract address holding the keys
 * 2. get the authenticator contract address
 * 3. get the implementation contract address
 * 4. check if a keyVault is initialized
 * 5. get the account address 
 * 6. get multiple account addresses 
 * 7. sign a transaction
 * 8. sign a 32-byte hash 
 * 9. sign an EIP-191 message 
 * 10. execute a function with an auth proof
 * 
 */

import 'dotenv/config';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "";
const PASSWORD = process.env.PASSWORD || "";
const ACCOUNT_INDEX = 0;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const AMOY_CHAIN_ID = 80002;
const SEPOLIA_CHAIN_ID = 11155111n;
const COUNTER_BYTECODE = process.env.COUNTER_BYTECODE || "0x6080806040523461001657610163908161001c8239f35b600080fdfe608080604052600436101561001357600080fd5b600090813560e01c90816303df179c146100c65750806306661abd146100a95763d09de08a1461004257600080fd5b346100a657806003193601126100a65780546000198114610092576001018082556040519081527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b82526011600452602482fd5b80fd5b50346100a657806003193601126100a65760209054604051908152f35b90503461012957602036600319011261012957815460043581018091116101155780835581527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b83526011600452602483fd5b5080fdfea264697066735822122027ffb7296a96af125559a72a946250ff78075f9534148f0c7f37996c4dc8f68e64736f6c63430008180033";


const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step X: KeyVault method examples");
  console.log("=".repeat(70));

  // Prepare auth proof (raw password bytes)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // Get keyVault address for a wallet
  const keyVaultAddr = await sdk.getKeyVaultAddr({
    walletAddr: WALLET_ADDRESS
  });
  console.log(`   KeyVault: ${keyVaultAddr}`);
  if (!keyVaultAddr) {
    console.error("❌ ERROR: Failed to get key vault address");
    process.exit(1);
  }

  // ============ STEP 1: Get storage contract holding the keys ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Get storage contract holding the keys");
  console.log("=".repeat(70));

  // const storageAddr = await sdk.getStorageAddr({
  const storageAddr = await sdk.getKeyVaultStorageAddr({
    keyVaultAddr: keyVaultAddr
  });

  console.log(`   Storage: ${storageAddr}`);
  if (!storageAddr) {
    console.error("❌ ERROR: Failed to get storage address");
    process.exit(1);
  }

  // ============ STEP 2: Get authenticator contract address ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Get authenticator contract address");
  console.log("=".repeat(70));

  const authenticatorAddr = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVaultAddr
  });
  console.log(`   Authenticator: ${authenticatorAddr}`);
  if (!authenticatorAddr) {
    console.error("❌ ERROR: Failed to get authenticator address");
    process.exit(1);
  }

  // ============ STEP 3: Get KeyVaultImplementation contract address ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Get KeyVaultImplementation contract address");
  console.log("=".repeat(70));

  const keyVaultImplAddr = await sdk.getKeyVaultImplAddr({
    keyVaultAddr: keyVaultAddr
  });
  console.log(`   Implementation: ${keyVaultImplAddr}`);
  if (!keyVaultImplAddr) {
    console.error("❌ ERROR: Failed to get implementation address");
    process.exit(1);
  }

  // ============ STEP 4: Check if a keyVault is initialized ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Check if a keyVault is initialized");
  console.log("=".repeat(70));

  const isInitialized = await sdk.isInitialized({
    keyVaultAddr: keyVaultAddr
  });
  console.log(`   isInitialized: ${isInitialized ? "✅ Yes" : "❌ No"}`);
  if (!isInitialized) {
    console.error("❌ ERROR: KeyVault is not initialized");
    process.exit(1);
  }

  // ============ STEP 5: Get the account address from the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: Get the account address (index 0) from the keyVault contract");
  console.log("=".repeat(70));

  const accountAddress = await sdk.getAccountAddr({
    keyVaultAddr: keyVaultAddr,
    index: 0
  });
  console.log(`   Account Address (index 0): ${accountAddress}`);
  if (!accountAddress) {
    console.error("❌ ERROR: Failed to get account address");
    process.exit(1);
  }

  // ============ STEP 6: Get multiple account addresses from the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 6: Get multiple account addresses (indexes 0-4) from the keyVault contract");
  console.log("=".repeat(70));

  const accountAddresses = await sdk.getAccountAddresses({
    keyVaultAddr: keyVaultAddr,
    fromIndex: 0,
    count: 5
  });
  // log each account address with index
  for (let i = 0; i < accountAddresses.length; i++) {
    console.log(`   Account Address (index ${i}): ${accountAddresses[i]}`);
  }
  if (!accountAddresses) {
    console.error("❌ ERROR: Failed to get account addresses");
    process.exit(1);
  }

  // ============ STEP 7: Sign a transaction with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 7: Sign a transaction");
  console.log("=".repeat(70));

  console.log(`   Deploying Counter contract...`);

  const amoyProvider = new ethers.JsonRpcProvider(AMOY_RPC_URL);

  // Counter contract ABI
  const COUNTER_ABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "by",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newCount",
          "type": "uint256"
        }
      ],
      "name": "Incremented",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "count",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "increment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "incrementBy",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  if (COUNTER_BYTECODE === "0x" || COUNTER_BYTECODE.length < 100) {
    console.error("\n❌ ERROR: Counter contract bytecode not provided!");
    console.error("   Set COUNTER_BYTECODE env var with compiled bytecode, or");
    console.error("   compile Counter.sol and update the COUNTER_BYTECODE constant above.");
    process.exit(1);
  }

  // Create contract factory manually
  const CounterFactory = new ethers.ContractFactory(COUNTER_ABI, COUNTER_BYTECODE, amoyProvider);
  const deployData = CounterFactory.bytecode;

  const deployNonce = await amoyProvider.getTransactionCount(accountAddress);
  const feeData = await amoyProvider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("30", "gwei");
  const deployGasLimit = 500000n;

  console.log(`   Nonce: ${deployNonce}`);
  console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  console.log("   Requesting signature from Sapphire...");
  const signedTransaction = await sdk.signTransaction({
    keyVaultAddr: keyVaultAddr,
    authProof: authProof,
    index: ACCOUNT_INDEX,
    nonce: deployNonce,
    gasPrice: gasPrice,
    gasLimit: deployGasLimit,
    to: ethers.ZeroAddress,
    value: 0,
    txData: deployData,
    chainId: AMOY_CHAIN_ID
  });
  console.log(`   Signature (signed transaction): ${signedTransaction}`);

  console.log("   Broadcasting deployment...");
  let deployTxResponse;
  try {
    deployTxResponse = await amoyProvider.broadcastTransaction(signedTransaction);
    console.log(`   Tx: ${deployTxResponse.hash}`);
  } catch (error) {
    // Check for insufficient funds error (most reliable check)
    if (error.code === 'INSUFFICIENT_FUNDS' || 
        error.shortMessage?.includes('insufficient funds') ||
        error.message?.includes('insufficient funds')) {
      console.error("❌ ERROR: Insufficient funds");
      console.error(`   Send testnet MATIC to: ${accountAddress}`);
      console.error("   Faucet: https://faucet.stakepool.dev.br/amoy");
      process.exit(1);
    }
    // Re-throw if it's a different error
    throw error;
  }

  const deployReceipt = await deployTxResponse.wait();
  const counterAddress = deployReceipt?.contractAddress;
  if (!counterAddress) {
    throw new Error("Failed to get contract address from deployment receipt");
  }
  console.log(`   ✅ Counter deployed: ${counterAddress}`);

  const counter = new ethers.Contract(counterAddress, COUNTER_ABI, amoyProvider);
  console.log(`   Initial count: ${await counter.count()}`);

  // ============ STEP 8: Sign a 32-byte hash with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 8: Sign a 32-byte hash");
  console.log("=".repeat(70));

  const hash = ethers.keccak256(ethers.toUtf8Bytes("Hello from TheWallet!"));

  const signedHash = await sdk.sign({
    keyVaultAddr: keyVaultAddr,
    authProof: authProof,
    index: 0,
    hash: hash
  });
  console.log(`   Signature (signed hash): ${signedHash}`);
  if (!signedHash) {
    console.error("❌ ERROR: Failed to sign hash");
    process.exit(1);
  }

  // ============ STEP 9: Sign an EIP-191 message with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 9: Sign an EIP-191 message with the keyVault contract");
  console.log("=".repeat(70));

  const message = "Hello from TheWallet!";

  const signature = await sdk.signMessage({
    keyVaultAddr: keyVaultAddr,
    authProof: authProof,
    index: 0,
    message: ethers.toUtf8Bytes(message)
  });
  console.log(`   Signature (signed message): ${signature}`);
  if (!signature) {
    console.error("❌ ERROR: Failed to sign message");
    process.exit(1);
  }

  // ============ STEP 10: Execute a function with an auth proof with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 10: Execute a function with an auth proof");
  console.log("=".repeat(70));

  // Example delegate contract (we'd deploy one, but for testing use a placeholder)
  const delegateContract = "0x1234567890123456789012345678901234567890";
  const authNonce = 0n;
  const chainId = SEPOLIA_CHAIN_ID;
  const accountIndex = 0;

  const KEYVAULT_IMPLEMENTATION_ABI = [
    {
      "inputs": [],
      "name": "DER_Split_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "expmod_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "k256Decompress_Invalid_Length_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "k256DeriveY_Invalid_Prefix_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "recoverV_Error",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "baseKey",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "baseChain",
          "type": "bytes32"
        },
        {
          "internalType": "uint32",
          "name": "index",
          "type": "uint32"
        }
      ],
      "name": "getAccountAddressImpl",
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
          "internalType": "bytes32",
          "name": "baseKey",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "baseChain",
          "type": "bytes32"
        },
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
      "name": "getAccountAddressesImpl",
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
          "name": "delegate",
          "type": "address"
        },
        {
          "internalType": "uint64",
          "name": "authNonce",
          "type": "uint64"
        },
        {
          "internalType": "uint256",
          "name": "chainId",
          "type": "uint256"
        }
      ],
      "name": "getAuthorizationHashImpl",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "authHash",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "authRlp",
          "type": "bytes"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "baseKey",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "baseChain",
          "type": "bytes32"
        },
        {
          "internalType": "uint32",
          "name": "index",
          "type": "uint32"
        },
        {
          "internalType": "address",
          "name": "delegate",
          "type": "address"
        },
        {
          "internalType": "uint64",
          "name": "authNonce",
          "type": "uint64"
        },
        {
          "internalType": "uint256",
          "name": "chainId",
          "type": "uint256"
        }
      ],
      "name": "signAuthorizationImpl",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "r",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        },
        {
          "internalType": "uint8",
          "name": "yParity",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "baseKey",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "baseChain",
          "type": "bytes32"
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
      "name": "signImpl",
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
          "internalType": "bytes32",
          "name": "baseKey",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "baseChain",
          "type": "bytes32"
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
      "name": "signMessageImpl",
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
          "internalType": "bytes32",
          "name": "baseKey",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "baseChain",
          "type": "bytes32"
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
          "name": "data",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "chainId",
          "type": "uint256"
        }
      ],
      "name": "signTransactionImpl",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "signedTx",
          "type": "bytes"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Build the implementation call with placeholder keys
  // signAuthorizationImpl(bytes32 baseKey, bytes32 baseChain, uint32 index, address delegate, uint64 authNonce, uint256 chainId)
  const KeyVaultImpl = new ethers.Contract(keyVaultImplAddr, KEYVAULT_IMPLEMENTATION_ABI, sdk.writeSigner);
  const implInterface = KeyVaultImpl.interface;

  // Prepare implementation call
  const implCall = implInterface.encodeFunctionData(
    "signAuthorizationImpl",
    [
      ethers.ZeroHash,  // placeholder baseKey - KeyVault replaces this
      ethers.ZeroHash,  // placeholder baseChain - KeyVault replaces this
      accountIndex,
      delegateContract,
      authNonce,
      chainId
    ]
  );

  console.log(`Delegate: ${delegateContract}`);
  console.log(`Auth nonce: ${authNonce}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Impl call length: ${implCall.length} chars`);

  const result = await sdk.executeWithAuth({
    keyVaultAddr: keyVaultAddr,
    authProof: authProof,
    implCall: implCall
  });

  // Decode result: (bytes32 r, bytes32 s, uint8 yParity)
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
    ["bytes32", "bytes32", "uint8"],
    result
  );
  
  const [r, s, yParity] = decoded;
  
  console.log(`\n✅ Authorization Signed!`);
  console.log(`r: ${r}`);
  console.log(`s: ${s}`);
  console.log(`yParity: ${yParity}`);

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`   Wallet: ${WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Storage: ${storageAddr}`);
  console.log(`   Authenticator: ${authenticatorAddr}`);
  console.log(`   KeyVaultImplementation: ${keyVaultImplAddr}`);
  console.log(`   Account Address (index 0): ${accountAddress}`);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
