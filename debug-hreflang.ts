/**
 * Debug script to check hreflang generation
 */

import { generateHreflangAlternates } from './lib/seo/hreflang-generator';

const path = '/tools/ai-image-upscaler';
const alternates = generateHreflangAlternates(path);

console.log('Hreflang alternates for:', path);
console.log(JSON.stringify(alternates, null, 2));
