# Content Directory

## Overview
Static content for the application including blog posts, documentation, and user-facing content.

## Structure

### Blog (`content/blog/`)
- Blog post content in Markdown format
- Front matter with metadata (title, date, author, tags)
- Featured images and assets
- Published and draft posts

### Content Organization
- Posts organized by date/year folders if needed
- Static assets (images, files) in content folders
- Consistent naming conventions
- SEO-optimized content structure

## Blog Post Format
```markdown
---
title: "Blog Post Title"
description: "Post description for SEO"
publishedAt: "2024-01-01"
author: "Author Name"
tags: ["tag1", "tag2"]
featured: true
image: "/blog/images/post-cover.jpg"
---

# Blog Post Content

Content written in Markdown with front matter...
```

## Content Standards
- All content in Markdown format
- Use front matter for metadata
- Include SEO descriptions
- Optimize images for web (WebP format preferred)
- Use semantic HTML structure
- Include alt text for all images
- Keep content accessible and inclusive

## Processing
- Content processed by `gray-matter` for front matter
- Markdown rendered with appropriate plugins
- Images optimized during build
- Sitemap generated automatically
- RSS feed for blog content

## Asset Management
- Images stored with content or in public folder
- Use relative paths for content-specific assets
- Optimize file sizes for web performance
- Include responsive image variants where applicable