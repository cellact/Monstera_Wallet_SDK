import { SENSITIVE_PARAM_NAMES } from './SensitiveParams.js';
import { Sanitizer } from './Sanitizer.js';

export { SENSITIVE_PARAM_NAMES } from './SensitiveParams.js';
export { Sanitizer } from './Sanitizer.js';

export const sanitizer = new Sanitizer(SENSITIVE_PARAM_NAMES);
