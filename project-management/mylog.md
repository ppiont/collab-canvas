# Log

Asked Claude for PRD based on collab canvas project assignment doc.
- validated PRD with claude, went through clarifications on technology choices and non-function requirements.
- Debated its choice of Railway vs Vercel/Netlify/Cloudflare etc. Says Railways is better for Svelte (my choice)

Decided with Claude to skip user stories as requirements are very clear already
- made a checklist with tasks corresponding to deployable PRs
- made architecture and user flow diagram
Initialized project. Created Railway app and deployed first commit.
Created additional environment (staging) in Railway

Created Supabase DB + Auth. Realized Google Auth in Supabase is self-owned, unlike with Auth0. Didn't want to create extra dependency, so skipped it.

