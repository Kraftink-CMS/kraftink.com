import { Link } from 'react-router-dom';
import type { CatalogueResource } from '../../../shared/catalogue';
import { marketResourcePath } from '../../../shared/routes';
import { localized, useLocale } from '../../lib/i18n';
import { commonMessages } from '../../lib/translations';
import { resourcePrice } from '../../lib/catalogue';
import { ResourceIcon } from './ResourceIcon';

export function ResourceCard({ resource, market = false }: { resource: CatalogueResource; market?: boolean }) {
    const { locale, path } = useLocale();
    const common = commonMessages[locale];
    const image = localized(resource.image, locale);
    const name = localized(resource.name, locale);
    const target = path(marketResourcePath(resource));
    const price =
        resource.commercial.kind === 'free'
            ? common.free
            : resource.access?.allowed && resource.resourceId
              ? common.purchased
              : resourcePrice(resource, locale);
    const cover = market ? resource.type === 'theme' : Boolean(image);
    const Heading = market ? 'h3' : 'h2';
    return (
        <article className={`card resource-card h-100${market ? ' market-card' : ''}`}>
            {cover && (
                <div className="resource-art" aria-hidden="true">
                    <ResourceIcon resource={resource} />
                    {image && (
                        <img
                            className="resource-cover-image"
                            key={image}
                            src={image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(event) => {
                                event.currentTarget.hidden = true;
                            }}
                        />
                    )}
                </div>
            )}
            <div className={market ? 'card-body flex-row gap-3' : 'card-body'}>
                {market && !cover && <ResourceIcon resource={resource} />}
                <div className="resource-card-copy">
                    <div className={market ? 'market-card-heading' : 'd-flex align-items-center gap-3 mb-3'}>
                        {!market && !cover && <ResourceIcon resource={resource} />}
                        <div>
                            {!market && <span className="resource-type">{common[resource.type]}</span>}
                            <Heading className="h5 mb-0">
                                <Link to={target} className={market ? 'stretched-link' : undefined}>
                                    {name}
                                </Link>
                            </Heading>
                        </div>
                        {market && <span className="market-card-price">{price}</span>}
                    </div>
                    <p>{localized(resource.description, locale)}</p>
                    <p className="small text-body-secondary mb-0">{resource.author.name}</p>
                </div>
            </div>
            {!market && (
                <div className="card-footer d-flex justify-content-between align-items-center">
                    <strong>{price}</strong>
                    <Link to={target} className="resource-link" aria-label={`${common.resource} · ${name}`}>
                        ↗
                    </Link>
                </div>
            )}
        </article>
    );
}
