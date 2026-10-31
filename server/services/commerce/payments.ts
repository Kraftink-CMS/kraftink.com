import type { Env } from '../../types';
import { and, eq, or } from 'drizzle-orm';
import { database } from '../../database';
import { fail as error } from '../../http';
import { now } from '../../lib/time';
import Stripe from 'stripe';
import { orders, sellerAccounts, stripeEvents } from '../../models/commerce';
import { stripeClient, stripeRequestOptions, expandedId, documentUrl, paidCheckoutMatchesOrder } from './stripe';
import { syncSeller } from './sellers';

async function chargeStatus(
    env: Env,
    stripe: Stripe,
    charge: Stripe.Charge,
    accountId: string,
): Promise<'paid' | 'refunded' | 'disputed' | 'failed'> {
    if (charge.amount_refunded > 0) {
        return 'refunded';
    }
    if (charge.disputed) {
        const disputes = await stripe.disputes.list(
            { charge: charge.id, limit: 100 },
            stripeRequestOptions(env, accountId),
        );
        if (
            disputes.has_more ||
            disputes.data.length === 0 ||
            disputes.data.some((dispute) => !['won', 'warning_closed'].includes(dispute.status))
        ) {
            return 'disputed';
        }
    }
    return charge.paid ? 'paid' : 'failed';
}

async function paidSession(env: Env, event: Stripe.Event, sessionId: string, accountId: string): Promise<void> {
    const stripe = stripeClient(env);
    const eventSession = event.data.object as Stripe.Checkout.Session;
    const order = eventSession.metadata?.order_id
        ? await database(env.DB)
              .select()
              .from(orders)
              .where(and(eq(orders.id, eventSession.metadata.order_id), eq(orders.connected_account_id, accountId)))
              .get()
        : await database(env.DB)
              .select()
              .from(orders)
              .where(and(eq(orders.stripe_session_id, sessionId), eq(orders.connected_account_id, accountId)))
              .get();
    if (!order) {
        return;
    }
    const session = await stripe.checkout.sessions.retrieve(
        sessionId,
        {
            expand: ['payment_intent.latest_charge', 'invoice'],
        },
        stripeRequestOptions(env, accountId),
    );
    if (!paidCheckoutMatchesOrder(session, order, env.STRIPE_LIVE_MODE === 'true')) {
        return;
    }
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
    if (
        !paymentIntent ||
        typeof paymentIntent === 'string' ||
        paymentIntent.status !== 'succeeded' ||
        paymentIntent.amount_received !== order.amount_cents ||
        paymentIntent.currency.toUpperCase() !== order.currency ||
        paymentIntent.metadata.order_id !== order.id ||
        paymentIntent.metadata.resource_id !== order.resource_id
    ) {
        return;
    }
    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    if (!charge || typeof charge === 'string' || !charge.paid || charge.amount !== order.amount_cents) {
        return;
    }
    const invoice = session.invoice && typeof session.invoice !== 'string' ? (session.invoice as Stripe.Invoice) : null;
    let status = await chargeStatus(env, stripe, charge, accountId);
    if (order.status === 'refunded') {
        status = 'refunded';
    }
    const timestamp = now();
    await env.DB.batch([
        env.DB.prepare(
            'INSERT OR IGNORE INTO stripe_events (id, account_id, type, created_at) VALUES (?, ?, ?, ?)',
        ).bind(event.id, accountId, event.type, timestamp),
        env.DB.prepare(
            `UPDATE orders SET status = CASE WHEN status = 'refunded' THEN 'refunded' ELSE ? END, stripe_session_id = ?, stripe_payment_intent_id = ?, stripe_charge_id = ?,
            stripe_invoice_id = COALESCE(?, stripe_invoice_id), invoice_url = COALESCE(?, invoice_url),
            paid_at = COALESCE(paid_at, ?), updated_at = ?, stripe_event_created = ?, stripe_last_event = ?, payment_revision = payment_revision + 1
            WHERE id = ? AND stripe_event_created <= ? AND payment_revision = ?
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)`,
        ).bind(
            status,
            session.id,
            paymentIntent.id,
            charge.id,
            expandedId(session.invoice),
            documentUrl(invoice?.hosted_invoice_url),
            event.created,
            timestamp,
            event.created,
            event.id,
            order.id,
            event.created,
            order.payment_revision,
            event.id,
        ),
        env.DB.prepare(
            `INSERT INTO entitlements (user_id, resource_id, order_id, status, created_at, updated_at)
            SELECT user_id, resource_id, id, 'revoked', ?, ? FROM orders WHERE id = ? AND status IN ('refunded', 'disputed')
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)
            ON CONFLICT(user_id, resource_id) DO NOTHING`,
        ).bind(timestamp, timestamp, order.id, event.id),
        env.DB.prepare(
            `INSERT INTO entitlements (user_id, resource_id, order_id, status, created_at, updated_at)
            SELECT user_id, resource_id, id, 'active', ?, ? FROM orders WHERE user_id = ? AND resource_id = ? AND status = 'paid'
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)
            ON CONFLICT(user_id, resource_id) DO UPDATE SET order_id = excluded.order_id, status = excluded.status, updated_at = excluded.updated_at`,
        ).bind(timestamp, timestamp, order.user_id, order.resource_id, event.id),
        env.DB.prepare(
            `UPDATE entitlements SET status = 'revoked', updated_at = ? WHERE user_id = ? AND resource_id = ?
            AND NOT EXISTS (SELECT 1 FROM orders WHERE user_id = ? AND resource_id = ? AND status = 'paid')
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)`,
        ).bind(timestamp, order.user_id, order.resource_id, order.user_id, order.resource_id, event.id),
        env.DB.prepare(
            `UPDATE stripe_events SET processed_at = ? WHERE id = ? AND processed_at IS NULL
            AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND (stripe_last_event = ? OR stripe_event_created > ?))`,
        ).bind(timestamp, event.id, order.id, event.id, event.created),
    ]);
    const processed = await database(env.DB)
        .select({ processed_at: stripeEvents.processed_at })
        .from(stripeEvents)
        .where(eq(stripeEvents.id, event.id))
        .get();
    if (!processed?.processed_at) {
        error(503, 'payment_reconciliation_pending');
    }
}

