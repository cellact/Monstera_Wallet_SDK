import { ValidationError, WriteRequiresSignerError } from '../../src/errors/index.js';
import { createTestSDK } from './setup.js';
import { INVALID_ADDRESS } from './fixtures.js';
import { closeSdkConnections } from './teardown.js';

/**
 * Tests that a method throws ValidationError when a required parameter is missing
 * @param {Function} method - Method to test
 * @param {Object} validParams - Valid parameters object
 * @param {string} missingParam - Name of parameter to omit
 */
export async function testMissingParam(method, validParams, missingParam) {
  const paramsWithout = { ...validParams };
  delete paramsWithout[missingParam];
  
  await expect(method(paramsWithout)).rejects.toThrow(ValidationError);
}

/**
 * Tests that a method throws ValidationError with invalid address
 * @param {Function} method - Method to test
 * @param {Object} validParams - Valid parameters object
 * @param {string} addressParam - Name of address parameter to invalidate
 */
export async function testInvalidAddress(method, validParams, addressParam) {
  const paramsWithInvalid = {
    ...validParams,
    [addressParam]: INVALID_ADDRESS
  };
  
  await expect(method(paramsWithInvalid)).rejects.toThrow(ValidationError);
}

/**
 * Tests that a method throws WriteRequiresSignerError with readonly SDK
 * @param {Function} method - Method to test
 * @param {Object} params - Parameters to pass
 */
export async function testReadonlySDK(method, params) {
  const readonlySdk = createTestSDK({ readonly: true });
  try {
    await expect(method.call(readonlySdk, params)).rejects.toThrow(WriteRequiresSignerError);
  } finally {
    await closeSdkConnections(readonlySdk);
  }
}

/**
 * Tests multiple missing parameters
 * @param {Function} method - Method to test
 * @param {Object} validParams - Valid parameters object
 * @param {string[]} paramNames - Array of parameter names to test
 */
export async function testMissingParams(method, validParams, paramNames) {
  for (const paramName of paramNames) {
    await testMissingParam(method, validParams, paramName);
  }
}