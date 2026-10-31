import type { Env, User } from '../../types';
import { and, eq } from 'drizzle-orm';
import { database } from '../../database';
import type Stripe from 'stripe';
import { fail as error } from '../../http';
import { now } from '../../lib/time';
import { entitlements, orders, type OrderRow } from '../../models/commerce';
import { stripeClient, stripeRequestOptions, stripeWebhookConfigured } from './stripe';
import { requireSellerReady } from './sellers';

interface PurchasableRow {
    id: string;
    author_id: string;
    slug: string;
    name: string;
    price_cents: number;
    currency: string;
}

export async function expireBannedCheckouts(env: Env, userId?: string): Promise<void> {
    let stripe: Stripe;
    try {
        stripe = stripeClient(env);
    } catch {
        return;
    }
    const result = await env.DB.prepare(
        `SELECT id, stripe_session_id, connected_account_id FROM orders
        WHERE status = 'expired' AND stripe_session_id IS NOT NULL AND checkout_closed_at IS NULL
        AND (? IS NULL OR user_id = ?) ORDER BY ${userId ? 'created_at DESC, id' : 'updated_at, id'} LIMIT 10`,
    )
        .bind(userId ?? null, userId ?? null)
        .all<Pick<OrderRow, 'id' | 'stripe_session_id' | 'connected_account_id'>>();
    await Promise.allSettled(
        result.results.map(async (order) => {
            const options = {
                ...stripeRequestOptions(env, order.connected_account_id),
                timeout: 5000,
                maxNetworkRetries: 0,
            };
            try {
                let session = await stripe.checkout.sessions.retrieve(order.stripe_session_id!, {}, options);
                if (session.status === 'open') {
                    session = await stripe.checkout.sessions.expire(order.stripe_session_id!, {}, options);
                }
                if (session.status === 'expired' || session.status === 'complete') {
                    await env.DB.prepare(
                        'UPDATE orders SET checkout_closed_at = ?, updated_at = ? WHERE id = ? AND stripe_session_id = ?',
                    )
                        .bind(now(), now(), order.id, order.stripe_session_id)
                        .run();
                    return;
                }
                await env.DB.prepare('UPDATE orders SET updated_at = ? WHERE id = ?').bind(now(), order.id).run();
            } catch {
                await env.DB.prepare('UPDATE orders SET updated_at = ? WHERE id = ?').bind(now(), order.id).run();
            }
        }),
    );
}

async function assertCheckoutAllowed(env: Env, userId: string, orderId: string): Promise<void> {
    const row = await env.DB.prepare(
        'SELECT u.banned_at, o.status FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ? AND o.user_id = ?',
    )
        .bind(orderId, userId)
        .first<{ banned_at: number | null; status: string }>();
    if (!row || row.banned_at !== null || row.status === 'expired') {
        await env.DB.prepare("UPDATE orders SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'created'")
            .bind(now(), orderId)
            .run();
        await expireBannedCheckouts(env, userId);
        error(403, 'authentication_required');
    }
    if (row.status !== 'created') {
        error(409, 'payment_confirmation_pending');
    }
}

