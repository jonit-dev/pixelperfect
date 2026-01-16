#!/usr/bin/env npx tsx
/**
 * Analyze app code breakdown in the bundle
 */

import * as fs from 'fs';

interface IMetaInput {
  bytes: number;
}

interface IBundleMeta {
  inputs: Record<string, IMetaInput>;
}

const meta: IBundleMeta = JSON.parse(
  fs.readFileSync('.open-next/server-functions/default/handler.mjs.meta.json', 'utf-8')
);

// Group files by directory pattern
const groups: Record<string, { bytes: number; files: number; examples: string[] }> = {};

for (const [filePath, info] of Object.entries(meta.inputs)) {
  // Skip node_modules
  if (filePath.includes('node_modules')) continue;

  // Categorize by path pattern
  let category = 'other';

  if (filePath.includes('.next/server/app/[locale]')) {
    // Extract the route after [locale]
    const match = filePath.match(/\.next\/server\/app\/\[locale\]\/([^/]+)/);
    if (match) {
      category = '[locale]/' + match[1];
    } else {
      category = '[locale]/root';
    }
  } else if (filePath.includes('.next/server/app/')) {
    const match = filePath.match(/\.next\/server\/app\/([^/]+)/);
    category = 'app/' + (match ? match[1] : 'root');
  } else if (filePath.includes('.next/server/chunks')) {
    category = 'chunks';
  } else if (filePath.includes('.next/')) {
    category = '.next-other';
  } else if (filePath.includes('/app/[locale]/')) {
    const match = filePath.match(/\/app\/\[locale\]\/([^/]+)/);
    category = 'src/[locale]/' + (match ? match[1] : 'root');
  } else if (filePath.includes('/server/')) {
    category = 'server';
  } else if (filePath.includes('/client/')) {
    category = 'client';
  } else if (filePath.includes('/shared/')) {
    category = 'shared';
  }

  if (!groups[category]) {
    groups[category] = { bytes: 0, files: 0, examples: [] };
  }
  groups[category].bytes += info.bytes;
  groups[category].files++;
  if (groups[category].examples.length < 3) {
    groups[category].examples.push(filePath);
  }
}

// Sort and print
const sorted = Object.entries(groups).sort((a, b) => b[1].bytes - a[1].bytes);

console.log('\n=== App Code Breakdown by Category ===\n');
console.log('Size (MB) | Files | Category');
console.log('----------|-------|----------');

for (const [cat, info] of sorted.slice(0, 40)) {
  const mb = (info.bytes / (1024 * 1024)).toFixed(2).padStart(9);
  const files = String(info.files).padStart(5);
  console.log(`${mb} | ${files} | ${cat}`);
}

// Find largest individual files
console.log('\n=== Top 20 Largest Individual Files ===\n');

const allFiles = Object.entries(meta.inputs)
  .filter(([path]) => !path.includes('node_modules'))
  .sort((a, b) => b[1].bytes - a[1].bytes);

for (const [filePath, info] of allFiles.slice(0, 20)) {
  const kb = (info.bytes / 1024).toFixed(1).padStart(10);
  // Shorten path for display
  const shortPath = filePath.replace('.open-next/server-functions/default/', '');
  console.log(`${kb} KB | ${shortPath}`);
}

// Analyze chunks specifically
console.log('\n=== Chunk Files Analysis ===\n');
const chunkFiles = Object.entries(meta.inputs)
  .filter(([path]) => path.includes('.next/server/chunks'))
  .sort((a, b) => b[1].bytes - a[1].bytes);

let totalChunks = 0;
for (const [, info] of chunkFiles) {
  totalChunks += info.bytes;
}
console.log(`Total chunks: ${(totalChunks / (1024 * 1024)).toFixed(2)} MB (${chunkFiles.length} files)`);
console.log('\nLargest chunks:');
for (const [filePath, info] of chunkFiles.slice(0, 10)) {
  const kb = (info.bytes / 1024).toFixed(1).padStart(10);
  const name = filePath.split('/').pop();
  console.log(`${kb} KB | ${name}`);
}
