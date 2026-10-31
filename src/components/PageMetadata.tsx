import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { fallbackLocale } from '../../shared/locales';
import { useLocale } from '../lib/i18n';
import { pageMetadata, type PageMetadata as Metadata } from '../lib/metadata';
import { usePublicPageData } from '../lib/rendering';

function metadataFields(metadata: Metadata) {
    return [
        { name: 'description', content: metadata.description },
        { name: 'robots', content: metadata.indexable ? 'index, follow' : 'noindex, follow' },
        { property: 'og:title', content: metadata.title },
        { property: 'og:description', content: metadata.description },
        { property: 'og:url', content: metadata.canonical },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: metadata.title },
        { name: 'twitter:description', content: metadata.description },
    ];
}

function metadataAlternates(metadata: Metadata) {
    return metadata.alternates.length === 0
        ? []
        : [
              ...metadata.alternates,
              {
                  locale: 'x-default',
                  href:
                      metadata.alternates.find((entry) => entry.locale === fallbackLocale)?.href ?? metadata.canonical,
              },
          ];
}

export function MetadataTags({ metadata }: { metadata: Metadata }) {
    return (
        <>
            <title>{metadata.title}</title>
            {metadataFields(metadata).map((entry) => (
                <meta key={entry.name ?? entry.property} {...entry} />
            ))}
            <link rel="canonical" href={metadata.canonical} />
            {metadataAlternates(metadata).map((entry) => (
                <link
                    key={entry.locale}
                    rel="alternate"
                    hrefLang={entry.locale}
                    href={entry.href}
                    data-kraftink-alternate=""
                />
            ))}
        </>
    );
}

export function PageMetadata() {
    const { locale } = useLocale();
    const location = useLocation();
    const { data } = usePublicPageData();
    const origin = data.origin;
    const metadata = useMemo(
        () => pageMetadata(location.pathname, location.search, locale, data, origin),
        [location.pathname, location.search, locale, data, origin],
    );
    useEffect(() => {
        document.title = metadata.title;
        for (const entry of metadataFields(metadata)) {
            const attribute = entry.name ? 'name' : 'property';
            const value = entry.name ?? entry.property!;
            let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, value);
                document.head.appendChild(element);
            }
            element.content = entry.content;
        }
        let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = metadata.canonical;
        document.head.querySelectorAll('link[data-kraftink-alternate]').forEach((entry) => entry.remove());
        for (const entry of metadataAlternates(metadata)) {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = entry.locale;
            link.href = entry.href;
            link.dataset.kraftinkAlternate = '';
            document.head.appendChild(link);
        }
    }, [metadata]);
    return null;
}
