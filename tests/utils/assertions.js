/**
 * Asserts that a value is a valid Ethereum address
 * @param {string} address - Address to validate
 */
export function expectValidAddress(address) {
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  }
  
  /**
   * Asserts that a value is a valid transaction hash
   * @param {string} txHash - Transaction hash to validate
   */
  export function expectValidTxHash(txHash) {
    expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  }
  
  /**
   * Asserts that a value is a valid hex string
   * @param {string} hex - Hex string to validate
   */
  export function expectValidHex(hex) {
    expect(hex).toMatch(/^0x[a-fA-F0-9]+$/);
  }
  
  /**
   * Asserts that a transaction result has required fields
   * @param {Object} result - Transaction result
   */
  export function expectTransactionResult(result) {
    expect(result).toBeDefined();
    expect(result.transactionHash).toBeDefined();
    expectValidTxHash(result.transactionHash);
  }
  
  /**
   * Asserts that a wallet creation result has required fields
   * @param {Object} result - Wallet creation result
   */
  export function expectWalletResult(result) {
    expect(result).toBeDefined();
    expect(result.wallet).toBeDefined();
    expect(result.keyVault).toBeDefined();
    expect(result.storage).toBeDefined();
    expect(result.authenticator).toBeDefined();
    expect(result.mnemonic).toBeDefined();
    expect(result.transactionHash).toBeDefined();
    
    expectValidAddress(result.wallet);
    expectValidAddress(result.keyVault);
    expectValidAddress(result.storage);
    expectValidAddress(result.authenticator);
    expectValidTxHash(result.transactionHash);
    
    // Validate mnemonic
    expectValidMnemonic(result.mnemonic);
  }

  /**
   * Asserts that a mnemonic is valid (12 or 24 words)
   * @param {string} mnemonic - Mnemonic phrase to validate
   * @param {number} expectedWordCount - Expected word count (default: 12)
   */
  export function expectValidMnemonic(mnemonic, expectedWordCount = 12) {
    expect(mnemonic).toBeDefined();
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.trim().length).toBeGreaterThan(0);
    
    const words = mnemonic.split(' ').filter(word => word.length > 0);
    expect(words.length).toBe(expectedWordCount);
  }