/**
 * Bind {@code this} typing for methods mixed onto {@link Monstera} via {@code Object.assign}.
 *
 * @module sdk/domains/defineDomainMethods
 */

/**
 * @template T
 * @param {T & ThisType<import('../Monstera.js').default>} methods
 * @returns {T}
 */
export function defineDomainMethods(methods) {
  return methods;
}
