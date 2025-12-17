import JSZip from 'jszip';
import { IBatchItem } from '@shared/types/pixelperfect';

/**
 * Check if URL is external (needs proxy) or internal (data URL)
 */
const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Fetch image blob, using proxy for external URLs to bypass CORS
 */
const fetchImageBlob = async (url: string): Promise<Blob> => {
  if (isExternalUrl(url)) {
    // Use proxy for external URLs (e.g., Replicate delivery URLs)
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return response.blob();
  } else {
    // Data URL - fetch directly
    const response = await fetch(url);
    return response.blob();
  }
};

export const downloadSingle = async (
  url: string | null,
  filename: string,
  mode: string
): Promise<void> => {
  if (!url) return;

  try {
    const blob = await fetchImageBlob(url);
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `pixelperfect_${mode}_${filename.split('.')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open URL in new tab
    window.open(url, '_blank');
  }
};

export const downloadBatch = async (queue: IBatchItem[], mode: string): Promise<void> => {
  const completedItems = queue.filter(item => item.status === 'COMPLETED' && item.processedUrl);

  if (completedItems.length === 0) return;

  // If only one item, just download it normally
  if (completedItems.length === 1) {
    const item = completedItems[0];
    await downloadSingle(item.processedUrl, item.file.name, mode);
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder('pixelperfect_batch');

  // Add files to zip
  const promises = completedItems.map(async item => {
    if (item.processedUrl && folder) {
      try {
        const blob = await fetchImageBlob(item.processedUrl);
        const filename = `pixelperfect_${mode}_${item.file.name.split('.')[0]}.png`;
        folder.file(filename, blob);
      } catch (error) {
        console.error(`Failed to add ${item.file.name} to zip:`, error);
      }
    }
  });

  await Promise.all(promises);

  // Generate and download zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = url;
  link.download = `pixelperfect_batch_${new Date().getTime()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
