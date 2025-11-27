# Public Directory

## Overview
Static assets that are served directly from the root URL. Files in this directory are accessible via `/filename`.

## Structure

### Images
- `icons/` - Favicon and app icons (multiple sizes)
- `images/` - Static images used throughout the site
- `og-image.png` - Default Open Graph image for social sharing

### Files
- `robots.txt` - Search engine crawling instructions
- `sitemap.xml` - Site sitemap for SEO
- `ads.txt` - Google ads verification (if applicable)
- `_redirects` - Netlify/Vercel redirect rules

### Configuration
- `manifest.json` - Progressive Web App manifest
- `.well-known/` - Domain verification files

## Key Files

### Favicon and Icons
- Multiple formats: `.ico`, `.png`, `.svg`
- Sizes: 16x16, 32x32, 192x192, 512x512
- Apple touch icon for iOS
- PWA icons for installed apps

### SEO Files
- `robots.txt` - Control search engine crawling
- `sitemap.xml` - Help search engines discover pages
- Open Graph images for social media sharing

## Asset Optimization
- Use WebP format for photographs
- Compress images for web performance
- Include responsive image variants
- Use appropriate file sizes for each use case
- Implement lazy loading where applicable

## Security Considerations
- No sensitive files in public directory
- Use Content-Security-Policy headers
- Implement proper MIME types
- Consider Subresource Integrity (SRI) for critical files

## Naming Conventions
- Use kebab-case for file names
- Include dimensions in image names where helpful
- Use descriptive names for SEO benefits
- Keep names concise but meaningful

## Performance
- Minimize number of files
- Use appropriate compression
- Consider CDN for static assets
- Implement caching strategies
- Use modern image formats (WebP, AVIF)