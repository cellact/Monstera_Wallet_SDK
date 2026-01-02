import { nodeResolve } from '@rollup/plugin-node-resolve';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const polyfillNode = require('rollup-plugin-polyfill-node');

// File paths - centralized for maintainability
const PATHS = {
  errorsIndex: './src/errors/index.js',
  mainEntry: 'src/index.js',
  browserEntry: 'build/browser-global.js',
  esmOutput: 'dist/monstera.mjs',
  iifeOutput: 'dist/monstera.global.js',
  packageJson: './package.json'
};

// Read version from package.json for build-time injection
const pkg = JSON.parse(readFileSync(PATHS.packageJson, 'utf-8'));
const version = pkg.version;

// Extract error class names from src/errors/index.js at build time
function extractErrorClassNames() {
  const errorsIndexContent = readFileSync(PATHS.errorsIndex, 'utf-8');
  
  // Parse the export statement to extract class names
  // Pattern: export { Class1, Class2, ... } from './WalletError.js';
  const exportMatch = errorsIndexContent.match(/export\s*\{([^}]+)\}\s*from/);
  if (!exportMatch) {
    throw new Error(
      `Could not parse error exports from ${PATHS.errorsIndex}. ` +
      `Expected format: export { Class1, Class2, ... } from './WalletError.js';`
    );
  }
  
  // Extract class names (handle whitespace and newlines)
  const classNames = exportMatch[1]
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  
  return classNames;
}

const errorClassNames = extractErrorClassNames();

// Plugin to inject version and remove Node.js-specific code for browser builds
const createBrowserPlugin = () => ({
  name: 'browser-build',
  transform(code, id) {
    if (id.includes('Monstera.js')) {
      let transformed = code;
      
      // Replace version getter body with simple return
      transformed = transformed.replace(
        /\/\/ In browser builds, version is injected at build time[\s\S]*?return 'unknown';/,
        `// Version injected at build time
    return "${version}";`
      );
      
      return {
        code: transformed,
        map: null // Let rollup generate sourcemap
      };
    }
  }
});

// Shared plugin configuration for both builds
const createPlugins = () => [
  polyfillNode({
    include: ['crypto'],
    sourceMap: true
  }),
  nodeResolve({
    preferBuiltins: false,
    browser: true
  }),
  createBrowserPlugin()
];

// Queue stub for async loading support
const queueStub = `
// Queue stub for async loading
(function(window) {
  var Monstera = window.Monstera || function() {
    (Monstera.q = Monstera.q || []).push(arguments);
  };
  Monstera.q = Monstera.q || [];
  window.Monstera = Monstera;
})(typeof window !== 'undefined' ? window : global);
`;

export default [
  // ESM build for modern browsers (<script type="module">)
  {
    input: PATHS.mainEntry,
    output: {
      file: PATHS.esmOutput,
      format: 'es',
      sourcemap: true,
      banner: '/* Monstera SDK - ESM Build */'
    },
    plugins: createPlugins(),
    external: ['ethers', 'module', 'url', 'path']
  },
  
  // IIFE global build for script-tag usage
  {
    input: PATHS.browserEntry,
    output: {
      file: PATHS.iifeOutput,
      format: 'iife',
      name: 'MonsteraSDK',
      sourcemap: true,
      exports: 'named',
      globals: {
        'ethers': 'ethers'
      },
      banner: queueStub,
      footer: (() => {
        // Generate error class exposure code dynamically
        const errorExposureCode = errorClassNames
          .map(name => `if (MonsteraSDK.${name}) window.Monstera.${name} = MonsteraSDK.${name};`)
          .join('\n  ');
        
        return `
// Process queued calls after SDK loads
if (typeof window !== 'undefined' && window.Monstera && window.Monstera.q) {
  var queue = window.Monstera.q;
  window.Monstera.q = [];
  queue.forEach(function(args) {
    if (window.Monstera && typeof window.Monstera === 'function') {
      window.Monstera.apply(null, args);
    }
  });
}
// Expose Monstera globally
if (typeof window !== 'undefined') {
  // MonsteraSDK is the IIFE return value (exports object)
  window.Monstera = MonsteraSDK.Monstera || (MonsteraSDK.default && MonsteraSDK.default.Monstera) || MonsteraSDK;
  
  // Expose error classes on Monstera (automatically extracted from src/errors/index.js)
  ${errorExposureCode}
}
/* Monstera SDK - IIFE Global Build */
      `;
      })()
    },
    plugins: createPlugins(),
    external: ['ethers', 'module', 'url', 'path']
  }
];

