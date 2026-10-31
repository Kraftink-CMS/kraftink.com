import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { statisticsMessages } from '../../lib/translations';
import { Card, Empty, ErrorNotice, Loading, PageTitle } from '../../components/UI';
import { Select } from '../../components/Select';
import { SalesBreakdown } from './statistics/SalesBreakdown';
import type { SalesStatistics } from './statistics/types';

type Period = 'currentMonth' | 'previousMonth' | 'currentYear' | 'custom';

function periodDates(period: Exclude<Period, 'custom'>) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)!.value;
    const year = part('year');
    const month = part('month');
    const today = `${year}-${month}-${part('day')}`;
    if (period === 'currentMonth') {
        return { from: `${year}-${month}-01`, to: today };
    }
    if (period === 'currentYear') {
        return { from: `${year}-01-01`, to: today };
    }
    const end = new Date(Date.UTC(Number(year), Number(month) - 1, 0)).toISOString().slice(0, 10);
    return { from: `${end.slice(0, 7)}-01`, to: end };
}

export function StatisticsPage() {
    const { locale } = useLocale();
    const t = statisticsMessages[locale];
    const [preset, setPreset] = useState<Period>('currentMonth');
    const [dates, setDates] = useState(() => periodDates('currentMonth'));
    const [currency, setCurrency] = useState('EUR');
    const [query, setQuery] = useState(() => ({ ...periodDates('currentMonth'), currency: 'EUR', refresh: 0 }));
    const [statistics, setStatistics] = useState<SalesStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        const parameters = new URLSearchParams({ from: query.from, to: query.to, currency: query.currency });
        void api<SalesStatistics>(`/api/admin/statistics?${parameters}`, { signal: controller.signal })
            .then((data) => {
                if (!controller.signal.aborted) {
                    setStatistics(data);
                }
            })
            .catch((failure) => {
                if (!controller.signal.aborted) {
                    setError(failure);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });
        return () => controller.abort();
    }, [query]);

    function apply(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!dates.from || !dates.to || dates.from > dates.to) {
            setError(new ApiError('invalid_statistics_period'));
            return;
        }
        setQuery((current) => ({ ...dates, currency, refresh: current.refresh + 1 }));
    }

    const number = new Intl.NumberFormat(locale);
    const amount = new Intl.NumberFormat(locale, { style: 'currency', currency: statistics?.currency ?? currency });
    const money = (cents: number) => amount.format(cents / 100);
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Europe/Paris' });
    const currencies = [...new Set(['EUR', ...(statistics?.currencies ?? []), currency])];
    const invalidPeriod = error instanceof ApiError && error.code === 'invalid_statistics_period';

    return (
        <>
            <PageTitle title={t.title} description={t.description}>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={loading}
                    onClick={() => setQuery((current) => ({ ...current, refresh: current.refresh + 1 }))}
                >
                    {t.refresh}
                </button>
            </PageTitle>
            <div className="vstack gap-4">
                <form onSubmit={apply}>
                    <Card
                        title={t.filters}
                        footer={
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {t.apply}
                            </button>
                        }
                    >
                        <div className="row g-3">
                            <div className={currencies.length > 1 ? 'col-md-6 col-xl-3' : 'col-md-4'}>
                                <label className="form-label" htmlFor="statistics-period">
                                    {t.period}
                                </label>
                                <Select
                                    id="statistics-period"
                                    className="form-select"
                                    value={preset}
                                    onChange={(event) => {
                                        const value = event.target.value as Period;
                                        setPreset(value);
                                        if (value !== 'custom') {
                                            setDates(periodDates(value));
                                        }
                                    }}
                                >
                                    {(['currentMonth', 'previousMonth', 'currentYear', 'custom'] as const).map(
                                        (value) => (
                                            <option key={value} value={value}>
                                                {t[value]}
                                            </option>
                                        ),
                                    )}
                                </Select>
                            </div>
                            {(['from', 'to'] as const).map((field) => (
                                <div className={currencies.length > 1 ? 'col-md-6 col-xl-3' : 'col-md-4'} key={field}>
                                    <label className="form-label" htmlFor={`statistics-${field}`}>
                                        {t[field]}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id={`statistics-${field}`}
                                        value={dates[field]}
                                        min={field === 'to' ? dates.from : undefined}
                                        max={field === 'from' ? dates.to : undefined}
                                        required
                                        onChange={(event) => {
                                            setDates((current) => ({ ...current, [field]: event.target.value }));
                                            setPreset('custom');
                                        }}
                                    />
                                </div>
                            ))}
                            {currencies.length > 1 && (
                                <div className="col-md-6 col-xl-3">
                                    <label className="form-label" htmlFor="statistics-currency">
                                        {t.currency}
                                    </label>
                                    <Select
                                        id="statistics-currency"
                                        className="form-select"
                                        value={currency}
                                        onChange={(event) => setCurrency(event.target.value)}
                                    >
                                        {currencies.map((value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            )}
                        </div>
                        <p className="form-text mb-0">{t.dateHint}</p>
                    </Card>
                </form>
                {invalidPeriod ? (
                    <p className="alert alert-danger mb-0" role="alert">
                        {t.invalidPeriod}
                    </p>
                ) : (
                    <ErrorNotice error={error} />
                )}
                {loading ? (
                    <Loading />
                ) : statistics ? (
                    <>
                        <section aria-labelledby="statistics-summary-title">
                            <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
                                <h2 className="h5 mb-0" id="statistics-summary-title">
                                    {t.periodSummary}
                                </h2>
                                <p className="small text-body-secondary mb-0">
                                    {date.format(new Date(`${statistics.range.from}T12:00:00Z`))} -{' '}
                                    {date.format(new Date(`${statistics.range.to}T12:00:00Z`))}
                                </p>
                            </div>
                            <div className="row g-3">
                                {[
                                    [t.salesVolume, money(statistics.period.paidVolumeCents)],
                                    [t.paidOrders, number.format(statistics.period.paidOrders)],
                                    [t.averageOrder, money(statistics.period.averageOrderCents)],
                                    [t.buyers, number.format(statistics.period.buyers)],
                                ].map(([label, value]) => (
                                    <div className="col-sm-6 col-xl-3" key={label}>
                                        <Card className="h-100">
                                            <p className="small text-body-secondary mb-2">{label}</p>
                                            <p className="h3 mb-0">{value}</p>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <div className="row g-4">
                            <div className="col-xl-6">
                                <Card title={t.allTime} className="h-100">
                                    <dl className="row gy-2 mb-0">
                                        {[
                                            [t.salesVolume, money(statistics.global.paidVolumeCents)],
                                            [t.paidOrders, number.format(statistics.global.paidOrders)],
                                            [t.buyers, number.format(statistics.global.buyers)],
                                        ].map(([label, value]) => (
                                            <div className="col-sm-4" key={label}>
                                                <dt className="small text-body-secondary fw-normal">{label}</dt>
                                                <dd className="fs-5 mb-0">{value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </Card>
                            </div>
                            <div className="col-xl-6">
                                <Card title={t.adjustments} className="h-100">
                                    <p className="small text-body-secondary">{t.adjustmentsHint}</p>
                                    <dl className="row g-3 mb-0">
                                        <div className="col-sm-6">
                                            <dt className="small text-body-secondary fw-normal">{t.refundedOrders}</dt>
                                            <dd className="fs-5 mb-1">
                                                {number.format(statistics.period.refundedOrders)}
                                            </dd>
                                            <dd className="small text-body-secondary mb-0">{t.refundedHint}</dd>
                                        </div>
                                        <div className="col-sm-6">
                                            <dt className="small text-body-secondary fw-normal">{t.disputedOrders}</dt>
                                            <dd className="fs-5 mb-1">
                                                {number.format(statistics.period.disputedOrders)}
                                            </dd>
                                            <dd className="small text-body-secondary mb-0">{t.disputedHint}</dd>
                                        </div>
                                    </dl>
                                </Card>
                            </div>
                        </div>
                        <details>
                            <summary>{t.details}</summary>
                            <p className="small text-body-secondary mt-2 mb-0">{t.volumeHint}</p>
                        </details>
                        <SalesBreakdown statistics={statistics} />
                    </>
                ) : !error ? (
                    <Empty>{t.noActivity}</Empty>
                ) : null}
            </div>
        </>
    );
}
