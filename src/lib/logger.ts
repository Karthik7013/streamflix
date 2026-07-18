type Level = "info" | "warn" | "error";

function log(level: Level, context: string, ...args: unknown[]) {
  const ts = new Date().toISOString();
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${ts}] [${level.toUpperCase()}] [${context}]`, ...args);
}

export const logger = {
  info: (context: string, ...args: unknown[]) => log("info", context, ...args),
  warn: (context: string, ...args: unknown[]) => log("warn", context, ...args),
  error: (context: string, ...args: unknown[]) => log("error", context, ...args),
};
