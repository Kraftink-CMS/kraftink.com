import { Link } from 'react-router-dom';
import { accountCopy } from '../../lib/translations';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { Card, Empty, StatusBadge } from '../../components/UI';
import type { AccountActions } from './types';
import type { Purchase } from './types';
import type { AccountCommerce } from './useAccountCommerce';

export function PurchasesPanel({
    commerce,
    actions,
    onConnectCms,
}: {
    commerce: AccountCommerce;
    actions: AccountActions;
    onConnectCms: () => void;
}) {
    const { locale, path } = useLocale();
    const copy = accountCopy[locale];
    const { purchases, setPurchases, purchasesCursor, setPurchasesCursor } = commerce;
    const { busy, action } = actions;
    const status = (value: string) => copy[value as keyof typeof copy] ?? value;

    return (
        <>
            {purchases.length === 0 ? (
                <Card>
                    <Empty>
                        {copy.emptyPurchases} <Link to={path('/market')}>{copy.browse}</Link>
                    </Empty>
                </Card>
            ) : (
                <div className="row g-4">
                    {purchases.map((purchase) => (
                        <div className="col-12 col-lg-6" key={purchase.resource_id}>
                            <Card
                                title={purchase.name || purchase.resource_name}
                                footer={
                                    purchase.access_status === 'active' &&
                                    ['published', 'withdrawn'].includes(purchase.status) ? (
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={onConnectCms}
                                        >
                                            {copy.site}
                                        </button>
                                    ) : undefined
                                }
                            >
                                <dl className="row mb-0">
                                    <dt className="col-5">{copy.version}</dt>
                                    <dd className="col-7">{purchase.version ?? '—'}</dd>
                                    <dt className="col-5">{copy.status}</dt>
                                    <dd className="col-7">
                                        <StatusBadge value={purchase.status} />
                                    </dd>
                                    <dt className="col-5">{copy.access}</dt>
                                    <dd className="col-7">{status(purchase.access_status)}</dd>
                                </dl>
                                {purchase.status === 'withdrawn' && (
                                    <p className="small text-body-secondary mb-0">{copy.removedNotice}</p>
                                )}
                            </Card>
                        </div>
                    ))}
                </div>
            )}
            {purchasesCursor && (
                <div className="mt-4 text-center">
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            void action(async () => {
                                const data = await api<{
                                    purchases: Purchase[];
                                    nextCursor: string | null;
                                }>(`/api/account/purchases?before=${encodeURIComponent(purchasesCursor)}`);
                                setPurchases((current) => [
                                    ...current,
                                    ...data.purchases.filter(
                                        (item) =>
                                            !current.some((existing) => existing.resource_id === item.resource_id),
                                    ),
                                ]);
                                setPurchasesCursor(data.nextCursor);
                            })
                        }
                    >
                        {copy.loadMore}
                    </button>
                </div>
            )}
        </>
    );
}
