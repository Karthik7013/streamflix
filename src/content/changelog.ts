export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  items?: string[];
  image?: string;
  button?: {
    url: string;
    text: string;
  };
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: "Version 1.4.0",
    date: "26 August 2026",
    title: "AI assistant and a smarter explore",
    description:
      "Chat with an AI assistant about what to watch, discover content through full-text search, and browse genre cards with images.",
    items: [
      "AI chatbot powered by Google Gemini — ask for recommendations, get answers about StreamFlix",
      "Model selector in the chat input to switch between Gemini 2.5 Flash Lite, Flash, Pro, and more",
      "Quick-start suggestions displayed when opening the AI assistant",
      "PostgreSQL full-text search with a command-palette search modal on the explore page",
      "Genre tag cards with backdrop images and gradient overlays replacing the old pill-style tags",
      "Dedicated tag pages with hero banners and infinite-scroll movie grids",
      "Tags now support custom images and URL slugs for cleaner links",
    ],
  },
  {
    version: "Version 1.3.0",
    date: "20 August 2026",
    title: "A more cinematic StreamFlix",
    description:
      "Detail pages now open with a trailer playing behind the hero, and sharing your favorites is easier than ever.",
    items: [
      "Background trailers on movie and series pages, starting automatically (muted) a few seconds after the page loads",
      "Tap the hero to toggle sound — a mute button sits top-right on mobile and bottom-right on desktop",
      "Playback pauses when you scroll away or switch tabs, and respects reduced-motion settings",
      "Media controls on your phone's lock screen — play, pause and seek without opening the app",
      "Rich link previews for movies and series when shared on WhatsApp, iMessage and other apps",
      "A \u201cGo back\u201d button on the player's error screen, plus smarter navigation between movie and series pages",
    ],
  },
  {
    version: "Version 1.2.0",
    date: "18 July 2026",
    title: "Community & trust",
    description:
      "Your feedback now has a voice. Report issues, join discussions, and browse a platform built with performance in mind.",
    items: [
      "Report any movie issue right from its detail page — the team reviews every report",
      "Comment on movies with instant visibility and infinite scrolling",
      "A publish/draft workflow for movies and series, so content goes live only when it's ready",
      "New trust pages: Terms of Service, Privacy Policy, DMCA and Contact",
      "Cookie consent banner for essential cookies",
      "Command palette (Ctrl/Command + K) in the admin panel for instant navigation",
      "Faster everywhere: Redis caching, database indexes and edge cache headers across all API routes",
    ],
  },
  {
    version: "Version 1.1.0",
    date: "28 June 2026",
    title: "Series, explore, and a player built for you",
    description:
      "The biggest update yet — full web series support, a Netflix-style explore experience, and a custom video player.",
    items: [
      "Web series with seasons and episodes, browsable and searchable just like movies",
      "Redesigned explore page: search modal, genre carousel cards and sort dropdown",
      "A custom video player with keyboard shortcuts and cinematic controls",
      "Top-10 and trending rows with numbered cards on the home page",
      "Watchlist with add/remove from any card, plus a dedicated page with infinite scroll",
      "One-click TMDB import for movies, seasons and episodes in the admin panel",
      "Progressive Web App support — install StreamFlix right from your home screen",
    ],
  },
  {
    version: "Version 1.0.0",
    date: "12 June 2026",
    title: "Welcome to StreamFlix",
    description:
      "StreamFlix launches with a growing library of movies and a complete content management system behind the scenes.",
    items: [
      "Browse and search a catalog of movies enriched with ratings, posters and trailers from TMDB",
      "Tag-based filtering and a hero carousel of featured titles",
      "Favorites, watch history and movie requests — tell us what to add next",
      "Accounts with Google, GitHub and email/password sign-in, plus email verification",
      "A full admin panel to manage movies, tags, users, requests and featured content",
      "Bulk import of movies via CSV and automated TMDB enrichment scripts",
      "Cloud uploads to Internet Archive, with orphan cleanup on cancel or update",
    ],
  },
];