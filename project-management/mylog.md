# Dev Log

## Code Analysis

~100% of the code was written by AI. I've run a few cli commands myself: To initialize my SvelteKit project with Bun and to deploy PartyKit. That + ClickOps in Cloudflare, Auth0 and Railway is the extent of my involvement. I don't recall intervening in code.

## Tools and Workflow

I used the following tools:

### Claude App

For project planning, I used Claude. I followed an approach similar to what Ash showcased on Day 1, except I skipped the user stories, as the requirements were pretty clear cut already. During later user testing I discovered UX shortfalls that I solved ad-hoc by letting Claude create user stories for them. I did not integrate these non-functional requirements to my PRD or Task list, but I did include details of their implementation in commits and PRs.

### Cursor

For coding. Cursor was my main SWE, and I tried to keep it focused on that. Anchoring it on the PRD and Tasks list allowed it to be super self-driven, even when switching to a fresh context. When it got stuck on small issues, I would try a new context and ask it to parse and reframe the problem. If I sensed that issues were indicative of systemic problems, I'd go back to Claude in Planning mode with extended thinking + web research to hash it out.

### Aqua

Used mainly for conversing with Claude in the initial planning phase. It's fantastic to be able to read, parse and respond to a large chunk of text, point by point, and respond to it in real time, without having to avert your eyes/scroll and shift focus back and forth between writing and reading. For smaller comments or commands to Cursor, the overhead isn't always worth it. But I'm using it more and more, as I get comfortable with it.

### Sourcery AI

I've connected Sourcery AI with GitHub to review my PRs and make suggestions. It outputs suggestions in a format that is geared toward LLM prompting. These I feed back into Cursor.


### MCPs
I've relied heavily on GitKraken, GitHub MCPs for structuring and writing commits and PRs. 
To debug app behavior and frontend errors, I began using Google-DevTools MCP on the recommendation of another Gauntleteer. It's mindblowingly efficient!


## Semi-chronological timeline of things I remembered to jot down.
1. Asked Claude for PRD based on collab canvas project assignment doc.
2. Validated PRD with claude, went through clarifications on technology choices and functional requirements.
3. Debated its choice of Railway vs Vercel/Netlify/Cloudflare etc. Says Railways is better for Svelte. Svelte was a hard lock, because I like shiny things.
4. Decided with Claude to skip user stories as requirements are very clear already
5. Made a checklist with tasks corresponding to deployable PRs
6. Made architecture and user flow diagrams
7. Initialized project. Created Railway app and deployed first commit.
8. Created additional environment (staging) in Railway
9. Created Supabase application. Configured Email Authentication with Password and Passwordless Email (magic link). Decided against Google OAuth to avoid extra dependencies and complexity.
10. Struggling a lot with PartyKit's global edge service. Can't deploy. Dev server works perfectly. Risky decision not to change arch. But it's just so buttery smooth.
11. Since I skipped Google Auth, made Claude adapt project plan.
12. Tested, fixed online counter. Decided to make Cursor add shape resizing and drag mode hint visual ad hoc. Diverging from the Tasks is actually very robust, since the PRD created by Claude was BULLET PROOF. I'm only DELETING stuff or adding non-functional improvements.
13. PartyKit's free managed service was [temporarily down](https://github.com/partykit/partykit/issues/971) so I had to host it on Cloudflare Workers + Durable Objects. 
14. Lots of UI/UX was polished here. Learning to better manage context window when vibe coding, and to utilize AI to write commit msg and PRs autonomously (my allowlist is growing!).
15. Added Google Auth back in. Screw Supabase - don't want it for auth because of Firebase dependency for Google Auth. Deployed Auth0 instead.
16. Really beginning to lean heavily into Google Dev-Tools MCP. It cuts down my debugging time by literally 10x+.

## Major learnings:
- Context is alpha-omega.
- MCPs are OP
- AI powers the ship but I've still gotta steer it. Could have avoided a lot of Supabase confusion, deployment and teardown if I'd spent a bit more time investigating things outside my knowledge zone. I initially thought its persistence was necessary, because I didn't understand PartyKit (Claude just argued convincingly for it).
- Cursor "add Docs" with links functionality (shown by Zac(?)). Highly efficient. Cursor is inept at finding the most basic documentation online on its own.
