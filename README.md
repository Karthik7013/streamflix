<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://streamflix.app/og.png">
    <img alt="StreamFlix" src="https://streamflix.app/og.png" width="400">
  </picture>
</p>

<p align="center">
  <strong>A full-featured video streaming platform built with Next.js, Better Auth, and modern web technologies.</strong>
</p>

<p align="center">
  <a href="https://streamflix.app">streamflix.app</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Better_Auth-1.6-6366f1" alt="Better Auth">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-Upstash-FF4438?logo=redis" alt="Upstash Redis">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
</p>

---

## Overview

StreamFlix is a production-grade video streaming platform that combines a Netflix-like user experience with a powerful admin dashboard. It features multi-provider authentication (Google, GitHub, email/password), a custom video player with ambient effects and keyboard shortcuts, content management via TMDB integration, and a fully responsive design optimized for all devices.

---

## Features

### User Features

| Feature | Description |
|---------|-------------|
| **Browse & Search** | Explore movies and series with tag filtering, search, and paginated results |
| **Watch** | Custom StreamFlix video player with ambient lighting, keyboard shortcuts, skip intro, and episode navigation |
| **Favorites** | Save and manage your favorite movies with optimistic UI updates |
| **Series** | Browse series with seasons and episode navigation; auto-suggest next episode |
| **Content Requests** | Request movies or series you'd like to see added |
| **Account Management** | Profile settings, email/password change, account deletion |
| **Social Auth** | Sign in with Google or GitHub in one click |

### Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with stats cards (total movies, users, tags, admins) and recent signups |
| **Content CRUD** | Full create, read, update, delete for movies and series with seasons + episodes |
| **TMDB Import** | Search The Movie Database and import metadata (posters, backdrops, trailers, cast) directly |
| **Featured Management** | Curate the hero carousel on the home page with drag-and-drop ordering |
| **Tag Management** | Create and manage content tags for categorization |
| **Request Management** | Approve or reject user content requests |
| **User Management** | View and manage registered users |

### Technical Features

