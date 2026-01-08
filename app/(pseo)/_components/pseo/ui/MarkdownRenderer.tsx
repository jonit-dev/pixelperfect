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
    // Lazily initialize DOMPurify only on client side
    const DOMPurify = useMemo(() => {
      if (typeof window !== 'undefined') {
        return createDOMPurify(window);
      }
      return null;
    }, []);

    // Return empty div during SSR
    if (!DOMPurify) {
      return <div className={className} />;
    }

    // Parse markdown and sanitize HTML
    const html = DOMPurify.sanitize(marked.parse(content) as string);

    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';
