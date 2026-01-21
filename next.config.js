import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // Keep TypeScript checking enabled
    ignoreBuildErrors: false,
  },
  // IMPORTANT: Disabled trailingSlash to prevent 308 redirects on API routes (especially webhooks)
  // trailingSlash: true causes Stripe webhooks to fail with 308 redirects
  // SEO trailing slashes are handled via explicit redirects below instead
  // Standalone output for OpenNext/Cloudflare deployment
  output: 'standalone',
  // Transpile packages for proper ESM handling
  transpilePackages: ['react-markdown', 'remark-gfm', 'unified', 'bail'],
  // Performance optimizations
  images: {
    unoptimized: process.env.OPENNEXT ? true : false,
    // Allow external images from dicebear for avatars
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
  },
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'date-fns',
      '@supabase/supabase-js',
      'framer-motion',
      'stripe',
      'marked',
      'zod',
      'zustand',
    ],
  },
  // External packages that shouldn't be bundled into the server
  serverExternalPackages: [],
  // Webpack configuration for bundle size optimization
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Enable server-side minification
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
  async redirects() {
    return [];
  },
  // Headers handled by middleware (lib/middleware/securityHeaders.ts)
  // Static asset caching handled by Cloudflare CDN automatically
};

// Initialize OpenNext for local development with Cloudflare bindings
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare')
    .then(({ initOpenNextCloudflareForDev }) => {
      initOpenNextCloudflareForDev();
    })
    .catch(() => {
      // Ignore if not installed yet
    });
}

export default withNextIntl(nextConfig);
