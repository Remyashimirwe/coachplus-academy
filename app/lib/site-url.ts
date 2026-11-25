const DEFAULT_SITE_URL = "https://www.coachplusacademy.com";

function resolveSiteUrl() {
  const configuredUrl = process.env.APP_URL?.trim() || DEFAULT_SITE_URL;
  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();
