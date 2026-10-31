import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';
import { documentationHref, documentationImages, renderDocumentation } from '../src/lib/documentation.ts';

const sections = [
    {
        id: 'installation',
        audience: 'owner',
        slugs: ['index', 'installation', 'configuration', 'seo', 'extensions-catalogue', 'migration'],
    },
    {
        id: 'services',
        audience: 'owner',
        slugs: ['oauth', 'games', 'kraftlink', 'shop-administration', 'vote', 'service-accounts'],
    },
    {
        id: 'maintenance',
        audience: 'owner',
        slugs: ['operations', 'updates'],
    },
    {
        id: 'extension-development',
        audience: 'developer',
        slugs: [
            'developpeurs',
            'architecture-extensions',
            'developpement-plugins',
            'developpement-themes',
            'developpement-jeux',
        ],
    },
    {
        id: 'developer-reference',
        audience: 'developer',
        slugs: [
            'ui-contributions',
            'tables',
            'api-plugins',
            'api-publique',
            'auth-api',
            'plugin-api-scopes',
            'plugin-events',
            'plugin-notifications',
            'plugin-widgets',
            'developpement-kraftlink',
            'developpement-serveurs',
            'developpement-soldes',
            'passerelles-paiement',
            'privacy-extensions',
            'development-migrations',
        ],
    },
    {
        id: 'distribution',
        audience: 'developer',
        slugs: ['extensions-publication'],
    },
];

async function listFiles(directory, relative = '') {
    let entries;

    try {
        entries = await readdir(path.join(directory, relative), { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT' && relative === '') {
            return [];
        }

        throw error;
    }
    const files = [];

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
        const filename = path.posix.join(relative, entry.name);

        if (entry.isSymbolicLink()) {
            throw new Error(`Documentation must not contain symbolic links: ${filename}`);
        }

        if (entry.isDirectory()) {
            files.push(...(await listFiles(directory, filename)));
        } else if (entry.isFile()) {
            files.push(filename);
        }
    }

    return files;
}

