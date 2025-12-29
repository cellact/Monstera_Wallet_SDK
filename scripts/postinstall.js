#!/usr/bin/env node

/**
 * Postinstall script - displays Monstera banner after npm install
 */

const path = require('path');
const fs = require('fs');

// Try to find the banner in the installed package
let bannerPath;
try {
  // When installed, the package will be in node_modules
  bannerPath = require.resolve('@monstera_protocol/sdk/src/utils/banner.js');
} catch (e) {
  // Fallback for local development
  bannerPath = path.join(__dirname, '../src/utils/banner.js');
}

if (fs.existsSync(bannerPath)) {
  try {
    const { printBanner } = require(bannerPath);
    printBanner();
  } catch (err) {
    // Silently fail if banner can't be loaded
  }
}

