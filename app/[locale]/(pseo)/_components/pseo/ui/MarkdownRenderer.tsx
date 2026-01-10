/**
 * Simple Markdown Renderer Component
 * Uses marked for reliable parsing with DOMPurify for security
 */

'use client';

import { ReactElement, memo, useMemo } from 'react';
import { marked } from 'marked';
import createDOMPurify from 'dompurify';

interface IMarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

export const MarkdownRenderer = memo(
  ({ content, className = '' }: IMarkdownRendererProps): ReactElement => {
    // Parse markdown (works on both server and client)
    const parsedMarkdown = useMemo(() => marked.parse(content) as string, [content]);

    // Lazily initialize DOMPurify only on client side
    const DOMPurify = useMemo(() => {
      if (typeof window !== 'undefined') {
        return createDOMPurify(window);
      }
      return null;
    }, []);

    // On server: render parsed markdown directly (content is trusted from our data files)
    // On client: sanitize with DOMPurify for extra safety
    const html = DOMPurify ? DOMPurify.sanitize(parsedMarkdown) : parsedMarkdown;

    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';
