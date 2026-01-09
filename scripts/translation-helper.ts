#!/usr/bin/env npx ts-node
/**
 * Translation Helper Script for LLMs
 *
 * Uses English locale as source of truth and compares against target locales.
 *
 * Commands:
 *   diff <locale> [file]                 - Find untranslated/missing keys vs English
 *   get-batch <locale> <file> [size]     - Get batch of entries needing translation
 *   apply <locale> <batch-file>          - Apply translations from batch file
 *   apply-inline <locale> <file> '<json>'- Apply translations inline
 *   validate <locale> [file]             - Validate JSON structure
 *   stats <locale>                       - Show translation statistics
 *   sync <locale> [file]                 - Add missing keys from English
 *
 * Example usage:
 *   npx ts-node scripts/translation-helper.ts diff de social-media-resize.json
 *   npx ts-node scripts/translation-helper.ts get-batch de social-media-resize.json 20
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const SOURCE_LOCALE = 'en';

interface IFlattenedEntry {
  key: string;
  value: string;
  path: string[];
}

interface ITranslationDiff {
  missing: IFlattenedEntry[]; // Keys in English but not in target
  untranslated: IFlattenedEntry[]; // Keys with exact same value as English
  translated: number; // Count of properly translated keys
  extra: string[]; // Keys in target but not in English (potential issue)
}

interface ITranslationBatch {
  file: string;
  updates: Array<{
    key: string;
    value: string;
  }>;
}

// Build key string from path array
function pathToKey(pathArr: string[]): string {
  let result = '';
  for (const part of pathArr) {
    if (part.startsWith('[')) {
      result += part;
    } else if (result === '') {
      result = part;
    } else {
      result += '.' + part;
    }
  }
  return result;
}

// Flatten nested JSON object to dot-notation keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenObject(obj: any, prefix: string[] = []): IFlattenedEntry[] {
  const entries: IFlattenedEntry[] = [];

  if (obj === null || obj === undefined) {
    return entries;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...prefix, key];

    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'string') {
      entries.push({ key: pathToKey(currentPath), value, path: currentPath });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const itemPath = [...currentPath, `[${index}]`];
        if (typeof item === 'string') {
          entries.push({
            key: pathToKey(itemPath),
            value: item,
            path: itemPath,
          });
        } else if (typeof item === 'object' && item !== null) {
          entries.push(...flattenObject(item, itemPath));
        }
      });
    } else if (typeof value === 'object') {
      entries.push(...flattenObject(value, currentPath));
    }
  }

  return entries;
}

// Create a map from flattened entries for quick lookup
function createEntryMap(entries: IFlattenedEntry[]): Map<string, IFlattenedEntry> {
  const map = new Map<string, IFlattenedEntry>();
  for (const entry of entries) {
    map.set(entry.key, entry);
  }
  return map;
}

// Compare target locale against English source
function compareWithSource(
  sourceEntries: IFlattenedEntry[],
  targetEntries: IFlattenedEntry[]
): ITranslationDiff {
  const sourceMap = createEntryMap(sourceEntries);
  const targetMap = createEntryMap(targetEntries);

  const diff: ITranslationDiff = {
    missing: [],
    untranslated: [],
    translated: 0,
    extra: [],
  };

  // Find missing and untranslated
  for (const [key, sourceEntry] of sourceMap) {
    const targetEntry = targetMap.get(key);

    if (!targetEntry) {
      diff.missing.push(sourceEntry);
    } else if (targetEntry.value === sourceEntry.value) {
      // Same value as English = not translated
      diff.untranslated.push(sourceEntry);
    } else {
      diff.translated++;
    }
  }

  // Find extra keys in target (not in source)
  for (const key of targetMap.keys()) {
    if (!sourceMap.has(key)) {
      diff.extra.push(key);
    }
  }

  return diff;
}

// Parse dot-notation key to path array
function keyToPath(key: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inBracket = false;

  for (const char of key) {
    if (char === '.' && !inBracket) {
      if (current) parts.push(current);
      current = '';
    } else if (char === '[') {
      if (current) parts.push(current);
      current = '[';
      inBracket = true;
    } else if (char === ']') {
      current += ']';
      parts.push(current);
      current = '';
      inBracket = false;
    } else {
      current += char;
    }
  }

  if (current) parts.push(current);
  return parts;
}

// Get value at a nested path
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string[]): any {
  let current = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = key.match(/^\[(\d+)\]$/);
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10);
      current = current[index];
    } else {
      current = current[key];
    }
  }

  return current;
}

// Set a value at a nested path in an object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setNestedValue(obj: any, path: string[], value: any): void {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];

    const arrayMatch = key.match(/^\[(\d+)\]$/);
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10);
      // Ensure array exists and has enough elements
      while (current.length <= index) {
        current.push(null);
      }
      if (current[index] === null || current[index] === undefined) {
        const nextArrayMatch = nextKey?.match(/^\[(\d+)\]$/);
        current[index] = nextArrayMatch ? [] : {};
      }
      current = current[index];
    } else {
      // Check if next key is an array index
      const nextArrayMatch = nextKey?.match(/^\[(\d+)\]$/);

      if (current[key] === undefined || current[key] === null) {
        current[key] = nextArrayMatch ? [] : {};
      }
      current = current[key];
    }
  }

  const lastKey = path[path.length - 1];
  const arrayMatch = lastKey.match(/^\[(\d+)\]$/);
  if (arrayMatch) {
    const index = parseInt(arrayMatch[1], 10);
    while (current.length <= index) {
      current.push(null);
    }
    current[index] = value;
  } else {
    current[lastKey] = value;
  }
}

// Deep clone and set value, preserving structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setValueInClone(obj: any, path: string[], value: any): any {
  const clone = JSON.parse(JSON.stringify(obj));
  setNestedValue(clone, path, value);
  return clone;
}

// Read JSON file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJsonFile(filePath: string): Promise<any> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// Write JSON file with pretty formatting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeJsonFile(filePath: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

// Get language name from locale code
function getLanguageName(locale: string): string {
  const names: Record<string, string> = {
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian',
    ja: 'Japanese',
    pt: 'Portuguese',
    en: 'English',
  };
  return names[locale] || locale;
}

// Command: diff
async function diffLocale(locale: string, fileName?: string): Promise<void> {
  if (locale === SOURCE_LOCALE) {
    console.error('Cannot diff English against itself');
    process.exit(1);
  }

  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  const targetDir = path.join(LOCALES_DIR, locale);

  if (!fs.existsSync(targetDir)) {
    console.error(`Locale directory not found: ${targetDir}`);
    process.exit(1);
  }

  const files = fileName
    ? [fileName.endsWith('.json') ? fileName : `${fileName}.json`]
    : fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));

  console.log(`\n# Translation Diff: English → ${getLanguageName(locale)}\n`);

  let totalMissing = 0;
  let totalUntranslated = 0;
  let totalTranslated = 0;

  const errors: string[] = [];

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠ Source file not found: ${file}`);
      continue;
    }

    try {
      const sourceData = await readJsonFile(sourcePath);
      const sourceEntries = flattenObject(sourceData);

      let targetEntries: IFlattenedEntry[] = [];
      if (fs.existsSync(targetPath)) {
        const targetData = await readJsonFile(targetPath);
        targetEntries = flattenObject(targetData);
      }

      const diff = compareWithSource(sourceEntries, targetEntries);

      totalMissing += diff.missing.length;
      totalUntranslated += diff.untranslated.length;
      totalTranslated += diff.translated;

      const needsWork = diff.missing.length + diff.untranslated.length;
      if (needsWork > 0 || !fs.existsSync(targetPath)) {
        const status = !fs.existsSync(targetPath)
          ? '❌ MISSING FILE'
          : `⚠ ${needsWork} entries need translation`;
        console.log(`\n## ${file} - ${status}\n`);

        if (diff.missing.length > 0) {
          console.log(`### Missing keys (${diff.missing.length}):\n`);
          for (const entry of diff.missing.slice(0, 10)) {
            console.log(`- \`${entry.key}\``);
            console.log(`  English: "${truncate(entry.value, 100)}"`);
          }
          if (diff.missing.length > 10) {
            console.log(`  ... and ${diff.missing.length - 10} more`);
          }
        }

        if (diff.untranslated.length > 0) {
          console.log(`\n### Untranslated keys (${diff.untranslated.length}):\n`);
          for (const entry of diff.untranslated.slice(0, 10)) {
            console.log(`- \`${entry.key}\``);
            console.log(`  Value: "${truncate(entry.value, 100)}"`);
          }
          if (diff.untranslated.length > 10) {
            console.log(`  ... and ${diff.untranslated.length - 10} more`);
          }
        }

        if (diff.extra.length > 0) {
          console.log(`\n### Extra keys (in ${locale} but not in en): ${diff.extra.length}`);
        }
      }
    } catch (error) {
      console.log(`\n## ${file} - ❌ PARSE ERROR\n`);
      console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
      errors.push(file);
    }
  }

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} file(s) had parse errors and were skipped`);
  }

  const total = totalMissing + totalUntranslated + totalTranslated;
  const progress = total > 0 ? ((totalTranslated / total) * 100).toFixed(1) : '100.0';

  console.log(`\n---\n## Summary for ${locale}`);
  console.log(`- Missing keys: ${totalMissing}`);
  console.log(`- Untranslated: ${totalUntranslated}`);
  console.log(`- Translated: ${totalTranslated}`);
  console.log(`- Progress: ${progress}%`);
}

// Command: diff-json (machine-readable)
async function diffLocaleJson(locale: string, fileName?: string): Promise<void> {
  if (locale === SOURCE_LOCALE) {
    console.error(JSON.stringify({ error: 'Cannot diff English against itself' }));
    process.exit(1);
  }

  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  const targetDir = path.join(LOCALES_DIR, locale);

  const files = fileName
    ? [fileName.endsWith('.json') ? fileName : `${fileName}.json`]
    : fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));

  const results: Record<
    string,
    {
      missing: Array<{ key: string; english: string }>;
      untranslated: Array<{ key: string; english: string }>;
      translated: number;
    }
  > = {};

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (!fs.existsSync(sourcePath)) continue;

    const sourceData = await readJsonFile(sourcePath);
    const sourceEntries = flattenObject(sourceData);

    let targetEntries: IFlattenedEntry[] = [];
    if (fs.existsSync(targetPath)) {
      const targetData = await readJsonFile(targetPath);
      targetEntries = flattenObject(targetData);
    }

    const diff = compareWithSource(sourceEntries, targetEntries);

    if (diff.missing.length > 0 || diff.untranslated.length > 0) {
      results[file] = {
        missing: diff.missing.map(e => ({ key: e.key, english: e.value })),
        untranslated: diff.untranslated.map(e => ({ key: e.key, english: e.value })),
        translated: diff.translated,
      };
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

// Command: get-batch
async function getBatch(
  locale: string,
  fileName: string,
  batchSize: number = 20,
  offset: number = 0
): Promise<void> {
  if (locale === SOURCE_LOCALE) {
    console.error(JSON.stringify({ error: 'Cannot get batch for English source locale' }));
    process.exit(1);
  }

  const file = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE, file);
  const targetPath = path.join(LOCALES_DIR, locale, file);

  if (!fs.existsSync(sourcePath)) {
    console.error(JSON.stringify({ error: `Source file not found: ${file}` }));
    process.exit(1);
  }

  const sourceData = await readJsonFile(sourcePath);
  const sourceEntries = flattenObject(sourceData);

  let targetEntries: IFlattenedEntry[] = [];
  if (fs.existsSync(targetPath)) {
    const targetData = await readJsonFile(targetPath);
    targetEntries = flattenObject(targetData);
  }

  const diff = compareWithSource(sourceEntries, targetEntries);

  // Combine missing and untranslated, prioritizing missing
  const allNeeded = [...diff.missing, ...diff.untranslated];
  const batch = allNeeded.slice(offset, offset + batchSize);

  if (batch.length === 0) {
    console.log(
      JSON.stringify(
        {
          status: 'complete',
          message: `All entries in ${file} are translated`,
          locale,
          file,
          totalRemaining: 0,
        },
        null,
        2
      )
    );
    return;
  }

  const output = {
    locale,
    file,
    targetLanguage: getLanguageName(locale),
    batchNumber: Math.floor(offset / batchSize) + 1,
    totalBatches: Math.ceil(allNeeded.length / batchSize),
    totalRemaining: allNeeded.length - offset,
    entries: batch.map(e => ({
      key: e.key,
      english: e.value,
    })),
    responseFormat: {
      description: 'Return a JSON array of objects with "key" and "value" fields',
      example: [{ key: batch[0]?.key || 'example.key', value: '<translated text>' }],
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

// Command: apply
async function applyTranslations(locale: string, batchFile: string): Promise<void> {
  const batchPath = path.resolve(batchFile);

  if (!fs.existsSync(batchPath)) {
    console.error(`Batch file not found: ${batchPath}`);
    process.exit(1);
  }

  const batch: ITranslationBatch | ITranslationBatch[] = JSON.parse(
    await fs.promises.readFile(batchPath, 'utf-8')
  );

  const batches = Array.isArray(batch) ? batch : [batch];

  let totalUpdates = 0;
  let successfulUpdates = 0;

  for (const b of batches) {
    const file = b.file.endsWith('.json') ? b.file : `${b.file}.json`;
    const targetPath = path.join(LOCALES_DIR, locale, file);
    const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE, file);

    // If target doesn't exist, create from source structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetData: any;
    if (fs.existsSync(targetPath)) {
      targetData = await readJsonFile(targetPath);
    } else if (fs.existsSync(sourcePath)) {
      console.log(`Creating new file ${file} from English template...`);
      targetData = await readJsonFile(sourcePath);
    } else {
      console.error(`Neither target nor source file found: ${file}`);
      continue;
    }

    console.log(`\nProcessing ${file}...`);

    for (const update of b.updates) {
      totalUpdates++;
      try {
        const pathArr = keyToPath(update.key);
        setNestedValue(targetData, pathArr, update.value);
        successfulUpdates++;
        console.log(`  ✓ ${update.key}`);
      } catch (error) {
        console.error(`  ✗ ${update.key}:`, error);
      }
    }

    await writeJsonFile(targetPath, targetData);
    console.log(`  Saved ${file}`);
  }

  console.log(`\n---`);
  console.log(
    `Total: ${totalUpdates}, Success: ${successfulUpdates}, Failed: ${totalUpdates - successfulUpdates}`
  );
}

// Command: apply-inline
async function applyInline(locale: string, fileName: string, updatesJson: string): Promise<void> {
  const file = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const targetPath = path.join(LOCALES_DIR, locale, file);
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE, file);

  let updates: Array<{ key: string; value: string }>;
  try {
    updates = JSON.parse(updatesJson);
  } catch (error) {
    console.error('Invalid JSON:', error);
    process.exit(1);
  }

  // If target doesn't exist, create from source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let targetData: any;
  if (fs.existsSync(targetPath)) {
    targetData = await readJsonFile(targetPath);
  } else if (fs.existsSync(sourcePath)) {
    console.log(`Creating ${file} from English template...`);
    targetData = await readJsonFile(sourcePath);
  } else {
    console.error(`Source file not found: ${file}`);
    process.exit(1);
  }

  let success = 0;
  for (const update of updates) {
    try {
      const pathArr = keyToPath(update.key);
      setNestedValue(targetData, pathArr, update.value);
      success++;
      console.log(`✓ ${update.key}`);
    } catch (error) {
      console.error(`✗ ${update.key}:`, error);
    }
  }

  await writeJsonFile(targetPath, targetData);
  console.log(`\nUpdated ${success}/${updates.length} entries in ${file}`);
}

// Command: sync - Add missing keys from English
async function syncLocale(locale: string, fileName?: string): Promise<void> {
  if (locale === SOURCE_LOCALE) {
    console.error('Cannot sync English with itself');
    process.exit(1);
  }

  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  const targetDir = path.join(LOCALES_DIR, locale);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fileName
    ? [fileName.endsWith('.json') ? fileName : `${fileName}.json`]
    : fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));

  let totalAdded = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (!fs.existsSync(sourcePath)) continue;

    const sourceData = await readJsonFile(sourcePath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetData: any;
    if (fs.existsSync(targetPath)) {
      targetData = await readJsonFile(targetPath);
    } else {
      // Create new file with English content
      console.log(`Creating ${file}...`);
      await writeJsonFile(targetPath, sourceData);
      const entries = flattenObject(sourceData);
      totalAdded += entries.length;
      continue;
    }

    const sourceEntries = flattenObject(sourceData);
    const targetEntries = flattenObject(targetData);
    const targetMap = createEntryMap(targetEntries);

    let addedInFile = 0;
    for (const entry of sourceEntries) {
      if (!targetMap.has(entry.key)) {
        setNestedValue(targetData, entry.path, entry.value);
        addedInFile++;
      }
    }

    if (addedInFile > 0) {
      await writeJsonFile(targetPath, targetData);
      console.log(`${file}: Added ${addedInFile} missing keys`);
      totalAdded += addedInFile;
    }
  }

  console.log(`\nTotal keys added: ${totalAdded}`);
}

// Command: stats
async function showStats(locale: string): Promise<void> {
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  const targetDir = path.join(LOCALES_DIR, locale);

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));

  console.log(`\n# Translation Statistics: ${getLanguageName(locale)}\n`);
  console.log('| File | Total | Missing | Untranslated | Done | Progress |');
  console.log('|------|-------|---------|--------------|------|----------|');

  let grandTotal = 0;
  let grandMissing = 0;
  let grandUntranslated = 0;
  let grandTranslated = 0;

  const errors: string[] = [];

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    try {
      const sourceData = await readJsonFile(sourcePath);
      const sourceEntries = flattenObject(sourceData);

      let targetEntries: IFlattenedEntry[] = [];
      if (fs.existsSync(targetPath)) {
        const targetData = await readJsonFile(targetPath);
        targetEntries = flattenObject(targetData);
      }

      const diff = compareWithSource(sourceEntries, targetEntries);
      const total = sourceEntries.length;
      const progress = total > 0 ? ((diff.translated / total) * 100).toFixed(0) : '0';

      grandTotal += total;
      grandMissing += diff.missing.length;
      grandUntranslated += diff.untranslated.length;
      grandTranslated += diff.translated;

      const shortName = file.length > 30 ? file.slice(0, 27) + '...' : file;
      console.log(
        `| ${shortName.padEnd(30)} | ${String(total).padStart(5)} | ${String(diff.missing.length).padStart(7)} | ${String(diff.untranslated.length).padStart(12)} | ${String(diff.translated).padStart(4)} | ${progress.padStart(6)}% |`
      );
    } catch (error) {
      const shortName = file.length > 30 ? file.slice(0, 27) + '...' : file;
      console.log(
        `| ${shortName.padEnd(30)} | ERROR | ${error instanceof Error ? error.message.slice(0, 30) : 'Parse error'} |`
      );
      errors.push(file);
    }
  }

  const grandProgress = grandTotal > 0 ? ((grandTranslated / grandTotal) * 100).toFixed(1) : '0';
  console.log('|------|-------|---------|--------------|------|----------|');
  console.log(
    `| **TOTAL** | ${String(grandTotal).padStart(5)} | ${String(grandMissing).padStart(7)} | ${String(grandUntranslated).padStart(12)} | ${String(grandTranslated).padStart(4)} | ${grandProgress.padStart(6)}% |`
  );

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} file(s) had parse errors: ${errors.join(', ')}`);
  }
}

// Command: validate
async function validateJson(locale: string, fileName?: string): Promise<void> {
  const localeDir = path.join(LOCALES_DIR, locale);

  if (!fs.existsSync(localeDir)) {
    console.error(`Locale directory not found: ${localeDir}`);
    process.exit(1);
  }

  const files = fileName
    ? [fileName.endsWith('.json') ? fileName : `${fileName}.json`]
    : fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));

  let valid = 0;
  let invalid = 0;

  for (const file of files) {
    const filePath = path.join(localeDir, file);

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      JSON.parse(content);
      console.log(`✓ ${file}`);
      valid++;
    } catch (error) {
      console.error(`✗ ${file}: ${error instanceof Error ? error.message : String(error)}`);
      invalid++;
    }
  }

  console.log(`\nValid: ${valid}, Invalid: ${invalid}`);
  if (invalid > 0) process.exit(1);
}

// Command: list-files
async function listFiles(locale: string): Promise<void> {
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  const targetDir = path.join(LOCALES_DIR, locale);

  const sourceFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  const targetFiles = new Set(
    fs.existsSync(targetDir) ? fs.readdirSync(targetDir).filter(f => f.endsWith('.json')) : []
  );

  console.log(
    JSON.stringify(
      {
        locale,
        files: sourceFiles.map(f => ({
          name: f,
          existsInTarget: targetFiles.has(f),
        })),
      },
      null,
      2
    )
  );
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Translation Helper Script for LLMs

Uses English (en) locale as the source of truth.

Commands:
  diff <locale> [file]                      Compare locale against English (human-readable)
  diff-json <locale> [file]                 Compare locale against English (JSON output)
  get-batch <locale> <file> [size] [offset] Get batch of entries needing translation
  apply <locale> <batch-file>               Apply translations from batch file
  apply-inline <locale> <file> '<json>'     Apply translations inline
  sync <locale> [file]                      Copy missing keys from English
  validate <locale> [file]                  Validate JSON structure
  stats <locale>                            Show translation statistics
  list-files <locale>                       List all translation files

Examples:
  # See what needs translating in German
  npx ts-node scripts/translation-helper.ts diff de

  # Get 20 entries needing translation from a specific file
  npx ts-node scripts/translation-helper.ts get-batch de social-media-resize.json 20

  # Get next batch (with offset)
  npx ts-node scripts/translation-helper.ts get-batch de social-media-resize.json 20 20

  # Apply translations from file
  npx ts-node scripts/translation-helper.ts apply de ./translations.json

  # Apply inline translations (from LLM output)
  npx ts-node scripts/translation-helper.ts apply-inline de social-media-resize.json '[{"key":"pages[0].title","value":"Bild für Pinterest skalieren"}]'

  # Add missing keys from English
  npx ts-node scripts/translation-helper.ts sync de

Batch file format:
  {
    "file": "social-media-resize.json",
    "updates": [
      { "key": "pages[0].title", "value": "Translated title" }
    ]
  }

LLM Workflow:
  1. get-batch → returns entries needing translation
  2. Translate entries
  3. apply-inline → apply translations
  4. Repeat until complete
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'diff':
        await diffLocale(args[1], args[2]);
        break;
      case 'diff-json':
        await diffLocaleJson(args[1], args[2]);
        break;
      case 'get-batch':
        await getBatch(args[1], args[2], parseInt(args[3]) || 20, parseInt(args[4]) || 0);
        break;
      case 'apply':
        await applyTranslations(args[1], args[2]);
        break;
      case 'apply-inline':
        await applyInline(args[1], args[2], args[3]);
        break;
      case 'sync':
        await syncLocale(args[1], args[2]);
        break;
      case 'validate':
        await validateJson(args[1], args[2]);
        break;
      case 'stats':
        await showStats(args[1]);
        break;
      case 'list-files':
        await listFiles(args[1]);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run with --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
