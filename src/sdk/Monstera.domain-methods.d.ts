import Monstera from './Monstera.js';
import { monsteraRecipeMethods } from './domains/MonsteraRecipes.js';
import { monsteraSessionMethods } from './domains/MonsteraSession.js';
import { monsteraAuthMethods } from './domains/MonsteraAuth.js';
import { monsteraFactoryMethods } from './domains/MonsteraFactory.js';
import { monsteraKeyVaultMethods } from './domains/MonsteraKeyVault.js';
import { monsteraSigningMethods } from './domains/MonsteraSigning.js';

type MonsteraDomainMethods =
  typeof monsteraRecipeMethods &
  typeof monsteraSessionMethods &
  typeof monsteraAuthMethods &
  typeof monsteraFactoryMethods &
  typeof monsteraKeyVaultMethods &
  typeof monsteraSigningMethods;

declare module './Monstera.js' {
  export default interface Monstera extends MonsteraDomainMethods {}
}

/** Instance type used for {@code this} in domain modules (class fields + mixed prototype methods). */
export type MonsteraInstance = InstanceType<typeof Monstera>;
