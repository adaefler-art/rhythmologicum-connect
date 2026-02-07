# MCP Server Fly.io Deployment

## Quick Start

```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=your-key-here LLM_PROVIDER=anthropic LOG_LEVEL=info
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
NEXT_PUBLIC_FEATURE_MCP_ENABLED=true
```

## Secrets Reference

MCP (Fly.io secrets):
- ANTHROPIC_API_KEY
- LLM_PROVIDER=anthropic (optional, defaults to anthropic)

Vercel (Studio app env):
- MCP_SERVER_URL
- NEXT_PUBLIC_FEATURE_MCP_ENABLED
