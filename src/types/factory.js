/**
 * Factory wallet creation and factory admin option types.
 *
 * @module types/factory
 */

// ============================================================================
// Wallet Creation & Factory Client Options
// ============================================================================

/**
 * @typedef {Object} CreateWalletBaseOptions
 * @property {AuthConfigInputOptions} authConfig - Structured auth config options
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
 */

/**
 * @typedef {CreateWalletBaseOptions & { mnemonic: Mnemonic }} CreateWalletFromMnemonicOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { hookAddr: Address; hookData: Bytes }} CreateWalletWithHookOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { customLogicImplAddr: Address; logicData: Bytes }} CreateWalletWithCustomLogicOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { username: string }} CreateWalletForUsernameOptions
 */

/**
 * @typedef {CreateWalletForUsernameOptions & { mnemonic: Mnemonic }} CreateWalletForUsernameFromMnemonicOptions
 */

/**
 * @typedef {CreateWalletBaseOptions & { usernameHash: Bytes32 }} CreateWalletForUsernameHashOptions
 */

/**
 * @typedef {CreateWalletForUsernameHashOptions & { mnemonic: Mnemonic }} CreateWalletForUsernameHashFromMnemonicOptions
 */

/**
 * Base options for WalletFactoryClient: {@code authConfig} is already encoded for the factory (never a structured object).
 * @typedef {Object} FactoryClientCreateWalletBaseOptions
 * @property {EncodedAuthConfigOptions} authConfig - Hex-encoded authenticator configuration
 * @property {Address} [authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { mnemonic: Mnemonic }} FactoryClientCreateWalletFromMnemonicOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { hookAddr: Address; hookData: Bytes }} FactoryClientCreateWalletWithHookOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { customLogicImplAddr: Address; logicData: Bytes }} FactoryClientCreateWalletWithCustomLogicOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { username: string }} FactoryClientCreateWalletForUsernameOptions
 */

/**
 * @typedef {FactoryClientCreateWalletForUsernameOptions & { mnemonic: Mnemonic }} FactoryClientCreateWalletForUsernameFromMnemonicOptions
 */

/**
 * @typedef {FactoryClientCreateWalletBaseOptions & { usernameHash: Bytes32 }} FactoryClientCreateWalletForUsernameHashOptions
 */

/**
 * @typedef {FactoryClientCreateWalletForUsernameHashOptions & { mnemonic: Mnemonic }} FactoryClientCreateWalletForUsernameHashFromMnemonicOptions
 */

/**
 * @typedef {{ username: string }} FactoryHashUsernameOptions
 */

/**
 * @typedef {{ usernameHash: Bytes32 }} FactoryWalletOfUsernameOptions
 */

/**
 * @typedef {{ walletAddr: Address }} FactoryWalletUsernameHashOptions
 */

// --- Proxies & address bundles ---

/**
 * @typedef {{ walletAddr: Address }} WalletProxyOptions
 */

/**
 * Wallet proxy plus HD index (WalletLogic account reads).
 * @typedef {WalletProxyOptions & { index: number }} WalletProxyIndexOptions
 */

/**
 * Wallet proxy plus contiguous address slice (WalletLogic account reads).
 * @typedef {WalletProxyOptions & { fromIndex: number; count: number }} WalletProxyAccountSliceOptions
 */

/**
 * Authenticated KeyVault implementation upgrade via WalletLogic proxy.
 * {@code authProof} is opaque bytes for the wallet's authenticator (contract validates). Typical layouts:
 * {@link EncodedAuthProofDualFactor}, {@link EncodedAuthProofWalletSignature}, {@link EncodedAuthProofPasswordMinute}, or {@link EncodedAuthProofPassword} — match your vault's authenticator.
 * @typedef {WalletProxyOptions & { authProof: Bytes; newImplAddr: Address }} WalletLogicUpdateKeyVaultImplOptions
 */

// --- Configure authenticators & account slices ---

/**
 * @typedef {{ keyVaultAddr?: Address }} KeyVaultAddrOptions
 * @property {Address} [keyVaultAddr] - KeyVault contract address; optional when {@link Monstera.connect} was given {@code credentials}
 */

