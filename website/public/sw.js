/**
 * Madurai Food Corner — Service Worker (mfc-pwa-v3)
 *
 * ⚠️  When you change the caching strategy, bump CACHE_VERSION below.
 *    The activate handler deletes ALL old caches, so existing users
 *    automatically get a clean slate on next visit.
 * ────────────────
 * 1. Non-GET requests          → pass through (no intercept)
 * 2. External-origin requests  → pass through (no intercept)
 * 3. API requests              → pass through (no intercept, always live data)
 * 4. Vite hashed assets        → network-first; cache on success for offline use
 *    (/assets/*.js, /assets/*.css, etc.)
 *    NEVER return index.html for an asset request.
 * 5. Navigation / HTML         → network-first; only fall back to cached
 *    (/index.html, SPA routes)   /index.html when the network is unreachable.
 * 6. Safe static files         → network-first; offline cache fallback
 *    (/logo.png, /manifest.json)
 *
 * Why this is safe after every Cloudflare Pages deployment:
 * - index.html is always fetched from the network first, so users always
 *   get the latest HTML shell with the correct hashed asset filenames.
 * - Old mfc-pwa-v1 cache is deleted during activation.
 * - skipWaiting() ensures the new SW activates immediately without waiting
 *   for all tabs to close.
 */

const CACHE_VERSION = 'mfc-pwa-v3';

/**
 * Small set of truly static files that are safe to cache for offline use.
 * Do NOT include '/' or '/index.html' here — those must always hit the
 * network first so that new deployments are picked up immediately.
 */
const OFFLINE_ASSETS = [
  '/index.html',   // cached only for offline fallback — never served cache-first
  '/logo.png',
  '/manifest.json',
];

/** The backend API origin — all requests to this origin bypass the SW entirely. */
const API_ORIGIN = 'https://madurai-food-corner.onrender.com';

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Pre-cache only the small offline fallback set.
      // Use individual adds so a single failure does not block install.
      return Promise.allSettled(
        OFFLINE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Pre-cache failed for ${url}:`, err);
          })
        )
      );
    })
  );

  // Activate immediately — do not wait for existing tabs to close.
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION) // delete all old versions
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all open clients immediately after activation.
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── 1. Only handle GET requests ──────────────────────────────────────────
  if (request.method !== 'GET') return;

  // ── 2. Only handle same-origin requests ──────────────────────────────────
  // Pass through requests to the API server, Cashfree, Cloudinary, etc.
  if (url.origin !== self.location.origin) return;

  // ── 3. Never intercept API requests ──────────────────────────────────────
  // Belt-and-suspenders check in case the API is ever proxied same-origin.
  if (url.pathname.startsWith('/api/')) return;

  // ── 4. Vite hashed assets — network-first, NEVER fall back to index.html ─
  // Vite generates files like /assets/index-Dm7hti3U.js and
  // /assets/index-BU1xYzTL.css with content hashes in the filename.
  // These must ALWAYS receive the correct asset — returning index.html
  // here would cause text/html MIME-type errors and blank pages.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(networkFirstAsset(request));
    return;
  }

  // ── 5. Navigation requests — network-first, fall back to /index.html ─────
  // This covers SPA routes like /menu, /checkout, /order-success/:id etc.
  // The network-first approach ensures every deployment is immediately visible.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // ── 6. Other same-origin static files (logo, manifest, images) ───────────
  // Network-first with offline cache fallback.
  event.respondWith(networkFirstStatic(request));
});

// ─── Strategy helpers ─────────────────────────────────────────────────────────

/**
 * Network-first for Vite hashed assets (/assets/*).
 * On success: cache the asset and return the response.
 * On failure: return cached version if available.
 * NEVER returns index.html — if an asset is missing and not cached, the
 * browser gets a real network error (which is correct behaviour).
 */
async function networkFirstAsset(request) {
  try {
    const networkResponse = await fetch(request);

    // Only cache valid asset responses (2xx with correct content type).
    // Reject any response whose content-type is text/html — this catches
    // the Cloudflare Pages `_redirects` fallback that serves index.html
    // for missing files. Caching that would reproduce the original bug.
    const contentType = networkResponse.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const isOk = networkResponse.ok;

    if (isOk && !isHtml) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Network unavailable — serve from cache if possible.
    const cached = await caches.match(request);
    if (cached) return cached;

    // Asset not cached and network unavailable — return a genuine error
    // response. Do NOT return index.html; the browser must know the asset
    // failed so it can surface the correct error.
    return new Response('Asset unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Network-first for HTML navigation requests.
 * On success: update the cache and return the latest HTML.
 * On failure: serve the cached /index.html as the offline fallback.
 * This ensures every new Cloudflare deployment is immediately visible.
 */
async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);

    // Refresh the cached index.html with the latest version from the network.
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put('/index.html', networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Network unavailable — serve the cached HTML shell.
    const cached = await caches.match('/index.html');
    if (cached) return cached;

    // No cached HTML either — return a simple offline message.
    return new Response(
      '<html><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Network-first for other same-origin static files (logo, manifest, images).
 * On success: cache the response.
 * On failure: serve the cached version if available.
 */
async function networkFirstStatic(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Nothing cached and network is down.
    return new Response('Resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
