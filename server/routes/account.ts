import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import type { AppEnv } from '../types';
import type { AppContext } from '../http';
import { fail, jsonBody, requestIp, requestLocale, sessionCookieName } from '../http';
import { loadUser, rotateSession } from '../services/identity/sessions';
import { normalizeIp } from '../../shared/ip';
import { audit, requireRole, requireSensitive, requireUser, requireVerifiedUser } from '../security/authorization';
import { rateLimit } from '../security/abuse';
import { defaultUploadLimit } from '../upload-limits';
import {
    browserCookieName,
    normalizeEmail,
    passwordField,
    validateUsername,
} from '../services/identity/authentication';
import { ensureMailConfigured, mailConfigured, sendAccountMail } from '../services/communication/mail';
import { expireBannedCheckouts } from '../services/commerce/checkout';

import {
    accountProfile,
    accountDeletionEligibility,
    deleteOwnAccount,
    setInitialPassword,
    unlinkGithub,
    changeUsername,
    requestEmailChange,
    cancelEmailChange,
    siteKeyState,
    rotateSiteKey,
    revokeSiteKey,
    changeAllowedIps,
    listUsers,
    prepareUserUpdate,
    applyUserUpdate,
} from '../services/identity/accounts';

const routes = new Hono<AppEnv>();

async function authenticationChanged(c: AppContext, userId: string, revision: string | null) {
    const result = await rotateSession(c.env, userId, c.get('session')!.id, revision);
    const secure = new URL(c.env.APP_ORIGIN).protocol === 'https:';
    setCookie(c, sessionCookieName(c), result.token, {
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
        maxAge: result.maxAge,
    });
    deleteCookie(c, browserCookieName(c.env.APP_ORIGIN), { path: '/', secure });
    deleteCookie(c, secure ? '__Host-kraftink_two_factor' : 'kraftink_two_factor', { path: '/', secure });
    const user = await loadUser(c.env, userId);
    c.set('user', user);
    c.set('session', result.session);
    return { user, csrfToken: result.session.csrfToken };
}

routes.get('/account', async (c) => {
    const user = requireUser(c);
    return c.json(await accountProfile(c.env.DB, user));
});

routes.post('/account/password', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'account-password.user', 5, 3600, user.id);
    const body = await jsonBody(c);
    if (Object.keys(body).some((key) => !['password', 'passwordConfirmation'].includes(key))) {
        fail(422, 'invalid_input');
    }
    const password = passwordField(body.password);
    if (body.passwordConfirmation !== password) {
        fail(422, 'password_confirmation_mismatch');
    }
    if (user.hasPassword) {
        fail(409, 'password_already_set');
    }
    if (!user.githubLinked) {
        fail(409, 'github_not_linked');
    }
    const result = await setInitialPassword(
        c.env.DB,
        user.id,
        c.get('session')!.id,
        c.req.header('X-Sensitive-Token') ?? '',
        password,
    );
    return c.json(await authenticationChanged(c, user.id, result.revision));
});

routes.delete('/account/github', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'github-unlink.user', 5, 3600, user.id);
    if (!user.hasPassword) {
        fail(409, 'password_required');
    }
    if (!user.githubLinked) {
        fail(409, 'github_not_linked');
    }
    const result = await unlinkGithub(c.env.DB, user.id, c.get('session')!.id, c.req.header('X-Sensitive-Token') ?? '');
    return c.json(await authenticationChanged(c, user.id, result.revision));
});

routes.get('/account/deletion', async (c) => {
    const user = requireUser(c);
    return c.json(await accountDeletionEligibility(c.env.DB, user.id));
});

routes.delete('/account', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'account-delete.user', 5, 3600, user.id);
    const session = c.get('session');
    if (!session) {
        fail(401, 'authentication_required');
    }
    await deleteOwnAccount(c.env.DB, user.id, session.id, c.req.header('X-Sensitive-Token') ?? '');
    const secure = new URL(c.env.APP_ORIGIN).protocol === 'https:';
    deleteCookie(c, sessionCookieName(c), { path: '/', secure });
    deleteCookie(c, browserCookieName(c.env.APP_ORIGIN), { path: '/', secure });
    deleteCookie(
        c,
        new URL(c.env.APP_ORIGIN).protocol === 'https:' ? '__Host-kraftink_two_factor' : 'kraftink_two_factor',
        { path: '/', secure },
    );
    c.set('user', null);
    c.set('session', null);
    return c.json({ success: true });
});

