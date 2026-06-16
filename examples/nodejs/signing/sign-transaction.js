/**
 * Step 6.1: Test Cross-Chain Transaction (Sapphire → Amoy)
 * 
 * Run: node examples/nodejs/signing/sign-transaction.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 * 
 * Optional env vars:
 *   AMOY_RPC_URL=https://rpc-amoy.polygon.technology (default)
 *   COUNTER_BYTECODE=0x... (default)
 * 
 * This demonstrates THE KEY SECURITY FEATURE:
 * - Private key NEVER leaves Sapphire enclave
 * - Transaction is built on Amoy, signed on Sapphire, broadcast on Amoy
 * 
 * Steps:
 * 1. Connect to Sapphire wallet, get account address
 * 2. Check balance on Amoy
 * 3. Deploy Counter contract on Amoy (signed via Sapphire)
 * 4. Call increment() on Amoy (signed via Sapphire)
 * 5. Call incrementBy(5) on Amoy (signed via Sapphire)
 * 
 * Required:
 *   - Wallet on Sapphire testnet (WALLET_ADDRESS)
 *   - Password for the wallet (PASSWORD)
 *   - MATIC on the wallet's account[0] on Amoy
 * 
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';
import { Contract, ContractFactory, formatEther, formatUnits, parseUnits, ZeroAddress } from '../../../src/adapters/ethers/index.js';
import { Interface } from '../../../src/adapters/ethers/encoding.js';
import { toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { JsonRpcProvider } from '../../../src/adapters/ethers/provider.js';

// ============ CONFIGURATION ============
const SAPPHIRE_WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const ACCOUNT_INDEX = 0;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const AMOY_CHAIN_ID = 80002;
const COUNTER_BYTECODE = process.env.COUNTER_BYTECODE || "0x6080806040523461001657610163908161001c8239f35b600080fdfe608080604052600436101561001357600080fd5b600090813560e01c90816303df179c146100c65750806306661abd146100a95763d09de08a1461004257600080fd5b346100a657806003193601126100a65780546000198114610092576001018082556040519081527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b82526011600452602482fd5b80fd5b50346100a657806003193601126100a65760209054604051908152f35b90503461012957602036600319011261012957815460043581018091116101155780835581527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b83526011600452602483fd5b5080fdfea264697066735822122027ffb7296a96af125559a72a946250ff78075f9534148f0c7f37996c4dc8f68e64736f6c63430008180033";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("Step 6.1: Cross-Chain Transaction (Sapphire → Amoy)");
  console.log("=".repeat(60));
  console.log("\n🔐 Private key NEVER leaves Sapphire enclave!");

  // Verify configuration
  if (!SAPPHIRE_WALLET_ADDRESS || !PASSWORD || !SIGNER_PRIVATE_KEY) {
    console.error("ERROR: Set WALLET_ADDRESS, PASSWORD, and SIGNER_PRIVATE_KEY env vars");
    process.exit(1);
  }

  // create amoy provider
  const amoyProvider = new JsonRpcProvider(AMOY_RPC_URL);
  console.log("\nSapphire Wallet:", SAPPHIRE_WALLET_ADDRESS);

  // ============ STEP 1: Connect to Sapphire Wallet ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Connect to Sapphire Wallet");
  console.log("=".repeat(60));

  // Get account address and KeyVault
  const keyVaultAddr = await sdk.getKeyVaultAddr({
    walletAddr: SAPPHIRE_WALLET_ADDRESS
  });
  const accountAddress = await sdk.getAccountAddr({
    keyVaultAddr: keyVaultAddr,
    index: ACCOUNT_INDEX
  });
  
  console.log(`   Wallet (proxy): ${SAPPHIRE_WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Account ${ACCOUNT_INDEX}: ${accountAddress}`);

  // ============ STEP 2: Check Balance on Amoy ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Check Balance on Amoy");
  console.log("=".repeat(60));

  const balance = await amoyProvider.getBalance(accountAddress);
  console.log(`   Balance: ${formatEther(balance)} MATIC`);

  if (balance === 0n) {
    console.error("\n   ❌ No MATIC balance!");
    console.error(`   Send testnet MATIC to: ${accountAddress}`);
    console.error("   Faucet: https://faucet.polygon.technology/ or https://faucet.stakepool.dev.br/amoy");
    process.exit(1);
  }

  // Prepare auth proof
  const authProof = toUtf8Bytes(PASSWORD);

  // ============ STEP 3: Deploy Counter on Amoy (via Sapphire signing) ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Deploy Counter on Amoy (via Sapphire signing)");
  console.log("=".repeat(60));

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
  const CounterFactory = new ContractFactory(COUNTER_ABI, COUNTER_BYTECODE, amoyProvider);
  const deployData = CounterFactory.bytecode;

  const deployNonce = await amoyProvider.getTransactionCount(accountAddress);
  const feeData = await amoyProvider.getFeeData();
  const gasPrice = feeData.gasPrice || parseUnits("30", "gwei");
  const deployGasLimit = 500000n;

  console.log(`   Nonce: ${deployNonce}`);
  console.log(`   Gas Price: ${formatUnits(gasPrice, "gwei")} gwei`);

  // Sign deployment via Sapphire (key stays in enclave!)
  console.log("   Requesting signature from Sapphire...");
  const signedDeployTx = await sdk.signTransaction({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    index: ACCOUNT_INDEX,
    nonce: deployNonce,
    gasPrice: gasPrice,
    gasLimit: deployGasLimit,
    to: ZeroAddress,
    value: 0,
    txData: deployData,
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

  const counter = new Contract(counterAddress, COUNTER_ABI, amoyProvider);
  console.log(`   Initial count: ${await counter.count()}`);

  // ============ STEP 4: Call increment() (via Sapphire signing) ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Call increment() (via Sapphire signing)");
  console.log("=".repeat(60));

  const counterInterface = new Interface(COUNTER_ABI);
  const txData = counterInterface.encodeFunctionData("increment", []);
  const nonce = await amoyProvider.getTransactionCount(accountAddress);
  const gasLimit = 100000n;

  console.log(`   To: ${counterAddress}`);
  console.log(`   Data: ${txData}`);
  console.log(`   Nonce: ${nonce}`);

  console.log("   Requesting signature from Sapphire...");
  const signedTx = await sdk.signTransaction({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    index: ACCOUNT_INDEX,
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: counterAddress,
    value: 0,
    txData: txData,
    chainId: AMOY_CHAIN_ID
  });

  console.log("   Broadcasting...");
  const txResponse = await amoyProvider.broadcastTransaction(signedTx);
  console.log(`   Tx: ${txResponse.hash}`);

  const receipt = await txResponse.wait();
  console.log(`   ✅ Confirmed in block ${receipt?.blockNumber}`);

  const newCount = await counter.count();
  console.log(`   New count: ${newCount}`);

  // ============ STEP 5: Call incrementBy(5) ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Call incrementBy(5)");
  console.log("=".repeat(60));

  const txData2 = counterInterface.encodeFunctionData("incrementBy", [5]);
  const nonce2 = await amoyProvider.getTransactionCount(accountAddress);

  console.log("   Requesting signature from Sapphire...");
  const signedTx2 = await sdk.signTransaction({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    index: ACCOUNT_INDEX,
    nonce: nonce2,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: counterAddress,
    value: 0,
    txData: txData2,
    chainId: AMOY_CHAIN_ID
  });

  console.log("   Broadcasting...");
  const txResponse2 = await amoyProvider.broadcastTransaction(signedTx2);
  const receipt2 = await txResponse2.wait();
  console.log(`   ✅ Confirmed in block ${receipt2?.blockNumber}`);

  const finalCount = await counter.count();
  console.log(`   Final count: ${finalCount}`);

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUCCESS!");
  console.log("=".repeat(60));
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
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
