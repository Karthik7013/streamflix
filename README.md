<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/favicon.svg">
    <img alt="StreamFlix" src="public/favicon.svg" width="50" height="50">
  </picture>
  <br>
  <strong>A self-hostable streaming platform. Clone, configure, and deploy your own Netflix-style site in minutes.</strong>
</div>

<br>

<div align="center">
  <img src="public/hero-readme.svg" width="800" alt="StreamFlix preview">
</div>

<br>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fstreamflix&env=DATABASE_URL,BETTER_AUTH_SECRET,TMDB_API_KEY,IA_S3_ACCESS_KEY,IA_S3_SECRET_KEY,IA_S3_BUCKET,IA_S3_ENDPOINT&project-name=my-streamflix&repository-name=my-streamflix">
    <img src="https://vercel.com/button" alt="Deploy with Vercel">
  </a>
  <a href="https://better-auth-nextjs-fawn.vercel.app">
    <img src="https://img.shields.io/badge/Live_Demo-visit-10b981?style=for-the-badge" alt="Live Demo">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT">
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Better_Auth-1.6-6366f1" alt="Better Auth">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-4169E1?logo=postgresql" alt="Drizzle + PostgreSQL">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
</p>

---

## Features

<table>
  <tr>
    <td width="33%">
      <h3>🎬 Browse & Discover</h3>
      <p>Explore movies and series with search, tag filters, and paginated results. Trending section, featured carousel, and related content recommendations.</p>
    </td>
    <td width="33%">
      <h3>▶️ Video Player</h3>
      <p>Custom player with ambient lighting effects, keyboard shortcuts, episode navigation for series, trailer modals, and progress tracking.</p>
    </td>
    <td width="33%">
      <h3>⭐ Favorites & Watchlist</h3>
      <p>Save titles with optimistic UI updates. Quick-access favorites page to pick up where you left off.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🔐 Authentication</h3>
      <p>Email/password, Google, and GitHub sign-in via Better Auth. Session management, password reset, and role-based access (user/admin).</p>
    </td>
    <td>
      <h3>⚙️ Admin Dashboard</h3>
      <p>Full CRUD for movies, series, seasons, and episodes. Manage featured content, tags, user requests, reports, and platform stats.</p>
    </td>
    <td>
      <h3>🎨 Fully Customizable</h3>
      <p>Change site name, tagline, colors, and legal info in one config file. Replace logo and favicon. Rebrand the entire app without touching code.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📦 TMDB Integration</h3>
      <p>Search and import metadata (posters, backdrops, trailers) directly from The Movie Database. One-click enrichment for your catalog.</p>
    </td>
    <td>
      <h3>📱 Responsive UI</h3>
      <p>Mobile-first design with bottom navigation bar for phones, sidebar for desktop. Works across all screen sizes.</p>
    </td>
    <td>
      <h3>🚀 1-Click Deploy</h3>
      <p>Optimized for Vercel. Deploy button below handles build, SSL, and environment variables. PostgreSQL (Neon) and Upstash Redis ready.</p>
    </td>
  </tr>
</table>

---

## Quick Start