routes.patch('/account/username', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'username.user', 10, 3600, user.id);
    const body = await jsonBody(c);
    if (Object.keys(body).some((key) => key !== 'username')) {
        fail(422, 'invalid_request');
    }
    const username = validateUsername(body.username);
    await requireSensitive(c, 'account.security');
    if (username === user.username) {
        return c.json({ user });
    }
    const nextUsernameChangeAt = await changeUsername(c.env.DB, user, username);
    await audit(c, 'account.username.changed', user.id);
    return c.json({ user: await loadUser(c.env, user.id), nextUsernameChangeAt });
});

routes.post('/account/email', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'email-change.user', 3, 3600, user.id);
    const body = await jsonBody(c);
    if (Object.keys(body).some((key) => key !== 'email')) {
        fail(422, 'invalid_request');
    }
    const email = normalizeEmail(body.email);
    ensureMailConfigured(c.env);
    await requireSensitive(c, 'account.security');
    if (email === user.email.toLowerCase()) {
        return c.json({ accepted: true }, 202);
    }
    const token = await requestEmailChange(c.env.DB, user, email);
    await sendAccountMail(c.env, email, 'email-change', token, token, requestLocale(c));
    if (mailConfigured(c.env)) {
        await sendAccountMail(c.env, user.email, 'email-change-requested', email, token, requestLocale(c));
    }
    await audit(c, 'account.email.requested', user.id);
    return c.json({ accepted: true }, 202);
});

routes.delete('/account/email', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'email-change.cancel', 10, 3600, user.id);
    await requireSensitive(c, 'account.security');
    await cancelEmailChange(c.env.DB, user.id);
    await audit(c, 'account.email.cancelled', user.id);
    return c.json({ success: true });
});

routes.get('/account/site-key', async (c) => {
    const user = requireUser(c);
    return c.json({ ...(await siteKeyState(c.env.DB, user.id)), clientIp: requestIp(c) });
});

routes.post('/account/site-key', async (c) => {
    const user = requireVerifiedUser(c);
    await rateLimit(c, 'site-key.user', 10, 3600, user.id);
    await requireSensitive(c, 'account.site-key');
    const token = await rotateSiteKey(c.env.DB, user.id);
    await audit(c, 'site-key.rotated', user.id);
    return c.json({ siteKey: token, message: 'site_key_copy_once' }, 201);
});

routes.delete('/account/site-key', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'site-key.revoke', 20, 3600, user.id);
    await revokeSiteKey(c.env.DB, user.id);
    await audit(c, 'site-key.revoked', user.id);
    return c.json({ success: true });
});

routes.patch('/account/ip', async (c) => {
    const user = requireVerifiedUser(c);
    await rateLimit(c, 'site-ip.user', 10, 3600, user.id);
    const body = await jsonBody(c);
    if (
        Object.keys(body).some((key) => key !== 'ips') ||
        !Array.isArray(body.ips) ||
        body.ips.length > 100 ||
        body.ips.some((value) => typeof value !== 'string')
    ) {
        fail(422, 'ip_invalid');
    }
    const ips = body.ips.map(normalizeIp);
    if (ips.some((ip) => ip === null) || new Set(ips).size !== ips.length) {
        fail(422, 'ip_invalid');
    }
    ips.sort();
    await requireSensitive(c, 'account.security');
    const result = await changeAllowedIps(c.env.DB, user.id, ips as string[]);
    if (result.changed) {
        await audit(c, 'site-ip.changed', user.id, { previousIps: result.previousIps, ips });
    }
    return c.json({ allowedIps: result.allowedIps, nextIpChangeAt: result.nextIpChangeAt });
});

routes.get('/admin/users', async (c) => {
    requireRole(c, 'admin');
    const query = (c.req.query('q') ?? '').trim().slice(0, 100);
    const offset = Math.min(Math.max(Number.parseInt(c.req.query('offset') ?? '0', 10) || 0, 0), 100000);
    return c.json({ ...(await listUsers(c.env.DB, query, offset)), defaultMaxUploadBytes: defaultUploadLimit(c.env) });
});

routes.patch('/admin/users/:id', async (c) => {
    const actor = requireRole(c, 'admin');
    await rateLimit(c, 'admin.users', 60, 3600, actor.id);
    const body = await jsonBody(c);
    const changes = await prepareUserUpdate(c.env.DB, actor.id, c.req.param('id'), body);
    await requireSensitive(c, body.role === undefined ? 'admin.users' : 'admin.roles');
    const details = await applyUserUpdate(c.env.DB, changes);
    await audit(c, 'admin.user-updated', changes.targetId, details);
    if (body.banned === true) {
        await expireBannedCheckouts(c.env, changes.targetId);
    }
    return c.json({ success: true });
});

export default routes;
