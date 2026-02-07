# MCP Server Fly.io Deployment

## Quick Start

```bash
fly launch
fly secrets set LLM_API_KEY=your-key-here LOG_LEVEL=info
fly deploy
curl https://<app>.fly.dev/health
```

## Output for Vercel

After deploy, the base URL is:

```
https://<app>.fly.dev
```

Set this in Vercel as:

```
MCP_SERVER_URL=https://<app>.fly.dev
```