export async function startCheckout(
    env: Env,
    user: User,
    resourceId: string,
    recordAudit: (action: string, target: string, details?: Record<string, unknown>) => Promise<void>,
) {
    const resource = await env.DB.prepare(
        `SELECT r.id, r.author_id, r.slug, r.name, r.price_cents, r.currency
            FROM resources r JOIN users u ON u.id = r.author_id
            JOIN resource_versions v ON v.id = r.approved_version_id
            WHERE r.id = ? AND r.status = 'published' AND u.banned_at IS NULL AND v.status = 'approved'
            AND v.archive_key IS NOT NULL`,
    )
        .bind(resourceId)
        .first<PurchasableRow>();
    if (!resource) {
        error(409, 'resource_unavailable');
    }
    if (resource.author_id === user.id) {
        error(409, 'own_resource');
    }
    const active = await database(env.DB)
        .select({ resource_id: entitlements.resource_id })
        .from(entitlements)
        .where(
            and(
                eq(entitlements.user_id, user.id),
                eq(entitlements.resource_id, resource.id),
                eq(entitlements.status, 'active'),
            ),
        )
        .get();
    if (active) {
        error(409, 'already_purchased');
    }
    const seller = await requireSellerReady(env, resource.author_id);
    const stripe = stripeClient(env);
    const existing = await database(env.DB)
        .select()
        .from(orders)
        .where(and(eq(orders.user_id, user.id), eq(orders.resource_id, resource.id), eq(orders.status, 'created')))
        .get();
    if (existing && !stripeWebhookConfigured(env, existing.connected_account_id)) {
        error(503, 'payments_unavailable');
    }
    if (existing?.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(
            existing.stripe_session_id,
            {},
            stripeRequestOptions(env, existing.connected_account_id),
        );
        if (session.status === 'open' && session.url) {
            await assertCheckoutAllowed(env, user.id, existing.id);
            return { data: { url: session.url, orderId: existing.id }, status: 200 as const };
        }
        if (session.payment_status === 'paid') {
            error(409, 'payment_confirmation_pending');
        }
        await env.DB.prepare("UPDATE orders SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'created'")
            .bind(now(), existing.id)
            .run();
    } else if (existing && existing.created_at <= now() - 23 * 3600) {
        error(409, 'payment_confirmation_pending');
    }
    const retry = existing && !existing.stripe_session_id ? existing : null;
    const id = retry?.id ?? crypto.randomUUID();
    const timestamp = now();
    const result = retry
        ? null
        : await env.DB.prepare(
              `INSERT INTO orders
            (id, user_id, resource_id, seller_id, connected_account_id, resource_name, seller_name, seller_email,
            amount_cents, currency, created_at, updated_at)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE NOT EXISTS (SELECT 1 FROM orders WHERE user_id = ? AND resource_id = ? AND status IN ('created', 'paid'))
            AND EXISTS (SELECT 1 FROM users WHERE id = ? AND banned_at IS NULL)
            AND (SELECT COUNT(*) FROM orders WHERE user_id = ? AND (status = 'created' OR (status = 'expired' AND stripe_session_id IS NOT NULL AND checkout_closed_at IS NULL))) < 5`,
          )
              .bind(
                  id,
                  user.id,
                  resource.id,
                  resource.author_id,
                  seller.accountId,
                  resource.name,
                  seller.sellerName,
                  seller.sellerEmail,
                  resource.price_cents,
                  resource.currency,
                  timestamp,
                  timestamp,
                  user.id,
                  resource.id,
                  user.id,
                  user.id,
              )
              .run();
    if (result && !result.meta.changes) {
        error(409, 'checkout_pending');
    }
    const price = retry?.amount_cents ?? resource.price_cents;
    const currency = retry?.currency ?? resource.currency;
    const resourceName = retry?.resource_name ?? resource.name;
    const accountId = retry?.connected_account_id ?? seller.accountId;
    await assertCheckoutAllowed(env, user.id, id);
    const session = await stripe.checkout.sessions.create(
        {
            mode: 'payment',
            expires_at: (retry?.created_at ?? timestamp) + 1800,
            allowed_payment_method_types: ['card'],
            client_reference_id: user.id,
            customer_email: user.email,
            customer_creation: 'always',
            billing_address_collection: 'required',
            name_collection: {
                business: { enabled: true, optional: true },
                individual: { enabled: true },
            },
            tax_id_collection: { enabled: true, required: 'never' },
            automatic_tax: { enabled: true, liability: { type: 'self' } },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: currency.toLowerCase(),
                        unit_amount: price,
                        tax_behavior: 'inclusive',
                        product_data: { name: resourceName },
                    },
                },
            ],
            payment_intent_data: {
                receipt_email: user.email,
                metadata: { order_id: id, resource_id: resource.id },
            },
            metadata: { order_id: id, resource_id: resource.id },
            invoice_creation: {
                enabled: true,
                invoice_data: { metadata: { order_id: id, resource_id: resource.id } },
            },
            success_url: `${env.APP_ORIGIN}/account/purchases?checkout=success&order=${id}`,
            cancel_url: `${env.APP_ORIGIN}/market?checkout=cancelled`,
        },
        { ...stripeRequestOptions(env, accountId), idempotencyKey: `kraftink-checkout-${id}` },
    );
    await database(env.DB)
        .update(orders)
        .set({ stripe_session_id: session.id, updated_at: now() })
        .where(eq(orders.id, id))
        .run();
    await assertCheckoutAllowed(env, user.id, id);
    if (!session.url) {
        error(503, 'payments_unavailable');
    }
    await recordAudit('order.checkout_started', id, {
        resourceId: resource.id,
        amountCents: price,
        currency,
    });
    return { data: { url: session.url, orderId: id }, status: 201 as const };
}
