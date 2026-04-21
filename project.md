# 📌 PROJECT.md

## YouTube History Record Tracker (Next.js + Apify)

Link https://dylanpage.vercel.app

---

## 🧠 Overview

This project scans YouTube videos from a specific channel (e.g. Dylan), extracts transcripts using **Apify**, and uses AI to detect:

> “history made” or “record-breaking” events

The system is designed to be **simple, reliable, and minimal**, using:

- **Next.js (fullstack)**
- **SQLite database**
- **Apify for transcripts**
- **OpenRouter (Qwen) for AI**

---

## ⚙️ Tech Stack

### Fullstack App

- **Next.js (App Router)**
- **Next.js API routes (backend logic)**

### Styling

- Tailwind CSS

### External Services

- **Apify Actor** (YouTube Transcript Scraper)
- **OpenRouter API**
  - Model: `qwen/qwen3.6-plus:free`

### Database

- **SQLite (local file DB)**
  - Access via Prisma or Drizzle ORM

---

## 🏗️ Architecture

```text
Next.js Frontend (UI)
        ↓
Next.js API Routes (/api/*)
        ↓
-------------------------
| Apify (transcripts)   |
| OpenRouter (AI)       |
-------------------------
        ↓
SQLite Database
```

---

## 🔄 Workflow

### 1. Input

- User enters:
  - YouTube video URL OR
  - Channel URL

---

### 2. Fetch Videos

- Get videos (last 1 year)
- Sort newest → oldest

---

### 3. Get Transcript (Apify)

Send request to Apify Actor:

```bash
POST https://api.apify.com/v2/acts/bbqmsPr0r519A0ZaV/runs?token=YOUR_API_KEY
```

#### Body:

```json
{
  "startUrls": [{ "url": "https://www.youtube.com/watch?v=VIDEO_ID" }]
}
```

---

### 4. Poll for Results

```bash
GET https://api.apify.com/v2/actor-runs/{runId}/dataset/items
```

👉 Returns transcript text

---

### 5. AI Processing

Send transcript to OpenRouter:

Prompt:

```text
Extract any "history made" or "record-breaking" events.

Return JSON:
[
  {
    "event": "...",
    "description": "...",
    "timestamp": "..."
  }
]

If none, return [].
```

---

### 6. Store in SQLite

Save:

- video_id
- title
- transcript (optional)
- event
- description
- timestamp
- created_at

---

## 🧩 Project Structure

```bash
app/
│── page.tsx                # Dashboard
│── events/page.tsx         # Events list
│
│── api/
│   ├── scan/route.ts       # main pipeline
│   ├── transcript/route.ts # apify calls
│   ├── events/route.ts     # fetch events
│
lib/
│── apify.ts
│── openrouter.ts
│── db.ts
│── youtube.ts
│
prisma/ or drizzle/
│── schema
```

---

## 🔌 API Routes

### POST `/api/scan`

Triggers full pipeline:

- Fetch videos
- Call Apify
- Process with AI
- Store results

---

### GET `/api/events`

Returns all detected events

---

### GET `/api/events?videoId=...`

Returns events for a specific video

---

## 🧠 Apify Integration

### Example (`lib/apify.ts`)

```ts
export async function runApify(videoUrl: string) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/bbqmsPr0r519A0ZaV/runs?token=${process.env.APIFY_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startUrls: [{ url: videoUrl }],
      }),
    },
  );

  return res.json();
}
```

---

## 🧠 OpenRouter Integration

### Example (`lib/openrouter.ts`)

```ts
export async function analyze(text: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.6-plus:free",
      messages: [
        {
          role: "user",
          content: `Extract history-making events:\n${text}`,
        },
      ],
    }),
  });

  return res.json();
}
```

---

## 🎨 Frontend UI

### 1. Dashboard

- Input field (channel / video URL)
- Button: **Scan**
- Progress indicator

---

### 2. Events Page

- Cards:
  - Video title
  - Event summary
  - Timestamp
  - Link to video

---

### 3. Video View (optional)

- Show transcript
- Highlight detected events

---

## 🧼 Design Goals

- Simple
- Clean UI
- Fast interactions
- Minimal clicks

---

## 🚀 MVP Features

- [x] Scan single video
- [x] Fetch transcript via Apify
- [x] Extract events via AI
- [x] Store in SQLite
- [x] Display results

---

## ⚡ Optimization

### 🔹 Cache everything

- Don’t re-call Apify
- Don’t re-run AI

---

### 🔹 Limit transcript size

- Chunk before sending to AI

---

### 🔹 Skip irrelevant videos

- Filter using title keywords

---

## ⚠️ Challenges

- Apify async polling
- Cost beyond free tier
- AI false positives
- Timestamp accuracy

---

## 🧪 MVP Strategy

1. Start with **single video URL**
2. Validate transcript
3. Validate AI output
4. Add channel support

---

## 🎯 Final Goal

A simple tool that answers:

> “What history or records were made in these videos?”