function describe(markdown) {
    const withoutCode = markdown.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    const paragraph =
        withoutCode.split(/\r?\n\s*\r?\n/).find((part) => {
            return part.trim() && !/^[#>|*-]|^\d+\./.test(part.trim());
        }) || [...withoutCode.matchAll(/^##\s+(.+)$/gm)].map((heading) => heading[1]).join('. ');
    const text = paragraph
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[`*_]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length <= 180) {
        return text;
    }

    return `${text.slice(0, 177).replace(/\s+\S*$/, '')}…`;
}

export async function loadDocumentation(site, locale = 'en') {
    const destination = path.join(site, 'content', 'documentation', locale);
    const documents = [];

    for (const filename of await listFiles(destination)) {
        if (!filename.endsWith('.md')) {
            continue;
        }

        const markdown = await readFile(path.join(destination, filename), 'utf8');
        const slug = filename.replace(/\.md$/, '').replace(/(^|\/)README$/i, '$1index');
        const title = markdown.match(/^#\s+(.+)$/m)?.[1].trim() || slug;
        const group = sections.find((section) => section.slugs.includes(slug));

        if (!group) {
            throw new Error(`Documentation guide has no audience or section: ${filename}`);
        }

        documents.push({
            slug,
            title,
            section: group.id,
            audience: group.audience,
            hidden: false,
            markdown,
            description: describe(markdown),
        });
    }

    return sortDocuments(documents, locale);
}

function sortDocuments(documents, locale) {
    return documents.sort((left, right) => {
        const leftSection = sections.findIndex((section) => section.id === left.section);
        const rightSection = sections.findIndex((section) => section.id === right.section);

        if (leftSection !== rightSection) {
            return leftSection - rightSection;
        }

        const order = sections[leftSection]?.slugs || [];
        const leftOrder = order.indexOf(left.slug);
        const rightOrder = order.indexOf(right.slug);

        return (
            (leftOrder < 0 ? Infinity : leftOrder) - (rightOrder < 0 ? Infinity : rightOrder) ||
            left.title.localeCompare(right.title, locale)
        );
    });
}

export async function loadLocalizedDocumentation(site, locales, fallbackLocale = 'en') {
    const languages = [...new Set([fallbackLocale, ...locales])];
    const variants = new Map(
        await Promise.all(
            languages.map(async (locale) => {
                return [
                    locale,
                    new Map((await loadDocumentation(site, locale)).map((document) => [document.slug, document])),
                ];
            }),
        ),
    );

    return new Map(
        locales.map((locale) => {
            const documents = new Map();

            for (const language of new Set([locale, fallbackLocale])) {
                for (const [slug, document] of variants.get(language)) {
                    if (documents.has(slug)) {
                        continue;
                    }

                    documents.set(slug, {
                        ...document,
                        contentLocale: language,
                        originalMarkdown: variants.get(fallbackLocale).get(slug)?.markdown || document.markdown,
                    });
                }
            }

            return [locale, sortDocuments([...documents.values()], locale)];
        }),
    );
}

export function prepareDocumentation(documents, locale) {
    const prepared = new Map(
        documents.map((guide) => {
            const rendered = renderDocumentation(guide.markdown);
            const originals = guide.originalMarkdown
                ? renderDocumentation(guide.originalMarkdown).headings
                : rendered.headings;
            return [
                guide.slug,
                {
                    ...rendered,
                    aliases: new Map(
                        originals.flatMap((id, index) =>
                            rendered.headings[index] ? [[id, rendered.headings[index]]] : [],
                        ),
                    ),
                },
            ];
        }),
    );

    return documents.map((guide) => {
        const rendered = prepared.get(guide.slug);
        const html = sanitizeHtml(rendered.html, {
            allowedTags: [
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'p',
                'a',
                'img',
                'ul',
                'ol',
                'li',
                'strong',
                'em',
                'b',
                'i',
                'del',
                's',
                'blockquote',
                'pre',
                'code',
                'hr',
                'br',
                'table',
                'thead',
                'tbody',
                'tfoot',
                'tr',
                'th',
                'td',
                'caption',
                'dl',
                'dt',
                'dd',
                'details',
                'summary',
                'kbd',
                'samp',
                'sub',
                'sup',
                'span',
            ],
            allowedAttributes: {
                ...Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => [tag, ['id']])),
                a: ['id', 'href', 'title', 'rel'],
                img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'data-documentation-images'],
                code: ['class'],
                ol: ['start'],
                th: ['colspan', 'rowspan', 'scope', 'align'],
                td: ['colspan', 'rowspan', 'align'],
                details: ['open'],
            },
            allowedClasses: { code: [/^language-[a-z\d_-]+$/i] },
            allowedSchemes: ['http', 'https', 'mailto', 'tel'],
            allowedSchemesByTag: { img: ['http', 'https'] },
            allowProtocolRelative: false,
            nonTextTags: [
                'script',
                'style',
                'textarea',
                'option',
                'iframe',
                'object',
                'embed',
                'svg',
                'math',
                'noscript',
            ],
            transformTags: {
                a: (_tag, attributes) => {
                    const href = documentationHref(attributes.href ?? '', guide, `/${locale}/documentation`, prepared);
                    return {
                        tagName: 'a',
                        attribs: {
                            ...attributes,
                            href,
                            ...(/^https?:/i.test(href) ? { rel: 'noopener noreferrer' } : {}),
                        },
                    };
                },
                img: (_tag, attributes) => {
                    const candidates = documentationImages(attributes.src ?? '', guide);
                    const original = { ...attributes };
                    delete original['data-documentation-images'];
                    return {
                        tagName: 'img',
                        attribs: {
                            ...original,
                            src: candidates[0],
                            loading: 'lazy',
                            ...(candidates.length > 1
                                ? { 'data-documentation-images': JSON.stringify(candidates) }
                                : {}),
                        },
                    };
                },
            },
        });
        return { ...guide, html, headings: rendered.headings, aliases: Object.fromEntries(rendered.aliases) };
    });
}
