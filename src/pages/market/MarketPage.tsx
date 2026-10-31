import { useState } from 'react';
import { Select } from '../../components/Select';
import { ResourceCard } from '../../components/market/ResourceCard';
import { CardsLoading, Empty, ErrorNotice, PageTitle } from '../../components/UI';
import { useCatalogue } from '../../hooks/useCatalogue';
import { localized, useLocale } from '../../lib/i18n';
import { commonMessages, publicMessages } from '../../lib/translations';

export function MarketPage() {
    const { locale } = useLocale();
    const text = publicMessages[locale];
    const common = commonMessages[locale];
    const { data, error } = useCatalogue();
    const [query, setQuery] = useState('');
    const [type, setType] = useState('');
    const [offer, setOffer] = useState('');
    const resources =
        data?.resources.filter(
            (resource) =>
                (!type || resource.type === type) &&
                (!offer || resource.commercial.kind === offer) &&
                `${localized(resource.name, locale)} ${localized(resource.description, locale)} ${resource.author.name}`
                    .toLocaleLowerCase(locale)
                    .includes(query.toLocaleLowerCase(locale)),
        ) ?? [];
    return (
        <>
            <PageTitle title={common.market} description={text.marketText} />
            <p className="text-body-secondary">{text.marketHelp}</p>
            <div className="market-filters">
                <div className="flex-grow-1">
                    <label className="form-label" htmlFor="market-search">
                        {common.search}
                    </label>
                    <input
                        id="market-search"
                        className="form-control"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div>
                    <label className="form-label" htmlFor="market-type">
                        {text.allTypes}
                    </label>
                    <Select
                        id="market-type"
                        className="form-select"
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                    >
                        <option value="">{text.allTypes}</option>
                        {(['plugin', 'theme', 'game'] as const).map((value) => (
                            <option key={value} value={value}>
                                {common[value]}
                            </option>
                        ))}
                    </Select>
                </div>
                <div>
                    <label className="form-label" htmlFor="market-offer">
                        {text.allOffers}
                    </label>
                    <Select
                        id="market-offer"
                        className="form-select"
                        value={offer}
                        onChange={(event) => setOffer(event.target.value)}
                    >
                        <option value="">{text.allOffers}</option>
                        <option value="free">{text.free}</option>
                        <option value="paid">{text.paid}</option>
                    </Select>
                </div>
            </div>
            <ErrorNotice error={error} />
            {data?.state !== 'fresh' && data && <div className="alert alert-warning">{text.stale}</div>}
            {!data && !error ? (
                <CardsLoading image />
            ) : resources.length ? (
                <div className="row g-4">
                    {resources.map((resource) => (
                        <div className="col-md-6 col-xl-4" key={resource.id}>
                            <ResourceCard resource={resource} />
                        </div>
                    ))}
                </div>
            ) : (
                data && <Empty />
            )}
        </>
    );
}
