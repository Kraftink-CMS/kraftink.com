import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import type { Role, User } from '../types';
import { hasRole } from '../../shared/auth';
import type { AppContext } from '../http';
import { fail, requestIp } from '../http';
import { now } from '../lib/time';
import { randomToken, sha256 } from './crypto';
import { database } from '../database';
import { sensitiveActions } from '../models';
import { recordAudit } from './audit';
import { prepareSensitiveTwoFactorVerification } from '../services/identity/two-factor';

export const sensitivePurposes = new Set([
    'account.site-key',
    'account.security',
    'account.github-link',
    'account.two-factor',
    'account.delete',
    'account.password',
    'account.github-unlink',
    'admin.users',
    'admin.roles',
    'creator.payments',
    'moderation.review',
    'admin.resource-revoke',
    'admin.announcements',
]);

export function requireUser(c: AppContext): User {
    const user = c.get('user');
    if (!user || user.banned) {
        fail(401, 'authentication_required');
    }
    return user;
}

export function requireVerifiedUser(c: AppContext): User {
    const user = requireUser(c);
    if (!user.emailVerified) {
        fail(403, 'email_verification_required');
    }
    return user;
}

export function requireRole(c: AppContext, required: Role): User {
    const user = requireVerifiedUser(c);
    if (!hasRole(user, required)) {
        fail(403, 'permission_denied');
    }
    return user;
}

export async function requireSensitive(c: AppContext, purpose = 'account.security'): Promise<void> {
    const user = [
        'account.security',
        'account.two-factor',
        'account.delete',
        'account.password',
        'account.github-unlink',
    ].includes(purpose)
        ? requireUser(c)
        : requireVerifiedUser(c);
    const session = c.get('session');
    const token = c.req.header('X-Sensitive-Token') ?? '';
    if (!session || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
        fail(403, 'reauthentication_required');
    }
    const result = await database(c.env.DB)
        .update(sensitiveActions)
        .set({ consumed_at: now() })
        .where(
            and(
                eq(sensitiveActions.token_hash, await sha256(token)),
                eq(sensitiveActions.user_id, user.id),
                eq(sensitiveActions.session_id, session.id),
                eq(sensitiveActions.purpose, purpose),
                isNull(sensitiveActions.consumed_at),
                gt(sensitiveActions.expires_at, now()),
                sql`EXISTS (SELECT 1 FROM users u WHERE u.id = ${sensitiveActions.user_id}
                    AND u.banned_at IS NULL
                    AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = ${sensitiveActions.session_id}
                        AND s.user_id = u.id AND s.expires_at > ${now()}
                        AND (u.two_factor_enabled_at IS NULL OR s.two_factor_revision = u.two_factor_revision))
                    AND ((u.two_factor_enabled_at IS NOT NULL AND ${sensitiveActions.auth_method} = 'two-factor'
                        AND u.two_factor_revision = ${sensitiveActions.two_factor_revision})
                    OR (u.two_factor_enabled_at IS NULL AND ${sensitiveActions.two_factor_revision} IS NULL
                        AND ((u.password_hash IS NOT NULL AND ${sensitiveActions.auth_method} = 'password')
                            OR (u.password_hash IS NULL AND u.github_id IS NOT NULL
                                AND ${sensitiveActions.purpose} <> 'admin.roles'
                                AND ${sensitiveActions.auth_method} = 'github')))))`,
            ),
        )
        .returning({ token_hash: sensitiveActions.token_hash })
        .get();
    if (!result) {
        fail(403, 'reauthentication_required');
    }
}

export async function issueSensitiveToken(
    c: AppContext,
    purpose: string,
    credential:
        | { method: 'password'; passwordHash: string }
        | { method: 'github'; githubId: string }
        | { method: 'two-factor'; code: string },
): Promise<{ sensitiveToken: string; purpose: string; expiresAt: number }> {
    const user = [
        'account.security',
        'account.two-factor',
        'account.delete',
        'account.password',
        'account.github-unlink',
    ].includes(purpose)
        ? requireUser(c)
        : requireVerifiedUser(c);
    const session = c.get('session');
    if (!session || !sensitivePurposes.has(purpose)) {
        fail(422, 'invalid_purpose');
    }
    const token = randomToken();
    const expiry = now() + 300;
    const factor =
        credential.method === 'two-factor'
            ? await prepareSensitiveTwoFactorVerification(c.env, user.id, session.id, credential.code)
            : null;
    const statement = c.env.DB.prepare(
        `INSERT INTO sensitive_actions (token_hash, user_id, session_id, purpose, expires_at, auth_method, two_factor_revision)
        SELECT ?, id, ?, ?, ?, ?, CASE WHEN two_factor_enabled_at IS NOT NULL THEN two_factor_revision END FROM users WHERE id = ? AND banned_at IS NULL
        AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = ? AND s.user_id = users.id AND s.expires_at > ?
            AND (users.two_factor_enabled_at IS NULL OR s.two_factor_revision = users.two_factor_revision))
        AND ((two_factor_enabled_at IS NOT NULL AND ? = 'two-factor'
                AND two_factor_revision = ? AND two_factor_last_verification = ?)
            OR (two_factor_enabled_at IS NULL AND ((? = 'password' AND password_hash = ?)
                OR (? = 'github' AND password_hash IS NULL AND github_id = ? AND ? <> 'admin.roles'))))
        RETURNING token_hash`,
    ).bind(
        await sha256(token),
        session.id,
        purpose,
        expiry,
        credential.method,
        user.id,
        session.id,
        now(),
        credential.method,
        factor?.revision ?? null,
        factor?.marker ?? null,
        credential.method,
        credential.method === 'password' ? credential.passwordHash : null,
        credential.method,
        credential.method === 'github' ? credential.githubId : null,
        purpose,
    );
    const result = await c.env.DB.batch([...(factor?.statements ?? []), statement]);
    if (result.at(-1)!.results.length === 0) {
        fail(403, 'reauthentication_required');
    }
    return { sensitiveToken: token, purpose, expiresAt: expiry };
}

export async function audit(
    c: AppContext,
    action: string,
    target: string,
    details: Record<string, unknown> = {},
): Promise<void> {
    await recordAudit(c.env, { userId: c.get('user')?.id ?? null, ip: requestIp(c) }, action, target, details);
}
