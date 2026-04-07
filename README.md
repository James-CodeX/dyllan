# YouTube History Record Tracker

Minimal fullstack Next.js app that scans YouTube videos, fetches transcripts via Apify, detects record-breaking events with OpenRouter, and stores results in Turso SQLite using Drizzle ORM.

## Stack

- Next.js App Router (v16)
- Drizzle ORM + Turso (libSQL)
- Apify YouTube transcript actor
- OpenRouter (`qwen/qwen3.6-plus:free`)
- Tailwind CSS + shadcn-style components

## Environment Variables

Create `.env.local`:

```env
APIFY_KEY=your_apify_token
OPENROUTER_KEY=your_openrouter_token
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
```

## Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

- `POST /api/scan`
  - body: `{ "input": "youtube channel or video url" }`
  - runs the full pipeline and returns summary
- `GET /api/events`
  - returns all detected events
- `GET /api/events?videoId=...`
  - filters events by video id
- `POST /api/transcript`
  - body: `{ "videoUrl": "..." }`
  - fetches transcript for a single video

## Notes

- Channel input scans the last 12 months of feed videos.
- Processed videos are cached in Turso to avoid duplicate Apify/OpenRouter calls.
