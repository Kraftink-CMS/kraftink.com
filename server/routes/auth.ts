import { Hono } from 'hono';
import { sessionData } from '../middleware/authentication';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { AppEnv } from '../types';
import type { AppContext } from '../http';
import { fail, jsonBody, requestLocale, sessionCookieName, textField } from '../http';
import { loadUser, persistSession, revokeSession } from '../services/identity/sessions';
import {
    audit,
    issueSensitiveToken,
    requireSensitive,
    requireUser,
    sensitivePurposes,
} from '../security/authorization';
import { randomToken, toBase64Url } from '../security/crypto';
import { rateLimit, verifyTurnstile } from '../security/abuse';
import { ensureMailConfigured, mailConfigured, sendAccountMail } from '../services/communication/mail';
import { now } from '../lib/time';
import {
    beginTwoFactorChallenge,
    completeTwoFactorChallenge,
    findTwoFactorChallenge,
    revokeBrowserChallenges,
    type FactorCompletion,
} from '../services/identity/two-factor';

import {
    normalizeEmail,
    passwordField,
    validateUsername,
    safeReturnPath,
    verifyPassword,
    grantBootstrapAdmin,
    issueVerification,
    browserCookieName,
    githubFetch,
    registerAccount,
    findAccount,
    passwordHash,
    issuePasswordReset,
    resetPassword,
    confirmEmailChange,
    verifyAccountEmail,
    beginGithubFlow,
    consumeGithubFlow,
    findGithubAccount,
    linkGithubAccount,
    registerGithubAccount,
    currentTermsVersion,
    requireTermsAccepted,
    rememberPreference,
} from '../services/identity/authentication';

const routes = new Hono<AppEnv>();

async function createSession(
    c: AppContext,
    userId: string,
    method: 'password' | 'github',
    completion?: FactorCompletion,
    expectedPasswordHash?: string | null,
    remember = false,
    expectedGithubId?: string,
) {
    const user = await loadUser(c.env, userId);
    if (!user || user.banned) {
        fail(401, 'credentials_invalid');
    }
    const result = await persistSession(
        c.env,
        userId,
        method,
        c.get('session')?.id,
        completion,
        expectedPasswordHash,
        remember,
        expectedGithubId,
    );
    setCookie(c, sessionCookieName(c), result.token, {
        httpOnly: true,
        secure: new URL(c.env.APP_ORIGIN).protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
        maxAge: result.maxAge,
    });
    c.set('user', user);
    c.set('session', result.session);
    return { user, csrfToken: result.session.csrfToken };
}

function twoFactorCookieName(c: AppContext) {
    return new URL(c.env.APP_ORIGIN).protocol === 'https:' ? '__Host-kraftink_two_factor' : 'kraftink_two_factor';
}

async function challengeTwoFactor(
    c: AppContext,
    userId: string,
    method: 'password' | 'github',
    options: Parameters<typeof beginTwoFactorChallenge>[3] = {},
) {
    const challenge = await beginTwoFactorChallenge(c.env, userId, method, options);
    setCookie(c, twoFactorCookieName(c), challenge.browser, {
        httpOnly: true,
        secure: new URL(c.env.APP_ORIGIN).protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
        maxAge: 300,
    });
    return { twoFactorRequired: true as const, challenge: challenge.token };
}

async function githubLogin(c: AppContext, userId: string, githubId: string, returnPath: string, remember: boolean) {
    const user = await loadUser(c.env, userId);
    if (!user || user.banned) {
        fail(401, 'credentials_invalid');
    }
    if (user.twoFactorEnabled) {
        const challenge = await challengeTwoFactor(c, userId, 'github', { returnPath, remember, githubId });
        const url = new URL('/login', c.env.APP_ORIGIN);
        url.hash = new URLSearchParams({ two_factor: challenge.challenge, next: returnPath }).toString();
        return c.redirect(url.toString(), 302);
    }
    await createSession(c, userId, 'github', undefined, undefined, remember, githubId);
    return c.redirect(new URL(returnPath, c.env.APP_ORIGIN).toString(), 302);
}

