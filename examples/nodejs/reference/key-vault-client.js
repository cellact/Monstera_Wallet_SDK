/**
 * Reference: KeyVault client methods
 * Folder: reference
 * Prerequisites: existing wallet (WALLET_ADDRESS, PASSWORD)
 * 
 * Run: node examples/nodejs/reference/key-vault-client.js
 * 
 * Required env vars:
 *   SIGNER_PRIVATE_KEY=0x... (your private key)
 *   WALLET_ADDRESS=0x... (your wallet address)
 *   PASSWORD=mysecretpassword123
 * 
 * Optional env vars:
 *   AMOY_RPC_URL=https://rpc-amoy.polygon.technology (default)
 *   COUNTER_BYTECODE=0x... (default)
 *   DELEGATE_CONTRACT=0x... (default: zero address; used in steps 10–11)
 *
 * Steps:
 * 1. Get storage contract address holding the keys
 * 2. Get authenticator contract address
 * 3. Get KeyVaultImplementation contract address
 * 4. Check if keyVault is initialized
 * 5. Get account address (index 0)
 * 6. Get multiple account addresses (indexes 0-4)
 * 7. Sign a transaction
 * 8. Sign a 32-byte hash
 * 9. Sign an EIP-191 message
 * 10. Sign an EIP-7702 authorization via signAuthorization (recommended)
 * 11. Same authorization via executeWithAuth + manual implCall (advanced)
 *
 */
import 'dotenv/config';
import { Monstera } from '../../../src/index.js';
import { Contract, ContractFactory, formatUnits, parseUnits, ZeroAddress } from '../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { JsonRpcProvider } from '../../../src/adapters/ethers/provider.js';
import {
  encodeSignAuthorizationImplCalldata,
  decodeSignAuthorizationResult
} from '../../../src/internal/vault/eip7702.js';
import {
  fetchAuthorizationChainId,
  fetchAuthorizationNonce
} from '../../../src/internal/crypto/eip7702.js';

// ============ CONFIGURATION ============
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PASSWORD = process.env.PASSWORD;
const ACCOUNT_INDEX = 0;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const AMOY_CHAIN_ID = 80002;
const DELEGATE_CONTRACT = process.env.DELEGATE_CONTRACT || ZeroAddress;
const COUNTER_BYTECODE = process.env.COUNTER_BYTECODE || "0x6080806040523461001657610163908161001c8239f35b600080fdfe608080604052600436101561001357600080fd5b600090813560e01c90816303df179c146100c65750806306661abd146100a95763d09de08a1461004257600080fd5b346100a657806003193601126100a65780546000198114610092576001018082556040519081527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b82526011600452602482fd5b80fd5b50346100a657806003193601126100a65760209054604051908152f35b90503461012957602036600319011261012957815460043581018091116101155780835581527f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa542060203392a280f35b634e487b7160e01b83526011600452602483fd5b5080fdfea264697066735822122027ffb7296a96af125559a72a946250ff78075f9534148f0c7f37996c4dc8f68e64736f6c63430008180033";

const sdk = Monstera.connect({
  mainnet: false,
  signer: SIGNER_PRIVATE_KEY,
  logLevel: 'debug'
});

