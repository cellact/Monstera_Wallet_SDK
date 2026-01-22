#!/usr/bin/env node

/**
 * Postinstall script - displays Monstera banner after npm install
 */

import { printBanner } from '../src/utils/banner.js';

printBanner();