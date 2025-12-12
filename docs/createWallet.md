# createWallet() Method

## Overview

The `createWallet()` method creates a new wallet on Oasis Sapphire by calling the `WalletFactory.createWallet()` contract method. It handles both off-chain cryptographic operations and on-chain transaction execution.

## Method Signature

```javascript
await sdk.wallets.createWallet({
  password: string,
  mnemonic?: string,
  returnMnemonic?: boolean
})
```

## Parameters

### `password` (required)
- **Type**: `string`
- **Description**: User's password for wallet authentication
- **Security**: Password is hashed using keccak256 before being sent to the contract

### `mnemonic` (optional)
- **Type**: `string`
- **Description**: BIP39 mnemonic phrase. If not provided, a new mnemonic is automatically generated
- **Default**: Auto-generated (12-word mnemonic)

### `returnMnemonic` (optional)
- **Type**: `boolean`
- **Description**: Whether to include the mnemonic in the return value
- **Default**: `false`
- **Security Note**: Only set to `true` if you need the mnemonic. Store it securely!

## Return Value

```typescript
{
  success: boolean,
  wallet: string,           // Wallet address (0x...)
  authenticator: string,     // Authenticator contract address
  transactionHash: string,   // Transaction hash
  blockNumber: number,       // Block number where transaction was mined
  gasUsed: string,          // Gas used (as string)
  mnemonic?: string         // Only included if returnMnemonic: true
}
```

## Process Flow

### Off-Chain Operations

1. **Mnemonic Generation** (if not provided)
   - Generates a BIP39-compliant 12-word mnemonic using 128 bits of entropy

2. **Seed Derivation**
   - Derives a 64-byte seed from the mnemonic using PBKDF2
   - Algorithm: PBKDF2-SHA512 with 2048 iterations
   - Salt format: `"mnemonic" + password`

3. **Password Hashing**
   - Hashes the password using keccak256
   - Result is used as `authConfig` in the contract call

### On-Chain Operations

1. **Contract Call**
   - Calls `factory.createWallet(seed, passwordAuthAddress, passwordHash)`
   - Uses Sapphire-wrapped signer for encrypted transaction

2. **Event Parsing**
   - Waits for transaction confirmation
   - Parses `WalletCreated` event from transaction receipt
   - Extracts wallet address and authenticator address

## Example Usage

### Basic Usage

```javascript
const { SapphireWalletSDK } = require('@arnacon/wallet-sdk');

const sdk = SapphireWalletSDK.fromConfig({
  network: 'testnet',
  addresses: {
    factory: '0x...',
    passwordAuth: '0x...'
  },
  signerOrProvider: '0x...' // Private key
});

const result = await sdk.wallets.createWallet({
  password: 'my-secure-password'
});

console.log('Wallet Address:', result.wallet);
console.log('Transaction:', result.transactionHash);
```

### With Custom Mnemonic

```javascript
const result = await sdk.wallets.createWallet({
  password: 'my-secure-password',
  mnemonic: 'word1 word2 word3 ... word12'
});
```

### With Mnemonic Returned (Not Recommended for Production)

```javascript
const result = await sdk.wallets.createWallet({
  password: 'my-secure-password',
  returnMnemonic: true
});

// Store mnemonic securely!
console.log('Mnemonic:', result.mnemonic);
```

## Security Considerations

1. **Password Storage**: Never store passwords in plain text. The SDK hashes passwords before sending to the contract.

2. **Mnemonic Security**: 
   - By default, mnemonics are NOT returned in the result
   - Only set `returnMnemonic: true` if absolutely necessary
   - Store mnemonics in secure, encrypted storage
   - Never log or expose mnemonics

3. **Private Key Security**: 
   - The signer private key is used for transaction signing
   - Keep it secure and never expose it in logs or client-side code

4. **Network Security**:
   - Testnet is for development/testing only
   - Use mainnet for production deployments
   - Verify contract addresses before use

## Error Handling

The method throws errors in the following cases:

- **Missing password**: `Error: Password is required`
- **Missing factory address**: `Error: Factory address is required...`
- **Missing authenticator address**: `Error: Password authenticator address is required...`
- **Transaction failure**: `Error: Failed to create wallet: <reason>`
- **Event not found**: `Error: WalletCreated event not found in transaction receipt`

## Related Methods

- `getWalletAddress()` - Get wallet address by username (if using username-based system)
- `getUserInfo()` - Get user information from contract

## Contract Method

This SDK method calls the following Solidity method:

```solidity
function createWallet(
    bytes memory seed,
    address authenticator,
    bytes memory authConfig
) external returns (address wallet, address authenticator);
```

## Event

The method listens for the following event:

```solidity
event WalletCreated(
    address indexed wallet,
    address indexed authenticator,
    bytes seed
);
```

