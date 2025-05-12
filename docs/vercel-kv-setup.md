# Setting Up Vercel KV for IMAP Sync Progress Storage

The IMAP Sync application now uses Vercel KV (Redis) for tracking progress across serverless function invocations. This document explains how to set up Vercel KV for your deployment.

## Why Vercel KV?

In a serverless environment like Vercel, each API route execution happens in an isolated Lambda function. This means:

1. In-memory variables don't persist between requests
2. Different users or even the same user's requests might be handled by different instances
3. The SSE stream and the sync process likely run on separate instances

Vercel KV (Redis) provides a persistent, low-latency shared storage that works across these instances.

## Setting Up Vercel KV

### 1. Create a Vercel KV Database

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the Storage tab
3. Click "Create" and select "KV Database"
4. Follow the prompts to create your KV database
5. Take note of the connection details

### 2. Add Environment Variables

Add the following environment variables to your Vercel project:

```
KV_URL=your-kv-connection-url
KV_REST_API_URL=your-kv-rest-api-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-read-only-token
```

### 3. Local Development

For local development, you can use the Vercel CLI to pull environment variables:

```bash
vercel env pull .env.local
```

This creates a `.env.local` file with your KV credentials that the application will use in development mode.

## Fallback for Development

The application includes a fallback to in-memory storage when Vercel KV is not available. This is useful for:

- Local development without setting up KV
- Testing in environments without KV access

However, this fallback will display a warning message in the console since progress data won't persist between serverless invocations.

## Redis TTL (Time-to-Live)

Progress data is stored with a 24-hour TTL to automatically clean up old sessions. You can adjust this by modifying the `PROGRESS_TTL` constant in `progress-store.ts`.

## Monitoring Usage

Monitor your Vercel KV usage through the Vercel dashboard to ensure you stay within your plan limits.