async function deliverVerification(c: AppContext, userId: string, email: string): Promise<void> {
    const token = await issueVerification(c.env, userId, email);
    if (token) {
        await sendAccountMail(c.env, email, 'verify', token, token, requestLocale(c));
    }
}

routes.get('/auth/session', (c) => c.json(sessionData(c)));

routes.post('/auth/register', async (c) => {
    await rateLimit(c, 'register.ip', 5, 3600);
    const body = await jsonBody(c);
    requireTermsAccepted(body.termsAccepted);
    await verifyTurnstile(c, body.turnstileToken);
    ensureMailConfigured(c.env);
    const email = normalizeEmail(body.email);
    const password = passwordField(body.password);
    const username = validateUsername(body.username);
    const id = await registerAccount(c.env, email, username, password, body.termsAccepted);
    if (id) {
        await deliverVerification(c, id, email);
    }
    return c.json({ accepted: true, message: 'registration_check_email' }, 202);
});

routes.post('/auth/login', async (c) => {
    await rateLimit(c, 'login.ip', 20, 900);
    const body = await jsonBody(c);
    const remember = rememberPreference(body.remember);
    const identifier = textField(body.identifier, 1, 254).trim().toLowerCase();
    await rateLimit(c, 'login.identifier', 10, 900, identifier);
    await verifyTurnstile(c, body.turnstileToken);
    const password = textField(body.password, 1, 128);
    const row = await findAccount(c.env.DB, identifier);
    if (row) {
        await rateLimit(c, 'login.account', 10, 900, row.id);
    }
    const valid = await verifyPassword(password, row?.password_hash ?? null);
    if (!row || !valid || row.banned_at !== null) {
        fail(401, 'credentials_invalid');
    }
    const user = await loadUser(c.env, row.id);
    if (user?.twoFactorEnabled) {
        return c.json(
            await challengeTwoFactor(c, row.id, 'password', {
                returnPath: safeReturnPath(body.next, c.env.APP_ORIGIN),
                passwordHash: row.password_hash,
                remember,
            }),
        );
    }
    return c.json(await createSession(c, row.id, 'password', undefined, row.password_hash, remember));
});

routes.post('/auth/two-factor/verify', async (c) => {
    await rateLimit(c, 'two-factor.ip', 30, 900);
    const body = await jsonBody(c);
    const challenge = await findTwoFactorChallenge(
        c.env,
        textField(body.challenge, 43, 43),
        getCookie(c, twoFactorCookieName(c)) ?? '',
    );
    await rateLimit(c, 'two-factor.user', 8, 300, challenge.user_id);
    const code = textField(body.code, 6, 40).trim();
    if (!/^\d{6}$/.test(code)) {
        await rateLimit(c, 'two-factor.recovery', 5, 900, challenge.user_id);
    }
    const completion = await completeTwoFactorChallenge(c.env, challenge, code);
    const result = await createSession(
        c,
        challenge.user_id,
        challenge.auth_method,
        completion,
        undefined,
        Boolean(challenge.remember),
    );
    deleteCookie(c, twoFactorCookieName(c), { path: '/', secure: new URL(c.env.APP_ORIGIN).protocol === 'https:' });
    return c.json({ ...result, next: challenge.return_path });
});

routes.post('/auth/logout', async (c) => {
    const token = getCookie(c, sessionCookieName(c));
    if (token) {
        await revokeSession(c.env.DB, token);
    }
    await revokeBrowserChallenges(c.env, getCookie(c, twoFactorCookieName(c)) ?? '');
    deleteCookie(c, twoFactorCookieName(c), { path: '/', secure: new URL(c.env.APP_ORIGIN).protocol === 'https:' });
    deleteCookie(c, sessionCookieName(c), { path: '/', secure: new URL(c.env.APP_ORIGIN).protocol === 'https:' });
    return c.json({ success: true });
});

