#!/usr/bin/env npx tsx
/**
 * Bundle Analysis Script
 *
 * Analyzes the OpenNext build output to identify large packages
 * and help optimize bundle size for Cloudflare Workers (10MB limit).
 *
 * Usage:
 *   npx tsx scripts/bundle-report.ts
 *   npx tsx scripts/bundle-report.ts --top=20
 *   npx tsx scripts/bundle-report.ts --filter=node_modules
 */

import * as fs from 'fs';
import * as path from 'path';

interface IMetaInput {
  bytes: number;
  imports: Array<{ path: string; kind: string; original?: string }>;
  format?: string;
}

interface IBundleMeta {
  inputs: Record<string, IMetaInput>;
  outputs?: Record<string, { bytes: number }>;
}

interface IPackageSize {
  name: string;
  bytes: number;
  files: number;
}

const CLOUDFLARE_LIMIT = 10 * 1024 * 1024; // 10MB
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getPackageName(filePath: string): string | null {
  // Extract package name from node_modules path
  const nodeModulesMatch = filePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  if (nodeModulesMatch) {
    return nodeModulesMatch[1];
  }
  return null;
}

function analyzeBundle(metaPath: string) {
  if (!fs.existsSync(metaPath)) {
    console.error(`${RED}Error: Meta file not found at ${metaPath}${RESET}`);
    console.log(`${YELLOW}Run a build first: npx opennextjs-cloudflare build${RESET}`);
    process.exit(1);
  }

  const meta: IBundleMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const inputs = meta.inputs;

  // Calculate total size
  let totalBytes = 0;
  const packageSizes: Map<string, IPackageSize> = new Map();
  const appCodeSize = { bytes: 0, files: 0 };
  const nextJsSize = { bytes: 0, files: 0 };

  for (const [filePath, info] of Object.entries(inputs)) {
    totalBytes += info.bytes;

    const packageName = getPackageName(filePath);

    if (packageName) {
      if (packageName.startsWith('next')) {
        nextJsSize.bytes += info.bytes;
        nextJsSize.files++;
      } else {
        const existing = packageSizes.get(packageName) || { name: packageName, bytes: 0, files: 0 };
        existing.bytes += info.bytes;
        existing.files++;
        packageSizes.set(packageName, existing);
      }
    } else {
      appCodeSize.bytes += info.bytes;
      appCodeSize.files++;
    }
  }

  // Sort packages by size
  const sortedPackages = Array.from(packageSizes.values()).sort((a, b) => b.bytes - a.bytes);

  // Print report
  console.log('\n');
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}                    BUNDLE SIZE ANALYSIS${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
  console.log('');

  // Total size with limit comparison
  const overLimit = totalBytes > CLOUDFLARE_LIMIT;
  const sizeColor = overLimit ? RED : GREEN;
  const limitStatus = overLimit
    ? `${RED}OVER LIMIT by ${formatBytes(totalBytes - CLOUDFLARE_LIMIT)}${RESET}`
    : `${GREEN}Under limit by ${formatBytes(CLOUDFLARE_LIMIT - totalBytes)}${RESET}`;

  console.log(`${BOLD}Total Bundle Size:${RESET} ${sizeColor}${formatBytes(totalBytes)}${RESET}`);
  console.log(`${BOLD}Cloudflare Limit:${RESET}  ${formatBytes(CLOUDFLARE_LIMIT)}`);
  console.log(`${BOLD}Status:${RESET}            ${limitStatus}`);
  console.log('');

  // Progress bar
  const percentage = Math.min((totalBytes / CLOUDFLARE_LIMIT) * 100, 100);
  const barWidth = 50;
  const filledWidth = Math.round((percentage / 100) * barWidth);
  const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);
  console.log(`[${sizeColor}${bar}${RESET}] ${percentage.toFixed(1)}%`);
  console.log('');

  // Breakdown
  console.log(`${BOLD}${CYAN}── Breakdown ──${RESET}`);
  console.log(`  App Code:     ${formatBytes(appCodeSize.bytes)} (${appCodeSize.files} files)`);
  console.log(`  Next.js:      ${formatBytes(nextJsSize.bytes)} (${nextJsSize.files} files)`);
  console.log(`  Dependencies: ${formatBytes(totalBytes - appCodeSize.bytes - nextJsSize.bytes)}`);
  console.log('');

  // Top packages
  const topN = parseInt(process.argv.find((a) => a.startsWith('--top='))?.split('=')[1] || '15');
  console.log(`${BOLD}${CYAN}── Top ${topN} Largest Dependencies ──${RESET}`);
  console.log('');

  sortedPackages.slice(0, topN).forEach((pkg, i) => {
    const percentage = ((pkg.bytes / totalBytes) * 100).toFixed(1);
    const sizeStr = formatBytes(pkg.bytes).padStart(10);
    const percentStr = `${percentage}%`.padStart(6);
    const marker =
      pkg.bytes > 1024 * 1024 ? `${RED}▸${RESET}` : pkg.bytes > 500 * 1024 ? `${YELLOW}▸${RESET}` : ' ';
    console.log(`  ${marker} ${sizeStr} ${percentStr}  ${pkg.name} (${pkg.files} files)`);
  });

  console.log('');

  // Recommendations
  if (overLimit) {
    console.log(`${BOLD}${CYAN}── Recommendations ──${RESET}`);
    console.log('');

    // Find packages that could be removed or replaced
    const heavyPackages = sortedPackages.filter((p) => p.bytes > 500 * 1024);

    for (const pkg of heavyPackages) {
      console.log(`  ${YELLOW}▸ ${pkg.name}${RESET} (${formatBytes(pkg.bytes)})`);

      // Package-specific recommendations
      if (pkg.name === '@imgly/background-removal' || pkg.name === 'onnxruntime-web') {
        console.log(`    → Consider moving to client-side only (browser)`);
        console.log(`    → Already in serverExternalPackages? Verify it's excluded from server bundle`);
      } else if (pkg.name === 'framer-motion') {
        console.log(`    → Use 'motion' (lighter) or lazy load animations`);
        console.log(`    → Import only needed components: import { motion } from 'framer-motion'`);
      } else if (pkg.name === 'react-icons') {
        console.log(`    → Import individual icons: import { FiUser } from 'react-icons/fi'`);
      } else if (pkg.name.includes('stripe')) {
        console.log(`    → Ensure server-side stripe is not bundled into client`);
      } else if (pkg.name === '@google/genai') {
        console.log(`    → Consider using API routes only for GenAI calls`);
      } else if (pkg.name === 'marked' || pkg.name === 'react-markdown') {
        console.log(`    → Consider lighter alternatives or pre-rendering markdown at build`);
      } else if (pkg.name === 'jszip') {
        console.log(`    → Move to client-side only if possible`);
      } else if (pkg.name === 'replicate') {
        console.log(`    → Ensure only used in API routes, not client bundles`);
      } else if (pkg.name === 'country-flag-icons') {
        console.log(`    → Import only needed flags, or use SVG sprites`);
      }
      console.log('');
    }

    console.log(`${BOLD}General tips:${RESET}`);
    console.log('  1. Add heavy packages to serverExternalPackages in next.config.js');
    console.log('  2. Use dynamic imports for non-critical features');
    console.log('  3. Check for duplicate dependencies with: yarn why <package>');
    console.log('  4. Consider moving heavy processing to Edge Functions or client-side');
    console.log('');
  }

  console.log(`${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
  console.log('');

  return { totalBytes, overLimit, sortedPackages };
}

// Check for handler.mjs (the main bundle)
const handlerPath = path.join(
  process.cwd(),
  '.open-next/server-functions/default/handler.mjs'
);
const handlerMetaPath = handlerPath + '.meta.json';

// Also check index.mjs
const indexPath = path.join(
  process.cwd(),
  '.open-next/server-functions/default/index.mjs'
);

console.log(`${CYAN}Analyzing bundle at: ${handlerMetaPath}${RESET}`);

// Check actual file sizes
if (fs.existsSync(handlerPath)) {
  const handlerSize = fs.statSync(handlerPath).size;
  console.log(`${BOLD}handler.mjs actual size:${RESET} ${formatBytes(handlerSize)}`);
}

if (fs.existsSync(indexPath)) {
  const indexSize = fs.statSync(indexPath).size;
  console.log(`${BOLD}index.mjs actual size:${RESET} ${formatBytes(indexSize)}`);
}

const result = analyzeBundle(handlerMetaPath);
process.exit(result.overLimit ? 1 : 0);
