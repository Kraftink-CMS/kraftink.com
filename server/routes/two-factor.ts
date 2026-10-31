import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import type { AppEnv } from '../types';
import type { AppContext } from '../http';
import { jsonBody, sessionCookieName, textField } from '../http';
import { audit, requireSensitive, requireUser } from '../security/authorization';
import { rateLimit } from '../security/abuse';
import { changeTwoFactor, confirmTwoFactor, setupTwoFactor, twoFactorState } from '../services/identity/two-factor';
import { rotateSession as rotateStoredSession } from '../services/identity/sessions';

const routes = new Hono<AppEnv>();

async function rotateSession(c: AppContext, revision: string | null) {
    const user = requireUser(c);
    const result = await rotateStoredSession(c.env, user.id, c.get('session')!.id, revision);
    setCookie(c, sessionCookieName(c), result.token, {
        httpOnly: true,
        secure: new URL(c.env.APP_ORIGIN).protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
        maxAge: result.maxAge,
    });
    c.set('session', result.session);
    return result.session.csrfToken;
}

routes.get('/account/two-factor', async (c) => {
    const user = requireUser(c);
    return c.json(await twoFactorState(c.env, user.id));
});

routes.post('/account/two-factor/setup', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'two-factor.setup', 5, 900, user.id);
    await requireSensitive(c, 'account.two-factor');
    return c.json(await setupTwoFactor(c.env, user, c.get('session')!.id));
});

routes.post('/account/two-factor/confirm', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'two-factor.confirm', 8, 300, user.id);
    const body = await jsonBody(c);
    const result = await confirmTwoFactor(c.env, user.id, c.get('session')!.id, textField(body.code, 6, 6));
    const csrfToken = await rotateSession(c, result.revision);
    await audit(c, 'account.two-factor.enabled', user.id);
    return c.json({ recoveryCodes: result.recoveryCodes, csrfToken });
});

routes.delete('/account/two-factor', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'two-factor.disable', 5, 900, user.id);
    await requireSensitive(c, 'account.two-factor');
    const result = await changeTwoFactor(c.env, user.id, c.get('session')!.id, true);
    const csrfToken = await rotateSession(c, result.revision);
    await audit(c, 'account.two-factor.disabled', user.id);
    return c.json({ success: true, csrfToken });
});

routes.post('/account/two-factor/recovery-codes', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'two-factor.recovery-regenerate', 5, 900, user.id);
    await requireSensitive(c, 'account.two-factor');
    const result = await changeTwoFactor(c.env, user.id, c.get('session')!.id, false);
    const csrfToken = await rotateSession(c, result.revision);
    await audit(c, 'account.two-factor.recovery-regenerated', user.id);
    return c.json({ recoveryCodes: result.recoveryCodes, csrfToken });
});

export default routes;
