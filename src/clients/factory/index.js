/**
 * Factory client barrel.
 *
 * Re-exports {@link WalletFactoryClient} (default) for direct use by {@link Monstera} and any
 * advanced consumer that needs raw access to the factory contract surface (wallet creation,
 * factory administration).
 *
 * @module clients/factory
 */

import WalletFactoryClient from './WalletFactoryClient.js';

export default WalletFactoryClient;
