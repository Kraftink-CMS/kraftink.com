import type { Env } from '../../types';
import { and, eq, sql } from 'drizzle-orm';
import { database } from '../../database';
import { fail as error } from '../../http';
import { now } from '../../lib/time';
import { orders } from '../../models/commerce';
import { stripeClient, stripeRequestOptions, documentUrl, expandedId, paidCheckoutMatchesOrder } from './stripe';

export interface OrderCursor {
    time: number | null;
    id: string;
}

function page<T extends { id: string; created_at: number }>(rows: T[]): { items: T[]; nextCursor: string | null } {
    const items = rows.slice(0, 50);
    const last = items.at(-1);
    return { items, nextCursor: rows.length > 50 && last ? `${last.created_at}.${last.id}` : null };
}

export async function listBuyerOrders(env: Env, userId: string, before: OrderCursor) {
    const orders = await env.DB.prepare(
        `SELECT id, resource_id, resource_name, seller_name, amount_cents, currency, status,
            created_at, paid_at, CASE WHEN invoice_url IS NOT NULL OR stripe_invoice_id IS NOT NULL OR paid_at IS NOT NULL
            THEN 1 ELSE 0 END AS document_available
            FROM orders WHERE user_id = ? AND (? IS NULL OR created_at < ? OR (created_at = ? AND id < ?))
            ORDER BY created_at DESC, id DESC LIMIT 51`,
    )
        .bind(userId, before.time, before.time, before.time, before.id)
        .all<{ id: string; created_at: number }>();
    const result = page(orders.results);
    return { orders: result.items, nextCursor: result.nextCursor };
}
export async function orderDocument(env: Env, userId: string, id: string) {
    const order = await database(env.DB)
        .select()
        .from(orders)
        .where(and(eq(orders.id, id), eq(orders.user_id, userId)))
        .get();
    if (!order) {
        error(404, 'order_not_found');
    }
    let invoice = documentUrl(order.invoice_url);
    let invoiceId = order.stripe_invoice_id;
    if (env.STRIPE_SECRET_KEY && (invoiceId || order.paid_at !== null)) {
        const stripe = stripeClient(env);
        if (!invoiceId && order.stripe_session_id) {
            const session = await stripe.checkout.sessions.retrieve(
                order.stripe_session_id,
                {},
                stripeRequestOptions(env, order.connected_account_id),
            );
            if (paidCheckoutMatchesOrder(session, order, env.STRIPE_LIVE_MODE === 'true')) {
                invoiceId = expandedId(session.invoice);
            }
        }
        if (invoiceId) {
            const remote = await stripe.invoices.retrieve(
                invoiceId,
                {},
                stripeRequestOptions(env, order.connected_account_id),
            );
            invoice = documentUrl(remote.hosted_invoice_url) ?? invoice;
        }
        const updated = await database(env.DB)
            .update(orders)
            .set({
                invoice_url: sql`COALESCE(${invoice}, ${orders.invoice_url})`,
                stripe_invoice_id: sql`COALESCE(${invoiceId}, ${orders.stripe_invoice_id})`,
                updated_at: now(),
            })
            .where(eq(orders.id, order.id))
            .returning({ invoice_url: orders.invoice_url })
            .get();
        invoice = documentUrl(updated?.invoice_url) ?? invoice;
    }
    if (!invoice && order.paid_at === null) {
        error(404, 'document_unavailable');
    }
    return { invoiceUrl: invoice };
}
export async function listBuyerPurchases(env: Env, userId: string, before: OrderCursor) {
    const purchases = await env.DB.prepare(
        `SELECT e.resource_id, e.status AS access_status, r.slug, r.type, r.name, r.status,
            v.version, o.id AS order_id, o.resource_name, o.amount_cents, o.currency, o.paid_at, o.created_at
            FROM entitlements e JOIN resources r ON r.id = e.resource_id JOIN orders o ON o.id = e.order_id
            LEFT JOIN resource_versions v ON v.id = r.approved_version_id WHERE e.user_id = ?
            AND (? IS NULL OR o.created_at < ? OR (o.created_at = ? AND o.id < ?)) ORDER BY o.created_at DESC, o.id DESC LIMIT 51`,
    )
        .bind(userId, before.time, before.time, before.time, before.id)
        .all<{ order_id: string; created_at: number }>();
    const result = page(purchases.results.map((row) => ({ ...row, id: row.order_id })));
    return { purchases: result.items, nextCursor: result.nextCursor };
}
export async function listSellerOrders(env: Env, userId: string, before: OrderCursor) {
    const orders = await env.DB.prepare(
        `SELECT id, resource_id, resource_name, amount_cents, currency, status, created_at, paid_at
            FROM orders WHERE seller_id = ? AND (? IS NULL OR created_at < ? OR (created_at = ? AND id < ?))
            ORDER BY created_at DESC, id DESC LIMIT 51`,
    )
        .bind(userId, before.time, before.time, before.time, before.id)
        .all<{ id: string; created_at: number }>();
    const result = page(orders.results);
    return { orders: result.items, nextCursor: result.nextCursor };
}
