const DEFAULT_SITE_URL = "https://coachplusacademy.com";

function resolveSiteUrl() {
  const configuredUrl = process.env.APP_URL?.trim() || DEFAULT_SITE_URL;
  try {
    const url = new URL(configuredUrl);
    if (url.hostname.toLowerCase() === "www.coachplusacademy.com") {
      url.hostname = "coachplusacademy.com";
    }
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();
