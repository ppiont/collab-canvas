# PartyKit Deployment Guide - Task 0.4

## Prerequisites

You need a PartyKit account. PartyKit is free for development and has a generous free tier.

## Step 1: Sign Up for PartyKit

1. Go to https://www.partykit.io
2. Click "Get Started" or "Sign In"
3. Sign in with GitHub (recommended)
4. You'll be taken to your dashboard

## Step 2: Deploy Your PartyKit Server

From your project directory, run:

```bash
bunx partykit deploy
```

### What Happens:
1. PartyKit will detect your `partykit.json` configuration
2. It will ask you to authenticate (if first time)
3. It will build and deploy your server to Cloudflare Workers
4. You'll get a deployment URL like: `https://collab-canvas.YOUR_USERNAME.partykit.dev`

### Expected Output:
```
✓ Built partykit/server.ts
✓ Deployed to https://collab-canvas.YOUR_USERNAME.partykit.dev
```

## Step 3: Copy Your PartyKit Host

After deployment, you'll receive a URL. Extract the **host** part (without https://):

Example:
- Full URL: `https://collab-canvas.username.partykit.dev`
- Host to use: `collab-canvas.username.partykit.dev`

## Step 4: Update Environment Variables

### Local (.env.local)
```bash
PUBLIC_PARTYKIT_HOST=collab-canvas.YOUR_USERNAME.partykit.dev
```

### Railway
1. Go to Railway dashboard → your project
2. Variables tab
3. Update `PUBLIC_PARTYKIT_HOST` with your actual host

## Step 5: Test the Deployment

Test your deployed PartyKit server:

```bash
curl https://YOUR_PARTYKIT_HOST/party/main
```

You should see:
```json
{"room":"main","connections":0,"status":"healthy"}
```

## Troubleshooting

### "partykit: command not found"
- Make sure you installed it: `bun add -d partykit`
- Use `bunx partykit deploy` instead of `partykit deploy`

### "Authentication required"
- Run `bunx partykit login`
- Follow the browser authentication flow
- Try deploying again

### "Build failed"
- Check `partykit/server.ts` for syntax errors
- Make sure `partykit.json` is valid JSON
- Run `bunx partykit dev` to test locally first

## What We Created

```
partykit/
└── server.ts          # PartyKit server with Y-PartyKit integration

partykit.json          # PartyKit configuration
```

## Next Steps

After deployment succeeds:
1. ✅ Copy your PartyKit host
2. ✅ Update `.env.local`
3. ✅ Update Railway environment variables
4. ✅ Test the connection
5. ✅ Mark Task 0.4 complete!

---

**Status:** Ready to deploy  
**Command:** `bunx partykit deploy`

