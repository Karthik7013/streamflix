<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://streamflix.app/og.png">
    <img alt="StreamFlix" src="https://streamflix.app/og.png" width="400">
  </picture>
</p>

<p align="center">
  <strong>A self-hostable Netflix-style streaming platform. Clone, configure, deploy your own video site in minutes.</strong>
</p>

<p align="center">
  <a href="https://streamflix.app">Live Demo</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#customization">Customization</a> &bull;
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fstreamflix&env=DATABASE_URL,BETTER_AUTH_SECRET,TMDB_API_KEY,IA_S3_ACCESS_KEY,IA_S3_SECRET_KEY,IA_S3_BUCKET,IA_S3_ENDPOINT&project-name=my-streamflix&repository-name=my-streamflix">
    <img src="https://vercel.com/button" alt="Deploy with Vercel">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Better_Auth-1.6-6366f1" alt="Better Auth">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
</p>

---

## Quick Start

```bash
git clone https://github.com/your-org/streamflix.git
cd streamflix
npm install

# 1. Set up your database and services (see Environment Variables below)
cp .env.example .env.local

# 2. Customize your brand (name, colors, logo)
#    → edit src/lib/site.config.ts

# 3. Run migrations and start
npm run db:push
npm run dev
```

That's it. Open [http://localhost:3000](http://localhost:3000) — you're running your own streaming platform.

---

## Overview

StreamFlix combines a Netflix-like user experience with a powerful admin dashboard. It features multi-provider authentication, a custom video player, content management via TMDB integration, and a fully responsive design — all configurable from a single file.

---

## Demo

Visit **[streamflix.app](https://streamflix.app)** for a live demo. Credentials for the admin panel are available by request.

---

## Features

### User Features

| Feature | Description |
|---------|-------------|
| **Browse & Search** | Explore movies and series with tag filtering, search, and paginated results |
| **Watch** | Custom video player with ambient lighting, keyboard shortcuts, episode navigation |
| **Favorites** | Save and manage your favorite titles with optimistic UI updates |
| **Series** | Browse series with seasons and episodes; auto-suggest next episode |
| **Content Requests** | Request movies or series you'd like to see added |
| **Account Management** | Profile settings, email/password change, account deletion |
| **Social Auth** | Sign in with Google or GitHub in one click |

### Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with stats cards (total movies, users, tags) and recent signups |
| **Content CRUD** | Full create, read, update, delete for movies and series with seasons + episodes |
| **TMDB Import** | Search The Movie Database and import metadata (posters, backdrops, trailers) directly |
| **Featured Management** | Curate the hero carousel with reorderable items |
| **Tag Management** | Create and manage content tags for categorization |
| **Request Management** | Approve or reject user content requests |
| **User Management** | View and manage registered users |

### Technical Features

| Feature | Description |
|---------|-------------|
| **Redis Caching** | Upstash Redis with scope-based cache invalidation and graceful fallback |
| **Rate Limiting** | Per-IP rate limiting for API routes |
| **Media Storage** | S3-compatible storage (Internet Archive, AWS S3, any S3 provider) |
| **Email** | Password reset and email verification with branded HTML templates |
| **Admin Plugin** | Role-based access control (admin/user) with session-level enforcement |
| **Analytics** | Vercel Analytics and Speed Insights for traffic monitoring |
| **Responsive UI** | Mobile-first design with bottom navigation bar for mobile, sidebar for desktop |
| **SEO** | Sitemap, robots.txt, Open Graph / Twitter Card metadata, PWA support |

---

## Customization

This is a **cloneable template** — every brand setting lives in one file.

### Change your site name, tagline, colors, and emails

Edit **`src/lib/site.config.ts`**:

```ts
export const siteConfig = {
  name: "StreamFlix",           // Site name shown everywhere
  tagline: "Watch Movies & TV Shows Online",
  description: "SEO description for search engines",
  company: "StreamFlix",         // Legal entity name
  contactEmail: "hello@streamflix.app",
  supportEmail: "support@streamflix.app",
  dmcaEmail: "dmca@streamflix.app",
  // ...
};
```

### Change your logo and favicon

Replace these files in `public/`:
- `public/favicon.svg` — Browser tab icon
- `public/og-image.png` — Social media preview card (1200×630)
- `public/manifest.json` — PWA manifest (update `name`, `short_name`, icons)

### Change your theme colors

Edit CSS variables in **`src/app/globals.css`** (the `:root` block). The default theme is a dark emerald palette — change the OKLCH values to your brand colors.

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
| **Media Storage** | S3-compatible ([Internet Archive](https://archive.org), AWS S3, etc.) |
| **Data Enrichment** | [TMDB API](https://www.themoviedb.org/documentation/api) |
| **State** | [TanStack React Query](https://tanstack.com/query) v5 |
| **Tables** | [TanStack React Table](https://tanstack.com/table) v8 |
| **Video Player** | [Media Chrome](https://www.media-chrome.org) |
| **Email** | [Nodemailer](https://nodemailer.com) (SMTP) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) + Speed Insights |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Notifications** | [Sonner](https://sonner.emilkowalski.com) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## Environment Variables

Create a `.env.local` file in the project root:

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

# Email (for verification & password reset)
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
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:push` | Push schema changes directly |
| `npm run db:studio` | Open Drizzle Studio |

---

## Project Structure

```
src/
├── app/
│   ├── (main)/             # Authenticated user routes (home, explore, movies, watch, etc.)
│   ├── admin/              # Admin dashboard & CRUD
│   ├── login/              # Authentication pages
│   └── api/                # API routes (mirror the data layer)
├── components/             # Shared React components
│   ├── ui/                 # shadcn/ui primitives
│   └── streamflix-player/  # Custom video player
├── hooks/                  # Custom React hooks (data fetching)
├── lib/
│   ├── api/                # Typed API client modules
│   ├── site.config.ts      # ← Central brand configuration
│   ├── auth.ts             # Better Auth server config
│   └── ...
├── services/               # Server-side business logic
└── types/                  # Shared TypeScript types
```

---

## Deployment

The platform is optimized for [Vercel](https://vercel.com).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fstreamflix&env=DATABASE_URL,BETTER_AUTH_SECRET,TMDB_API_KEY,IA_S3_ACCESS_KEY,IA_S3_SECRET_KEY,IA_S3_BUCKET,IA_S3_ENDPOINT&project-name=my-streamflix&repository-name=my-streamflix)

1. Click the button above
2. Connect your repository
3. Fill in the environment variables
4. Deploy

One click handles build, deploy, and SSL. Connect a PostgreSQL database (Neon is recommended for serverless), set up Upstash Redis, and configure your OAuth provider credentials.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <a href="https://streamflix.app">streamflix.app</a> &nbsp;|&nbsp;
  <a href="https://github.com/your-org/streamflix">GitHub</a>
</p>

<p align="center">
  <sub>Built with Next.js, Better Auth, and ❤️</sub>
</p>
