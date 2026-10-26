// Sentry error reporting for the Pages Functions (functions/_middleware.js). Inert until the
// SENTRY_DSN secret is set on the Pages project, so tests, forks and local runs send nothing.
//
// The contact form carries a visitor's name, email address, organization and message, and the
// Turnstile token. An event carries only the error, its stack, and the request method and path.
// The SDK's own data collection is off (SDK 11 dropped sendDefaultPii, and its replacement
// collects by default), and beforeSend drops the request body, headers, cookies, query string,
// user, IP address, timezone and breadcrumbs, and cuts long tokens, query strings and email
// addresses out of error messages.

const URL_TAIL = /(https?:\/\/[^\s?#"'<>]+)[?#][^\s"'<>]*/gi;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TOKEN = /[A-Za-z0-9_.-]{32,}/g;

export const scrubText = (text) => text.replace(URL_TAIL, "$1").replace(EMAIL, "[email]").replace(TOKEN, "[token]");
const baseName = (path) => path.slice(path.lastIndexOf("/") + 1);

export function beforeSend(event) {
  if (event.request) {
    let url;
    try {
      const parsed = new URL(event.request.url);
      url = scrubText(parsed.origin + parsed.pathname);
    } catch {
      url = undefined;
    }
    event.request = { method: event.request.method, url };
  }
  delete event.user;
  delete event.breadcrumbs;
  delete event.extra;
  if (event.contexts) delete event.contexts.culture;
  if (event.transaction) event.transaction = scrubText(event.transaction);
  if (event.message) event.message = scrubText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
    // Under wrangler pages dev the bundle sits in the checkout, so frames carry a local path.
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (frame.filename) frame.filename = baseName(frame.filename);
      if (frame.abs_path) frame.abs_path = baseName(frame.abs_path);
    }
  }
  return event;
}

export function sentryOptions(env) {
  return {
    dsn: env.SENTRY_DSN || undefined,
    environment: env.SENTRY_ENVIRONMENT || "production",
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    beforeSend,
    // Fetch breadcrumbs would carry the Resend and Turnstile calls; keep none.
    beforeBreadcrumb: () => null,
  };
}