async function reconcileCharge(env: Env, event: Stripe.Event, accountId: string, chargeId: string): Promise<void> {
    const stripe = stripeClient(env);
    const order = await database(env.DB)
        .select()
        .from(orders)
        .where(and(eq(orders.connected_account_id, accountId), eq(orders.stripe_charge_id, chargeId)))
        .get();
    if (!order) {
        return;
    }
    const charge = await stripe.charges.retrieve(chargeId, {}, stripeRequestOptions(env, accountId));
    if (
        charge.amount !== order.amount_cents ||
        charge.currency.toUpperCase() !== order.currency ||
        expandedId(charge.payment_intent) !== order.stripe_payment_intent_id
    ) {
        return;
    }
    let status = await chargeStatus(env, stripe, charge, accountId);
    if (order.status === 'refunded') {
        status = 'refunded';
    }
    const timestamp = now();
    await env.DB.batch([
        env.DB.prepare(
            'INSERT OR IGNORE INTO stripe_events (id, account_id, type, created_at) VALUES (?, ?, ?, ?)',
        ).bind(event.id, accountId, event.type, timestamp),
        env.DB.prepare(
            `UPDATE orders SET status = CASE WHEN status = 'refunded' THEN 'refunded' ELSE ? END, stripe_charge_id = ?, updated_at = ?,
            stripe_event_created = ?, stripe_last_event = ?, payment_revision = payment_revision + 1
            WHERE id = ? AND stripe_event_created <= ? AND payment_revision = ?
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)`,
        ).bind(
            status,
            charge.id,
            timestamp,
            event.created,
            event.id,
            order.id,
            event.created,
            order.payment_revision,
            event.id,
        ),
        env.DB.prepare(
            `INSERT INTO entitlements (user_id, resource_id, order_id, status, created_at, updated_at)
            SELECT user_id, resource_id, id, 'active', ?, ? FROM orders WHERE user_id = ? AND resource_id = ? AND status = 'paid'
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)
            ON CONFLICT(user_id, resource_id) DO UPDATE SET order_id = excluded.order_id, status = excluded.status, updated_at = excluded.updated_at`,
        ).bind(timestamp, timestamp, order.user_id, order.resource_id, event.id),
        env.DB.prepare(
            `UPDATE entitlements SET status = 'revoked', updated_at = ? WHERE user_id = ? AND resource_id = ?
            AND NOT EXISTS (SELECT 1 FROM orders WHERE user_id = ? AND resource_id = ? AND status = 'paid')
            AND EXISTS (SELECT 1 FROM stripe_events WHERE id = ? AND processed_at IS NULL)`,
        ).bind(timestamp, order.user_id, order.resource_id, order.user_id, order.resource_id, event.id),
        env.DB.prepare(
            `UPDATE stripe_events SET processed_at = ? WHERE id = ? AND processed_at IS NULL
            AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND (stripe_last_event = ? OR stripe_event_created > ?))`,
        ).bind(timestamp, event.id, order.id, event.id, event.created),
    ]);
    const processed = await database(env.DB)
        .select({ processed_at: stripeEvents.processed_at })
        .from(stripeEvents)
        .where(eq(stripeEvents.id, event.id))
        .get();
    if (!processed?.processed_at) {
        error(503, 'payment_reconciliation_pending');
    }
}

