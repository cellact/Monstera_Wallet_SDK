#!/usr/bin/env node

/**
 * Postinstall script - displays Monstera banner after npm install
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Try to find the banner in the installed package
let bannerPath;
try {
  // When installed, the package will be in node_modules
  bannerPath = require.resolve('@monstera_protocol/sdk/src/utils/banner.js');
} catch (e) {
  // Fallback for local development
  bannerPath = join(__dirname, '../src/utils/banner.js');
}

(async () => {
  if (existsSync(bannerPath)) {
    try {
      const bannerUrl = bannerPath.startsWith('/') ? `file://${bannerPath}` : bannerPath;
      const { printBanner } = await import(bannerUrl);
      printBanner();
    } catch (err) {
      // Silently fail if banner can't be loaded
    }
  }
})();

