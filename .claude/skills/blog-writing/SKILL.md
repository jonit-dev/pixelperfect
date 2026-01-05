---
name: blog-writing
description: Write SEO-optimized blog posts for MyImageUpscaler. Use when creating new blog content, optimizing existing posts, or planning content strategy.
---

# Blog Writing Skill

## Quick Reference

### Directory Structure

```
content/blog/              # Blog posts (MDX format)
├── *.mdx                  # Individual posts
app/blog/
├── page.tsx               # Blog listing page
└── [slug]/page.tsx        # Individual post page
public/before-after/       # Before/after comparison images
├── girl-before.webp
├── girl-after.webp
├── women-before.webp
└── women-after.webp
```

## Blog Post Format

### Frontmatter (Required)

```yaml
---
title: "Post Title - Include Primary Keyword"
description: "150-160 chars. Include keyword and value prop. End with action."
date: "YYYY-MM-DD"
author: "MyImageUpscaler Team"
category: "Tutorials" | "Comparisons" | "E-commerce" | "Tips"
tags: ["tag1", "tag2", "tag3", "tag4"]
image: "/blog/images/post-cover.jpg"  # Optional: OG image
---
```

### Content Structure

1. **Hook** (1-2 paragraphs) - Identify problem, connect emotionally
2. **Context** - Why this matters, statistics if available
3. **Main Sections** (3-5) - H2 headers, actionable content
4. **Callouts** - Tips, warnings, info boxes
5. **CTA** - Link to `/upscaler` or `/pricing`

## Writing Guidelines

### SEO Optimization

- **Title**: 50-60 chars, primary keyword near start
- **Description**: 150-160 chars, keyword + benefit + CTA
- **H1**: Match title or slight variation
- **H2s**: Include secondary keywords naturally
- **Intro**: Primary keyword in first 100 words
- **Internal links**: Link to `/pricing`, other blog posts

### Keyword Targeting

Reference `/docs/SEO/keywords.csv` for keyword research:

| Volume | Priority | Example                                         |
| ------ | -------- | ----------------------------------------------- |
| 500K+  | High     | "image upscaler", "ai photo enhancer"           |
| 50K+   | Medium   | "upscale image to 4k", "free image upscaler"    |
| 5K+    | Low      | "best ai upscaler", "photo resolution enhancer" |

### Content Components

#### Callout Types

```mdx
<Callout type="tip">Pro tip content here.</Callout>

<Callout type="info">Informational content here.</Callout>

<Callout type="warning">Warning or caution content here.</Callout>
```

#### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Data 1   | Data 2   | Data 3   |
```

#### Code Blocks

```markdown
\`\`\`
Code or formula here
\`\`\`
```

#### Images

Reference images from `/public/` using absolute paths:

```markdown
![Alt text](/before-after/girl-before.webp)
```

For before/after comparisons:

```markdown
| Before                                               | After                                              |
| ---------------------------------------------------- | -------------------------------------------------- |
| ![Before upscaling](/before-after/women-before.webp) | ![After upscaling](/before-after/women-after.webp) |
```

## Sourcing Images from Public APIs

Use free stock photo APIs to add relevant images to blog posts. Download and save to `/public/blog/images/`.

### Unsplash API

**Source URL Pattern:**

```
https://unsplash.com/photos/{photo-id}
```

**Direct Image URL (for downloading):**

```
https://images.unsplash.com/photo-{id}?w=1200&q=80
```

**How to find images:**

