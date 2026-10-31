import type { CatalogueResource } from '../../shared/catalogue';
import { commonMessages } from './translations';

export function resourcePrice(resource: CatalogueResource, locale: string): string {
    const value = resource.commercial.price;
    return value
        ? new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency }).format(Number(value.amount))
        : commonMessages[locale].paidOffer;
}
