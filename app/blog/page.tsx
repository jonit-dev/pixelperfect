import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@server/blog';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { clientEnv } from '@shared/config/env';

export const metadata: Metadata = {
  title: 'Blog - Image Enhancement Tips & Guides',
  description: `Learn about AI image upscaling, photo enhancement techniques, and tips for e-commerce product photography. Expert guides from ${clientEnv.APP_NAME}.`,
  openGraph: {
    title: `Blog - Image Enhancement Tips & Guides | ${clientEnv.APP_NAME}`,
    description:
      'Learn about AI image upscaling, photo enhancement techniques, and tips for e-commerce product photography.',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-base">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Image Enhancement Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert tips, tutorials, and guides on AI image upscaling, photo restoration, and
            e-commerce photography optimization.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl shadow-sm border border-border">
              <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {posts.map(post => (
                <article
                  key={post.slug}
                  className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                >
                  {post.image && (
                    <div className="aspect-video bg-surface-light relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent-light/20" />
                    </div>
                  )}
                  <div className="p-6 md:p-8">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface text-accent">
                        {post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl md:text-2xl font-semibold text-primary mb-3 group-hover:text-accent transition-colors">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-4 line-clamp-2">{post.description}</p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {post.readingTime}
                      </span>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-surface text-muted-foreground"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More Link */}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-accent font-medium hover:text-accent-hover transition-colors group/link"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Enhance Your Images?</h2>
          <p className="text-accent-foreground mb-8 text-lg">
            Try our AI-powered image upscaler and see the difference for yourself.
          </p>
          <Link
            href="/upscaler"
            className="inline-flex items-center gap-2 px-8 py-4 bg-surface text-accent font-semibold rounded-xl hover:bg-accent-hover transition-colors"
          >
            Try {clientEnv.APP_NAME} Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
