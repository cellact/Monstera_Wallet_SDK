/**
 * Wallet logic client barrel.
 *
 * Re-exports {@link WalletLogicClient} (default) for direct access to the WalletLogic contract
 * (wallet-proxy address surface). Most application code should prefer the KeyVault-shaped API on
 * {@link Monstera}; this client is reserved for proxy-level operations like initialisation.
 *
 * @module clients/logic
 */

import WalletLogicClient from './WalletLogicClient.js';

export default WalletLogicClient;
