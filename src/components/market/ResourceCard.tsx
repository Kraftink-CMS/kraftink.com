import { Link } from 'react-router-dom';
import type { CatalogueResource } from '../../../shared/catalogue';
import { marketResourcePath } from '../../../shared/routes';
import { localized, useLocale } from '../../lib/i18n';
import { commonMessages } from '../../lib/translations';
import { resourcePrice } from '../../lib/catalogue';
import { Skeleton } from '../UI';
import { ResourceIcon } from './ResourceIcon';

export function ResourceCard({ resource }: { resource: CatalogueResource }) {
    const { locale, path } = useLocale();
    const common = commonMessages[locale];
    const cover = resource.type === 'theme';
    const image = cover ? localized(resource.image, locale) : undefined;
    const name = localized(resource.name, locale);
    const target = path(marketResourcePath(resource));
    const price =
        resource.commercial.kind === 'free'
            ? common.free
            : resource.access?.allowed && resource.resourceId
              ? common.purchased
              : resourcePrice(resource, locale);
    return (
        <article className="card resource-card h-100">
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
            <div className="card-body d-flex gap-3">
                {!cover && <ResourceIcon resource={resource} />}
                <div className="resource-card-copy">
                    <div className="resource-card-heading">
                        <h3 className="h5 mb-0">
                            <Link to={target} className="stretched-link">
                                {name}
                            </Link>
                        </h3>
                        <span className="resource-card-price">{price}</span>
                    </div>
                    <p>{localized(resource.description, locale)}</p>
                    <p className="small text-body-secondary mb-0">{resource.author.name}</p>
                </div>
            </div>
        </article>
    );
}

export function ResourceCardLoading({ cover = false }: { cover?: boolean }) {
    return (
        <div className="card h-100 overflow-hidden">
            {cover && <div className="resource-art skeleton rounded-0" />}
            <div className="card-body d-flex gap-3">
                {!cover && <div className="resource-icon skeleton rounded-3" />}
                <div className="resource-card-copy gap-2">
                    <div className="d-flex justify-content-between gap-2">
                        <Skeleton width="45%" height="1.25rem" />
                        <Skeleton width="18%" />
                    </div>
                    <Skeleton width="95%" />
                    <Skeleton width="65%" />
                    <Skeleton width="35%" height="0.875rem" />
                </div>
            </div>
        </div>
    );
}
