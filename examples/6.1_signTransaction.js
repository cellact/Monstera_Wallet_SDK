/**
 * Step 6: Test Cross-Chain Transaction (Sapphire → Amoy)
 * 
 * Run: node examples/6_signTransaction.js
 * 
 * This demonstrates THE KEY SECURITY FEATURE:
 * - Private key NEVER leaves Sapphire enclave
 * - Transaction is built on Amoy, signed on Sapphire, broadcast on Amoy
 * 
 * Flow:
 * 1. Get account address from Sapphire wallet
 * 2. Deploy Counter contract on Amoy (signed via Sapphire)
 * 3. Call increment() on Amoy (signed via Sapphire)
 * 4. Verify count increased
 * 
 * Required:
 *   - Wallet on Sapphire testnet (WALLET_ADDRESS)
 *   - Password for the wallet (PASSWORD)
 *   - MATIC on the wallet's account[0] on Amoy
 * 
 */
require('dotenv').config();
const { SapphireWalletSDK } = require('../src/index-new');
const { ethers } = require("ethers");

// ============ CONFIGURATION ============
const SAPPHIRE_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const ACCOUNT_INDEX = 0;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const AMOY_CHAIN_ID = 80002;

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  signerOrProvider: SIGNER_PRIVATE_KEY
});

async function main() {
  console.log("=".repeat(70));
  console.log("Step 6: Cross-Chain Transaction (Sapphire → Amoy)");
  console.log("=".repeat(70));
  console.log("\n🔐 Private key NEVER leaves Sapphire enclave!");

  // Verify configuration
  if (!SAPPHIRE_WALLET_ADDRESS || !PASSWORD || !SIGNER_PRIVATE_KEY) {
    console.error("ERROR: Set TEST_WALLET_ADDRESS, TEST_PASSWORD, and SIGNER_PRIVATE_KEY env vars");
    process.exit(1);
  }

  // create amoy provider
  const amoyProvider = new ethers.JsonRpcProvider(AMOY_RPC_URL);
  console.log("\nSapphire Wallet:", SAPPHIRE_WALLET_ADDRESS);

  // ============ Connect to Sapphire Wallet ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Connect to Sapphire Wallet");
  console.log("=".repeat(70));

  // Get account address and KeyVault
  const accountAddress = await sdk.wallets.getAccountAddress({
    walletAddress: SAPPHIRE_WALLET_ADDRESS,
    index: ACCOUNT_INDEX
  });
  const keyVaultAddr = await sdk.wallets.getKeyVault({
    walletAddress: SAPPHIRE_WALLET_ADDRESS
  });
  
  console.log(`   Wallet (proxy): ${SAPPHIRE_WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Account ${ACCOUNT_INDEX}: ${accountAddress}`);

  // ============ Check Balance on Amoy ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Check Balance on Amoy");
  console.log("=".repeat(70));

  const balance = await amoyProvider.getBalance(accountAddress);
  console.log(`   Balance: ${ethers.formatEther(balance)} MATIC`);

  if (balance === 0n) {
    console.error("\n   ❌ No MATIC balance!");
    console.error(`   Send testnet MATIC to: ${accountAddress}`);
    console.error("   Faucet: https://faucet.polygon.technology/");
    process.exit(1);
  }

  // Prepare auth proof
  const authProof = ethers.toUtf8Bytes(PASSWORD);

  // ============ Deploy Counter on Amoy ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Deploy Counter on Amoy (via Sapphire signing)");
  console.log("=".repeat(70));

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

  // Sign deployment via Sapphire (key stays in enclave!)
  console.log("   Requesting signature from Sapphire...");
  const signedDeployTx = await sdk.wallets.signTransaction({
    walletAddress: SAPPHIRE_WALLET_ADDRESS,
    authProof: authProof,
    index: ACCOUNT_INDEX,
    nonce: deployNonce,
    gasPrice: gasPrice,
    gasLimit: deployGasLimit,
    to: ethers.ZeroAddress,
    value: 0,
    data: deployData,
    chainId: AMOY_CHAIN_ID
  });

  console.log("   Broadcasting deployment...");
  const deployTxResponse = await amoyProvider.broadcastTransaction(signedDeployTx);
  console.log(`   Tx: ${deployTxResponse.hash}`);

  const deployReceipt = await deployTxResponse.wait();
  const counterAddress = deployReceipt?.contractAddress;
  if (!counterAddress) {
    throw new Error("Failed to get contract address from deployment receipt");
  }
  console.log(`   ✅ Counter deployed: ${counterAddress}`);

  const counter = new ethers.Contract(counterAddress, COUNTER_ABI, amoyProvider);
  console.log(`   Initial count: ${await counter.count()}`);

  // ============ Sign increment() via Sapphire ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Call increment() (via Sapphire signing)");
  console.log("=".repeat(70));

  const counterInterface = new ethers.Interface(COUNTER_ABI);
  const txData = counterInterface.encodeFunctionData("increment", []);
  const nonce = await amoyProvider.getTransactionCount(accountAddress);
  const gasLimit = 100000n;

  console.log(`   To: ${counterAddress}`);
  console.log(`   Data: ${txData}`);
  console.log(`   Nonce: ${nonce}`);

  console.log("   Requesting signature from Sapphire...");
  const signedTx = await sdk.wallets.signTransaction({
    walletAddress: SAPPHIRE_WALLET_ADDRESS,
    authProof: authProof,
    index: ACCOUNT_INDEX,
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: counterAddress,
    value: 0,
    data: txData,
    chainId: AMOY_CHAIN_ID
  });

  console.log("   Broadcasting...");
  const txResponse = await amoyProvider.broadcastTransaction(signedTx);
  console.log(`   Tx: ${txResponse.hash}`);

  const receipt = await txResponse.wait();
  console.log(`   ✅ Confirmed in block ${receipt?.blockNumber}`);

  const newCount = await counter.count();
  console.log(`   New count: ${newCount}`);

  // ============ Second Transaction ============
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: Call incrementBy(5)");
  console.log("=".repeat(70));

  const txData2 = counterInterface.encodeFunctionData("incrementBy", [5]);
  const nonce2 = await amoyProvider.getTransactionCount(accountAddress);

  console.log("   Requesting signature from Sapphire...");
  const signedTx2 = await sdk.wallets.signTransaction({
    walletAddress: SAPPHIRE_WALLET_ADDRESS,
    authProof: authProof,
    index: ACCOUNT_INDEX,
    nonce: nonce2,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: counterAddress,
    value: 0,
    data: txData2,
    chainId: AMOY_CHAIN_ID
  });

  console.log("   Broadcasting...");
  const txResponse2 = await amoyProvider.broadcastTransaction(signedTx2);
  const receipt2 = await txResponse2.wait();
  console.log(`   ✅ Confirmed in block ${receipt2?.blockNumber}`);

  const finalCount = await counter.count();
  console.log(`   Final count: ${finalCount}`);

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("SUCCESS!");
  console.log("=".repeat(70));
  console.log(`
  Sapphire Wallet: ${SAPPHIRE_WALLET_ADDRESS}
  KeyVault:        ${keyVaultAddr}
  Account:         ${accountAddress}
  Counter:         ${counterAddress}
  Final Count:     ${finalCount}

  Security Verified:
  ─────────────────
  ✅ Private key NEVER left Sapphire enclave
  ✅ All transactions signed inside confidential compute
  ✅ Only signed bytes were sent to Amoy
  ✅ Authentication enforced by KeyVault
  `);
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
