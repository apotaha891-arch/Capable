import { NextResponse } from 'next/server';

// Wildcard subdomain routing: {slug}.capable.app → /{slug}
// Spec §7 — wildcard domain handled in middleware so `/` of a subdomain
// renders the slug's page without an explicit URL path.

const APEX = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'capable.app').toLowerCase();

export function middleware(req) {
  const host = req.headers.get('host')?.toLowerCase() || '';
  const hostname = host.split(':')[0];
  const url = req.nextUrl.clone();

  // Skip internals, statics, and the API
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.match(/\.[a-z0-9]+$/i)
  ) {
    return NextResponse.next();
  }

  // Apex / www → render the marketing root as-is
  if (hostname === APEX || hostname === `www.${APEX}` || hostname === 'localhost') {
    return NextResponse.next();
  }

  // Subdomain of the apex → rewrite to /{slug}
  if (hostname.endsWith(`.${APEX}`)) {
    const sub = hostname.slice(0, -APEX.length - 1);
    if (sub && sub !== 'www') {
      // Only rewrite root path; let nested paths fall through (404 if unknown)
      if (url.pathname === '/') {
        url.pathname = `/${sub}`;
        return NextResponse.rewrite(url);
      }
    }
    return NextResponse.next();
  }

  // Custom domain — look up not yet wired in renderer; fall through to root.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
