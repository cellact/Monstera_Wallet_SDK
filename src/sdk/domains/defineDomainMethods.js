/**
 * Bind {@code this} typing for methods mixed onto {@link Monstera} via {@code Object.assign}.
 *
 * {@code this} is typed as {@link MonsteraInstance} (see {@code Monstera.domain-methods.d.ts})
 * so Cmd+click navigates to recipe and domain methods across files.
 *
 * @module sdk/domains/defineDomainMethods
 */

/// <reference path="../Monstera.domain-methods.d.ts" />

/**
 * @template T
 * @param {T & ThisType<import('../Monstera.domain-methods').MonsteraInstance>} methods
 * @returns {T}
 */
export function defineDomainMethods(methods) {
  return methods;
}
