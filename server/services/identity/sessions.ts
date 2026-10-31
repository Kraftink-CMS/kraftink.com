import { and, eq, gt, sql } from 'drizzle-orm';
import { database } from '../../database';
import { sessions, users } from '../../models';
import type { Env, Session, User } from '../../types';
import { now } from '../../lib/time';
import { randomToken, sha256 } from '../../security/crypto';
import { fail } from '../../http';
import type { FactorCompletion } from './two-factor';

const sessionLifetime = 7 * 86400;
const browserSessionLifetime = 12 * 3600;

export async function loadUser(env: Env, id: string): Promise<User | null> {
    const db = database(env.DB);
    const row = await db
        .select({
            id: users.id,
            email: users.email,
            username: users.username,
            locale: users.locale,
            role: users.role,
            email_verified_at: users.email_verified_at,
            banned_at: users.banned_at,
            two_factor_enabled_at: users.two_factor_enabled_at,
            has_password: sql<number>`${users.password_hash} IS NOT NULL`,
            github_linked: sql<number>`${users.github_id} IS NOT NULL`,
        })
        .from(users)
        .where(eq(users.id, id))
        .get();
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        email: row.email,
        username: row.username,
        locale: row.locale,
        role: row.role,
        emailVerified: row.email_verified_at !== null,
        banned: row.banned_at !== null,
        twoFactorEnabled: row.two_factor_enabled_at !== null,
        hasPassword: Boolean(row.has_password),
        githubLinked: Boolean(row.github_linked),
    };
}

export async function findSession(env: Env, id: string, timestamp: number) {
    return database(env.DB)
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, id), gt(sessions.expires_at, timestamp)))
        .get();
}

export async function persistSession(
    env: Env,
    userId: string,
    method: 'password' | 'github',
    previousId?: string,
    completion?: FactorCompletion,
    expectedPasswordHash?: string | null,
    remember = false,
    expectedGithubId?: string,
): Promise<{ token: string; session: Session; maxAge?: number }> {
    const token = randomToken();
    const csrfToken = randomToken();
    const id = await sha256(token);
    const lifetime = remember ? sessionLifetime : browserSessionLifetime;
    const expiresAt = now() + lifetime;
    const statements = [
        env.DB.prepare(
            `INSERT INTO sessions (id, user_id, csrf_token, auth_method, created_at, expires_at, remember, two_factor_revision)
            SELECT ?, id, ?, ?, ?, ?, ?, CASE WHEN two_factor_enabled_at IS NOT NULL THEN two_factor_revision END FROM users WHERE id = ? AND banned_at IS NULL
            AND (? IS NULL OR password_hash = ?) AND ((two_factor_enabled_at IS NULL AND ? IS NULL)
            OR (two_factor_enabled_at IS NOT NULL AND two_factor_revision = ?
                AND EXISTS (SELECT 1 FROM authentication_challenges c WHERE c.token_hash = ? AND c.user_id = users.id
                    AND c.completion_id = ? AND c.consumed_at IS NOT NULL AND c.expires_at > ?
                    AND c.revision = users.two_factor_revision AND c.auth_method = ? AND c.remember = ?)))
            AND (? <> 'github' OR github_id = ?) RETURNING id`,
        ).bind(
            id,
            csrfToken,
            method,
            now(),
            expiresAt,
            remember ? 1 : 0,
            userId,
            expectedPasswordHash ?? null,
            expectedPasswordHash ?? null,
            completion?.revision ?? null,
            completion?.revision ?? null,
            completion?.tokenHash ?? null,
            completion?.completionId ?? null,
            now(),
            method,
            remember ? 1 : 0,
            method,
            expectedGithubId ?? completion?.githubId ?? null,
        ),
    ];
    if (previousId) {
        statements.push(
            env.DB.prepare(
                'DELETE FROM sensitive_actions WHERE session_id = ? AND EXISTS (SELECT 1 FROM sessions WHERE id = ?)',
            ).bind(previousId, id),
            env.DB.prepare('DELETE FROM sessions WHERE id = ? AND EXISTS (SELECT 1 FROM sessions WHERE id = ?)').bind(
                previousId,
                id,
            ),
        );
    }
    const created = await env.DB.batch(statements);
    if (created[0].results.length === 0) {
        fail(401, 'authentication_required');
    }
    return {
        token,
        session: { id, userId, csrfToken, expiresAt, remember },
        ...(remember ? { maxAge: lifetime } : {}),
    };
}

export async function revokeSession(binding: D1Database, token: string): Promise<void> {
    const id = await sha256(token);
    await binding.batch([
        binding.prepare('DELETE FROM sensitive_actions WHERE session_id = ?').bind(id),
        binding.prepare('DELETE FROM sessions WHERE id = ?').bind(id),
    ]);
}

export async function rotateSession(env: Env, userId: string, previousId: string, revision: string | null) {
    const token = randomToken();
    const csrfToken = randomToken();
    const id = await sha256(token);
    const result = await env.DB.batch([
        env.DB.prepare(
            `INSERT INTO sessions (id, user_id, csrf_token, auth_method, created_at, expires_at, remember, two_factor_revision)
            SELECT ?, u.id, ?, s.auth_method, ?, CASE WHEN s.remember = 1 THEN s.expires_at ELSE MIN(s.expires_at, ?) END,
                s.remember, CASE WHEN u.two_factor_enabled_at IS NOT NULL THEN u.two_factor_revision END FROM users u JOIN sessions s ON s.user_id = u.id
            WHERE u.id = ? AND s.id = ? AND s.expires_at > ? AND u.banned_at IS NULL AND u.two_factor_revision IS ?
            AND (u.two_factor_enabled_at IS NULL OR s.two_factor_revision = u.two_factor_revision) RETURNING id, expires_at, remember`,
        ).bind(id, csrfToken, now(), now() + browserSessionLifetime, userId, previousId, now(), revision),
        env.DB.prepare(
            'DELETE FROM sensitive_actions WHERE session_id = ? AND EXISTS (SELECT 1 FROM sessions WHERE id = ?)',
        ).bind(previousId, id),
        env.DB.prepare('DELETE FROM sessions WHERE id = ? AND EXISTS (SELECT 1 FROM sessions WHERE id = ?)').bind(
            previousId,
            id,
        ),
    ]);
    if (result[0].results.length === 0) {
        fail(401, 'authentication_required');
    }
    const created = result[0].results[0] as { expires_at: number; remember: number };
    const remember = created.remember === 1;
    return {
        token,
        session: { id, userId, csrfToken, expiresAt: created.expires_at, remember },
        ...(remember ? { maxAge: Math.max(0, created.expires_at - now()) } : {}),
    };
}