async function reconcileInvoice(env: Env, invoice: Stripe.Invoice, accountId: string): Promise<void> {
    const order = await database(env.DB)
        .select()
        .from(orders)
        .where(
            and(
                eq(orders.connected_account_id, accountId),
                or(eq(orders.stripe_invoice_id, invoice.id), eq(orders.id, invoice.metadata?.order_id ?? '')),
            ),
        )
        .get();
    if (!order?.stripe_session_id) {
        return;
    }
    const session = await stripeClient(env).checkout.sessions.retrieve(
        order.stripe_session_id,
        {},
        stripeRequestOptions(env, accountId),
    );
    const customerId = expandedId(session.customer);
    if (
        !paidCheckoutMatchesOrder(session, order, env.STRIPE_LIVE_MODE === 'true') ||
        expandedId(session.invoice) !== invoice.id ||
        !customerId ||
        expandedId(invoice.customer) !== customerId ||
        invoice.total !== order.amount_cents ||
        invoice.currency.toUpperCase() !== order.currency
    ) {
        return;
    }
    await database(env.DB)
        .update(orders)
        .set({ stripe_invoice_id: invoice.id, invoice_url: documentUrl(invoice.hosted_invoice_url), updated_at: now() })
        .where(and(eq(orders.id, order.id), eq(orders.connected_account_id, accountId)))
        .run();
}

export async function processStripeWebhook(env: Env, raw: string, signature: string) {
    let payload: unknown;
    try {
        payload = JSON.parse(raw);
    } catch {
        error(400, 'webhook_invalid');
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        error(400, 'webhook_invalid');
    }
    const connected = Object.hasOwn(payload, 'account');
    const suppliedAccount = (payload as { account?: unknown }).account;
    if (connected && (typeof suppliedAccount !== 'string' || !suppliedAccount)) {
        error(400, 'webhook_invalid');
    }
    const secret = connected ? env.STRIPE_CONNECT_WEBHOOK_SECRET : env.STRIPE_PLATFORM_WEBHOOK_SECRET;
    if (!secret || (!connected && !env.STRIPE_PLATFORM_ACCOUNT_ID)) {
        error(503, 'payments_unavailable');
    }
    const stripe = stripeClient(env);
    let event: Stripe.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            raw,
            signature,
            secret,
            300,
            Stripe.createSubtleCryptoProvider(),
        );
    } catch {
        return error(400, 'webhook_invalid');
    }
    if (event.livemode !== (env.STRIPE_LIVE_MODE === 'true')) {
        error(400, 'webhook_mode_invalid');
    }
    const accountId = connected ? event.account : env.STRIPE_PLATFORM_ACCOUNT_ID;
    if (
        !accountId ||
        (connected &&
            (typeof event.account !== 'string' ||
                event.account !== suppliedAccount ||
                accountId === env.STRIPE_PLATFORM_ACCOUNT_ID)) ||
        (!connected && event.account !== undefined)
    ) {
        error(400, 'webhook_invalid');
    }
    const existing = await database(env.DB)
        .select({ processed_at: stripeEvents.processed_at })
        .from(stripeEvents)
        .where(eq(stripeEvents.id, event.id))
        .get();
    if (existing?.processed_at) {
        return { received: true };
    }
    if (connected && event.type === 'account.updated') {
        const account = await stripe.accounts.retrieve(accountId);
        await syncSeller(env, account);
    } else if (connected && event.type === 'account.application.deauthorized') {
        await database(env.DB)
            .update(sellerAccounts)
            .set({ charges_enabled: 0, payouts_enabled: 0, disabled_at: now(), updated_at: now() })
            .where(eq(sellerAccounts.stripe_account_id, accountId))
            .run();
    } else if (
        event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded'
    ) {
        await paidSession(env, event, (event.data.object as Stripe.Checkout.Session).id, accountId);
        return { received: true };
    } else if (event.type === 'charge.refunded') {
        await reconcileCharge(env, event, accountId, (event.data.object as Stripe.Charge).id);
        return { received: true };
    } else if (
        event.type === 'charge.dispute.created' ||
        event.type === 'charge.dispute.updated' ||
        event.type === 'charge.dispute.closed'
    ) {
        const chargeId = expandedId((event.data.object as Stripe.Dispute).charge);
        if (chargeId) {
            await reconcileCharge(env, event, accountId, chargeId);
        }
        return { received: true };
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await env.DB.prepare(
            "UPDATE orders SET status = ?, updated_at = ? WHERE stripe_session_id = ? AND connected_account_id = ? AND status = 'created'",
        )
            .bind(event.type === 'checkout.session.expired' ? 'expired' : 'failed', now(), session.id, accountId)
            .run();
    } else if (event.type === 'invoice.paid') {
        await reconcileInvoice(env, event.data.object as Stripe.Invoice, accountId);
    }
    await database(env.DB)
        .insert(stripeEvents)
        .values({ id: event.id, account_id: accountId, type: event.type, created_at: now(), processed_at: now() })
        .onConflictDoNothing()
        .run();
    return { received: true };
}
