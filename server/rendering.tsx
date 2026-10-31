import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppProviders } from '../src/AppProviders';
import { MetadataTags } from '../src/components/PageMetadata';
import { pageMetadata, localizedPagePath } from '../src/lib/metadata';
import type { PageData, PublicPageData } from '../src/lib/rendering';
import type { Guide } from '../src/lib/documentation';
import { isLocale, localeRegistry, localizedPathname } from '../shared/locales';
import { fail, sessionCookieName, type AppContext } from './http';
import { getCookie } from 'hono/cookie';
import { resolveSession, sessionData } from './middleware/authentication';
import { hasRole } from '../shared/auth';
import { protectedPages } from '../shared/routes';
import type { Env } from './types';
import { cachedMetadata, mergedCatalogue } from './services/market/catalogue';

const publicPaths = ['', 'features', 'about', 'downloads', 'market', 'terms', 'privacy'];

async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            operation(controller.signal),
            new Promise<undefined>((resolve) => {
                timer = setTimeout(() => {
                    controller.abort();
                    resolve(undefined);
                }, 2000);
            }),
        ]);
    } catch {
        return undefined;
    } finally {
        clearTimeout(timer);
        controller.abort();
    }
}

async function assetJson(env: Env, path: string, signal: AbortSignal): Promise<unknown> {
    const response = await env.ASSETS.fetch(
        new Request(new URL(path, env.APP_ORIGIN), {
            headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' },
            signal,
        }),
    );
    if (!response.ok) {
        throw new Error('public_data_unavailable');
    }
    return response.json();
}

function guideData(value: unknown): value is Guide[] {
    return (
        Array.isArray(value) &&
        value.every(
            (guide) =>
                guide &&
                typeof guide === 'object' &&
                typeof guide.slug === 'string' &&
                typeof guide.title === 'string' &&
                typeof guide.html === 'string' &&
                typeof guide.markdown === 'string' &&
                typeof guide.description === 'string' &&
                typeof guide.hidden === 'boolean' &&
                Array.isArray(guide.headings) &&
                guide.headings.every((heading: unknown) => typeof heading === 'string') &&
                guide.aliases &&
                typeof guide.aliases === 'object' &&
                !Array.isArray(guide.aliases),
        )
    );
}

async function guides(env: Env, locale: string, signal: AbortSignal): Promise<Guide[]> {
    const value = await assetJson(env, `/generated/documentation-${locale}.json`, signal);
    if (!guideData(value)) {
        throw new Error('documentation_unavailable');
    }
    return value;
}

async function publicData(env: Env, locale: string, relative: string, userId: string | null): Promise<PublicPageData> {
    const data: PublicPageData = { locale, origin: new URL(env.APP_ORIGIN).origin };
    if (relative === 'documentation' || relative.startsWith('documentation/')) {
        data.guides = await bounded((signal) => guides(env, locale, signal));
    } else if (
        relative === '' ||
        relative === 'market' ||
        relative === 'market/resource' ||
        relative.startsWith('market/resource/')
    ) {
        data.catalogue = await bounded((signal) =>
            mergedCatalogue(env, userId, false, { persistMetadata: false, signal }),
        );
        data.catalogueIdentity = userId ?? 'public';
    } else if (relative === 'downloads') {
        const result = await bounded(async (signal) => {
            const [sources, metadata] = await Promise.all([
                assetJson(env, '/generated/sources.json', signal),
                cachedMetadata(env, 'releases', { persistMetadata: false, signal }),
            ]);
            return { sources, releases: metadata.data };
        });
        if (result) {
            data.sources = result.sources;
            data.releases = result.releases;
        }
    }
    return data;
}

function serializedData(data: PageData): string {
    return JSON.stringify(data)
        .replaceAll('<', '\\u003c')
        .replaceAll('\u2028', '\\u2028')
        .replaceAll('\u2029', '\\u2029');
}

function responseHeaders(indexable: boolean, status: number, personalized: boolean, template?: Headers): Headers {
    const headers = new Headers({
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control':
            !personalized && indexable && status === 200 ? 'public, max-age=0, must-revalidate' : 'private, no-store',
        'CDN-Cache-Control': 'no-store',
        'Vary': 'Cookie, Accept-Language',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'same-origin',
        ...(status === 503 ? { 'Retry-After': '30' } : {}),
        ...(!indexable ? { 'X-Robots-Tag': 'noindex, follow' } : {}),
    });
    for (const name of [
        'Content-Security-Policy',
        'Content-Security-Policy-Report-Only',
        'X-Frame-Options',
        'Permissions-Policy',
        'Strict-Transport-Security',
        'Cross-Origin-Opener-Policy',
        'Cross-Origin-Embedder-Policy',
        'Cross-Origin-Resource-Policy',
        'Origin-Agent-Cluster',
        'X-Permitted-Cross-Domain-Policies',
        'X-Content-Type-Options',
        'Referrer-Policy',
    ]) {
        const value = template?.get(name);
        if (value !== null && value !== undefined) headers.set(name, value);
    }
    return headers;
}

