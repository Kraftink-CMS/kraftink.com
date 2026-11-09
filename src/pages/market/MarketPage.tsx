import { useSearchParams } from 'react-router-dom';
import type { CatalogueResource } from '../../../shared/catalogue';
import { Select } from '../../components/Select';
import { ResourceCard } from '../../components/market/ResourceCard';
import { CardsLoading, Empty, ErrorNotice, PageTitle } from '../../components/UI';
import { useCatalogue } from '../../hooks/useCatalogue';
import { localized, useLocale } from '../../lib/i18n';
import { commonMessages, publicMessages } from '../../lib/translations';

const resourceTypes = ['theme', 'plugin', 'game'] as const;
const filterTypes = ['plugin', 'theme', 'game'] as const;

export function MarketPage() {
    const { locale } = useLocale();
    const text = publicMessages[locale];
    const common = commonMessages[locale];
    const { data, error } = useCatalogue();
    const [search, setSearch] = useSearchParams();
    const query = search.get('q') ?? '';
    const requestedType = search.get('type') ?? '';
    const requestedOffer = search.get('offer') ?? '';
    const type = resourceTypes.find((value) => value === requestedType) ?? '';
    const offer = ['free', 'paid'].includes(requestedOffer) ? requestedOffer : '';
    function filter(key: 'q' | 'type' | 'offer', value: string, replace = false) {
        setSearch(
            (current) => {
                const next = new URLSearchParams(current);
                if (value) {
                    next.set(key, value);
                } else {
                    next.delete(key);
                }
                return next;
            },
            { replace, preventScrollReset: true },
        );
    }
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    const matches =
        data?.resources.filter(
            (resource) =>
                (!offer || resource.commercial.kind === offer) &&
                `${localized(resource.name, locale)} ${localized(resource.description, locale)} ${resource.author.name}`
                    .toLocaleLowerCase(locale)
                    .includes(normalizedQuery),
        ) ?? [];
    const groups: Record<CatalogueResource['type'], CatalogueResource[]> = { plugin: [], theme: [], game: [] };
    for (const resource of matches) {
        groups[resource.type].push(resource);
    }
    const sections = resourceTypes.filter((value) => (!type || type === value) && groups[value].length);
    const categories = [
        { value: '', label: text.marketAll, count: matches.length },
        ...filterTypes
            .filter((value) => value !== 'game' || type === value || data?.resources.some((r) => r.type === value))
            .map((value) => ({ value, label: text.marketTypes[value], count: groups[value].length })),
    ];

    return (
        <>
            <PageTitle title={common.market} description={text.marketText} />
            <div className="market-filters mb-3">
                <div className="market-search">
                    <label className="visually-hidden" htmlFor="market-search">
                        {common.search}
                    </label>
                    <i className="bi bi-search" aria-hidden="true" />
                    <input
                        id="market-search"
                        className="form-control"
                        type="search"
                        placeholder={text.marketSearch}
                        value={query}
                        onChange={(event) => filter('q', event.target.value, true)}
                    />
                </div>
                <div>
                    <label className="visually-hidden" htmlFor="market-offer">
                        {text.marketOfferFilter}
                    </label>
                    <Select
                        id="market-offer"
                        className="form-select"
                        value={offer}
                        onChange={(event) => filter('offer', event.target.value)}
                    >
                        <option value="">{text.allOffers}</option>
                        <option value="free">{text.free}</option>
                        <option value="paid">{text.paid}</option>
                    </Select>
                </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label={text.marketTypeFilter}>
                {categories.map(({ value, label, count }) => (
                    <button
                        key={value}
                        type="button"
                        className="market-category"
                        aria-pressed={type === value}
                        onClick={() => {
                            if (type !== value) {
                                filter('type', value);
                            }
                        }}
                    >
                        {label}
                        {data && <span>{count}</span>}
                    </button>
                ))}
            </div>
            <ErrorNotice error={error} />
            {data?.state !== 'fresh' && data && <div className="alert alert-warning">{text.stale}</div>}
            {!data && !error ? (
                <CardsLoading image={!type || type === 'theme'} />
            ) : sections.length ? (
                <div className="d-grid gap-4">
                    {sections.map((value) => (
                        <section key={value} aria-labelledby={`market-section-${value}`}>
                            <h2 id={`market-section-${value}`} className="h4 mb-3">
                                {text.marketTypes[value]}
                            </h2>
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                                {groups[value].map((resource) => (
                                    <div className="col" key={resource.id}>
                                        <ResourceCard resource={resource} market />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                data && <Empty />
            )}
        </>
    );
}
