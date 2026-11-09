import { Link } from 'react-router-dom';
import type { CatalogueResource } from '../../../shared/catalogue';
import { localized, useLocale } from '../../lib/i18n';
import { commonMessages } from '../../lib/translations';
import { resourcePrice } from '../../lib/catalogue';
import { ResourceIcon } from './ResourceIcon';

export function ResourceCard({ resource }: { resource: CatalogueResource }) {
    const { locale, path } = useLocale();
    const common = commonMessages[locale];
    const identifier = encodeURIComponent(resource.resourceId ?? resource.id);
    const image = localized(resource.image, locale);
    const name = localized(resource.name, locale);
    const target = `${path('/market/resource')}/${identifier}`;
    return (
        <article className="card resource-card h-100">
            {image && (
                <div className="resource-art" aria-hidden="true">
                    <ResourceIcon resource={resource} />
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
                </div>
            )}
            <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                    {!image && <ResourceIcon resource={resource} />}
                    <div>
                        <span className="resource-type">{common[resource.type]}</span>
                        <h2 className="h5 mb-0">
                            <Link to={target}>{name}</Link>
                        </h2>
                    </div>
                </div>
                <p>{localized(resource.description, locale)}</p>
                <p className="small text-body-secondary mb-0">{resource.author.name}</p>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
                <strong>
                    {resource.commercial.kind === 'free'
                        ? common.free
                        : resource.access?.allowed && resource.resourceId
                          ? common.purchased
                          : resourcePrice(resource, locale)}
                </strong>
                <Link to={target} className="resource-link" aria-label={`${common.resource} · ${name}`}>
                    ↗
                </Link>
            </div>
        </article>
    );
}
