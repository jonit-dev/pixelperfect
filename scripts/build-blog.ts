import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

function validateImage(image: string | undefined, slug: string): void {
  if (!image) {
    console.warn(`⚠️  [${slug}] Missing featured image`);
    return;
  }

  // Local paths must exist
  if (image.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', image);
    if (!fs.existsSync(localPath)) {
      throw new Error(
        `❌ [${slug}] Featured image not found: ${image}\n   Use an Unsplash URL instead, e.g.: https://images.unsplash.com/photo-XXX?w=1200&h=630&fit=crop&q=80`
      );
    }
  }

  // Must be Unsplash or local
  if (!image.startsWith('/') && !image.startsWith('https://images.unsplash.com/')) {
    console.warn(`⚠️  [${slug}] Non-Unsplash external image: ${image}`);
  }
}

interface IBlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  readingTime: string;
  content: string;
}

async function buildBlogData() {
  const postsDir = path.join(process.cwd(), 'content/blog');

  // Check if blog directory exists
  if (!fs.existsSync(postsDir)) {
    console.warn('⚠️  No blog directory found at content/blog');
    const outputPath = path.join(process.cwd(), 'content/blog-data.json');
    fs.writeFileSync(outputPath, JSON.stringify({ posts: [] }, null, 2));
    console.log('✅ Created empty content/blog-data.json');
    return;
  }

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

  if (files.length === 0) {
    console.warn('⚠️  No .mdx files found in content/blog');
    const outputPath = path.join(process.cwd(), 'content/blog-data.json');
    fs.writeFileSync(outputPath, JSON.stringify({ posts: [] }, null, 2));
    console.log('✅ Created empty content/blog-data.json');
    return;
  }

  const posts: IBlogPost[] = files
    .map(filename => {
      const slug = filename.replace(/\.mdx$/, '');
      const content = fs.readFileSync(path.join(postsDir, filename), 'utf8');
      const { data, content: markdown } = matter(content);

      // Validate featured image
      validateImage(data.image, slug);

      return {
        slug,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        author: data.author || 'MyImageUpscaler Team',
        category: data.category || 'General',
        tags: data.tags || [],
        image: data.image,
        readingTime: readingTime(markdown).text,
        content: markdown,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const outputPath = path.join(process.cwd(), 'content/blog-data.json');
  fs.writeFileSync(outputPath, JSON.stringify({ posts }, null, 2));

  console.log(`✅ Built ${posts.length} blog posts to content/blog-data.json`);
}

buildBlogData().catch(error => {
  console.error('❌ Failed to build blog data:', error);
  process.exit(1);
});
