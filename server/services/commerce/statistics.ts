import type { Env } from '../../types';
import { fail } from '../../http';
import { now } from '../../lib/time';

interface Summary {
    paidOrders: number;
    paidVolumeCents: number;
    averageOrderCents: number;
    buyers: number;
    refundedOrders: number;
    disputedOrders: number;
}

interface MonthRange {
    month: string;
    startAt: number;
    endAt: number;
}

const timeZone = 'Europe/Paris';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const offsetFormatter = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'longOffset' });
const summaryFields = `COUNT(CASE WHEN o.status = 'paid' THEN 1 END) AS paidOrders,
    COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.amount_cents ELSE 0 END), 0) AS paidVolumeCents,
    COALESCE(CAST(ROUND(AVG(CASE WHEN o.status = 'paid' THEN o.amount_cents END)) AS INTEGER), 0) AS averageOrderCents,
    COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.user_id END) AS buyers,
    COUNT(CASE WHEN o.status = 'refunded' THEN 1 END) AS refundedOrders,
    COUNT(CASE WHEN o.status = 'disputed' THEN 1 END) AS disputedOrders`;

function localDate(timestamp: number): string {
    const parts = dateFormatter.formatToParts(new Date(timestamp * 1000));
    return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)!.value).join('-');
}

function dateValue(value: string): number {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 2000) {
        fail(400, 'invalid_statistics_period');
    }
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
        fail(400, 'invalid_statistics_period');
    }
    return timestamp / 1000;
}

function midnight(timestamp: number): number {
    const offset = offsetFormatter
        .formatToParts(new Date(timestamp * 1000))
        .find((part) => part.type === 'timeZoneName')!.value;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset)!;
    const seconds = (Number(match[2]) * 60 + Number(match[3])) * 60;
    return timestamp - (match[1] === '+' ? seconds : -seconds);
}

function monthRanges(from: string, to: string, startAt: number, endAt: number): MonthRange[] {
    const first = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
    const last = new Date(`${to.slice(0, 7)}-01T00:00:00Z`);
    const count = (last.getUTCFullYear() - first.getUTCFullYear()) * 12 + last.getUTCMonth() - first.getUTCMonth() + 1;
    if (count < 1 || count > 60) {
        fail(400, 'invalid_statistics_period');
    }
    return Array.from({ length: count }, (_, index) => {
        const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index, 1) / 1000;
        const end = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index + 1, 1) / 1000;
        return {
            month: new Date(start * 1000).toISOString().slice(0, 7),
            startAt: Math.max(midnight(start), startAt),
            endAt: Math.min(midnight(end), endAt),
        };
    });
}

export async function commerceStatistics(env: Env, query: { from?: string; to?: string; currency?: string }) {
    const generatedAt = now();
    const today = localDate(generatedAt);
    const from = query.from ?? `${today.slice(0, 4)}-01-01`;
    const to = query.to ?? today;
    const fromDate = dateValue(from);
    const toDate = dateValue(to);
    if (fromDate > toDate) {
        fail(400, 'invalid_statistics_period');
    }
    const currency = (query.currency ?? 'EUR').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
        fail(400, 'invalid_statistics_currency');
    }
    const startAt = midnight(fromDate);
    const endAt = midnight(toDate + 86400);
    const months = monthRanges(from, to, startAt, endAt);
    const [currencies, global, period, monthly, topResources, topSellers] = await env.DB.batch([
        env.DB.prepare(
            `SELECT DISTINCT currency FROM orders WHERE paid_at IS NOT NULL
            AND status IN ('paid', 'refunded', 'disputed') ORDER BY currency`,
        ),
        env.DB.prepare(
            `SELECT ${summaryFields} FROM orders o WHERE o.currency = ? AND o.paid_at IS NOT NULL
            AND o.status IN ('paid', 'refunded', 'disputed')`,
        ).bind(currency),
        env.DB.prepare(
            `SELECT ${summaryFields} FROM orders o WHERE o.currency = ? AND o.paid_at >= ? AND o.paid_at < ?
            AND o.status IN ('paid', 'refunded', 'disputed')`,
        ).bind(currency, startAt, endAt),
        env.DB.prepare(
            `WITH months AS (
                SELECT json_extract(value, '$.month') AS month, json_extract(value, '$.startAt') AS start_at,
                json_extract(value, '$.endAt') AS end_at FROM json_each(?)
            )
            SELECT m.month, ${summaryFields} FROM months m LEFT JOIN orders o
            ON o.currency = ? AND o.paid_at >= m.start_at AND o.paid_at < m.end_at
            AND o.status IN ('paid', 'refunded', 'disputed') GROUP BY m.month ORDER BY m.month`,
        ).bind(JSON.stringify(months), currency),
        env.DB.prepare(
            `SELECT o.resource_id AS resourceId, r.name, COUNT(*) AS paidOrders, SUM(o.amount_cents) AS paidVolumeCents
            FROM orders o JOIN resources r ON r.id = o.resource_id
            WHERE o.currency = ? AND o.paid_at >= ? AND o.paid_at < ? AND o.status = 'paid'
            GROUP BY o.resource_id, r.name ORDER BY paidVolumeCents DESC, paidOrders DESC, o.resource_id LIMIT 10`,
        ).bind(currency, startAt, endAt),
        env.DB.prepare(
            `SELECT o.seller_id AS sellerId, u.username, COUNT(*) AS paidOrders, SUM(o.amount_cents) AS paidVolumeCents
            FROM orders o JOIN users u ON u.id = o.seller_id
            WHERE o.currency = ? AND o.paid_at >= ? AND o.paid_at < ? AND o.status = 'paid'
            GROUP BY o.seller_id, u.username ORDER BY paidVolumeCents DESC, paidOrders DESC, o.seller_id LIMIT 10`,
        ).bind(currency, startAt, endAt),
    ]);
    return {
        generatedAt,
        timeZone,
        currency,
        currencies: [
            ...new Set([
                'EUR',
                currency,
                ...(currencies.results as Array<{ currency: string }>).map((row) => row.currency),
            ]),
        ].sort(),
        range: { from, to, startAt, endAt },
        global: global.results[0] as Summary,
        period: period.results[0] as Summary,
        monthly: monthly.results as Array<Summary & { month: string }>,
        topResources: topResources.results,
        topSellers: topSellers.results,
    };
}
