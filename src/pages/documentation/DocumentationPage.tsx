import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Empty, ErrorNotice, Loading, PageTitle } from '../../components/UI';
import { useLocale } from '../../lib/i18n';
import { publicMessages } from '../../lib/translations';
import { usePublicPageData } from '../../lib/rendering';
import { decodeFragment, documentationHeading, guideFragment, type Guide } from '../../lib/documentation';

export function DocumentationPage() {
    const { locale, path } = useLocale();
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const text = publicMessages[locale];
    const { data, update } = usePublicPageData();
    const initialGuides = data.locale === locale ? (data.guides ?? null) : null;
    const [guides, setGuides] = useState<Guide[] | null>(initialGuides);
    const [guidesLocale, setGuidesLocale] = useState<string | null>(initialGuides ? locale : null);
    const [error, setError] = useState<unknown>(null);
    const [search, setSearch] = useState('');
    const article = useRef<HTMLElement>(null);
    const previousGuide = useRef<{ slug: string; headings: string[] } | null>(null);
    const slug = params['*'] || 'index';
    useEffect(() => {
        const controller = new AbortController();
        setError(null);
        fetch(`/generated/documentation-${locale}.json`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('service_unavailable');
                }
                return response.json() as Promise<Guide[]>;
            })
            .then((documents) => {
                if (!controller.signal.aborted) {
                    setGuidesLocale(locale);
                    setGuides(documents);
                    update({ locale, guides: documents });
                }
            })
            .catch((failure) => {
                if (!controller.signal.aborted) {
                    setError(failure);
                }
            });
        return () => controller.abort();
    }, [locale, update]);
    const activeGuides = guidesLocale === locale ? guides : null;
    const selected = activeGuides?.find((guide) => guide.slug === slug);
    const prepared = useMemo(
        () =>
            new Map(
                (activeGuides ?? []).map((guide) => [
                    guide.slug,
                    {
                        html: guide.html,
                        headings: guide.headings,
                        aliases: new Map(Object.entries(guide.aliases)),
                    },
                ]),
            ),
        [activeGuides],
    );
    const html = selected?.html ?? '';
    useEffect(() => {
        const current = prepared.get(slug);
        if (!html || !current) {
            return;
        }
        let id = guideFragment(location.hash, current);
        const previous = previousGuide.current;
        if (location.hash && !current.headings.includes(id) && previous?.slug === slug) {
            const decoded = decodeFragment(location.hash);
            const index = previous.headings.findIndex(
                (heading) => heading === decoded || heading === documentationHeading(decoded),
            );
            id = current.headings[index] ?? id;
        }
        previousGuide.current = { slug, headings: current.headings };
        if (!location.hash) {
            return;
        }
        if (current.headings.includes(id) && id !== decodeFragment(location.hash)) {
            navigate(
                { pathname: location.pathname, search: location.search, hash: `#${encodeURIComponent(id)}` },
                { replace: true },
            );
        }
        const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 20);
        return () => window.clearTimeout(timer);
    }, [location.hash, location.pathname, location.search, html, prepared, slug, navigate]);
    useEffect(() => {
        const cleanups: Array<() => void> = [];
        for (const image of article.current?.querySelectorAll<HTMLImageElement>('img[data-documentation-images]') ??
            []) {
            const candidates = JSON.parse(image.dataset.documentationImages ?? '[]') as string[];
            let index = 0;
            const retry = () => {
                index += 1;
                if (index < candidates.length) {
                    image.src = candidates[index];
                }
            };
            image.addEventListener('error', retry);
            if (image.complete && image.naturalWidth === 0) {
                retry();
            }
            cleanups.push(() => image.removeEventListener('error', retry));
        }
        return () => cleanups.forEach((cleanup) => cleanup());
    }, [html]);
    if (!activeGuides) {
        return error ? <ErrorNotice error={error} /> : <Loading />;
    }
    return (
        <>
            <PageTitle title={text.docsTitle} description={text.docsIntro} />
            <div className="docs-layout">
                <aside className="docs-sidebar">
                    <label className="form-label" htmlFor="docs-search">
                        {text.docsSearch}
                    </label>
                    <input
                        id="docs-search"
                        type="search"
                        className="form-control mb-3"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    {(['owner', 'developer'] as const).map((audience) => (
                        <section key={audience}>
                            <h2 className="h6">{text[audience]}</h2>
                            <nav aria-label={text[audience]}>
                                {activeGuides
                                    .filter(
                                        (guide) =>
                                            !guide.hidden &&
                                            guide.audience === audience &&
                                            `${guide.title} ${guide.description}`
                                                .toLowerCase()
                                                .includes(search.toLowerCase()),
                                    )
                                    .map((guide) => (
                                        <Link
                                            key={guide.slug}
                                            className={guide.slug === slug ? 'active' : ''}
                                            to={`${path('/documentation')}/${guide.slug}`}
                                        >
                                            {guide.title}
                                        </Link>
                                    ))}
                            </nav>
                        </section>
                    ))}
                </aside>
                <article className="documentation-content" ref={article} lang={selected?.contentLocale ?? locale}>
                    {selected ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <Empty>{text.notFoundText}</Empty>}
                </article>
            </div>
        </>
    );
}
