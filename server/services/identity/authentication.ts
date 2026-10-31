import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import type { OAuthProvider } from '../../../shared/auth';
import type { Env } from '../../types';
import { database } from '../../database';
import {
    emailChanges,
    emailVerifications,
    oauthStates,
    passwordResets,
    users,
    type UserRow,
    type OAuthStateRow,
} from '../../models';
import { fail, textField } from '../../http';
import { now } from '../../lib/time';
import { constantTimeEqual, fromBase64Url, randomToken, sha256, toBase64Url } from '../../security/crypto';

const passwordIterations = 600000;
export const currentTermsVersion = '2026-10-30';

export function requireTermsAccepted(value: unknown): void {
    if (value !== true) {
        fail(422, 'terms_acceptance_required');
    }
}

export function rememberPreference(value: unknown): boolean {
    if (value !== undefined && typeof value !== 'boolean') {
        fail(422, 'invalid_input');
    }
    return value === true;
}

export type AuthRow = Pick<UserRow, 'id' | 'email' | 'username' | 'password_hash' | 'github_id' | 'banned_at'>;

export function availableOAuthProviders(env: Env): OAuthProvider[] {
    return env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? [{ id: 'github', name: 'GitHub' }] : [];
}

export function normalizeEmail(input: unknown): string {
    const email = textField(input, 3, 254).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fail(422, 'email_invalid');
    }
    return email;
}

export function validateUsername(input: unknown): string {
    const username = textField(typeof input === 'string' ? input.trim() : input, 3, 30);
    if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]{2,29}$/.test(username)) {
        fail(422, 'username_invalid');
    }
    return username;
}

export function safeReturnPath(value: unknown, origin: string): string {
    if (
        typeof value !== 'string' ||
        !value.startsWith('/') ||
        value.startsWith('//') ||
        value.length > 2048 ||
        /[\\\u0000-\u0020\u007f]/.test(value)
    ) {
        return '/account';
    }
    try {
        const url = new URL(value, origin);
        if (
            url.origin !== new URL(origin).origin ||
            url.pathname.startsWith('/api/') ||
            /\/(?:login|register|forgot-password|reset-password|verify-email)$/.test(url.pathname)
        ) {
            return '/account';
        }
        return url.pathname + url.search + url.hash;
    } catch {
        return '/account';
    }
}

export function passwordField(input: unknown): string {
    const value = textField(input, 12, 128);
    if (new TextEncoder().encode(value).length > 512) {
        fail(422, 'password_invalid');
    }
    return value;
}

export async function hashPassword(
    password: string,
    salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16)),
): Promise<string> {
    const encodedPassword = new TextEncoder().encode(password);
    let digest: Uint8Array;
    try {
        const key = await crypto.subtle.importKey('raw', encodedPassword, 'PBKDF2', false, ['deriveBits']);
        digest = new Uint8Array(
            await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    hash: 'SHA-256',
                    salt: new Uint8Array(salt),
                    iterations: passwordIterations,
                },
                key,
                256,
            ),
        );
    } catch {
        digest = pbkdf2(nobleSha256, encodedPassword, salt, { c: passwordIterations, dkLen: 32 });
    }
    return `$pbkdf2-sha256$${passwordIterations}$${toBase64Url(salt)}$${toBase64Url(digest)}`;
}

export async function verifyPassword(password: string, encoded: string | null): Promise<boolean> {
    const parts = encoded?.split('$');
    if (
        !parts ||
        parts.length !== 5 ||
        parts[1] !== 'pbkdf2-sha256' ||
        parts[2] !== String(passwordIterations) ||
        !/^[A-Za-z0-9_-]{22}$/.test(parts[3]) ||
        !/^[A-Za-z0-9_-]{43}$/.test(parts[4])
    ) {
        await hashPassword(password, new Uint8Array(16));
        return false;
    }
    const result = await hashPassword(password, fromBase64Url(parts[3]));
    return constantTimeEqual(result, encoded ?? '');
}

export async function grantBootstrapAdmin(env: Env, userId: string): Promise<void> {
    const bootstrap = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    if (!bootstrap) {
        return;
    }
    await env.DB.prepare(
        `UPDATE users SET role = 'admin'
         WHERE id = ? AND email = ? COLLATE NOCASE AND email_verified_at IS NOT NULL AND banned_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')`,
    )
        .bind(userId, bootstrap)
        .run();
}

