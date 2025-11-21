# Supabase Instructions

## Workflow

- **Migrations**: Always use migrations for schema changes. Do not edit database directly in production.
- **Local Dev**: Use `supabase start` and `supabase stop`.
- **Types**: Generate types with `supabase gen types typescript --local > src/types/supabase.ts`.

## Security

- **RLS**: Enable Row Level Security on ALL tables.
- **Policies**: Write policies for SELECT, INSERT, UPDATE, DELETE explicitly.

## Edge Functions

- Develop in `supabase/functions`.
- Use `deno` for runtime.
