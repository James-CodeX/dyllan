# 🎥 DylanPage(NewsDaddy) History Made Tracker

<p align="center">
  <img src="./public/dylan-sticker.png" alt="Dylan Sticker" width="150" />
</p>

A minimal, full-stack Next.js web application that automatically scans YouTube videos, fetches transcripts via Apify, detects record-breaking events using OpenRouter's AI models, and stores the results securely in a Turso SQLite database using Drizzle ORM.

**Live Event Tracker:** [https://dylanpage.vercel.app](https://dylanpage.vercel.app)

---

## ✨ Features

- **Automated YouTube Scanning**: Seamlessly fetch videos from a specific channel or single video URLs.
- **AI-Powered Event Detection**: Leverages OpenRouter to analyze transcripts and identify key events or records.
- **Secure Admin Dashboard**: Built-in `/add` administrative page protected by a custom password.
- **Caching Mechanism**: Prevents redundant API calls by caching processed videos and transcripts in Turso.
- **Modern Tech Stack**: Built with Next.js App Router (v16), Drizzle ORM, and beautifully styled with Tailwind CSS & shadcn/ui.

## 🛠️ Technology Stack

- **Framework**: Next.js (App Router)
- **Database**: Drizzle ORM + Turso (libSQL)
- **Data Scraping**: Apify (YouTube Transcript Actor)
- **AI/LLM**: OpenRouter (Configurable models)
- **Styling**: Tailwind CSS + Custom UI Components

---

## ⚙️ Configuration (Environment Variables)

Create a `.env.local` file in your root directory and add the following variables:

```env
# Apify (For scraping YouTube Transcripts)
APIFY_KEY=your_apify_token

# OpenRouter (For AI Analysis)
OPENROUTER_KEY=your_openrouter_token
OPENROUTER_MODEL=openai/gpt-oss-20b:free

# Turso (Database)
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Security
ADMIN_PASSWORD=your_7_char_password  # Used to protect the /add dashboard
```

> **Note:** The `ADMIN_PASSWORD` is required to access the `/add` scan dashboard. Ensure it is at least 7 characters for better security.

---

## 🚀 Installation & Usage

1. **Install dependencies:**

   ```bash
   npm install
   # or bun install / pnpm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   # or bun dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000). To access the admin tools, visit `http://localhost:3000/add` and enter your configured `ADMIN_PASSWORD`.

---

## 📡 API Endpoints

| Method   | Endpoint          | Description                                        | Body / Query                          |
| :------- | :---------------- | :------------------------------------------------- | :------------------------------------ |
| **POST** | `/api/scan`       | Runs the full pipeline and returns a scan summary. | `{ "input": "channel or video url" }` |
| **GET**  | `/api/events`     | Retrieves all detected record-breaking events.     | _None_                                |
| **GET**  | `/api/events`     | Retrieves events filtered by a specific video.     | `?videoId=...`                        |
| **POST** | `/api/transcript` | Fetches the transcript for a single video.         | `{ "videoUrl": "..." }`               |

---

## 💡 Additional Notes

- **Timeframe:** Channel inputs automatically scan the past **12 months** of feed videos.
- **Efficiency:** Processed videos are aggressively tracked and cached in Turso to avoid duplicate Apify operations and unnecessary OpenRouter token usage.
