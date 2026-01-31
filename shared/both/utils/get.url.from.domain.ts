import { parse } from 'tldts';

/**
 * Returns cookie domain for cross-subdomain use.
 * For Railway (xxx.up.railway.app), tldts gives "railway.app" which can reject in some browsers.
 * Returning undefined creates a host-only cookie (most reliable for same-origin).
 */
export function getUrlFromDomain(domain: string): string | undefined {
  try {
    const url = parse(domain);
    if (!url.hostname) return undefined;
    // Use hostname for host-only cookie when on known multi-level domains (Railway, Vercel, etc.)
    const host = url.hostname;
    if (host.includes('railway.app') || host.includes('vercel.app') || host.includes('up.railway')) {
      return undefined; // host-only cookie for reliability
    }
    return url.domain ? '.' + url.domain : host;
  } catch {
    return undefined;
  }
}
