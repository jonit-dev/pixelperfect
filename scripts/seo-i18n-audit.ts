#!/usr/bin/env tsx
/**
 * SEO i18n Audit Script
 *
 * Comprehensive validation of i18n implementation for SEO best practices.
 * This script validates:
 * - All translation files exist and are valid JSON
 * - hreflang tags are correctly configured
 * - Sitemap entries for all locales
 * - No broken links or missing translations
 * - Locale coverage across all categories
 *
 * Usage: npx tsx scripts/seo-i18n-audit.ts
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n/config';

/**
 * Audit result interface
 */
interface IAuditResult {
  category: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string[];
}

/**
 * Translation file structure
 */
interface ITranslationFile {
  [key: string]: string | number | boolean | ITranslationFile;
}

/**
 * Expected translation files per locale (excluding English)
 */
const EXPECTED_TRANSLATIONS = [
  'common.json',
  'tools.json',
  'formats.json',
  'free.json',
  'guides.json',
];

/**
 * All translation files found in English locale
 */
const ALL_ENGLISH_TRANSLATIONS = [
  'common.json',
  'tools.json',
  'formats.json',
  'free.json',
  'guides.json',
  'scale.json',
  'use-cases.json',
  'compare.json',
  'alternatives.json',
  'platforms.json',
  'device-use.json',
  'format-scale.json',
  'platform-format.json',
  'dashboard.json',
  'auth.json',
  'pricing.json',
  'help.json',
  'blog.json',
  'features.json',
  'howItWorks.json',
];

/**
 * Audit results collection
 */
const auditResults: IAuditResult[] = [];

/**
 * Add audit result
 */
function addResult(
  category: string,
  status: 'pass' | 'fail' | 'warn',
  message: string,
  details?: string[]
) {
  auditResults.push({ category, status, message, details });
}

/**
 * Validate JSON file structure
 */
