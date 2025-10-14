# Dev Log

## Tools and Workflow

I used the following tools:

### Claude App

For project planning, I used Claude. I followed an approach similar to what Ash showcased on Day 1, except I skipped the user stories, as the requirements were pretty clear cut already. During later user testing I discovered UX shortfalls that I solved ad-hoc by letting Claude create user stories for them. I did not integrate these non-functional requirements to my PRD or Task list, but I did include details of their implementation in commits and PRs.

### Cursor

For coding. Cursor was my main SWE, and I tried to keep it focused on that. When it got stuck on small issues, I would try a new context and ask it to parse and reframe the problem. If I sensed that issues were indicative of systemic problems, I'd go back to Claude in Planning mode with extended thinking + web research to hash it out.

### Aqua

Used mainly for conversing with Claude in the initial planning phase. It's fantastic to be able to read, parse and respond to a large chunk of text, point by point, and respond to it in real time, without having to avert your eyes/scroll and shift focus back and forth between writing and reading. For smaller comments or commands to Cursor, the overhead isn't always worth it. But I'm using it more and more, as I get comfortable with it.

### Sourcery AI

I've connected Sourcery AI with GitHub to review my PRs and make suggestions. It outputs suggestions in a format that is geared toward LLM prompting.

Asked Claude for PRD based on collab canvas project assignment doc.
- validated PRD with claude, went through clarifications on technology choices and non-function requirements.
- Debated its choice of Railway vs Vercel/Netlify/Cloudflare etc. Says Railways is better for Svelte (my choice)

Decided with Claude to skip user stories as requirements are very clear already
- made a checklist with tasks corresponding to deployable PRs
- made architecture and user flow diagram
Initialized project. Created Railway app and deployed first commit.
Created additional environment (staging) in Railway

Created Supabase DB + Auth. Realized Google Auth in Supabase is self-owned, unlike with Auth0. Didn't want to create extra dependency, so skipped it.

Struggling a lot with PartyKit's global edge service. Can't deploy. Dev server works perfectly. Risky decision not to change arch. But it's just so buttery.

Phase 2: skipped Google Auth, made Claude adapt project plan.

Phase 4: Tested, fixed online counter. Decided to makde Cursor add shape resizing and drag mode hint ad hoc.

Phase 5 and 6. Lots of UI/UX was polished during this. Learning to manage context window and utilize AI to write commit msg and PRs.

```sh
bunx partykit deploy --domain collab-canvas.piontek0.workers.dev
```

Phase 7: Discovered that PartyKit's `persist: true` option automatically handles all persistence via Cloudflare Durable Objects. No Supabase Storage integration needed! State survives indefinitely across disconnects and server restarts. This is a huge win - removed 2 tasks and simplified the architecture significantly. The PRD initially specified a 60-second snapshot interval to Supabase Storage, but Durable Objects handle this automatically and more reliably.

**Key learning:** Always verify if infrastructure provides features before implementing them yourself. PartyKit's Durable Objects persistence is production-grade and requires zero configuration beyond `persist: true`.

**MVP Status:** ✅ COMPLETE - All 15 tasks done, fully deployed and working perfectly.