1. Search on [unsplash.com](https://unsplash.com) for relevant terms
2. Find a suitable image and copy the photo ID from URL
3. Download using the direct URL pattern above
4. Save to `/public/blog/images/{post-slug}/`

**Example workflow:**

```bash
# Create directory for post images
mkdir -p public/blog/images/restore-old-photos

# Download image (use curl or wget)
curl -o public/blog/images/restore-old-photos/vintage-camera.jpg \
  "https://images.unsplash.com/photo-1542567455-cd733f23fbb1?w=1200&q=80"
```

**Attribution:** Unsplash images are free to use without attribution, but credit is appreciated:

```markdown
![Vintage camera on wooden table](/blog/images/restore-old-photos/vintage-camera.jpg)
_Photo by [Photographer Name](https://unsplash.com/@username) on Unsplash_
```

### Other Free Image Sources

| Source       | URL           | License                       | Best For               |
| ------------ | ------------- | ----------------------------- | ---------------------- |
| Unsplash     | unsplash.com  | Free, no attribution required | High-quality photos    |
| Pexels       | pexels.com    | Free, no attribution required | Lifestyle, business    |
| Pixabay      | pixabay.com   | Free, no attribution required | Illustrations, vectors |
| Lorem Picsum | picsum.photos | Free placeholder              | Development/testing    |

### Image Guidelines for Blog Posts

1. **Download and host locally** - Don't hotlink to external URLs
2. **Optimize file size** - Use WebP format, max 200KB per image
3. **Consistent dimensions** - 1200x630 for hero images (OG compatible)
4. **Descriptive filenames** - `vintage-photo-album.webp` not `img123.webp`
5. **Alt text required** - Describe the image for accessibility and SEO

### Directory Structure for Blog Images

```
public/blog/images/
├── {post-slug}/           # Per-post image folder
│   ├── hero.webp          # Main/OG image
│   ├── step-1.webp        # Tutorial steps
│   └── comparison.webp    # Before/after
└── shared/                # Reusable across posts
    ├── upscaler-ui.webp
    └── quality-comparison.webp
```

### Quick Image Download Script

```bash
# Function to download and optimize Unsplash image
download_blog_image() {
  local photo_id=$1
  local output_path=$2
  curl -sL "https://images.unsplash.com/photo-${photo_id}?w=1200&q=80" -o "${output_path}"
}

# Usage
download_blog_image "1542567455-cd733f23fbb1" "public/blog/images/my-post/hero.jpg"
```

## Category Guidelines

### Tutorials

- Step-by-step instructions
- Clear numbered steps
- Expected outcomes
- Troubleshooting tips
- Tags: ["tutorials", "how-to", specific topic]

### Comparisons

- Objective criteria
- Tables for easy scanning
- Clear winner recommendation
- Tags: ["comparison", "reviews", tool names]

### E-commerce

- Business-focused benefits
- ROI calculations
- Platform-specific tips (Amazon, Shopify, eBay)
- Tags: ["e-commerce", "product photography", platform names]

### Tips

- Quick, actionable advice
- Bullet points preferred
- Visual examples
- Tags: ["tips", "quick tips", specific topic]

## Product Mentions

### Natural Integration

- Mention myimageupscaler.com benefits organically
- Highlight differentiators:
  - Text/logo preservation (unique strength)
  - No watermarks on output
  - Fast processing (30-60 seconds)
  - E-commerce optimization
  - 10 free credits

### CTAs

End with clear call-to-action:

```markdown
---

Ready to enhance your images? [Try myimageupscaler.com free](/pricing) — 10 credits, no credit card required.
```

## Validation Checklist

Before publishing:

- [ ] Title is 50-60 characters with primary keyword
- [ ] Description is 150-160 characters with CTA
- [ ] Date is in YYYY-MM-DD format
- [ ] Category matches allowed values
- [ ] 3-5 relevant tags included
- [ ] Primary keyword in first 100 words
- [ ] 2+ internal links to /pricing or other blog posts
- [ ] At least one image reference or table
- [ ] Callouts used for tips/warnings
- [ ] CTA at end of post
- [ ] No broken image paths
- [ ] `yarn verify` passes

## Existing Posts Reference

| Slug                                          | Topic                      | Category    | Keywords Covered                           |
| --------------------------------------------- | -------------------------- | ----------- | ------------------------------------------ |
| ai-image-enhancement-ecommerce-guide          | E-commerce AI enhancement  | E-commerce  | AI enhancement, product photos, conversion |
| best-free-image-upscalers-comparison          | Free tool comparison       | Comparisons | free upscaler, comparison, reviews         |
| how-to-upscale-images-without-losing-quality  | Quality upscaling tutorial | Tutorials   | upscale, quality, AI upscaling             |
| keep-text-sharp-when-upscaling-product-photos | Text preservation          | Tutorials   | text preservation, product labels          |

## Topic Ideas (Uncovered Keywords)

High-priority topics not yet covered:

1. **Old Photo Restoration** - "restore old photos ai", "old photo enhancer"
2. **Social Media Optimization** - "instagram image size", "facebook photo dimensions"
3. **Print Preparation** - "image resolution for printing", "DPI for print"
4. **Batch Processing** - "bulk image upscaler", "batch photo enhancement"
5. **Format Conversion** - "png vs jpg quality", "best image format"
6. **Wallpaper/4K Content** - "upscale to 4k", "wallpaper upscaler"
7. **Photo Enlargement** - "enlarge photo without blur", "photo enlarger"

## File Naming Convention

```
kebab-case-with-primary-keyword.mdx

Examples:
✅ restore-old-photos-ai-enhancement.mdx
✅ social-media-image-sizes-2024.mdx
❌ OldPhotoRestore.mdx (wrong case)
❌ photo_restore.mdx (underscores)
```
