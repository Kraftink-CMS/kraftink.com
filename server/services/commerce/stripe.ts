import Stripe from 'stripe';
import type { Env } from '../../types';
import { fail as error } from '../../http';
import type { OrderRow } from '../../models/commerce';

export function stripeClient(env: Env): Stripe {
    if (!env.STRIPE_SECRET_KEY) {
        error(503, 'payments_unavailable');
    }
    const live = env.STRIPE_LIVE_MODE === 'true';
    const keyMode = env.STRIPE_SECRET_KEY.match(/^(?:sk|rk)_(live|test)_/)?.[1];
    if (!keyMode || live !== (keyMode === 'live')) {
        error(503, 'payments_configuration');
    }
    return new Stripe(env.STRIPE_SECRET_KEY, {
        httpClient: Stripe.createFetchHttpClient(),
        maxNetworkRetries: 2,
        timeout: 15000,
    });
}

export function stripeRequestOptions(env: Env, accountId: string): Stripe.RequestOptions {
    return accountId === env.STRIPE_PLATFORM_ACCOUNT_ID ? {} : { stripeAccount: accountId };
}

export function stripeWebhookConfigured(env: Env, accountId: string): boolean {
    return Boolean(
        accountId === env.STRIPE_PLATFORM_ACCOUNT_ID
            ? env.STRIPE_PLATFORM_WEBHOOK_SECRET
            : env.STRIPE_CONNECT_WEBHOOK_SECRET,
    );
}

export function expandedId(value: string | { id: string } | null | undefined): string | null {
    return typeof value === 'string' ? value : (value?.id ?? null);
}

export function paidCheckoutMatchesOrder(
    session: Stripe.Checkout.Session,
    order: Pick<OrderRow, 'id' | 'resource_id' | 'user_id' | 'stripe_session_id' | 'amount_cents' | 'currency'>,
    live: boolean,
): boolean {
    return (
        session.metadata?.order_id === order.id &&
        (!order.stripe_session_id || order.stripe_session_id === session.id) &&
        session.metadata?.resource_id === order.resource_id &&
        session.client_reference_id === order.user_id &&
        session.amount_total === order.amount_cents &&
        session.currency?.toUpperCase() === order.currency &&
        session.mode === 'payment' &&
        session.payment_status === 'paid' &&
        session.status === 'complete' &&
        session.livemode === live &&
        session.automatic_tax?.enabled === true &&
        session.automatic_tax.status === 'complete'
    );
}

export function documentUrl(url: string | null | undefined): string | null {
    if (!url) {
        return null;
    }
    try {
        const parsed = new URL(url);
        const allowed = ['pay.stripe.com', 'invoice.stripe.com', 'files.stripe.com'];
        return parsed.protocol === 'https:' && allowed.includes(parsed.hostname) && !parsed.username && !parsed.password
            ? url
            : null;
    } catch {
        return null;
    }
}
