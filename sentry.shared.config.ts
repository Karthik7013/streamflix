import * as Sentry from "@sentry/nextjs";

function isPrerenderBailout(event: Sentry.ErrorEvent): boolean {
  const values = event.exception?.values ?? [];
  return values.some(
    (e) =>
      e.mechanism?.data?.digest === "DYNAMIC_SERVER_USAGE" ||
      (e.value ?? "").includes("DYNAMIC_SERVER_USAGE") ||
      (e.value ?? "").includes("Dynamic server usage")
  );
}

const shared: Sentry.NodeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  beforeSend(event) {
    if (isPrerenderBailout(event)) return null;
    return event;
  },
};

export { shared as sentrySharedOptions, isPrerenderBailout };
