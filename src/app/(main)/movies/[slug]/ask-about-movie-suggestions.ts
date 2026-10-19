export const ASK_SUGGESTION_LIMIT = 5;

export interface AskSuggestionsMovie {
  title: string;
  tags: readonly { name: string }[];
  credits: { cast: readonly unknown[] };
  related: readonly unknown[];
  durationSeconds: number | null;
  originalLanguage: string | null;
}

export function buildAskSuggestions(
  movie: AskSuggestionsMovie,
  reviewCount: number
): string[] {
  const title = movie.title;
  const suggestions: string[] = [`What's ${title} about?`];

  if (movie.credits.cast.length > 0) {
    suggestions.push(`Who stars in ${title}?`);
  }
  if (movie.tags.length > 0) {
    suggestions.push(
      `Is ${title} worth watching if I like ${movie.tags[0].name}?`
    );
  }
  if (reviewCount > 0) {
    suggestions.push(`What are viewers saying about ${title}?`);
  }
  if (movie.related.length > 0) {
    suggestions.push(`What else is like ${title}?`);
  }
  if (movie.durationSeconds) {
    suggestions.push(`How long is ${title}?`);
  }
  if (movie.originalLanguage) {
    suggestions.push(`What language is ${title} in?`);
  }

  return suggestions.slice(0, ASK_SUGGESTION_LIMIT);
}