export async function issueVerification(env: Env, userId: string, email: string): Promise<string | null> {
    const token = randomToken();
    const issued = await env.DB.batch([
        env.DB.prepare(
            'DELETE FROM email_verifications WHERE user_id = ? AND consumed_at IS NULL AND EXISTS (SELECT 1 FROM users WHERE id = ? AND email = ? COLLATE NOCASE AND banned_at IS NULL)',
        ).bind(userId, userId, email),
        env.DB.prepare(
            `INSERT INTO email_verifications (token_hash, user_id, expires_at, created_at)
             SELECT ?, id, ?, ? FROM users WHERE id = ? AND email = ? COLLATE NOCASE AND banned_at IS NULL RETURNING user_id`,
        ).bind(await sha256(token), now() + 86400, now(), userId, email),
    ]);
    return issued[1].results.length > 0 ? token : null;
}

export function browserCookieName(origin: string): string {
    return new URL(origin).protocol === 'https:' ? '__Host-kraftink_oauth' : 'kraftink_oauth';
}

export async function githubFetch<T>(url: string, accessToken: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'KraftInk',
            'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
        fail(503, 'github_unavailable');
    }
    return response.json<T>();
}

export async function registerAccount(
    env: Env,
    email: string,
    username: string,
    password: string,
    termsAccepted: unknown,
): Promise<string | null> {
    requireTermsAccepted(termsAccepted);
    const digest = await hashPassword(password);
    const id = crypto.randomUUID();
    const created = await env.DB.prepare(
        'INSERT OR IGNORE INTO users (id, email, username, password_hash, created_at, updated_at, terms_accepted_at, terms_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
    )
        .bind(id, email, username, digest, now(), now(), now(), currentTermsVersion)
        .first();
    return created ? id : null;
}

export async function findAccount(binding: D1Database, identifier: string): Promise<AuthRow | undefined> {
    return database(binding)
        .select({
            id: users.id,
            email: users.email,
            username: users.username,
            password_hash: users.password_hash,
            github_id: users.github_id,
            banned_at: users.banned_at,
        })
        .from(users)
        .where(eq(identifier.includes('@') ? users.email : users.username, identifier))
        .get();
}

export async function findGithubAccount(binding: D1Database, githubId: string) {
    return database(binding)
        .select({ id: users.id, banned_at: users.banned_at, two_factor_enabled_at: users.two_factor_enabled_at })
        .from(users)
        .where(eq(users.github_id, githubId))
        .get();
}

export async function passwordHash(binding: D1Database, userId: string): Promise<string | null> {
    const row = await database(binding)
        .select({ password_hash: users.password_hash })
        .from(users)
        .where(eq(users.id, userId))
        .get();
    return row?.password_hash ?? null;
}

export async function issuePasswordReset(env: Env, email: string): Promise<string | null> {
    const row = await database(env.DB)
        .select({ id: users.id, banned_at: users.banned_at })
        .from(users)
        .where(eq(users.email, email))
        .get();
    if (row && row.banned_at === null) {
        const token = randomToken();
        const issued = await env.DB.batch([
            env.DB.prepare(
                'DELETE FROM password_resets WHERE user_id = ? AND consumed_at IS NULL AND EXISTS (SELECT 1 FROM users WHERE id = ? AND email = ? COLLATE NOCASE AND banned_at IS NULL)',
            ).bind(row.id, row.id, email),
            env.DB.prepare(
                `INSERT INTO password_resets (token_hash, user_id, expires_at, created_at)
                 SELECT ?, id, ?, ? FROM users WHERE id = ? AND email = ? COLLATE NOCASE AND banned_at IS NULL RETURNING user_id`,
            ).bind(await sha256(token), now() + 1800, now(), row.id, email),
        ]);
        if (issued[1].results.length > 0) {
            return token;
        }
    }
    return null;
}