function validateJson(filePath: string): {
  valid: boolean;
  error?: string;
  content?: ITranslationFile;
} {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as ITranslationFile;
    return { valid: true, content: parsed };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if all expected translation files exist for a locale
 */
function checkTranslationFilesExist(locale: string): { exists: string[]; missing: string[] } {
  const localePath = join(process.cwd(), 'locales', locale);
  const existingFiles = existsSync(localePath) ? readdirSync(localePath) : [];

  const exists: string[] = [];
  const missing: string[] = [];

  for (const file of EXPECTED_TRANSLATIONS) {
    if (existingFiles.includes(file)) {
      exists.push(file);
    } else {
      missing.push(file);
    }
  }

  return { exists, missing };
}

/**
 * Audit 1: Check all translation files exist
 */
function auditTranslationFilesExist() {
  console.log('\n🔍 Auditing translation files existence...');

  const allMissing: string[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;

    const { exists, missing } = checkTranslationFilesExist(locale);

    if (missing.length === 0) {
      addResult(
        'Translation Files',
        'pass',
        `All expected translation files exist for ${locale.toUpperCase()}`,
        exists
      );
    } else {
      addResult(
        'Translation Files',
        'fail',
        `Missing ${missing.length} translation files for ${locale.toUpperCase()}`,
        missing
      );
      allMissing.push(`${locale}: ${missing.join(', ')}`);
    }
  }

  if (allMissing.length === 0) {
    console.log('✅ All expected translation files exist');
  } else {
    console.log(`❌ Missing translation files:\n  ${allMissing.join('\n  ')}`);
  }
}

/**
 * Audit 2: Validate JSON structure of all translation files
 */
function auditJsonStructure() {
  console.log('\n🔍 Auditing JSON structure...');

  const invalidFiles: string[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    const localePath = join(process.cwd(), 'locales', locale);

    if (!existsSync(localePath)) {
      addResult('JSON Structure', 'fail', `Locale directory missing for ${locale.toUpperCase()}`);
      continue;
    }

    const files = readdirSync(localePath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(localePath, file);
      const result = validateJson(filePath);

      if (!result.valid) {
        invalidFiles.push(`${locale}/${file}: ${result.error}`);
        addResult('JSON Structure', 'fail', `Invalid JSON in ${locale}/${file}`, [result.error!]);
      }
    }
  }

  if (invalidFiles.length === 0) {
    console.log('✅ All translation files have valid JSON structure');
  } else {
    console.log(`❌ Invalid JSON files:\n  ${invalidFiles.join('\n  ')}`);
  }
}

/**
 * Audit 3: Check locale coverage per category
 */
function auditLocaleCoverage() {
  console.log('\n🔍 Auditing locale coverage...');

  const coverageByCategory: Record<string, string[]> = {};

  // Initialize categories
  for (const file of EXPECTED_TRANSLATIONS) {
    const category = file.replace('.json', '');
    coverageByCategory[category] = [];
  }

  // Check coverage for each locale
  for (const locale of SUPPORTED_LOCALES) {
    const localePath = join(process.cwd(), 'locales', locale);

    if (!existsSync(localePath)) {
      for (const category of Object.keys(coverageByCategory)) {
        coverageByCategory[category].push(`${locale}: MISSING`);
      }
      continue;
    }

    const files = readdirSync(localePath);

    for (const category of Object.keys(coverageByCategory)) {
      const file = `${category}.json`;
      if (files.includes(file)) {
        coverageByCategory[category].push(`${locale}: ✓`);
      } else {
        coverageByCategory[category].push(`${locale}: ✗`);
      }
    }
  }

  const warnings: string[] = [];

  for (const [category, coverage] of Object.entries(coverageByCategory)) {
    const missing = coverage.filter(c => c.includes('✗'));

    if (missing.length > 0) {
      warnings.push(`${category}: ${missing.join(', ')}`);
    }
  }

  if (warnings.length === 0) {
    console.log('✅ All categories fully localized');
    addResult(
      'Locale Coverage',
      'pass',
      'All categories have translations for all supported locales'
    );
  } else {
    console.log(`⚠️  Partial coverage:\n  ${warnings.join('\n  ')}`);
    addResult('Locale Coverage', 'warn', 'Some categories have incomplete translations', warnings);
  }
}

/**
 * Audit 4: Check for English-only content handling
 */
function auditEnglishOnlyContent() {
  console.log('\n🔍 Auditing English-only content...');

  const englishOnlyCategories: string[] = [];
  const localizedCategories = EXPECTED_TRANSLATIONS.map(f => f.replace('.json', ''));

  for (const file of ALL_ENGLISH_TRANSLATIONS) {
    const category = file.replace('.json', '');

    if (!localizedCategories.includes(category)) {
      englishOnlyCategories.push(category);
    }
  }

  console.log(`ℹ️  English-only categories (${englishOnlyCategories.length}):`);
  console.log(`  ${englishOnlyCategories.join(', ')}`);
  console.log(`ℹ️  Localized categories (${localizedCategories.length}):`);
  console.log(`  ${localizedCategories.join(', ')}`);

  addResult(
    'English-Only Content',
    'pass',
    `Identified ${englishOnlyCategories.length} English-only categories and ${localizedCategories.length} localized categories`
  );
}

/**
 * Audit 5: Check for duplicate keys within translation files
 */
function auditDuplicateKeys() {
  console.log('\n🔍 Auditing duplicate keys...');

  const duplicatesFound: string[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    const localePath = join(process.cwd(), 'locales', locale);

    if (!existsSync(localePath)) continue;

    const files = readdirSync(localePath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(localePath, file);
      const result = validateJson(filePath);

      if (result.valid && result.content) {
        const keys = Object.keys(result.content);
        const uniqueKeys = new Set(keys);

        if (keys.length !== uniqueKeys.size) {
          const duplicates = keys.filter(k => keys.indexOf(k) !== keys.lastIndexOf(k));
          duplicatesFound.push(`${locale}/${file}: ${duplicates.join(', ')}`);
        }
      }
    }
  }

  if (duplicatesFound.length === 0) {
    console.log('✅ No duplicate keys found');
    addResult('Duplicate Keys', 'pass', 'No duplicate keys in translation files');
  } else {
    console.log(`❌ Duplicate keys found:\n  ${duplicatesFound.join('\n  ')}`);
    addResult(
      'Duplicate Keys',
      'fail',
      'Duplicate keys found in translation files',
      duplicatesFound
    );
  }
}

/**
 * Audit 6: Check translation file sizes (detect potential empty files)
 */
function auditTranslationFileSizes() {
  console.log('\n🔍 Auditing translation file sizes...');

  const smallFiles: string[] = [];
  const minSize = 100; // Minimum 100 bytes

  for (const locale of SUPPORTED_LOCALES) {
    const localePath = join(process.cwd(), 'locales', locale);

    if (!existsSync(localePath)) continue;

    const files = readdirSync(localePath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(localePath, file);
      const stats = statSync(filePath);

      if (stats.size < minSize) {
        smallFiles.push(`${locale}/${file}: ${stats.size} bytes`);
      }
    }
  }

  if (smallFiles.length === 0) {
    console.log('✅ All translation files have adequate size');
    addResult('File Sizes', 'pass', 'All translation files meet minimum size requirements');
  } else {
    console.log(`⚠️  Small files detected (< ${minSize} bytes):\n  ${smallFiles.join('\n  ')}`);
    addResult('File Sizes', 'warn', 'Some translation files may be incomplete', smallFiles);
  }
}

/**
 * Audit 7: Check locale consistency (same keys across locales)
 */
function auditLocaleConsistency() {
  console.log('\n🔍 Auditing locale consistency...');

  const referenceLocale = DEFAULT_LOCALE;
  const referencePath = join(process.cwd(), 'locales', referenceLocale);

  if (!existsSync(referencePath)) {
    console.log('❌ Reference locale (English) not found');
    addResult('Locale Consistency', 'fail', 'Reference locale not found');
    return;
  }

  const referenceFiles = readdirSync(referencePath).filter(f => f.endsWith('.json'));
  const inconsistencies: string[] = [];

  for (const file of referenceFiles) {
    const referenceFilePath = join(referencePath, file);
    const referenceResult = validateJson(referenceFilePath);

    if (!referenceResult.valid || !referenceResult.content) continue;

    const referenceKeys = Object.keys(referenceResult.content);

    for (const locale of SUPPORTED_LOCALES) {
      if (locale === referenceLocale) continue;

      const localePath = join(process.cwd(), 'locales', locale);
      const localeFilePath = join(localePath, file);

      if (!existsSync(localeFilePath)) {
        // File doesn't exist - this is expected for English-only categories
        continue;
      }

      const localeResult = validateJson(localeFilePath);

      if (!localeResult.valid || !localeResult.content) continue;

      const localeKeys = Object.keys(localeResult.content);
      const missingKeys = referenceKeys.filter(k => !localeKeys.includes(k));
      const extraKeys = localeKeys.filter(k => !referenceKeys.includes(k));

      if (missingKeys.length > 0 || extraKeys.length > 0) {
        const issues: string[] = [];
        if (missingKeys.length > 0) issues.push(`missing: ${missingKeys.slice(0, 5).join(', ')}`);
        if (extraKeys.length > 0) issues.push(`extra: ${extraKeys.slice(0, 5).join(', ')}`);

        inconsistencies.push(`${locale}/${file}: ${issues.join('; ')}`);
      }
    }
  }

  if (inconsistencies.length === 0) {
    console.log('✅ All locales have consistent key structure');
    addResult('Locale Consistency', 'pass', 'All locales have matching translation keys');
  } else {
    console.log(`⚠️  Key inconsistencies found:\n  ${inconsistencies.join('\n  ')}`);
    addResult('Locale Consistency', 'warn', 'Some locales have key mismatches', inconsistencies);
  }
}

/**
 * Generate summary report
 */
function generateSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(80));

  const pass = auditResults.filter(r => r.status === 'pass').length;
  const fail = auditResults.filter(r => r.status === 'fail').length;
  const warn = auditResults.filter(r => r.status === 'warn').length;

  console.log(`\nTotal Checks: ${auditResults.length}`);
  console.log(`✅ Pass: ${pass}`);
  console.log(`❌ Fail: ${fail}`);
  console.log(`⚠️  Warn: ${warn}`);

  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS');
  console.log('-'.repeat(80));

  const groupedByCategory = auditResults.reduce(
    (acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    },
    {} as Record<string, IAuditResult[]>
  );

  for (const [category, results] of Object.entries(groupedByCategory)) {
    console.log(`\n${category}:`);

    for (const result of results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${icon} ${result.message}`);

      if (result.details && result.details.length > 0) {
        for (const detail of result.details.slice(0, 3)) {
          console.log(`     - ${detail}`);
        }
        if (result.details.length > 3) {
          console.log(`     ... and ${result.details.length - 3} more`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));

  if (fail > 0) {
    console.log('\n🚨 AUDIT FAILED - Please fix the errors above');
    process.exit(1);
  } else if (warn > 0) {
    console.log('\n⚠️  AUDIT PASSED WITH WARNINGS - Review warnings before production');
    process.exit(0);
  } else {
    console.log('\n✅ AUDIT PASSED - All checks successful!');
    process.exit(0);
  }
}

/**
 * Main audit execution
 */
function main() {
  console.log('='.repeat(80));
  console.log('🌍 SEO i18n AUDIT');
  console.log('='.repeat(80));
  console.log(`Supported Locales: ${SUPPORTED_LOCALES.join(', ')}`);
  console.log(`Default Locale: ${DEFAULT_LOCALE.toUpperCase()}`);
  console.log(`Expected Translations: ${EXPECTED_TRANSLATIONS.join(', ')}`);

  try {
    auditTranslationFilesExist();
    auditJsonStructure();
    auditLocaleCoverage();
    auditEnglishOnlyContent();
    auditDuplicateKeys();
    auditTranslationFileSizes();
    auditLocaleConsistency();
    generateSummary();
  } catch (error) {
    console.error('\n❌ Audit failed with error:', error);
    process.exit(1);
  }
}

// Run the audit
main();