```bash
git clone https://github.com/your-org/streamflix.git
cd streamflix
npm install

# 1. Set up your database and services
cp .env.example .env.local

# 2. Customize your brand
#    → edit src/lib/site.config.ts

# 3. Run database migrations
npm run db:push

# 4. Start developing
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — your streaming platform is running.

---

## Screenshots

> **Note:** Add your own screenshots here. Replace the image below with actual captures from your deployment.

| Page | Preview |
|------|---------|
| **Home page** with hero carousel and featured content | `screenshots/home.png` |
| **Movie detail** with backdrop, metadata, and related titles | `screenshots/movie-detail.png` |
| **Video player** with ambient lighting and controls | `screenshots/player.png` |
| **Admin dashboard** with stats and CRUD management | `screenshots/admin.png` |
| **Admin movie editor** with TMDB import | `screenshots/admin-edit.png` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js](https://nextjs.org) 16 (App Router, React 19) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v4, [shadcn/ui](https://ui.shadcn.com) |
| **Auth** | [Better Auth](https://better-auth.com) 1.6 |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) |
| **Cache** | [Upstash Redis](https://upstash.com) |
| **Media Storage** | S3-compatible ([Internet Archive](https://archive.org), AWS S3, MinIO) |
| **Data Enrichment** | [TMDB API](https://www.themoviedb.org/documentation/api) |
| **State** | [TanStack React Query](https://tanstack.com/query) v5 |
| **Tables** | [TanStack React Table](https://tanstack.com/table) v8 |
| **Video Player** | [Media Chrome](https://www.media-chrome.org) |
| **Email** | [Nodemailer](https://nodemailer.com) (SMTP) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Notifications** | [Sonner](https://sonner.emilkowalski.com) |

---

## Project Structure

```
src/
├── app/
│   ├── (main)/          — User-facing pages (home, movies, series, watch, favorites)
│   ├── admin/           — Admin dashboard and CRUD pages
│   ├── (legal)/         — Legal pages (terms, privacy, DMCA, contact)
│   ├── login/           — Authentication pages
│   ├── forgot-password/ — Password reset flow
│   └── api/             — API routes (mirrors the data layer)
├── components/
│   ├── ui/              — shadcn/ui primitives
│   └── streamflix-player/ — Custom video player
├── hooks/               — Data fetching hooks (React Query)
├── lib/
│   ├── api/             — Typed API client modules
│   ├── site.config.ts   — ← Central brand configuration
│   ├── auth.ts          — Better Auth server config
│   └── ...
├── services/            — Server-side business logic
└── types/               — Shared TypeScript types
```

---

## Configuration

All brand settings are centralized in **`src/lib/site.config.ts`**:

```ts
export const siteConfig = {
  name: "StreamFlix",           // Site name (shown everywhere)
  tagline: "Watch Movies & TV Shows Online",
  description: "SEO description",
  company: "StreamFlix",        // Legal entity name
  contactEmail: "hello@streamflix.app",
  supportEmail: "support@streamflix.app",
  dmcaEmail: "dmca@streamflix.app",
};
```

To change colors, edit CSS variables in `src/app/globals.css`. To change the logo, replace files in `public/`.

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="your-secret-key"

# URL (public)
NEXT_PUBLIC_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Email
EMAIL="your-email@gmail.com"
APP_PASSWORD="your-gmail-app-password"

# Redis Cache
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# S3 Media Storage
IA_S3_ACCESS_KEY="..."
IA_S3_SECRET_KEY="..."
IA_S3_BUCKET="..."
IA_S3_ENDPOINT="https://s3.us.archive.org"

# TMDB
TMDB_API_KEY="..."
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

---

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fstreamflix&env=DATABASE_URL,BETTER_AUTH_SECRET,TMDB_API_KEY,IA_S3_ACCESS_KEY,IA_S3_SECRET_KEY,IA_S3_BUCKET,IA_S3_ENDPOINT&project-name=my-streamflix&repository-name=my-streamflix)

1. Click the **Deploy** button above
2. Connect your GitHub repository
3. Fill in the required environment variables
4. Click **Deploy** — Vercel handles build, SSL, and hosting

The platform is optimized for serverless PostgreSQL (Neon) and Redis (Upstash). No server management needed.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for code standards and pull request guidelines. This project follows a strict set of conventions — review [AGENTS.md](AGENTS.md) before submitting code.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <a href="https://streamflix.app">streamflix.app</a> &nbsp;|&nbsp;
  <a href="https://github.com/your-org/streamflix">GitHub</a>
</p>

<p align="center">
  <sub>Built with <a href="https://nextjs.org">Next.js</a>, <a href="https://better-auth.com">Better Auth</a>, and ❤️</sub>
</p>