export async function resetPassword(binding: D1Database, token: string, password: string): Promise<string> {
    const tokenHash = await sha256(token);
    const row = await database(binding)
        .select({ user_id: passwordResets.user_id })
        .from(passwordResets)
        .innerJoin(users, eq(users.id, passwordResets.user_id))
        .where(
            and(
                eq(passwordResets.token_hash, tokenHash),
                isNull(passwordResets.consumed_at),
                gt(passwordResets.expires_at, now()),
                isNull(users.banned_at),
            ),
        )
        .get();
    if (!row) {
        fail(400, 'reset_token_invalid');
    }
    const digest = await hashPassword(password);
    const timestamp = now();
    const changed = await binding.batch([
        binding
            .prepare(
                `UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
             WHERE id = ? AND banned_at IS NULL AND EXISTS (SELECT 1 FROM password_resets p WHERE p.token_hash = ?
                 AND p.user_id = users.id AND p.consumed_at IS NULL AND p.expires_at > ?) RETURNING id`,
            )
            .bind(digest, timestamp, timestamp, row.user_id, tokenHash, timestamp),
        binding
            .prepare(
                'DELETE FROM sensitive_actions WHERE user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND password_hash = ?)',
            )
            .bind(row.user_id, row.user_id, digest),
        binding
            .prepare(
                'DELETE FROM authentication_challenges WHERE user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND password_hash = ?)',
            )
            .bind(row.user_id, row.user_id, digest),
        binding
            .prepare(
                'DELETE FROM sessions WHERE user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND password_hash = ?)',
            )
            .bind(row.user_id, row.user_id, digest),
        binding
            .prepare(
                'UPDATE password_resets SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL AND EXISTS (SELECT 1 FROM users WHERE id = ? AND password_hash = ?)',
            )
            .bind(timestamp, row.user_id, row.user_id, digest),
    ]);
    if (changed[0].results.length === 0) {
        fail(400, 'reset_token_invalid');
    }
    return row.user_id;
}

export async function confirmEmailChange(binding: D1Database, token: string) {
    const timestamp = now();
    const tokenHash = await sha256(token);
    const pending = await database(binding)
        .select({ previous_email: emailChanges.previous_email })
        .from(emailChanges)
        .where(
            and(
                eq(emailChanges.token_hash, tokenHash),
                isNull(emailChanges.consumed_at),
                gt(emailChanges.expires_at, timestamp),
            ),
        )
        .get();
    if (!pending) {
        fail(400, 'verification_token_invalid');
    }
    const confirmed = `SELECT e.user_id FROM email_changes e JOIN users u ON u.id = e.user_id
        WHERE e.token_hash = ? AND e.consumed_at IS NULL AND e.expires_at > ?
        AND u.email = e.new_email COLLATE NOCASE AND u.email_changed_at = ? AND u.banned_at IS NULL`;
    const statements = [
        binding
            .prepare(
                `UPDATE users SET email = (SELECT new_email FROM email_changes WHERE token_hash = ?),
             email_verified_at = ?, email_changed_at = ?, updated_at = ?
             WHERE banned_at IS NULL AND (email_changed_at IS NULL OR email_changed_at <= ?)
             AND EXISTS (SELECT 1 FROM email_changes e WHERE e.token_hash = ? AND e.user_id = users.id
                 AND e.consumed_at IS NULL AND e.expires_at > ? AND users.email = e.previous_email COLLATE NOCASE
                 AND NOT EXISTS (SELECT 1 FROM users other WHERE other.email = e.new_email COLLATE NOCASE AND other.id <> users.id))
             RETURNING id, email`,
            )
            .bind(tokenHash, timestamp, timestamp, timestamp, timestamp - 7 * 86400, tokenHash, timestamp),
        ...[
            'password_resets',
            'email_verifications',
            'oauth_states',
            'authentication_challenges',
            'sensitive_actions',
            'sessions',
        ].map((table) =>
            binding
                .prepare(`DELETE FROM ${table} WHERE user_id IN (${confirmed})`)
                .bind(tokenHash, timestamp, timestamp),
        ),
        binding
            .prepare(
                `UPDATE email_changes SET consumed_at = ? WHERE token_hash = ? AND consumed_at IS NULL AND user_id IN (${confirmed})`,
            )
            .bind(timestamp, tokenHash, tokenHash, timestamp, timestamp),
    ];
    const result = await binding.batch(statements);
    const changed = result[0].results[0] as { id: string; email: string } | undefined;
    if (!changed) {
        fail(400, 'verification_token_invalid');
    }
    return { ...changed, previousEmail: pending.previous_email };
}

export async function verifyAccountEmail(binding: D1Database, token: string): Promise<string> {
    const row = await database(binding)
        .update(emailVerifications)
        .set({ consumed_at: now() })
        .where(
            and(
                eq(emailVerifications.token_hash, await sha256(token)),
                isNull(emailVerifications.consumed_at),
                gt(emailVerifications.expires_at, now()),
            ),
        )
        .returning({ user_id: emailVerifications.user_id })
        .get();
    if (!row) {
        fail(400, 'verification_token_invalid');
    }
    await database(binding)
        .update(users)
        .set({ email_verified_at: now(), updated_at: now() })
        .where(eq(users.id, row.user_id));
    return row.user_id;
}

