import { Card, Empty } from '../../../components/UI';
import { useLocale } from '../../../lib/i18n';
import { statisticsMessages } from '../../../lib/translations';
import type { SalesStatistics } from './types';

export function SalesBreakdown({ statistics }: { statistics: SalesStatistics }) {
    const { locale } = useLocale();
    const t = statisticsMessages[locale];
    const number = new Intl.NumberFormat(locale);
    const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: statistics.currency });
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: statistics.timeZone });
    const maxVolume = Math.max(...statistics.monthly.map((entry) => entry.paidVolumeCents), 1);
    const rankings = [
        {
            title: t.topResources,
            label: t.resource,
            rows: statistics.topResources.map((entry) => ({ ...entry, id: entry.resourceId, label: entry.name })),
        },
        {
            title: t.topSellers,
            label: t.seller,
            rows: statistics.topSellers.map((entry) => ({ ...entry, id: entry.sellerId, label: entry.username })),
        },
    ];

    return (
        <>
            <Card title={t.monthlySales}>
                {statistics.period.paidOrders === 0 ? (
                    <Empty>{t.noSales}</Empty>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <caption className="visually-hidden">{t.monthlySales}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">{t.month}</th>
                                    <th scope="col" className="text-end">
                                        {t.paidOrders}
                                    </th>
                                    <th scope="col" className="text-end">
                                        {t.salesVolume}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {statistics.monthly.map((entry) => (
                                    <tr key={entry.month}>
                                        <th scope="row">{month.format(new Date(`${entry.month}-15T12:00:00Z`))}</th>
                                        <td className="text-end text-nowrap">{number.format(entry.paidOrders)}</td>
                                        <td className="text-end">
                                            <span className="text-nowrap">
                                                {currency.format(entry.paidVolumeCents / 100)}
                                            </span>
                                            <div className="progress mt-1" aria-hidden="true">
                                                <div
                                                    className="progress-bar bg-primary"
                                                    style={{ width: `${(entry.paidVolumeCents / maxVolume) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            {statistics.period.paidOrders > 0 && (
                <div className="row g-4">
                    {rankings.map((ranking) => (
                        <div className="col-xl-6" key={ranking.title}>
                            <Card title={ranking.title} className="h-100">
                                {ranking.rows.length === 0 ? (
                                    <Empty>{t.noSales}</Empty>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <caption className="visually-hidden">{ranking.title}</caption>
                                            <thead>
                                                <tr>
                                                    <th scope="col">{ranking.label}</th>
                                                    <th scope="col" className="text-end">
                                                        {t.paidOrders}
                                                    </th>
                                                    <th scope="col" className="text-end">
                                                        {t.salesVolume}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ranking.rows.map((entry) => (
                                                    <tr key={entry.id}>
                                                        <th scope="row">{entry.label}</th>
                                                        <td className="text-end text-nowrap">
                                                            {number.format(entry.paidOrders)}
                                                        </td>
                                                        <td className="text-end text-nowrap">
                                                            {currency.format(entry.paidVolumeCents / 100)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
