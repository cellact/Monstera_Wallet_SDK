/**
 * Step X: KeyVault method examples
 * 
 * Run: node examples/keyVaultMethods.js
 * 
 * Tests:
 * 1. get the storage contract address holding the keys
 * 2. get the authenticator contract address
 * 3. get the implementation contract address
 * 4. check if a keyVault is initialized
 * 5. change the authenticator contract address (to be implemented)
 * 6. get the account address 
 * 7. get multiple account addresses 
 * 8. sign a transaction
 * 9. sign a 32-byte hash 
 * 10. sign an EIP-191 message 
 * 11. execute a function with an auth proof
 * 
 * Required env vars:
 *   WALLET_ADDRESS=0x...
 *   TEST_PASSWORD=password
 *   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
 *   AMOY_CHAIN_ID=80002
 *   SIGNER_PRIVATE_KEY=0x... (private key for deploying/creating wallet)
 */

require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers, HDNodeWallet, Wallet } = require('ethers');

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const ACCOUNT_INDEX = 0;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const AMOY_CHAIN_ID = 80002;

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step X: KeyVault method examples");
  console.log("=".repeat(70));

  // Prepare auth proof (raw password bytes)
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // Get keyVault address for a wallet
  const keyVaultAddr = await sdk.wallets.getKeyVault({
    walletAddress: WALLET_ADDRESS
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

  const storageAddr = await sdk.wallets.getStorageAddr({
    keyVaultAddress: keyVaultAddr
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

  const authenticatorAddr = await sdk.wallets.getAuthenticatorKeyVault({
    keyVaultAddress: keyVaultAddr
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

  const keyVaultImplAddr = await sdk.wallets.getKeyVaultImplAddr({
    keyVaultAddress: keyVaultAddr
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

  const isInitialized = await sdk.wallets.isInitializedKeyVault({
    keyVaultAddress: keyVaultAddr
  });
  console.log(`   isInitialized: ${isInitialized ? "✅ Yes" : "❌ No"}`);
  if (!isInitialized) {
    console.error("❌ ERROR: KeyVault is not initialized");
    process.exit(1);
  }

//   // ============ STEP 5: Change the authenticator contract address ============
//   console.log("\n" + "=".repeat(70));
//   console.log("STEP 5: Change the authenticator contract address");
//   console.log("=".repeat(70));

//   const newAuthenticatorAddr = await sdk.wallets.changeAuthenticatorKeyVault({
//     keyVaultAddress: keyVaultAddr,
//     authProof: authProof
//   });
//   console.log(`   New Authenticator: ${newAuthenticatorAddr}`);
//   if (!newAuthenticatorAddr) {
//     console.error("❌ ERROR: Failed to change authenticator address");
//     process.exit(1);
//   }

  // ============ STEP 6: Get the account address from the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 6: Get the account address (index 0) from the keyVault contract");
  console.log("=".repeat(70));

  const accountAddress = await sdk.wallets.getAccountAddressKeyVault({
    keyVaultAddress: keyVaultAddr,
    index: 0
  });
  console.log(`   Account Address (index 0): ${accountAddress}`);
  if (!accountAddress) {
    console.error("❌ ERROR: Failed to get account address");
    process.exit(1);
  }

  // ============ STEP 7: Get multiple account addresses from the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 7: Get multiple account addresses (indexes 0-4) from the keyVault contract");
  console.log("=".repeat(70));

  const accountAddresses = await sdk.wallets.getAccountAddressesKeyVault({
    keyVaultAddress: keyVaultAddr,
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

  // ============ STEP 8: Sign a transaction with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 8: Sign a transaction");
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

  const COUNTER_BYTECODE = process.env.COUNTER_BYTECODE || "0x6080806040523461001657610163908161001c8239f35b600080fdfe608080604052600436101561001357600080fd5b600090813560e01c90816303df179c146100c65750806306661abd146100a95763d09de08a1461004257600080fd5b346100a657806003193601126100a65780546000198114610092576001018082556040519081527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b82526011600452602482fd5b80fd5b50346100a657806003193601126100a65760209054604051908152f35b90503461012957602036600319011261012957815460043581018091116101155780835581527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b83526011600452602483fd5b5080fdfea264697066735822122027ffb7296a96af125559a72a946250ff78075f9534148f0c7f37996c4dc8f68e64736f6c63430008180033";
  
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
  const signedTransaction = await sdk.wallets.signTransactionKeyVault({
    keyVaultAddress: keyVaultAddr,
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
  const deployTxResponse = await amoyProvider.broadcastTransaction(signedTransaction);
  console.log(`   Tx: ${deployTxResponse.hash}`);

  const deployReceipt = await deployTxResponse.wait();
  const counterAddress = deployReceipt?.contractAddress;
  if (!counterAddress) {
    throw new Error("Failed to get contract address from deployment receipt");
  }
  console.log(`   ✅ Counter deployed: ${counterAddress}`);

  const counter = new ethers.Contract(counterAddress, COUNTER_ABI, amoyProvider);
  console.log(`   Initial count: ${await counter.count()}`);

  // ============ STEP 9: Sign a 32-byte hash with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 9: Sign a 32-byte hash");
  console.log("=".repeat(70));

  const hash = ethers.keccak256(ethers.toUtf8Bytes("Hello from TheWallet!"));

  const signedHash = await sdk.wallets.signKeyVault({
    keyVaultAddress: keyVaultAddr,
    authProof: authProof,
    index: 0,
    hash: hash
  });
  console.log(`   Signature (signed hash): ${signedHash}`);
  if (!signedHash) {
    console.error("❌ ERROR: Failed to sign hash");
    process.exit(1);
  }

  // ============ STEP 10: Sign an EIP-191 message with the keyVault contract ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 10: Sign an EIP-191 message with the keyVault contract");
  console.log("=".repeat(70));

  const message = "Hello from TheWallet!";

  const signature = await sdk.wallets.signMessageKeyVault({
    keyVaultAddress: keyVaultAddr,
    authProof: authProof,
    index: 0,
    message: ethers.toUtf8Bytes(message)
  });
  console.log(`   Signatur (signed message): ${signature}`);
  if (!signature) {
    console.error("❌ ERROR: Failed to sign message");
    process.exit(1);
  }

//   // ============ STEP 11: Execute a function with an auth proof with the keyVault contract ============
//   console.log("\n" + "=".repeat(70));
//   console.log("STEP 11: Execute a function with an auth proof");
//   console.log("=".repeat(70));

//   // Prepare implementation call
//   const implCall = implInterface.encodeFunctionData(
//     "signAuthorizationImpl",
//     [
//       ethers.ZeroHash,  // placeholder baseKey - KeyVault replaces this
//       ethers.ZeroHash,  // placeholder baseChain - KeyVault replaces this
//       accountIndex,
//       delegateContract,
//       authNonce,
//       chainId
//     ]
//   );

//   const result = await sdk.wallets.executeWithAuth({
//     keyVaultAddress: keyVaultAddr,
//     authProof: authProof,
//     implCall: implCall
//   });
//   console.log(`   Result: ${result}`);
//   if (!result) {
//     console.error("❌ ERROR: Failed to execute function");
//     process.exit(1);
//   }

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`   Wallet: ${WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
//   console.log(`   Storage: ${storageAddr}`);
//   console.log(`   Authenticator: ${authenticatorAddr}`);
//   console.log(`   KeyVaultImplementation: ${keyVaultImplAddr}`);
//   console.log(`   Account Address (index 0): ${accountAddress}`);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
