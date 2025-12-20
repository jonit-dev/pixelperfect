# App Directory

## Overview

This directory contains the Next.js 15 App Router structure with all route handlers, pages, and layouts.

## Structure

### Route Pages

- `app/page.tsx` - Landing page
- `app/dashboard/` - User dashboard area
- `app/blog/` - Blog listing and individual blog posts
- `app/pricing/` - Pricing page with subscription plans
- `app/upscaler/` - Main image upscaler tool
- `app/privacy/`, `app/terms/` - Legal pages
- `app/help/` - Help and documentation pages
- `app/success/`, `app/canceled/` - Stripe checkout result pages

### API Routes

- `app/api/` - All API endpoints
  - Stripe webhooks (`/api/webhooks/stripe`)
  - Supabase authentication endpoints
  - File upload and processing endpoints

### Layouts

- `app/layout.tsx` - Root layout with providers
- `app/dashboard/layout.tsx` - Dashboard-specific layout
- Other route-specific layouts

## Key Files

- `app/providers.tsx` - React Query and other providers
- `app/globals.css` - Global Tailwind CSS styles
- `app/middleware.ts` - Next.js middleware for auth and routing

## Rules

- All pages must use Server Components by default
- Client Components should be marked with `"use client"`
- API routes handle validation and error responses
- Use consistent loading and error states across routes
