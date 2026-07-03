export const STALE = {
  /** Re-fetch as fast as React Query allows */
  NEVER: 0,
  /** 30 seconds — for fast-moving data that users want fresh */
  FAST: 30_000,
  /** 5 minutes — default for most list/entity queries */
  DEFAULT: 5 * 60 * 1000,
  /** 30 minutes — for data that rarely changes */
  HOUR: 30 * 60 * 1000,
} as const;
