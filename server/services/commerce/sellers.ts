import type { Env, User } from '../../types';
import { eq } from 'drizzle-orm';
import { database } from '../../database';
import { now } from '../../lib/time';
import { fail as error } from '../../http';
import { sellerAccounts, type SellerAccountRow as SellerRow } from '../../models/commerce';
import Stripe from 'stripe';
import { stripeClient, stripeRequestOptions, stripeWebhookConfigured } from './stripe';

export async function getSeller(env: Env, userId: string): Promise<SellerRow | null> {
    return (
        (await database(env.DB).select().from(sellerAccounts).where(eq(sellerAccounts.user_id, userId)).get()) ?? null
    );
}
export async function syncSeller(env: Env, account: Stripe.Account): Promise<void> {
    await database(env.DB)
        .update(sellerAccounts)
        .set({
            charges_enabled: account.charges_enabled ? 1 : 0,
            payouts_enabled: account.payouts_enabled ? 1 : 0,
            details_submitted: account.details_submitted ? 1 : 0,
            business_type: account.business_type ?? null,
            legal_name: account.business_profile?.name ?? account.company?.name ?? null,
            country: account.country ?? null,
            disabled_at: null,
            updated_at: now(),
        })
        .where(eq(sellerAccounts.stripe_account_id, account.id))
        .run();
}
export async function sellerTaxReady(env: Env, stripe: Stripe, accountId: string): Promise<boolean> {
    const settings = await stripe.tax.settings.retrieve({}, stripeRequestOptions(env, accountId));
    return settings.status === 'active' && Boolean(settings.defaults.tax_code);
}
export type SellerReadinessError = 'seller_not_ready' | 'seller_tax_not_ready' | 'payments_unavailable';

interface SellerContext {
    seller: SellerRow | null;
    managedByPlatform: boolean;
    accountId: string | null;
    sellerName: string;
    sellerEmail: string;
    accountReady: boolean;
    taxReady: boolean;
    ready: boolean;
    reason: SellerReadinessError | null;
}

async function inspectSeller(env: Env, userId: string): Promise<SellerContext> {
    const owner = await env.DB.prepare('SELECT username,email,role,banned_at FROM users WHERE id = ?')
        .bind(userId)
        .first<{ username: string; email: string; role: string | null; banned_at: number | null }>();
    const managedByPlatform = owner?.role === 'admin';
    const seller = managedByPlatform ? null : await getSeller(env, userId);
    const context: SellerContext = {
        seller,
        managedByPlatform,
        accountId: managedByPlatform ? (env.STRIPE_PLATFORM_ACCOUNT_ID ?? null) : (seller?.stripe_account_id ?? null),
        sellerName: seller?.legal_name ?? owner?.username ?? '',
        sellerEmail: owner?.email ?? '',
        accountReady: false,
        taxReady: false,
        ready: false,
        reason: null,
    };
    const unavailable = (reason: SellerReadinessError): SellerContext => ({ ...context, ready: false, reason });
    if (!owner || owner.banned_at !== null || (!managedByPlatform && seller && seller.disabled_at !== null)) {
        return unavailable('seller_not_ready');
    }
    if (!context.accountId) {
        return unavailable(managedByPlatform ? 'payments_unavailable' : 'seller_not_ready');
    }
    if (!managedByPlatform && context.accountId === env.STRIPE_PLATFORM_ACCOUNT_ID) {
        return unavailable('seller_not_ready');
    }
    if (!env.STRIPE_SECRET_KEY || !stripeWebhookConfigured(env, context.accountId)) {
        return unavailable('payments_unavailable');
    }
    try {
        const stripe = stripeClient(env);
        const remote = await stripe.accounts.retrieve(context.accountId);
        if (!managedByPlatform) {
            await syncSeller(env, remote);
            context.seller = await getSeller(env, userId);
            if (context.seller?.stripe_account_id !== remote.id) {
                return unavailable('seller_not_ready');
            }
        }
        context.sellerName = remote.business_profile?.name ?? remote.company?.name ?? context.sellerName;
        context.sellerEmail = remote.business_profile?.support_email ?? remote.email ?? context.sellerEmail;
        const requirements = remote.requirements;
        context.accountReady = Boolean(
            remote.charges_enabled &&
            remote.payouts_enabled &&
            remote.details_submitted &&
            !requirements?.disabled_reason &&
            !requirements?.currently_due?.length &&
            !requirements?.past_due?.length &&
            !requirements?.pending_verification?.length,
        );
        if (!context.accountReady) {
            return unavailable('seller_not_ready');
        }
        context.taxReady = await sellerTaxReady(env, stripe, remote.id);
        return { ...context, ready: context.taxReady, reason: context.taxReady ? null : 'seller_tax_not_ready' };
    } catch (failure) {
        if (failure instanceof Stripe.errors.StripeError) {
            return unavailable('payments_unavailable');
        }
        throw failure;
    }
}

