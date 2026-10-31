import { Marked } from 'marked';
import { fallbackLocale } from '../../shared/locales.ts';

export interface Guide {
    slug: string;
    title: string;
    section: string;
    audience: string;
    markdown: string;
    html: string;
    headings: string[];
    aliases: Record<string, string>;
    description: string;
    hidden: boolean;
    contentLocale?: string;
    originalMarkdown?: string;
    availableLocales?: string[];
}

export interface RenderedGuide {
    html: string;
    headings: string[];
    aliases: Map<string, string>;
}

export function documentationHeading(value: string): string {
    const plain = value
        .replace(/<[^>]*>/g, '')
        .replace(/[*_`]/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    return (
        plain.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
        plain.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') ||
        'section'
    );
}

export function renderDocumentation(markdown: string): { html: string; headings: string[] } {
    const headings: string[] = [];
    const used = new Map<string, number>();
    const parser = new Marked({
        gfm: true,
        renderer: {
            heading({ tokens, depth }) {
                const text = this.parser.parseInline(tokens);
                const base = documentationHeading(text);
                let suffix = used.get(base) ?? 0;
                let id = suffix ? `${base}-${suffix}` : base;
                while (headings.includes(id)) {
                    suffix += 1;
                    id = `${base}-${suffix}`;
                }
                used.set(base, suffix + 1);
                headings.push(id);
                return `<h${depth} id="${id}">${text}</h${depth}>\n`;
            },
        },
    });
    return { html: parser.parse(markdown, { async: false }), headings };
}

export function decodeFragment(fragment: string): string {
    try {
        return decodeURIComponent(fragment.replace(/^#/, ''));
    } catch {
        return fragment.replace(/^#/, '');
    }
}

export function guideFragment(fragment: string, guide?: RenderedGuide): string {
    const decoded = decodeFragment(fragment);
    if (!decoded || !guide) {
        return decoded;
    }
    if (guide.headings.includes(decoded)) {
        return decoded;
    }
    const normalized = documentationHeading(decoded);
    return guide.headings.includes(normalized)
        ? normalized
        : (guide.aliases.get(decoded) ?? guide.aliases.get(normalized) ?? decoded);
}

function sourceFilename(slug: string): string {
    return `${slug === 'index' ? 'README' : slug.replace(/\/index$/, '/README')}.md`;
}

export function documentationHref(
    href: string,
    source: Pick<Guide, 'slug' | 'contentLocale'>,
    base: string,
    guides: Map<string, RenderedGuide>,
): string {
    if (!href || /^(?:https?:|mailto:|tel:)/i.test(href)) {
        return href;
    }
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
        return '#';
    }
    const locale = source.contentLocale ?? fallbackLocale;
    const root = `/documentation/source/${locale}/`;
    const url = new URL(href, `https://content.invalid${root}${sourceFilename(source.slug)}`);
    let filename: string | null = null;
    if (href.startsWith('#')) {
        filename = sourceFilename(source.slug);
    } else if (url.pathname.startsWith(root)) {
        filename = url.pathname.slice(root.length);
    } else {
        const explicitSource = /^\/documentation\/source\/[^/]+\/(.+)$/.exec(url.pathname);
        if (explicitSource) {
            filename = explicitSource[1];
        }
    }
    if (filename && /\.md$/i.test(filename)) {
        const target = filename.replace(/\.md$/i, '').replace(/(^|\/)README$/i, '$1index');
        const fragment = guideFragment(url.hash, guides.get(target));
        return `${base}/${target}${url.search}${fragment ? `#${encodeURIComponent(fragment)}` : ''}`;
    }
    if (filename) {
        return `${root}${filename}${url.search}${url.hash}`;
    }
    if (href.startsWith('/') && !/^\/(?:assets|generated|api|documentation\/source)(?:\/|$)/.test(href)) {
        return `${base.replace(/\/documentation$/, '')}${href}`;
    }
    return `${url.pathname}${url.search}${url.hash}`;
}

export function documentationImages(src: string, source: Guide): string[] {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src)) {
        return [src];
    }
    const locale = source.contentLocale ?? fallbackLocale;
    const root = `/documentation/source/${locale}/`;
    const url = new URL(src, `https://content.invalid${root}${sourceFilename(source.slug)}`);
    const screenshot =
        /^\/documentation\/source\/[^/]+\/assets\/([^/]+\.(?:png|jpe?g|webp))$/i.exec(url.pathname) ??
        /^\/assets\/(?:images|screenshots\/[^/]+)\/([^/]+\.(?:png|jpe?g|webp))$/i.exec(url.pathname);
    const suffix = url.search + url.hash;
    const original = url.pathname + suffix;
    if (!screenshot) {
        return [original];
    }
    const filename = screenshot[1];
    const stem = filename.replace(/\.(?:png|jpe?g|webp)$/i, '');
    return Array.from(
        new Set([
            ...Array.from(new Set([locale, fallbackLocale])).flatMap((language) => [
                `/assets/screenshots/${language}/${filename}${suffix}`,
                ...['png', 'jpg', 'jpeg', 'webp'].map(
                    (extension) => `/assets/screenshots/${language}/${stem}.${extension}${suffix}`,
                ),
            ]),
            original,
        ]),
    );
}