async function main() {
  console.log("=".repeat(60));
  console.log("KeyVault methods");
  console.log("=".repeat(60));

  if (!SIGNER_PRIVATE_KEY || !WALLET_ADDRESS || !PASSWORD) {
    console.error("ERROR: Set SIGNER_PRIVATE_KEY, WALLET_ADDRESS, and PASSWORD env vars");
    process.exit(1);
  }

  // Prepare auth proof (raw password bytes)
  const authProof = toUtf8Bytes(PASSWORD);

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
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Get storage contract holding the keys");
  console.log("=".repeat(60));

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
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Get authenticator contract address");
  console.log("=".repeat(60));

  const authenticatorAddr = await sdk.getAuthenticatorAddr({
    keyVaultAddr: keyVaultAddr
  });
  console.log(`   Authenticator: ${authenticatorAddr}`);
  if (!authenticatorAddr) {
    console.error("❌ ERROR: Failed to get authenticator address");
    process.exit(1);
  }

  // ============ STEP 3: Get KeyVaultImplementation contract address ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Get KeyVaultImplementation contract address");
  console.log("=".repeat(60));

  const keyVaultImplAddr = await sdk.getKeyVaultImplAddr({
    keyVaultAddr: keyVaultAddr
  });
  console.log(`   Implementation: ${keyVaultImplAddr}`);
  if (!keyVaultImplAddr) {
    console.error("❌ ERROR: Failed to get implementation address");
    process.exit(1);
  }

  // ============ STEP 4: Check if a keyVault is initialized ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Check if a keyVault is initialized");
  console.log("=".repeat(60));

  const isInitialized = await sdk.isInitialized({
    keyVaultAddr: keyVaultAddr
  });
  console.log(`   isInitialized: ${isInitialized ? "✅ Yes" : "❌ No"}`);
  if (!isInitialized) {
    console.error("❌ ERROR: KeyVault is not initialized");
    process.exit(1);
  }

  // ============ STEP 5: Get the account address from the keyVault contract ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Get the account address (index 0) from the keyVault contract");
  console.log("=".repeat(60));

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
  console.log("\n" + "=".repeat(60));
  console.log("STEP 6: Get multiple account addresses (indexes 0-4) from the keyVault contract");
  console.log("=".repeat(60));

  const accountAddresses = await sdk.getAccountAddresses({
    keyVaultAddr: keyVaultAddr,
    fromIndex: 0,
    count: 5
  });
  if (!accountAddresses || accountAddresses.length === 0) {
    console.error("❌ ERROR: Failed to get account addresses");
    process.exit(1);
  }
  for (let i = 0; i < accountAddresses.length; i++) {
    console.log(`   Account Address (index ${i}): ${accountAddresses[i]}`);
  }

  // ============ STEP 7: Sign a transaction with the keyVault contract ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 7: Sign a transaction");
  console.log("=".repeat(60));

  console.log(`   Deploying Counter contract...`);

  const amoyProvider = new JsonRpcProvider(AMOY_RPC_URL);

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

  console.log("   Requesting signature from Sapphire...");
  const signedTransaction = await sdk.signTransaction({
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

  const counter = new Contract(counterAddress, COUNTER_ABI, amoyProvider);
  console.log(`   Initial count: ${await counter.count()}`);

  // ============ STEP 8: Sign a 32-byte hash with the keyVault contract ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 8: Sign a 32-byte hash");
  console.log("=".repeat(60));

  const hash = keccak256(toUtf8Bytes("Hello from TheWallet!"));

  const signedHash = await sdk.sign({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    index: 0,
    hash: hash
  });
  console.log(`   Signature (signed hash): ${signedHash}`);
  if (!signedHash) {
    console.error("❌ ERROR: Failed to sign hash");
    process.exit(1);
  }

  // ============ STEP 9: Sign an EIP-191 message with the keyVault contract ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 9: Sign an EIP-191 message with the keyVault contract");
  console.log("=".repeat(60));

  const message = "Hello from TheWallet!";

  const signature = await sdk.signMessage({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    index: 0,
    message: toUtf8Bytes(message)
  });
  console.log(`   Signature (signed message): ${signature}`);
  if (!signature) {
    console.error("❌ ERROR: Failed to sign message");
    process.exit(1);
  }

  // ============ STEP 10: Sign authorization (EIP-7702) — high-level API ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 10: Sign authorization via signAuthorization (recommended)");
  console.log("=".repeat(60));
  console.log("   Monstera.signAuthorization builds the implCall, action-bound auth proof,");
  console.log("   and executeWithAuth call for you.\n");

  console.log(`   Delegate: ${DELEGATE_CONTRACT}`);

  const signedAuthorization = await sdk.signAuthorization({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    delegateAddr: DELEGATE_CONTRACT,
    index: ACCOUNT_INDEX
  });

  console.log(`\n✅ Authorization Signed!`);
  console.log(`   Delegate: ${signedAuthorization.address}`);
  console.log(`   Nonce: ${signedAuthorization.nonce}`);
  console.log(`   Chain ID: ${signedAuthorization.chainId}`);
  console.log(`   r: ${signedAuthorization.signature.r}`);
  console.log(`   s: ${signedAuthorization.signature.s}`);
  console.log(`   yParity: ${signedAuthorization.signature.yParity}`);

  // ============ STEP 11: Same flow via executeWithAuth — low-level API ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 11: Sign authorization via executeWithAuth (advanced)");
  console.log("=".repeat(60));
  console.log("   For custom KeyVault implementation calls, you build implCall yourself.");
  console.log("   For signAuthorizationImpl, use encodeSignAuthorizationImplCalldata (same helper the SDK uses).\n");

  const chainId = await fetchAuthorizationChainId(sdk.readProvider);
  const authNonce = await fetchAuthorizationNonce(sdk.readProvider, accountAddress);

  const implCall = encodeSignAuthorizationImplCalldata({
    index: ACCOUNT_INDEX,
    delegateAddr: DELEGATE_CONTRACT,
    nonce: authNonce,
    chainId
  });

  console.log(`   Delegate: ${DELEGATE_CONTRACT}`);
  console.log(`   Authority (account ${ACCOUNT_INDEX}): ${accountAddress}`);
  console.log(`   Auth nonce: ${authNonce}`);
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   implCall length: ${implCall.length} chars`);

  const rawResult = await sdk.executeWithAuth({
    keyVaultAddr: keyVaultAddr,
    authProof: { password: authProof },
    implCall
  });

  const lowLevelSig = decodeSignAuthorizationResult(rawResult);

  console.log(`\n✅ Authorization Signed (low-level)!`);
  console.log(`   r: ${lowLevelSig.r}`);
  console.log(`   s: ${lowLevelSig.s}`);
  console.log(`   yParity: ${lowLevelSig.yParity}`);

  const signaturesMatch =
    lowLevelSig.r === signedAuthorization.signature.r &&
    lowLevelSig.s === signedAuthorization.signature.s &&
    lowLevelSig.yParity === signedAuthorization.signature.yParity;
  console.log(`   Matches step 10: ${signaturesMatch ? "✅ Yes" : "❌ No"}`);

  // ============ SUMMARY ============
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Wallet: ${WALLET_ADDRESS}`);
  console.log(`   KeyVault: ${keyVaultAddr}`);
  console.log(`   Storage: ${storageAddr}`);
  console.log(`   Authenticator: ${authenticatorAddr}`);
  console.log(`   KeyVaultImplementation: ${keyVaultImplAddr}`);
  console.log(`   Account Address (index 0): ${accountAddress}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
