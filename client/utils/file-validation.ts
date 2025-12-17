import { IMAGE_VALIDATION } from '@shared/validation/upscale.schema';

export interface IFileValidationResult {
  valid: boolean;
  reason?: 'type' | 'size';
}

export interface IProcessFilesResult {
  validFiles: File[];
  oversizedFiles: File[];
  invalidTypeFiles: File[];
  errorMessage: string | null;
}

export function validateImageFile(file: File, isPaidUser: boolean): IFileValidationResult {
  // Check file type
  if (
    !IMAGE_VALIDATION.ALLOWED_TYPES.includes(
      file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'
    )
  ) {
    return { valid: false, reason: 'type' };
  }

  // Check file size
  const maxSize = isPaidUser ? IMAGE_VALIDATION.MAX_SIZE_PAID : IMAGE_VALIDATION.MAX_SIZE_FREE;
  if (file.size > maxSize) {
    return { valid: false, reason: 'size' };
  }

  return { valid: true };
}

export function processFiles(files: File[], isPaidUser: boolean): IProcessFilesResult {
  const results = files.map(f => ({ file: f, result: validateImageFile(f, isPaidUser) }));
  const validFiles = results.filter(r => r.result.valid).map(r => r.file);
  const oversizedFiles = results
    .filter(r => !r.result.valid && r.result.reason === 'size')
    .map(r => r.file);
  const invalidTypeFiles = results
    .filter(r => !r.result.valid && r.result.reason === 'type')
    .map(r => r.file);

  let errorMessage: string | null = null;
  if (validFiles.length !== files.length) {
    const maxMB = isPaidUser ? 25 : 5;
    errorMessage = `Some files were rejected. Only JPG, PNG, WEBP under ${maxMB}MB are allowed.`;
  }

  return { validFiles, oversizedFiles, invalidTypeFiles, errorMessage };
}