export async function sellerStatus(env: Env, userId: string) {
    const status = await inspectSeller(env, userId);
    return {
        seller: status.seller,
        managedByPlatform: status.managedByPlatform,
        accountReady: status.accountReady,
        taxReady: status.taxReady,
        ready: status.ready,
        reason: status.reason,
    };
}

export async function requireSellerReady(env: Env, userId: string): Promise<SellerContext & { accountId: string }> {
    const status = await inspectSeller(env, userId);
    if (!status.ready || !status.accountId) {
        const reason = status.reason ?? 'seller_not_ready';
        error(reason === 'payments_unavailable' ? 503 : 409, reason);
    }
    return { ...status, accountId: status.accountId };
}
export async function startSellerOnboarding(
    env: Env,
    user: User,
    recordAudit: (action: string, target: string, details?: Record<string, unknown>) => Promise<void>,
) {
    const stripe = stripeClient(env);
    const status = await inspectSeller(env, user.id);
    if (status.managedByPlatform) {
        if (!status.accountId) error(503, 'payments_unavailable');
        return { url: `https://dashboard.stripe.com/${encodeURIComponent(status.accountId)}` };
    }
    let local = status.seller;
    if (local?.stripe_account_id && status.accountReady) {
        await recordAudit('seller.dashboard_opened', user.id, { accountId: local.stripe_account_id });
        const dashboard = `https://dashboard.stripe.com/${encodeURIComponent(local.stripe_account_id)}`;
        return { url: status.taxReady ? dashboard : `${dashboard}/settings/tax` };
    }
    if (local?.stripe_account_id && status.reason !== 'seller_not_ready') {
        error(503, 'payments_unavailable');
    }
    if (!local) {
        await database(env.DB)
            .insert(sellerAccounts)
            .values({ user_id: user.id, created_at: now(), updated_at: now() })
            .onConflictDoNothing()
            .run();
        local = await getSeller(env, user.id);
    }
    let accountId = local?.stripe_account_id;
    if (!accountId) {
        const account = await stripe.accounts.create(
            {
                email: user.email,
                controller: {
                    fees: { payer: 'account' },
                    losses: { payments: 'stripe' },
                    requirement_collection: 'stripe',
                    stripe_dashboard: { type: 'full' },
                },
                metadata: { kraftink_user_id: user.id },
            },
            { idempotencyKey: `kraftink-seller-${user.id}` },
        );
        accountId = account.id;
        await env.DB.prepare(
            'UPDATE seller_accounts SET stripe_account_id = ?, updated_at = ? WHERE user_id = ? AND stripe_account_id IS NULL',
        )
            .bind(accountId, now(), user.id)
            .run();
    }
    const link = await stripe.accountLinks.create({
        account: accountId,
        type: 'account_onboarding',
        collection_options: { fields: 'eventually_due' },
        refresh_url: `${env.APP_ORIGIN}/creator/payments?stripe=refresh`,
        return_url: `${env.APP_ORIGIN}/creator/payments?stripe=return`,
    });
    await recordAudit('seller.onboarding_started', user.id, { accountId });
    return { url: link.url };
}