routes.post('/auth/forgot-password', async (c) => {
    await rateLimit(c, 'forgot.ip', 10, 3600);
    const body = await jsonBody(c);
    await verifyTurnstile(c, body.turnstileToken);
    ensureMailConfigured(c.env);
    const email = normalizeEmail(body.email);
    await rateLimit(c, 'forgot.email', 3, 3600, email);
    const token = await issuePasswordReset(c.env, email);
    if (token) {
        await sendAccountMail(c.env, email, 'reset', token, token, requestLocale(c));
    }
    return c.json({ accepted: true, message: 'password_reset_check_email' }, 202);
});

routes.post('/auth/reset-password', async (c) => {
    await rateLimit(c, 'reset.ip', 10, 3600);
    const body = await jsonBody(c);
    await verifyTurnstile(c, body.turnstileToken);
    const token = textField(body.token, 43, 43);
    const password = passwordField(body.password);
    const userId = await resetPassword(c.env.DB, token, password);
    await grantBootstrapAdmin(c.env, userId);
    deleteCookie(c, sessionCookieName(c), { path: '/', secure: new URL(c.env.APP_ORIGIN).protocol === 'https:' });
    return c.json({ success: true });
});

routes.post('/auth/verify-email', async (c) => {
    await rateLimit(c, 'verify.ip', 20, 3600);
    const body = await jsonBody(c);
    const token = textField(body.token, 43, 43);
    if (body.purpose === 'email-change') {
        const changed = await confirmEmailChange(c.env.DB, token);
        await audit(c, 'account.email.changed', changed.id);
        if (mailConfigured(c.env)) {
            await sendAccountMail(
                c.env,
                changed.previousEmail,
                'email-changed',
                changed.email,
                token,
                requestLocale(c),
            );
        }
        deleteCookie(c, sessionCookieName(c), { path: '/', secure: new URL(c.env.APP_ORIGIN).protocol === 'https:' });
        return c.json({ success: true, emailChanged: true });
    }
    const userId = await verifyAccountEmail(c.env.DB, token);
    await grantBootstrapAdmin(c.env, userId);
    return c.json({ success: true });
});

routes.post('/auth/resend-verification', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'verify.user', 3, 3600, user.id);
    ensureMailConfigured(c.env);
    if (!user.emailVerified) {
        await deliverVerification(c, user.id, user.email);
    }
    return c.json({ accepted: true }, 202);
});

routes.post('/auth/reauthenticate', async (c) => {
    const user = requireUser(c);
    await rateLimit(c, 'reauth.user', 10, 900, user.id);
    const body = await jsonBody(c);
    const purpose = textField(body.purpose, 1, 64);
    if (!sensitivePurposes.has(purpose)) {
        fail(422, 'invalid_purpose');
    }
    if (user.twoFactorEnabled) {
        await rateLimit(c, 'two-factor.user', 8, 300, user.id);
        const code = textField(body.code, 6, 40).trim();
        if (!/^\d{6}$/.test(code)) {
            await rateLimit(c, 'two-factor.recovery', 5, 900, user.id);
        }
        return c.json(await issueSensitiveToken(c, purpose, { method: 'two-factor', code }));
    }
    const digest = await passwordHash(c.env.DB, user.id);
    const valid = await verifyPassword(textField(body.password, 1, 128), digest);
    if (!valid || !digest) {
        fail(401, 'credentials_invalid');
    }
    return c.json(await issueSensitiveToken(c, purpose, { method: 'password', passwordHash: digest }));
});

