/**
 * tsc writes one .d.ts per source file. Two fixups make that output usable:
 * domain methods are copied onto Monstera at runtime, and JSDoc typedefs are
 * referenced by bare name from other files.
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';

const file = new URL('../dist/types/sdk/Monstera.d.ts', import.meta.url);
const marker = 'MonsteraFacadeMethods';

let text = readFileSync(file, 'utf8');
text = text.replace(/export interface Monstera extends\s*\{\s*\}/g, '');

if (!text.includes(marker)) {
  text += `
import { monsteraAuthMethods } from "./domains/MonsteraAuth.js";
import { monsteraFactoryMethods } from "./domains/MonsteraFactory.js";
import { monsteraKeyVaultMethods } from "./domains/MonsteraKeyVault.js";
import { monsteraSessionMethods } from "./domains/MonsteraSession.js";
import { monsteraSigningMethods } from "./domains/MonsteraSigning.js";
type ${marker} = typeof monsteraAuthMethods & typeof monsteraFactoryMethods & typeof monsteraKeyVaultMethods & typeof monsteraSessionMethods & typeof monsteraSigningMethods;
interface Monstera extends ${marker} {
}
`;
}

writeFileSync(file, text);

const typesDir = new URL('../dist/types/types/', import.meta.url);
const namesByFile = new Map();

for (const entry of readdirSync(typesDir).filter((name) => name.endsWith('.d.ts')).sort()) {
  const source = readFileSync(new URL(entry, typesDir), 'utf8');
  for (const match of source.matchAll(/^export (?:type|interface) ([A-Za-z0-9_]+)/gm)) {
    const name = match[1];
    if (!namesByFile.has(name)) namesByFile.set(name, entry);
  }
}

const lines = ['export {};', '', 'declare global {'];
for (const [name, entry] of namesByFile) {
  const moduleName = entry.replace(/\.d\.ts$/, '.js');
  lines.push(`  type ${name} = import("./types/${moduleName}").${name};`);
}
lines.push('}', '');

const globalsFile = new URL('../dist/types/jsdoc-globals.d.ts', import.meta.url);
writeFileSync(globalsFile, `${lines.join('\n')}\n`);

const indexFile = new URL('../dist/types/index.d.ts', import.meta.url);
let index = readFileSync(indexFile, 'utf8');
const reference = '/// <reference path="./jsdoc-globals.d.ts" />\n';
if (!index.startsWith(reference)) {
  index = reference + index;
  writeFileSync(indexFile, index);
}
