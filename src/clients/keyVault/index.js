/**
 * KeyVault client barrel.
 *
 * Re-exports {@link KeyVaultClient} (default) for direct use by {@link Monstera} and any advanced
 * consumer that needs raw access to the KeyVault contract surface (signing, account queries,
 * authenticator/implementation upgrades, imported-key management).
 *
 * @module clients/keyVault
 */

import KeyVaultClient from './KeyVaultClient.js';

export default KeyVaultClient;
