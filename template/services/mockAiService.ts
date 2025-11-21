import { ProcessingStatus, UpscaleConfig } from '../types';

// Simulates an async image processing workflow
export const processImageMock = (
  file: File, 
  config: UpscaleConfig,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Simulate Upload
    onProgress(10);
    
    setTimeout(() => {
      onProgress(30);
      
      // 2. Simulate Processing (longer wait based on scale)
      const processingTime = config.scale === 4 ? 4000 : 2000;
      
      // Simulate steps
      let currentProgress = 30;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress > 90) {
          clearInterval(interval);
        } else {
          onProgress(currentProgress);
        }
      }, processingTime / 5);

      setTimeout(() => {
        clearInterval(interval);
        onProgress(100);

        // Return a high-res placeholder to mimic result
        // In a real app, this would be the URL returned by Replicate/AWS
        // We append a random query param to prevent caching issues in demo
        const width = config.scale === 4 ? 2048 : 1024;
        const height = config.scale === 4 ? 2048 : 1024;
        resolve(`https://picsum.photos/${width}/${height}?random=${Date.now()}`);
      }, processingTime);
      
    }, 1500);
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};