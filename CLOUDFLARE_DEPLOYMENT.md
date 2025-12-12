# Cloudflare Worker Deployment Guide

This guide explains how to deploy your devjournal.io blog to Cloudflare Workers.

## Prerequisites

- A Cloudflare account ([sign up here](https://dash.cloudflare.com/sign-up))
- Node.js and pnpm installed
- Project dependencies installed (`pnpm install`)

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will install Wrangler CLI and all other dependencies.

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window for you to authorize Wrangler with your Cloudflare account.

### 3. Configure Your Worker (Optional)

Edit `wrangler.jsonc` to customize:
- `name`: Your worker name (currently: `devjournal-io`)
- `compatibility_date`: Cloudflare Workers compatibility date
- `vars`: Environment variables

## Deployment

### Production Deployment

Build and deploy to production:

```bash
pnpm deploy
```

This command will:
1. Build your Astro site (`pnpm build`)
2. Deploy the worker to Cloudflare

### Preview Deployment

Test deployment without publishing:

```bash
pnpm deploy:preview
```

### Local Development

Run the worker locally with Wrangler:

```bash
pnpm worker:dev
```

This starts a local development server that simulates the Cloudflare Workers environment.

## Worker Features

The Cloudflare Worker includes:

- ✅ **Static Asset Serving**: Serves your built Astro site from the edge
- ✅ **Security Headers**: Adds security headers (X-Frame-Options, CSP, etc.)
- ✅ **Smart Caching**: Implements caching strategies for static assets
- ✅ **Trailing Slash Handling**: Properly handles Astro's trailing slash URLs
- ✅ **Global Edge Network**: Deployed to Cloudflare's global CDN

## Custom Domain

To add a custom domain:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your worker (`devjournal-io`)
4. Go to Settings → Triggers
5. Add your custom domain or route

## Environment Variables

To add environment variables:

1. Edit `wrangler.jsonc` and add to the `vars` section, or
2. Use Wrangler secrets for sensitive data:

```bash
npx wrangler secret put SECRET_NAME
```

## Troubleshooting

### Build Errors

If you encounter build errors, ensure:
- All dependencies are installed: `pnpm install`
- The Astro build succeeds: `pnpm build`

### Deployment Fails

- Verify you're authenticated: `npx wrangler whoami`
- Check your Cloudflare account has Workers enabled
- Review the error message for specific issues

### 404 Errors

The worker handles Astro's trailing slash behavior. If you're getting 404s:
- Ensure your `astro.config.mjs` has `trailingSlash: "always"` (already configured)
- Check that the build output exists in `./dist`

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
