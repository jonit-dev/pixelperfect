/**
 * Replicate Output Parser Utility
 *
 * Handles the various output formats returned by Replicate API:
 * - String URLs
 * - FileOutput objects with .url property (function or string)
 * - Objects with .href property
 * - Arrays of any of the above
 */

/**
 * Extract URL string from various Replicate output formats
 */
export function extractUrl(value: unknown): string | null {
  // Handle string URLs directly
  if (typeof value === 'string') {
    return value;
  }

  // Handle objects with various URL properties
  if (value && typeof value === 'object') {
    // FileOutput objects can be converted to string (they extend URL class)
    if (typeof (value as { toString?: () => string }).toString === 'function') {
      const stringified = String(value);
      if (stringified.startsWith('http')) {
        return stringified;
      }
    }

    // Try .url property (could be string or function)
    if ('url' in value) {
      const urlValue = (value as { url: unknown }).url;
      if (typeof urlValue === 'function') {
        return urlValue();
      }
      if (typeof urlValue === 'string') {
        return urlValue;
      }
    }

    // Try .href property (URL-like objects)
    if ('href' in value && typeof (value as { href: unknown }).href === 'string') {
      return (value as { href: string }).href;
    }
  }

  return null;
}

/**
 * Parse Replicate API output and extract the image URL
 *
 * @param output - The raw output from Replicate API
 * @returns The extracted image URL
 * @throws Error if no valid URL can be extracted
 */
export function parseReplicateOutput(output: unknown): string {
  let outputUrl: string | null;

  // Handle array outputs (return first element's URL)
  if (Array.isArray(output)) {
    const first = output[0];
    outputUrl = extractUrl(first);
    if (!outputUrl) {
      throw new Error('Unexpected array output format from Replicate');
    }
    return outputUrl;
  }

  // Handle single output
  outputUrl = extractUrl(output);
  if (!outputUrl) {
    throw new Error('No output URL returned from Replicate');
  }

  return outputUrl;
}

/**
 * Detect MIME type from URL
 *
 * @param url - The image URL
 * @returns The detected MIME type
 */
export function detectMimeTypeFromUrl(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('.png')) {
    return 'image/png';
  }

  if (lowerUrl.includes('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

/**
 * Parse complete Replicate response with metadata
 *
 * @param output - The raw output from Replicate API
 * @returns Parsed response with URL, MIME type, and expiry
 */
export function parseReplicateResponse(output: unknown): {
  imageUrl: string;
  mimeType: string;
  expiresAt: number;
} {
  const imageUrl = parseReplicateOutput(output);

  if (!imageUrl) {
    throw new Error('Output URL is empty');
  }

  return {
    imageUrl,
    mimeType: detectMimeTypeFromUrl(imageUrl),
    expiresAt: Date.now() + 3600000, // 1 hour
  };
}
