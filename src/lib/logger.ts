import * as Sentry from "@sentry/nextjs";

type Level = "info" | "warn" | "error";

function reportToSentry(context: string, args: unknown[]) {
  try {
    const err = args.find((a) => a instanceof Error);
    if (err) {
      Sentry.captureException(err, { extra: { context } });
    } else {
      Sentry.captureMessage(
        `[${context}] ${args.map((a) => String(a)).join(" ")}`,
        "error"
      );
    }
  } catch {
    // Reporting must never break the logged code path.
  }
}

function log(level: Level, context: string, ...args: unknown[]) {
  const ts = new Date().toISOString();
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${ts}] [${level.toUpperCase()}] [${context}]`, ...args);
  if (level === "error") reportToSentry(context, args);
}

export const logger = {
  info: (context: string, ...args: unknown[]) => log("info", context, ...args),
  warn: (context: string, ...args: unknown[]) => log("warn", context, ...args),
  error: (context: string, ...args: unknown[]) => log("error", context, ...args),
};
