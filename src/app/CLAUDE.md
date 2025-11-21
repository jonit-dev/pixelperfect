# App Router Instructions

## Architecture

- **Server Components**: Default. Use for data fetching, sensitive logic.
- **Client Components**: Use `'use client'` only when interactivity (hooks, event listeners) is needed.
- **Layouts**: Use `layout.tsx` for shared UI; `template.tsx` for re-mounting on navigation.

## Data Fetching

- Fetch data in Server Components directly via `await`.
- Use `Suspense` for streaming UI.
- Avoid `useEffect` for data fetching unless absolutely necessary.

## Routing

- Use `next/link` for navigation.
- Use `useRouter` hook for programmatic navigation (Client Components only).