export async function renderPage(c: AppContext): Promise<Response> {
    const url = new URL(c.req.url);
    await resolveSession(c);
    const session = sessionData(c);
    const localePath = localizedPathname(url.pathname === '/index.html' ? '/' : url.pathname, session.preferredLocale)
        .replace(/\/{2,}/g, '/')
        .replace(/\/$/, '');
    if (url.pathname !== localePath) {
        return new Response(null, {
            status: 302,
            headers: {
                Location: new URL(`${localePath}${url.search}`, c.env.APP_ORIGIN).href,
                Vary: 'Cookie, Accept-Language',
                'Cache-Control': 'private, no-store',
            },
        });
    }
    const locale = localePath.split('/')[1];
    if (!isLocale(locale)) {
        return new Response(null, { status: 404 });
    }
    const relative = localePath.split('/').slice(2).join('/');
    const personalized = Boolean(session.user || getCookie(c, sessionCookieName(c)) || c.req.header('Authorization'));
    const protectedPage = Object.hasOwn(protectedPages, relative);
    if (protectedPage && !session.user) {
        return new Response(null, {
            status: 302,
            headers: {
                Location: new URL(
                    `/${locale}/login?next=${encodeURIComponent(localePath + url.search)}`,
                    c.env.APP_ORIGIN,
                ).href,
                'Cache-Control': 'private, no-store',
                'CDN-Cache-Control': 'no-store',
            },
        });
    }
    const data: PageData = { ...(await publicData(c.env, locale, relative, session.user?.id ?? null)), session };
    let metadata = pageMetadata(localePath, url.search, locale, data, new URL(c.env.APP_ORIGIN).origin);
    const requiredRole = protectedPage ? protectedPages[relative as keyof typeof protectedPages] : null;
    if (requiredRole && !hasRole(session.user, requiredRole)) {
        metadata = { ...metadata, status: 403 };
    }
    let content: string;
    try {
        content = renderToString(
            <StaticRouter location={`${localePath}${url.search}`}>
                <AppProviders initial={data} />
            </StaticRouter>,
        );
    } catch (error) {
        console.error('page_render_failed', error instanceof Error ? error.name : 'Error');
        fail(503, 'page_render_failed');
    }
    const template = await c.env.ASSETS.fetch(
        new Request(new URL('/index.html', c.env.APP_ORIGIN), {
            headers: { Accept: 'text/html', 'Accept-Encoding': 'identity' },
        }),
    );
    if (!template.ok) {
        return new Response(null, {
            status: 503,
            headers: responseHeaders(false, 503, personalized, template.headers),
        });
    }
    const head = renderToStaticMarkup(<MetadataTags metadata={metadata} />);
    const response = new Response(template.body, {
        status: metadata.status,
        headers: responseHeaders(metadata.indexable, metadata.status, personalized, template.headers),
    });
    return new HTMLRewriter()
        .on('html', {
            element(element) {
                element.setAttribute('lang', locale);
                element.setAttribute('dir', localeRegistry[locale].direction);
            },
        })
        .on('head title', {
            element(element) {
                element.remove();
            },
        })
        .on('head meta', {
            element(element) {
                const name = element.getAttribute('name')?.toLowerCase() ?? '';
                const property = element.getAttribute('property')?.toLowerCase() ?? '';
                if (
                    ['description', 'robots'].includes(name) ||
                    name.startsWith('twitter:') ||
                    property.startsWith('og:')
                )
                    element.remove();
            },
        })
        .on('head link', {
            element(element) {
                const relation = element.getAttribute('rel')?.toLowerCase();
                if (relation === 'canonical' || (relation === 'alternate' && element.getAttribute('hreflang') !== null))
                    element.remove();
            },
        })
        .on('head', {
            element(element) {
                element.append(head, { html: true });
            },
        })
        .on('#root', {
            element(element) {
                element.setInnerContent(content, { html: true });
            },
        })
        .on('body', {
            element(element) {
                element.append(
                    `<script type="application/json" id="kraftink-page-data">${serializedData(data)}</script>`,
                    { html: true },
                );
            },
        })
        .transform(response);
}

function xml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

export function robots(env: Env): Response {
    const origin = new URL(env.APP_ORIGIN).origin;
    return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`, {
        headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Cache-Control': 'public, max-age=300',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}

export async function sitemap(env: Env): Promise<Response> {
    const origin = new URL(env.APP_ORIGIN).origin;
    const locales = Object.keys(localeRegistry);
    const urls = new Set(
        locales.flatMap((locale) => publicPaths.map((path) => new URL(localizedPagePath(locale, path), origin).href)),
    );
    const [documents, catalogue] = await Promise.all([
        bounded((signal) =>
            Promise.all(
                locales.map(async (locale) => {
                    try {
                        return { locale, guides: await guides(env, locale, signal) };
                    } catch {
                        return { locale, guides: [] };
                    }
                }),
            ),
        ),
        bounded((signal) => mergedCatalogue(env, null, false, { persistMetadata: false, signal })),
    ]);
    for (const document of documents ?? []) {
        for (const guide of document.guides) {
            if (guide.hidden || (guide.availableLocales && !guide.availableLocales.includes(document.locale))) continue;
            const path =
                guide.slug === 'index'
                    ? 'documentation'
                    : `documentation/${guide.slug.split('/').map(encodeURIComponent).join('/')}`;
            urls.add(new URL(localizedPagePath(document.locale, path), origin).href);
        }
    }
    for (const resource of catalogue?.resources ?? []) {
        for (const locale of locales)
            urls.add(
                new URL(
                    localizedPagePath(
                        locale,
                        `market/resource/${encodeURIComponent(resource.resourceId ?? resource.id)}`,
                    ),
                    origin,
                ).href,
            );
    }
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from(
            urls,
        )
            .sort()
            .map((url) => `<url><loc>${xml(url)}</loc></url>`)
            .join('')}</urlset>`,
        {
            headers: {
                'Content-Type': 'application/xml; charset=UTF-8',
                'Cache-Control': 'public, max-age=300',
                'X-Content-Type-Options': 'nosniff',
            },
        },
    );
}

export function assetPath(pathname: string): boolean {
    return (
        /^\/(?:assets|generated|licenses|documentation\/source|\.well-known)(?:\/|$)/.test(pathname) ||
        /\.(?:css|m?js|map|png|jpe?g|webp|gif|avif|svg|ico|woff2?|ttf|json|md|txt|xml)$/i.test(pathname)
    );
}
