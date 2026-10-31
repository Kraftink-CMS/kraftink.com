import { accountCopy } from '../../lib/translations';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { Card, Empty } from '../../components/UI';
import type { AccountActions, Order, PaymentDocument } from './types';
import type { AccountCommerce } from './useAccountCommerce';

export function OrdersPanel({ commerce, actions }: { commerce: AccountCommerce; actions: AccountActions }) {
    const { locale } = useLocale();
    const copy = accountCopy[locale];
    const { orders, setOrders, ordersCursor, setOrdersCursor, documents, setDocuments } = commerce;
    const { busy, action } = actions;
    const date = (timestamp: number) =>
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp * 1000);
    const price = (amount: number, currency: string) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / 100);
    const status = (value: string) => copy[value as keyof typeof copy] ?? value;

    function loadDocument(id: string) {
        return action(async () => {
            const document = await api<PaymentDocument>(`/api/account/orders/${encodeURIComponent(id)}/document`);
            setDocuments((current) => ({ ...current, [id]: document }));
        });
    }

    return (
        <Card
            title={copy.orders}
            footer={
                ordersCursor ? (
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            void action(async () => {
                                const data = await api<{
                                    orders: Order[];
                                    nextCursor: string | null;
                                }>(`/api/account/orders?before=${encodeURIComponent(ordersCursor)}`);
                                setOrders((current) => [
                                    ...current,
                                    ...data.orders.filter(
                                        (item) => !current.some((existing) => existing.id === item.id),
                                    ),
                                ]);
                                setOrdersCursor(data.nextCursor);
                            })
                        }
                    >
                        {copy.loadMore}
                    </button>
                ) : undefined
            }
        >
            {orders.length === 0 ? (
                <Empty>{copy.emptyOrders}</Empty>
            ) : (
                <div className="table-responsive">
                    <table className="table align-middle mb-0">
                        <thead>
                            <tr>
                                <th scope="col">{copy.resource}</th>
                                <th scope="col">{copy.seller}</th>
                                <th scope="col">{copy.amount}</th>
                                <th scope="col">{copy.date}</th>
                                <th scope="col">{copy.status}</th>
                                <th scope="col">{copy.document}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.resource_name}</td>
                                    <td>{order.seller_name}</td>
                                    <td className="text-nowrap">{price(order.amount_cents, order.currency)}</td>
                                    <td className="text-nowrap">{date(order.created_at)}</td>
                                    <td className="text-nowrap">{status(order.status)}</td>
                                    <td className="text-nowrap">
                                        {documents[order.id] ? (
                                            <div className="vstack align-items-start gap-2">
                                                {documents[order.id].invoiceUrl ? (
                                                    <a
                                                        href={documents[order.id].invoiceUrl!}
                                                        target="_blank"
                                                        rel="noopener noreferrer nofollow"
                                                    >
                                                        {copy.invoice}
                                                    </a>
                                                ) : (
                                                    <>
                                                        <span className="small text-body-secondary" role="status">
                                                            {copy.invoicePending}
                                                        </span>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => void loadDocument(order.id)}
                                                        >
                                                            {copy.refreshDocument}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            Boolean(order.document_available) && (
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => void loadDocument(order.id)}
                                                >
                                                    {copy.openDocument}
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
