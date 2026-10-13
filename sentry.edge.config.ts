import * as Sentry from "@sentry/nextjs";
import { sentrySharedOptions } from "./sentry.shared.config";

Sentry.init(sentrySharedOptions);
