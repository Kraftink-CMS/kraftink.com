import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';
import { audit, requireRole, requireSensitive, requireUser } from '../security/authorization';
import { fail as error, jsonBody, requestBody } from '../http';
import { rateLimit } from '../security/abuse';
import { sellerStatus, startSellerOnboarding } from '../services/commerce/sellers';
import { startCheckout } from '../services/commerce/checkout';
import { processStripeWebhook } from '../services/commerce/payments';
import { listBuyerOrders, orderDocument, listBuyerPurchases, listSellerOrders } from '../services/commerce/orders';
import { commerceStatistics } from '../services/commerce/statistics';

const routes = new Hono<AppEnv>();

function cursor(c: Context<AppEnv>): { time: number | null; id: string } {
    const value = c.req.query('before');
    if (!value) {
        return { time: null, id: '' };
    }
    const match = /^(\d{1,11})\.([0-9a-f-]{36})$/i.exec(value);
    if (!match || !z.string().uuid().safeParse(match[2]).success) {
        error(400, 'invalid_cursor');
    }
    return { time: Number(match[1]), id: match[2] };
}

function creator(c: Context<AppEnv>) {
    const user = requireRole(c, 'creator');
    if (!user.emailVerified) {
        error(403, 'email_verification_required');
    }
    return user;
}

routes.get('/creator/stripe/status', async (c) => c.json(await sellerStatus(c.env, creator(c).id)));
routes.post('/creator/stripe/onboard', async (c) => {
    const user = creator(c);
    await requireSensitive(c, 'creator.payments');
    if (
        !z
            .object({})
            .strict()
            .safeParse(await jsonBody(c)).success
    )
        error(400, 'invalid_seller');
    return c.json(
        await startSellerOnboarding(c.env, user, (action, target, details) => audit(c, action, target, details)),
    );
});
routes.post('/checkout', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'checkout', 20, 3600, user.id);
    if (!user.emailVerified) error(403, 'email_verification_required');
    const parsed = z.object({ resourceId: z.string().uuid() }).safeParse(await jsonBody(c));
    if (!parsed.success) error(400, 'invalid_resource');
    const result = await startCheckout(c.env, user, parsed.data.resourceId, (action, target, details) =>
        audit(c, action, target, details),
    );
    return c.json(result.data, result.status);
});
routes.post('/stripe/webhook', async (c) => {
    const signature = c.req.header('Stripe-Signature');
    if (!signature) error(400, 'webhook_invalid');
    const raw = new TextDecoder().decode(await requestBody(c, 1024 * 1024));
    return c.json(await processStripeWebhook(c.env, raw, signature));
});
routes.get('/account/orders', async (c) => {
    const user = requireUser(c);
    return c.json(await listBuyerOrders(c.env, user.id, cursor(c)));
});
routes.get('/account/orders/:id/document', async (c) => {
    const user = requireUser(c);
    return c.json(await orderDocument(c.env, user.id, c.req.param('id')));
});
routes.get('/account/purchases', async (c) => {
    const user = requireUser(c);
    return c.json(await listBuyerPurchases(c.env, user.id, cursor(c)));
});
routes.get('/creator/orders', async (c) => {
    const user = creator(c);
    return c.json(await listSellerOrders(c.env, user.id, cursor(c)));
});
routes.get('/admin/statistics', async (c) => {
    const user = requireRole(c, 'admin');
    await rateLimit(c, 'admin.statistics', 30, 60, user.id);
    return c.json(
        await commerceStatistics(c.env, {
            from: c.req.query('from'),
            to: c.req.query('to'),
            currency: c.req.query('currency'),
        }),
    );
});

export default routes;