export async function beginGithubFlow(
    binding: D1Database,
    state: string,
    browser: string,
    verifier: string,
    purpose: OAuthStateRow['purpose'],
    actionPurpose: string,
    returnPath: string,
    userId: string | null,
    sessionId: string | null,
    options: { remember?: boolean; termsAcceptedAt?: number | null; termsVersion?: string | null } = {},
): Promise<void> {
    await database(binding)
        .insert(oauthStates)
        .values({
            state_hash: await sha256(state),
            browser_hash: await sha256(browser),
            code_verifier: verifier,
            purpose,
            action_purpose: purpose === 'reauthenticate' ? actionPurpose : null,
            return_path: returnPath,
            user_id: userId,
            session_id: sessionId,
            expires_at: now() + 600,
            remember: options.remember ? 1 : 0,
            terms_accepted_at: options.termsAcceptedAt ?? null,
            terms_version: options.termsVersion ?? null,
        });
}

export async function consumeGithubFlow(binding: D1Database, state: string, browser: string) {
    return database(binding)
        .update(oauthStates)
        .set({ consumed_at: now() })
        .where(
            and(
                eq(oauthStates.state_hash, await sha256(state)),
                eq(oauthStates.browser_hash, await sha256(browser)),
                isNull(oauthStates.consumed_at),
                gt(oauthStates.expires_at, now()),
            ),
        )
        .returning()
        .get();
}

export async function linkGithubAccount(
    binding: D1Database,
    githubId: string,
    userId: string,
    sessionId: string,
): Promise<void> {
    const changed = await database(binding)
        .update(users)
        .set({ github_id: githubId, updated_at: now() })
        .where(
            and(
                eq(users.id, userId),
                isNull(users.banned_at),
                isNull(users.github_id),
                sql`EXISTS (SELECT 1 FROM sessions s WHERE s.id = ${sessionId} AND s.user_id = ${users.id}
                AND s.expires_at > ${now()} AND (${users.two_factor_enabled_at} IS NULL OR s.two_factor_revision = ${users.two_factor_revision}))`,
            ),
        )
        .returning({ id: users.id })
        .get();
    if (!changed) {
        fail(401, 'authentication_required');
    }
}

export async function registerGithubAccount(
    env: Env,
    githubId: string,
    githubLogin: string,
    email: string,
    termsAcceptance: { acceptedAt: number; version: string },
): Promise<string | null> {
    if (
        termsAcceptance.version !== currentTermsVersion ||
        !Number.isSafeInteger(termsAcceptance.acceptedAt) ||
        termsAcceptance.acceptedAt <= 0
    ) {
        fail(422, 'terms_acceptance_required');
    }
    const emailOwner = await database(env.DB).select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (emailOwner) {
        return null;
    }
    const base = String(githubLogin || `github_${githubId}`)
        .replace(/[^A-Za-z0-9_.-]/g, '_')
        .replace(/^[^A-Za-z0-9_]/, '_');
    const usernameBase = validateUsername((base.length < 3 ? `gh_${base}` : base).slice(0, 30));
    let id: string | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidateId = crypto.randomUUID();
        const username =
            attempt === 0 ? usernameBase : `${usernameBase.slice(0, 21)}_${crypto.randomUUID().slice(0, 8)}`;
        const created = await env.DB.prepare(
            'INSERT OR IGNORE INTO users (id, email, username, github_id, email_verified_at, created_at, updated_at, terms_accepted_at, terms_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
        )
            .bind(
                candidateId,
                email,
                username,
                githubId,
                now(),
                now(),
                now(),
                termsAcceptance.acceptedAt,
                termsAcceptance.version,
            )
            .first();
        if (created) {
            id = candidateId;
            break;
        }
        const identityOwner = await findGithubAccount(env.DB, githubId);
        if (identityOwner) {
            if (identityOwner.banned_at !== null) {
                fail(401, 'credentials_invalid');
            }
            id = identityOwner.id;
            break;
        }
        const addressOwner = await database(env.DB)
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .get();
        if (addressOwner) {
            return null;
        }
    }
    if (!id) {
        fail(409, 'oauth_identity_conflict');
    }
    return id;
}