const startGithub = async (c: AppContext) => {
    if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET) {
        fail(503, 'github_unavailable');
    }
    await rateLimit(c, 'github.ip', 20, 900);
    const registering = c.req.path === '/api/auth/github/register';
    const registration = registering ? await jsonBody(c) : null;
    if (registering) {
        requireTermsAccepted(registration?.termsAccepted);
    }
    const purpose = registering ? 'login' : c.req.method === 'POST' ? 'link' : (c.req.query('purpose') ?? 'login');
    const actionPurpose = c.req.query('action') ?? 'account.security';
    const returnPath = safeReturnPath(registering ? registration?.next : c.req.query('next'), c.env.APP_ORIGIN);
    const queryRemember = c.req.query('remember');
    if (
        !registering &&
        purpose === 'login' &&
        queryRemember !== undefined &&
        !['true', 'false'].includes(queryRemember)
    ) {
        fail(422, 'invalid_input');
    }
    const remember = registering
        ? rememberPreference(registration?.remember)
        : purpose === 'login'
          ? queryRemember === 'true'
          : (c.get('session')?.remember ?? false);
    if (
        !['login', 'link', 'reauthenticate'].includes(purpose) ||
        (purpose === 'link' && c.req.method !== 'POST') ||
        (purpose === 'reauthenticate' && !sensitivePurposes.has(actionPurpose))
    ) {
        fail(422, 'invalid_purpose');
    }
    const user = purpose === 'login' ? null : requireUser(c);
    const session = c.get('session');
    if (purpose === 'reauthenticate' && user!.twoFactorEnabled) {
        fail(403, 'two_factor_confirmation_required');
    }
    if (
        purpose === 'reauthenticate' &&
        (actionPurpose === 'admin.roles' ||
            actionPurpose === 'account.github-unlink' ||
            (await passwordHash(c.env.DB, user!.id)))
    ) {
        fail(403, 'password_confirmation_required');
    }
    if (purpose === 'reauthenticate' && !user!.githubLinked) {
        fail(403, 'github_not_linked');
    }
    if (purpose === 'link') {
        await requireSensitive(c, 'account.github-link');
        const linked = await findAccount(c.env.DB, user!.email);
        if (linked?.github_id) {
            fail(409, 'github_already_linked');
        }
    }
    const state = randomToken();
    const browser = randomToken();
    const verifier = randomToken(48);
    await beginGithubFlow(
        c.env.DB,
        state,
        browser,
        verifier,
        purpose as 'login' | 'link' | 'reauthenticate',
        actionPurpose,
        returnPath,
        user?.id ?? null,
        session?.id ?? null,
        {
            remember,
            termsAcceptedAt: registering ? now() : null,
            termsVersion: registering ? currentTermsVersion : null,
        },
    );
    setCookie(c, browserCookieName(c.env.APP_ORIGIN), browser, {
        httpOnly: true,
        secure: new URL(c.env.APP_ORIGIN).protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
        maxAge: 600,
    });
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', c.env.GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_uri', new URL('/api/auth/github/callback', c.env.APP_ORIGIN).toString());
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);
    url.searchParams.set(
        'code_challenge',
        toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))),
    );
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('prompt', 'select_account');
    return c.req.method === 'POST' ? c.json({ url: url.toString() }) : c.redirect(url.toString(), 302);
};
routes.get('/auth/github', startGithub);
routes.post('/auth/github/link', startGithub);
routes.post('/auth/github/register', startGithub);