| Feature | Description |
|---------|-------------|
| **Redis Caching** | Upstash Redis with scope-based cache invalidation and graceful fallback |
| **Rate Limiting** | Per-IP rate limiting for API routes (60 req/min) |
| **Media Storage** | Internet Archive S3 for scalable video and image hosting with HMAC-SHA1 signing |
| **Email Verification** | Password reset and email verification with branded HTML templates |
| **Admin Plugin** | Role-based access control (admin/user roles) with session-level enforcement |
| **Analytics** | Vercel Analytics and Speed Insights for real-time traffic monitoring |
| **Responsive UI** | Mobile-first design with bottom navigation bar for mobile, sidebar for desktop |
| **SEO** | Sitemap, robots.txt, Open Graph / Twitter Card metadata, and PWA support |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js](https://nextjs.org) 16.2.7 (App Router, React 19) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v4, [shadcn/ui](https://ui.shadcn.com), [Base UI React](https://base-ui.com) |
| **Auth** | [Better Auth](https://better-auth.com) 1.6.14 |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) 0.45.2 |
| **Cache** | [Upstash Redis](https://upstash.com) |
| **Media Storage** | [Internet Archive S3](https://archive.org) |
| **Data Enrichment** | [TMDB API](https://www.themoviedb.org/documentation/api) |
| **State** | [TanStack React Query](https://tanstack.com/query) v5, [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Tables** | [TanStack React Table](https://tanstack.com/table) v8 |
| **Video Player** | [Media Chrome](https://www.media-chrome.org) |
| **Email** | [Nodemailer](https://nodemailer.com) (SMTP) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) + Speed Insights |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Notifications** | [Sonner](https://sonner.emilkowalski.com) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Neon recommended)
- An Upstash Redis instance
- TMDB API key (for content import)
- S3-compatible storage (Internet Archive or any S3 provider)

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

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

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/streamflix.git
cd streamflix

# Install dependencies
npm install

# Run database migrations
npm run db:generate
npm run db:migrate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready to go.

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
│   ├── (main)/             # Authenticated user routes
│   │   ├── home/           # Dashboard with hero carousel
│   │   ├── explore/        # Browse & search movies
│   │   ├── movies/[slug]/  # Movie detail page
│   │   ├── watch/          # Video player
│   │   ├── favorites/      # User favorites
│   │   ├── series/         # Series listing & detail
│   │   ├── requests/       # Content requests
│   │   └── settings/       # Account settings
│   ├── admin/              # Admin dashboard & CRUD
│   ├── login/              # Authentication pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── streamflix-player/  # Custom video player
│   ├── hero-carousel.tsx   # Featured content carousel
│   └── ...                 # Feature components
├── db/
│   ├── schema.ts           # Drizzle schema definitions
│   └── migrations/         # Database migrations
├── hooks/                  # React hooks
├── lib/
│   ├── auth.ts             # Better Auth server config
│   ├── auth-client.ts      # Better Auth client config
│   ├── session.ts          # Server session helpers
│   ├── cache.ts            # Redis cache utilities
│   └── rate-limit.ts       # Rate limiting
└── services/               # Business logic layer
```

---

## API Overview

### Public Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/[...all]` | Better Auth handler (login, signup, session, etc.) |
| GET | `/api/home/featured` | Featured carousel movies (cached) |
| GET | `/api/home/recently-added` | Recently added movies |
| GET | `/api/movies` | Search movies with filters |
| GET | `/api/movies/[slug]` | Movie details |
| GET | `/api/movies/[slug]/related` | Related movies |
| GET | `/api/series` | List all series |
| GET | `/api/series/[slug]` | Series details with seasons & episodes |
| GET/POST | `/api/favorites` | Get or toggle favorites |
| POST | `/api/requests` | Submit content request |
| GET | `/api/tags` | All content tags |

### Admin Endpoints (requires `admin` role)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Aggregate platform stats |
| GET | `/api/admin/recent-signups` | Recent user registrations |
| GET | `/api/admin/most-favorited` | Most favorited movies |
| CRUD | `/api/admin/movies` | Movie management |
| CRUD | `/api/admin/series` | Series, season, and episode management |
| CRUD | `/api/admin/tags` | Tag management |
| CRUD | `/api/admin/featured` | Featured carousel management |
| CRUD | `/api/admin/requests` | Content request management |
| POST | `/api/admin/tmdb/search` | Search TMDB |
| POST | `/api/admin/tmdb/import` | Import from TMDB |

---

## Authentication

StreamFlix uses [Better Auth](https://better-auth.com) for authentication, supporting:

- **Email & Password** with email verification
- **Google OAuth** 
- **GitHub OAuth**
- **Password Reset** flow with branded email templates
- **Account Linking** — link multiple OAuth providers to one account
- **Admin Roles** — role-based access with `admin` and `user` roles

Authenticated routes are protected via the `RequireAuth` component; admin routes via `RequireAdmin`. Server-side session validation uses Redis-backed caching for performance.

---

## Deployment

The platform is optimized for deployment on [Vercel](https://vercel.com).

```bash
npm run build
```

Configure the same environment variables in your Vercel project settings. Connect a PostgreSQL database (Neon is recommended for serverless compatibility), set up Upstash Redis, and configure your OAuth provider credentials.

---

## License

MIT

---

<p align="center">
  <a href="https://streamflix.app">streamflix.app</a> &nbsp;|&nbsp;
  <a href="https://github.com/your-org/streamflix">GitHub</a> &nbsp;|&nbsp;
  <a href="https://discord.gg/streamflix">Discord</a> &nbsp;|&nbsp;
  <a href="https://twitter.com/streamflix">Twitter</a>
</p>

<p align="center">
  <sub>Built with Next.js, Better Auth, and ❤️</sub>
</p>