/**
 * @typedef {KeyVaultAddrOptions & { selector: string; paramsHash: Bytes32 }} ComputeActionHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { selector: Bytes4; paramsHash: Bytes32 }} ComputeMultiAuthenticatorActionHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { newImplementation: Address }} ComputeCustomImplementationAckHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { newAuthenticator: Address; configHash: Bytes32 }} ComputeCustomAuthenticatorAckHashOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { implementation: Address }} IsImplementationApprovedOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authenticator: Address }} IsAuthenticatorApprovedOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & WalletProxyOptions } InitializeWalletLogicOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32 }} ConfigurePasswordOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { initialWhitelist: Address[] }} ConfigureWalletSignatureOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash?: Bytes32; initialWhitelist: Address[] }} ConfigurePasswordOrWalletSignatureOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { passwordHash: Bytes32; guardianAddr: Address }} ConfigureDualFactorOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { apiKeySecret?: Bytes32 }} ConfigureApiKeySessionOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { authConfig: MultiAuthConfigInputOptions }} ConfigureMultiAuthenticatorOptions
 */

/**
 * @typedef {CreateAuthProofMultiOptions & {
 *   child: Address;
 *   childAuthConfig: AuthConfigInputOptions;
 * }} AddMultiAuthenticatorOptions
 */

/**
 * @typedef {CreateAuthProofMultiOptions & { child: Address }} RemoveMultiAuthenticatorOptions
 */

/**
 * @typedef {CreateAuthProofApiKeySessionActionOptions & { newApiKeySecret: Bytes32 }} RotateApiKeyOptions
 */

/**
 * @typedef {ConfigurePasswordOptions} ConfigurePasswordMinuteOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & { index?: number }} KeyVaultAddrIndexOptions
 * @property {number} [index] - HD account index (defaults to {@code 0} on end-user connect paths)
 */

/**
 * @typedef {KeyVaultAddrOptions & { fromIndex: number; count: number }} KeyVaultAccountSliceOptions
 */

/**
 * @typedef {KeyVaultAddrOptions & ImportedKeyBase} KeyVaultImportedKeyOptions
 */

// --- KeyVault & wallet admin (authenticated) ---

/**
 * @typedef {KeyVaultAuthBaseOptions & { implCall: Bytes }} ExecuteWithAuthOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & { newImplAddr: Address }} UpdateKeyVaultImplOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & { newImplAddr: Address; customAckHash: Bytes32 }} UpdateKeyVaultImplCustomOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & { newAuthenticatorAddr: Address; newAuthConfig: Bytes; customAckHash: Bytes32 }} UpdateAuthenticatorCustomOptions
 */

/**
 * @typedef {KeyVaultAuthBaseOptions & ImportedKeyBase} DeactivateActivateKeyOptions
 */

/**
 * @typedef {{ newLogicAddr: Address }} UpdateWalletLogicImplOptions
 */

/**
 * @typedef {{ newAdminAddr: Address }} TransferAdminOptions
 */

/**
 * @typedef {{ authenticatorAddr: Address }} FactoryAllowedAuthenticatorsOptions
 */

/**
 * @typedef {{ implementationAddr: Address }} FactoryAllowedKeyVaultImplementationsOptions
 */

/**
 * Factory policy-registry view: whether {@code implementationAddr} is approved for {@code keyVaultAddr}.
 * @typedef {KeyVaultAddrOptions & { implementationAddr: Address }} FactoryIsImplementationApprovedOptions
 */

/**
 * Factory policy-registry view: whether {@code authenticatorAddr} is approved for {@code keyVaultAddr}.
 * @typedef {KeyVaultAddrOptions & { authenticatorAddr: Address }} FactoryIsAuthenticatorApprovedOptions
 */

/**
 * @typedef {{ authenticatorAddr: Address; allowed: boolean }} SetAuthenticatorAllowedOptions
 */

/**
 * @typedef {{ implementationAddr: Address; allowed: boolean }} SetKeyVaultImplementationAllowedOptions
 */

/**
 * @typedef {{ walletOrKeyVaultAddr: Address; authenticatorAddr: Address; allowed: boolean }} SetWalletAuthenticatorAllowedOptions
 */

/**
 * @typedef {{ walletOrKeyVaultAddr: Address; implementationAddr: Address; allowed: boolean }} SetWalletImplementationAllowedOptions
 */