routes.get('/auth/github/callback', async (c) => {
    await rateLimit(c, 'github.callback', 30, 900);
    const state = c.req.query('state') ?? '';
    const code = c.req.query('code') ?? '';
    const browser = getCookie(c, browserCookieName(c.env.APP_ORIGIN)) ?? '';
    deleteCookie(c, browserCookieName(c.env.APP_ORIGIN), {
        path: '/',
        secure: new URL(c.env.APP_ORIGIN).protocol === 'https:',
    });
    if (
        !/^[A-Za-z0-9_-]{43}$/.test(state) ||
        !/^[A-Za-z0-9_-]{43}$/.test(browser) ||
        code.length === 0 ||
        code.length > 512 ||
        !c.env.GITHUB_CLIENT_ID ||
        !c.env.GITHUB_CLIENT_SECRET
    ) {
        fail(400, 'oauth_state_invalid');
    }
    const flow = await consumeGithubFlow(c.env.DB, state, browser);
    if (!flow) {
        fail(400, 'oauth_state_invalid');
    }
    if (flow.purpose !== 'login' && (c.get('user')?.id !== flow.user_id || c.get('session')?.id !== flow.session_id)) {
        fail(403, 'oauth_session_invalid');
    }
    const exchange = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'KraftInk' },
        body: JSON.stringify({
            client_id: c.env.GITHUB_CLIENT_ID,
            client_secret: c.env.GITHUB_CLIENT_SECRET,
            code,
            code_verifier: flow.code_verifier,
            redirect_uri: new URL('/api/auth/github/callback', c.env.APP_ORIGIN).toString(),
        }),
        signal: AbortSignal.timeout(10000),
    });
    if (!exchange.ok) {
        fail(503, 'github_unavailable');
    }
    const credentials = await exchange.json<{ access_token?: string }>();
    if (!credentials.access_token) {
        fail(400, 'oauth_code_invalid');
    }
    const profile = await githubFetch<{ id: number; login: string; name?: string }>(
        'https://api.github.com/user',
        credentials.access_token,
    );
    const githubId = String(profile.id);
    if (!Number.isSafeInteger(profile.id) || profile.id <= 0) {
        fail(400, 'github_identity_invalid');
    }
    const existing = await findGithubAccount(c.env.DB, githubId);
    if (flow.purpose === 'reauthenticate') {
        if (!existing || existing.id !== flow.user_id || existing.banned_at !== null || !flow.action_purpose) {
            fail(403, 'github_identity_mismatch');
        }
        if (existing.two_factor_enabled_at !== null) {
            fail(403, 'two_factor_confirmation_required');
        }
        if (
            flow.action_purpose === 'admin.roles' ||
            flow.action_purpose === 'account.github-unlink' ||
            (await passwordHash(c.env.DB, existing.id))
        ) {
            fail(403, 'password_confirmation_required');
        }
        const proof = await issueSensitiveToken(c, flow.action_purpose, { method: 'github', githubId });
        const url = new URL('/account', c.env.APP_ORIGIN);
        url.hash = new URLSearchParams({ sensitive: proof.sensitiveToken, purpose: proof.purpose }).toString();
        return c.redirect(url.toString(), 302);
    }
    if (flow.purpose === 'link') {
        if (existing && existing.id !== flow.user_id) {
            fail(409, 'github_already_linked');
        }
        await linkGithubAccount(c.env.DB, githubId, flow.user_id!, flow.session_id!);
        return c.redirect(new URL('/account?github=linked', c.env.APP_ORIGIN).toString(), 302);
    }
    if (existing) {
        if (existing.banned_at !== null) {
            fail(401, 'credentials_invalid');
        }
        return githubLogin(
            c,
            existing.id,
            githubId,
            safeReturnPath(flow.return_path, c.env.APP_ORIGIN),
            Boolean(flow.remember),
        );
    }
    if (flow.terms_accepted_at === null || flow.terms_version !== currentTermsVersion) {
        const url = new URL('/register', c.env.APP_ORIGIN);
        url.searchParams.set('error', 'terms_acceptance_required');
        url.searchParams.set('next', safeReturnPath(flow.return_path, c.env.APP_ORIGIN));
        return c.redirect(url.toString(), 302);
    }
    const emails = await githubFetch<Array<{ email: string; verified: boolean; primary: boolean }>>(
        'https://api.github.com/user/emails',
        credentials.access_token,
    );
    const verified = emails.find((entry) => entry.verified && entry.primary) ?? emails.find((entry) => entry.verified);
    if (!verified) {
        fail(403, 'github_verified_email_required');
    }
    const email = normalizeEmail(verified.email);
    const id = await registerGithubAccount(c.env, githubId, profile.login, email, {
        acceptedAt: flow.terms_accepted_at,
        version: flow.terms_version,
    });
    if (!id) {
        const url = new URL('/login', c.env.APP_ORIGIN);
        url.searchParams.set('error', 'github_link_required');
        url.searchParams.set('next', safeReturnPath(flow.return_path, c.env.APP_ORIGIN));
        return c.redirect(url.toString(), 302);
    }
    await grantBootstrapAdmin(c.env, id);
    return githubLogin(c, id, githubId, safeReturnPath(flow.return_path, c.env.APP_ORIGIN), Boolean(flow.remember));
});

export default routes;
