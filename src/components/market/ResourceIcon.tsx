import type { CatalogueResource } from '../../../shared/catalogue';
import { marketIconName } from '../../../shared/packages/presentation';

const defaultIcons = { plugin: 'puzzle', theme: 'palette', game: 'controller' };

export function ResourceIcon({
    resource,
    previewImage,
}: {
    resource: Pick<CatalogueResource, 'type' | 'icon'>;
    previewImage?: string;
}) {
    const icon = resource.icon ?? '';
    const image = previewImage?.startsWith('blob:')
        ? previewImage
        : /^(?:https:\/\/|\/(?!\/))/i.test(icon)
          ? icon
          : undefined;
    const name = marketIconName(icon) ? icon : defaultIcons[resource.type];
    return (
        <span className="resource-icon" aria-hidden="true">
            <i className={`bi bi-${name}`} />
            {image && (
                <img
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
        </span>
    );
}
