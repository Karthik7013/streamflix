# StreamFlix Content Tone Refresh — Design

## Goal
Unify all user-facing text across StreamFlix to a **premium, cinematic brand voice** — polished, mature, consistent. No functional changes.

## Scope
**Tone consistency only.** No new features, no structural changes, no fixing placeholder links or missing toasts.

## Voice Principles
- Premium & cinematic — like Netflix or HBO
- Polished but not stiff
- Concise — every word earns its place
- Warm but restrained

## Capitalization Rules
| Context | Rule | Example |
|---------|------|---------|
| Page/section headings | Title case | `Trending Now` |
| Navigation items | Title case | `Home`, `Explore` |
| Buttons | Sentence case | `Sign out`, `Try again` |
| Toast messages | Sentence case | `Comment posted.` |
| Error messages | Sentence case | `Unable to load content.` |
| Empty states | Sentence case | `Nothing featured yet.` |
| Form labels | Title case | `Movie Title` |
| Placeholders | Sentence case | `Search movies...` |

## Tier 1 — Brand-Facing Changes

### Landing Page
| Current | Proposed |
|---------|----------|
| `Welcome to StreamFlix, your cinematic journey starts here.` | `StreamFlix — where every frame finds you.` |
| `Dive into a vast library...` | `Explore a curated library of films and series. From blockbusters to hidden gems, your next great watch is waiting.` |
| ` Get Started` | `Get started` |
| ` Continue` | `Continue watching` |

### Login Page
| Current | Proposed |
|---------|----------|
| `Welcome back` | `Welcome back.` |
| `Sign in to access your library and continue your cinematic journey.` | `Sign in to pick up where you left off.` |
| `Create an account` | `Join StreamFlix` |
| `Sign up to start building your library.` | `Create your account and start watching.` |

### Empty States
| Current | Proposed |
|---------|----------|
| `No movies to show` | `Nothing featured yet.` |
| `No recently added movies` | `No recent additions.` |
| `No movies found` / `Can't find what you're looking for?` | `No titles match your search. Try adjusting your filters.` |
| `No series found` / `Try adjusting your filters.` | `No series match your search. Try different filters.` |
| `No favorites yet` / `Start exploring...` | `Your watchlist is empty. Explore our library to add your first favorite.` |
| `No comments yet. Be the first to share your thoughts!` | `No comments yet. Start the conversation.` |
| `No movies found for "{query}"` | `No results for "{query}".` |
| `No movies found matching your criteria.` | `No titles match your criteria.` |
| `No series found matching your criteria.` | `No series match your criteria.` |
| `No movies have been favorited yet.` | `No favorited movies yet.` |
| `No seasons available yet.` | `No seasons yet.` |

### Error Messages
| Current | Proposed |
|---------|----------|
| `Failed to load content. Check your connection.` | `Unable to load content. Please check your connection.` |
| `Failed to load movie.` | `This title is temporarily unavailable.` |
| `Failed to load series.` | `This series is temporarily unavailable.` |
| `Failed to load favorites.` | `Unable to load your watchlist.` |
| `Failed to load comments` | `Unable to load comments.` |
| `Failed to change password` | `Unable to update password.` |
| `Failed to create account.` | `Unable to create your account.` |
| `Failed to sign in. Please try again.` | `Sign-in failed. Please try again.` |
| `Failed to delete account.` | `Unable to delete your account.` |
| `This movie isn't available yet. We're working on adding it — stay tuned!` | `This title isn't available yet. We're working on bringing it to StreamFlix.` |

### Toast Messages
| Current | Proposed |
|---------|----------|
| `Session expired. Please sign in again.` | `Your session has expired. Please sign in again.` |
| `Failed to sign in with Google. Please try again.` | `Google sign-in failed. Please try again.` |
| `Email not verified. Check your inbox for the verification link.` | `Email not verified. Check your inbox for a verification link.` |
| `Account created! Check your email for the verification link.` | `Account created. Check your email for the verification link.` |
| `Comment posted!` | `Comment posted.` |
| `Failed to post comment. Try again.` | `Unable to post comment. Please try again.` |
| `Request submitted! We'll review it and get back to you.` | `Request submitted. We'll review it shortly.` |
| `Password changed successfully.` | `Password updated.` |
| `Your password has been reset successfully.` | `Your password has been reset.` |
| `Report submitted. Admins will review it.` | `Report submitted. An admin will review it.` |
| `Failed to submit report. Please try again.` | `Unable to submit report. Please try again.` |
| `Profile picture updated` | `Profile picture updated.` |
| `Tag created` | `Tag created.` |
| `Tag updated` | `Tag updated.` |
| `Tag deleted` | `Tag deleted.` |
| `Failed to send reset email.` | `Unable to send reset email.` |

### Watch Page
| Current | Proposed |
|---------|----------|
| `This movie isn't available yet...` | `This title isn't available yet. We're working on bringing it to StreamFlix.` |
| `UP NEXT` | `Up Next` |

## Tier 2 — Utility Text (unchanged)
Table headers, pagination, form labels, admin page descriptions, navigation items, admin sidebar — all stay as-is.

## Tier 3 — Validation Text
| Current | Proposed |
|---------|----------|
| `Invalid email address` | `Invalid email address.` |
| `Password must be at least 8 characters` | `Password must be at least 8 characters.` |
| `Name must be at least 2 characters` | `Name must be at least 2 characters.` |
| `Movie title is required` | `Movie title is required.` |
| `Invalid URL` | `Invalid URL.` |

## Tone Consistency Checklist
- All sentences end with a period (toasts, errors, empty states)
- Buttons use sentence case (not title case)
- Headings use title case
- No leading/trailing whitespace in any string
- "Fail to..." → "Unable to..." or similar polished phrasing
- Exclamation marks only in genuinely exciting contexts (avoid in toasts/errors)

## Files to Change
- `src/app/page.tsx`, `cta-btn.tsx`
- `src/app/login/` — page, email-form, schemas
- `src/app/forgot-password/`, `src/app/reset-password/`
- `src/app/not-found.tsx`, `src/app/error.tsx`
- `src/app/home/` — home-content, hero-carousel, recent-movies
- `src/app/explore/` — explore-content, movie-grid
- `src/app/favorites/favorites-content.tsx`
- `src/app/movies/[slug]/` — movie-detail-client, comments-section, report-section
- `src/app/series/` — multiple pages
- `src/app/watch/` — watch-content, player/next-episode-card
- `src/app/requests/` — request-form, schemas
- `src/app/settings/` — change-password, danger-zone, user-profile
- `src/app/admin/` — featured-list, all table pages
- `src/components/` — error-state, data-table, search-modal, tmdb-search, entity-dialog, upload-field

## Implementation Order
1. Landing page + login (highest visibility)
2. Home page (explore, favorites, movie/series detail, watch)
3. Settings & user flows
4. Admin empty states & errors
5. Toasts across the app
6. Validation messages
