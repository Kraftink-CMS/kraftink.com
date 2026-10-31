import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { generateSecret, generateURI, verify } from 'otplib';
import { crypto as otpCrypto } from '@otplib/plugin-crypto-web';
import { database } from '../../database';
import { authenticationChallenges, recoveryCodes, users, type AuthenticationChallengeRow } from '../../models';
import { fail } from '../../http';
import { now } from '../../lib/time';
import { fromBase64Url, randomToken, sha256, toBase64Url } from '../../security/crypto';
import type { Env, User } from '../../types';

export interface FactorCompletion {
    tokenHash: string;
    completionId: string;
    revision: string;
    githubId?: string;
}

async function encryptionKey(env: Env): Promise<CryptoKey> {
    const encoded = env.TWO_FACTOR_ENCRYPTION_KEY;
    if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) {
        fail(503, 'two_factor_unavailable');
    }
    return crypto.subtle.importKey('raw', new Uint8Array(fromBase64Url(encoded)), 'AES-GCM', false, [
        'encrypt',
        'decrypt',
    ]);
}

async function encryptSecret(env: Env, secret: string, userId: string, revision: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const additionalData = new TextEncoder().encode(`kraftink:two-factor:${userId}:${revision}`);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData },
        await encryptionKey(env),
        new TextEncoder().encode(secret),
    );
    return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
}

async function decryptSecret(env: Env, encrypted: string, userId: string, revision: string): Promise<string> {
    const key = await encryptionKey(env);
    const parts = encrypted.split('.');
    if (parts.length !== 3 || parts[0] !== 'v1') {
        fail(503, 'two_factor_unavailable');
    }
    try {
        const secret = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(fromBase64Url(parts[1])),
                additionalData: new TextEncoder().encode(`kraftink:two-factor:${userId}:${revision}`),
            },
            key,
            new Uint8Array(fromBase64Url(parts[2])),
        );
        return new TextDecoder().decode(secret);
    } catch {
        fail(503, 'two_factor_unavailable');
    }
}

async function matchedStep(env: Env, row: typeof users.$inferSelect, code: string): Promise<number> {
    if (!/^\d{6}$/.test(code) || !row.two_factor_secret || !row.two_factor_revision) {
        fail(401, 'two_factor_code_invalid');
    }
    const secret = await decryptSecret(env, row.two_factor_secret, row.id, row.two_factor_revision);
    const result = await verify({
        secret,
        token: code,
        crypto: otpCrypto,
        algorithm: 'sha1',
        digits: 6,
        period: 30,
        epoch: now(),
        epochTolerance: 30,
        ...(row.two_factor_last_step >= 0 ? { afterTimeStep: row.two_factor_last_step } : {}),
    });
    if (!result.valid || !('timeStep' in result) || typeof result.timeStep !== 'number') {
        fail(401, 'two_factor_code_invalid');
    }
    return result.timeStep;
}

async function newRecoveryCodes(userId: string, revision: string) {
    const codes = Array.from({ length: 10 }, () => {
        const raw = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
            byte.toString(16).padStart(2, '0'),
        ).join('');
        return raw.match(/.{8}/g)!.join('-');
    });
    const hashes = await Promise.all(codes.map((code) => recoveryHash(userId, revision, code)));
    return { codes, hashes };
}

async function recoveryHash(userId: string, revision: string, code: string) {
    return sha256(`${userId}:${revision}:${code.replace(/[\s-]/g, '').toLowerCase()}`);
}

export async function prepareSensitiveTwoFactorVerification(env: Env, userId: string, sessionId: string, code: string) {
    const row = await database(env.DB).select().from(users).where(eq(users.id, userId)).get();
    if (!row || row.banned_at !== null || row.two_factor_enabled_at === null || !row.two_factor_revision) {
        fail(403, 'reauthentication_required');
    }
    const revision = row.two_factor_revision;
    const marker = crypto.randomUUID();
    const gate = `EXISTS (SELECT 1 FROM sessions s WHERE s.id = ? AND s.user_id = users.id
        AND s.expires_at > ? AND s.two_factor_revision = users.two_factor_revision)`;
    const statements: D1PreparedStatement[] = [];
    if (/^\d{6}$/.test(code)) {
        const step = await matchedStep(env, row, code);
        statements.push(
            env.DB.prepare(
                `UPDATE users SET two_factor_last_step = ?, two_factor_last_verification = ?
                WHERE id = ? AND two_factor_revision = ? AND two_factor_enabled_at IS NOT NULL
                AND banned_at IS NULL AND two_factor_last_step < ? AND ${gate}`,
            ).bind(step, marker, userId, revision, step, sessionId, now()),
        );
    } else {
        if (!/^[a-fA-F0-9\s-]{32,40}$/.test(code) || code.replace(/[\s-]/g, '').length !== 32) {
            fail(401, 'two_factor_code_invalid');
        }
        statements.push(
            env.DB.prepare(
                `UPDATE recovery_codes SET consumed_at = ?, consumption_id = ?
                WHERE code_hash = ? AND user_id = ? AND revision = ? AND consumed_at IS NULL
                AND EXISTS (SELECT 1 FROM users WHERE id = recovery_codes.user_id AND banned_at IS NULL
                    AND two_factor_enabled_at IS NOT NULL AND two_factor_revision = ? AND ${gate})`,
            ).bind(
                now(),
                marker,
                await recoveryHash(userId, revision, code),
                userId,
                revision,
                revision,
                sessionId,
                now(),
            ),
            env.DB.prepare(
                `UPDATE users SET two_factor_last_verification = ? WHERE id = ? AND two_factor_revision = ?
                AND EXISTS (SELECT 1 FROM recovery_codes r WHERE r.user_id = users.id AND r.consumption_id = ?)`,
            ).bind(marker, userId, revision, marker),
        );
    }
    return { statements, revision, marker };
}

export async function twoFactorState(env: Env, userId: string) {
    const row = await database(env.DB)
        .select({ enabled_at: users.two_factor_enabled_at, revision: users.two_factor_revision })
        .from(users)
        .where(eq(users.id, userId))
        .get();
    const remaining =
        row?.enabled_at !== null && row?.revision
            ? await database(env.DB)
                  .select({ count: count() })
                  .from(recoveryCodes)
                  .where(
                      and(
                          eq(recoveryCodes.user_id, userId),
                          eq(recoveryCodes.revision, row.revision),
                          isNull(recoveryCodes.consumed_at),
                      ),
                  )
                  .get()
            : null;
    return { enabled: Boolean(row?.enabled_at), recoveryCodesRemaining: remaining?.count ?? 0 };
}

export async function setupTwoFactor(env: Env, user: User, sessionId: string) {
    const secret = generateSecret({ crypto: otpCrypto, length: 20 });
    const revision = crypto.randomUUID();
    const expiresAt = now() + 600;
    const encrypted = await encryptSecret(env, secret, user.id, revision);
    const changed = await database(env.DB)
        .update(users)
        .set({
            two_factor_secret: encrypted,
            two_factor_revision: revision,
            two_factor_pending_session_id: sessionId,
            two_factor_pending_expires_at: expiresAt,
            two_factor_last_step: -1,
        })
        .where(
            and(
                eq(users.id, user.id),
                isNull(users.two_factor_enabled_at),
                isNull(users.banned_at),
                sql`EXISTS (SELECT 1 FROM sessions s WHERE s.id = ${sessionId} AND s.user_id = ${users.id} AND s.expires_at > ${now()})`,
            ),
        )
        .returning({ id: users.id })
        .get();
    if (!changed) {
        if (user.twoFactorEnabled) {
            fail(409, 'two_factor_already_enabled');
        }
        fail(401, 'authentication_required');
    }
    return {
        secret,
        uri: generateURI({ issuer: 'KraftInk', label: user.email, secret, algorithm: 'sha1', digits: 6, period: 30 }),
        expiresAt,
    };
}

export async function confirmTwoFactor(env: Env, userId: string, sessionId: string, code: string) {
    const row = await database(env.DB).select().from(users).where(eq(users.id, userId)).get();
    if (
        !row ||
        row.two_factor_enabled_at !== null ||
        row.two_factor_pending_session_id !== sessionId ||
        (row.two_factor_pending_expires_at ?? 0) <= now() ||
        !row.two_factor_revision
    ) {
        fail(409, 'two_factor_setup_expired');
    }
    const step = await matchedStep(env, row, code);
    const marker = crypto.randomUUID();
    const recovery = await newRecoveryCodes(userId, row.two_factor_revision);
    const active =
        'EXISTS (SELECT 1 FROM users WHERE id = ? AND two_factor_last_verification = ? AND two_factor_enabled_at IS NOT NULL)';
    const result = await env.DB.batch([
        env.DB.prepare(
            `UPDATE users SET two_factor_enabled_at = ?, two_factor_last_step = ?, two_factor_last_verification = ?,
            two_factor_pending_session_id = NULL, two_factor_pending_expires_at = NULL
            WHERE id = ? AND two_factor_enabled_at IS NULL AND banned_at IS NULL AND two_factor_revision = ?
            AND two_factor_pending_session_id = ? AND two_factor_pending_expires_at > ?
            AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = ? AND s.user_id = users.id AND s.expires_at > ?) RETURNING id`,
        ).bind(now(), step, marker, userId, row.two_factor_revision, sessionId, now(), sessionId, now()),
        env.DB.prepare(`DELETE FROM sensitive_actions WHERE user_id = ? AND ${active}`).bind(userId, userId, marker),
        env.DB.prepare(`DELETE FROM sessions WHERE user_id = ? AND id <> ? AND ${active}`).bind(
            userId,
            sessionId,
            userId,
            marker,
        ),
        env.DB.prepare(`UPDATE sessions SET two_factor_revision = ? WHERE id = ? AND ${active}`).bind(
            row.two_factor_revision,
            sessionId,
            userId,
            marker,
        ),
        env.DB.prepare(`DELETE FROM oauth_states WHERE user_id = ? AND ${active}`).bind(userId, userId, marker),
        env.DB.prepare(`DELETE FROM authentication_challenges WHERE user_id = ? AND ${active}`).bind(
            userId,
            userId,
            marker,
        ),
        env.DB.prepare(`DELETE FROM recovery_codes WHERE user_id = ? AND ${active}`).bind(userId, userId, marker),
        ...recovery.hashes.map((hash) =>
            env.DB.prepare(
                `INSERT INTO recovery_codes (code_hash, user_id, revision, created_at) SELECT ?, id, two_factor_revision, ? FROM users WHERE id = ? AND two_factor_last_verification = ?`,
            ).bind(hash, now(), userId, marker),
        ),
    ]);
    if (result[0].results.length === 0) {
        fail(409, 'two_factor_setup_expired');
    }
    return { recoveryCodes: recovery.codes, revision: row.two_factor_revision };
}

export async function changeTwoFactor(env: Env, userId: string, sessionId: string, disable: boolean) {
    const row = await database(env.DB)
        .select({ revision: users.two_factor_revision, enabled_at: users.two_factor_enabled_at })
        .from(users)
        .where(eq(users.id, userId))
        .get();
    if (!row?.revision || row.enabled_at === null) {
        fail(409, 'two_factor_not_enabled');
    }
    const marker = crypto.randomUUID();
    const recovery = disable ? null : await newRecoveryCodes(userId, row.revision);
    const active = 'EXISTS (SELECT 1 FROM users WHERE id = ? AND two_factor_last_verification = ?)';
    const result = await env.DB.batch([
        env.DB.prepare(
            disable
                ? `UPDATE users SET two_factor_secret = NULL, two_factor_enabled_at = NULL, two_factor_revision = NULL,
                two_factor_last_step = -1, two_factor_last_verification = ?, two_factor_pending_session_id = NULL, two_factor_pending_expires_at = NULL
                WHERE id = ? AND two_factor_revision = ? AND two_factor_enabled_at IS NOT NULL AND banned_at IS NULL
                AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = ? AND s.user_id = users.id AND s.expires_at > ? AND s.two_factor_revision = users.two_factor_revision) RETURNING id`
                : `UPDATE users SET two_factor_last_verification = ? WHERE id = ? AND two_factor_revision = ? AND two_factor_enabled_at IS NOT NULL AND banned_at IS NULL
                AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = ? AND s.user_id = users.id AND s.expires_at > ? AND s.two_factor_revision = users.two_factor_revision) RETURNING id`,
        ).bind(marker, userId, row.revision, sessionId, now()),
        env.DB.prepare(`DELETE FROM recovery_codes WHERE user_id = ? AND ${active}`).bind(userId, userId, marker),
        ...(recovery?.hashes ?? []).map((hash) =>
            env.DB.prepare(
                `INSERT INTO recovery_codes (code_hash, user_id, revision, created_at) SELECT ?, id, two_factor_revision, ? FROM users WHERE id = ? AND two_factor_last_verification = ?`,
            ).bind(hash, now(), userId, marker),
        ),
        ...(disable
            ? [
                  env.DB.prepare(`DELETE FROM sensitive_actions WHERE user_id = ? AND ${active}`).bind(
                      userId,
                      userId,
                      marker,
                  ),
                  env.DB.prepare(`DELETE FROM sessions WHERE user_id = ? AND id <> ? AND ${active}`).bind(
                      userId,
                      sessionId,
                      userId,
                      marker,
                  ),
                  env.DB.prepare(`UPDATE sessions SET two_factor_revision = NULL WHERE id = ? AND ${active}`).bind(
                      sessionId,
                      userId,
                      marker,
                  ),
                  env.DB.prepare(`DELETE FROM oauth_states WHERE user_id = ? AND ${active}`).bind(
                      userId,
                      userId,
                      marker,
                  ),
                  env.DB.prepare(`DELETE FROM authentication_challenges WHERE user_id = ? AND ${active}`).bind(
                      userId,
                      userId,
                      marker,
                  ),
              ]
            : []),
    ]);
    if (result[0].results.length === 0) {
        fail(409, 'two_factor_not_enabled');
    }
    return recovery ? { recoveryCodes: recovery.codes, revision: row.revision } : { success: true, revision: null };
}

export async function beginTwoFactorChallenge(
    env: Env,
    userId: string,
    method: 'password' | 'github',
    options: {
        returnPath?: string;
        passwordHash?: string | null;
        remember?: boolean;
        githubId?: string;
    } = {},
) {
    const token = randomToken();
    const browser = randomToken();
    const changed = await env.DB.prepare(
        `INSERT INTO authentication_challenges
        (token_hash, browser_hash, user_id, auth_method, revision, return_path, expires_at, remember)
        SELECT ?, ?, id, ?, two_factor_revision, ?, ?, ? FROM users
        WHERE id = ? AND banned_at IS NULL AND two_factor_enabled_at IS NOT NULL AND two_factor_revision IS NOT NULL
        AND (? IS NULL OR password_hash = ?) AND (? <> 'github' OR github_id = ?) RETURNING token_hash`,
    )
        .bind(
            await sha256(token),
            await sha256(browser),
            method,
            options.returnPath ?? '/account',
            now() + 300,
            options.remember ? 1 : 0,
            userId,
            options.passwordHash ?? null,
            options.passwordHash ?? null,
            method,
            options.githubId ?? null,
        )
        .first();
    if (!changed) {
        fail(401, 'credentials_invalid');
    }
    return { token, browser };
}

export async function findTwoFactorChallenge(env: Env, token: string, browser: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token) || !/^[A-Za-z0-9_-]{43}$/.test(browser)) {
        fail(401, 'two_factor_challenge_invalid');
    }
    const row = await database(env.DB)
        .select()
        .from(authenticationChallenges)
        .where(
            and(
                eq(authenticationChallenges.token_hash, await sha256(token)),
                eq(authenticationChallenges.browser_hash, await sha256(browser)),
                isNull(authenticationChallenges.consumed_at),
            ),
        )
        .get();
    if (!row || row.expires_at <= now()) {
        fail(401, 'two_factor_challenge_invalid');
    }
    return row;
}

export async function revokeBrowserChallenges(env: Env, browser: string): Promise<void> {
    if (/^[A-Za-z0-9_-]{43}$/.test(browser)) {
        await database(env.DB)
            .delete(authenticationChallenges)
            .where(eq(authenticationChallenges.browser_hash, await sha256(browser)));
    }
}

export async function completeTwoFactorChallenge(
    env: Env,
    challenge: AuthenticationChallengeRow,
    code: string,
): Promise<FactorCompletion> {
    const row = await database(env.DB).select().from(users).where(eq(users.id, challenge.user_id)).get();
    if (
        !row ||
        row.banned_at !== null ||
        row.two_factor_enabled_at === null ||
        row.two_factor_revision !== challenge.revision ||
        (challenge.auth_method === 'github' && row.github_id === null)
    ) {
        fail(401, 'two_factor_challenge_invalid');
    }
    const marker = crypto.randomUUID();
    const gate = `EXISTS (SELECT 1 FROM authentication_challenges c WHERE c.token_hash = ? AND c.browser_hash = ?
        AND c.user_id = users.id AND c.revision = users.two_factor_revision AND c.consumed_at IS NULL AND c.expires_at > ?)
        AND (? <> 'github' OR users.github_id = ?)`;
    const statements: D1PreparedStatement[] = [];
    if (/^\d{6}$/.test(code)) {
        const step = await matchedStep(env, row, code);
        statements.push(
            env.DB.prepare(
                `UPDATE users SET two_factor_last_step = ?, two_factor_last_verification = ?
            WHERE id = ? AND two_factor_revision = ? AND two_factor_enabled_at IS NOT NULL AND banned_at IS NULL
            AND two_factor_last_step < ? AND ${gate}`,
            ).bind(
                step,
                marker,
                row.id,
                challenge.revision,
                step,
                challenge.token_hash,
                challenge.browser_hash,
                now(),
                challenge.auth_method,
                row.github_id,
            ),
        );
    } else {
        if (!/^[a-fA-F0-9\s-]{32,40}$/.test(code) || code.replace(/[\s-]/g, '').length !== 32) {
            fail(401, 'two_factor_code_invalid');
        }
        statements.push(
            env.DB.prepare(
                `UPDATE recovery_codes SET consumed_at = ?, consumption_id = ?
            WHERE code_hash = ? AND user_id = ? AND revision = ? AND consumed_at IS NULL
            AND EXISTS (SELECT 1 FROM users WHERE id = recovery_codes.user_id AND banned_at IS NULL
                AND two_factor_enabled_at IS NOT NULL AND two_factor_revision = ? AND ${gate})`,
            ).bind(
                now(),
                marker,
                await recoveryHash(row.id, challenge.revision, code),
                row.id,
                challenge.revision,
                challenge.revision,
                challenge.token_hash,
                challenge.browser_hash,
                now(),
                challenge.auth_method,
                row.github_id,
            ),
        );
        statements.push(
            env.DB.prepare(
                `UPDATE users SET two_factor_last_verification = ? WHERE id = ? AND two_factor_revision = ?
            AND EXISTS (SELECT 1 FROM recovery_codes r WHERE r.user_id = users.id AND r.consumption_id = ?)`,
            ).bind(marker, row.id, challenge.revision, marker),
        );
    }
    statements.push(
        env.DB.prepare(
            `UPDATE authentication_challenges SET consumed_at = ?, completion_id = ? WHERE token_hash = ?
        AND browser_hash = ? AND consumed_at IS NULL AND expires_at > ?
        AND EXISTS (SELECT 1 FROM users WHERE id = authentication_challenges.user_id AND banned_at IS NULL
            AND two_factor_revision = authentication_challenges.revision AND two_factor_last_verification = ?) RETURNING token_hash`,
        ).bind(now(), marker, challenge.token_hash, challenge.browser_hash, now(), marker),
    );
    const result = await env.DB.batch(statements);
    if (result.at(-1)!.results.length === 0) {
        fail(401, 'two_factor_code_invalid');
    }
    return {
        tokenHash: challenge.token_hash,
        completionId: marker,
        revision: challenge.revision,
        ...(challenge.auth_method === 'github' ? { githubId: row.github_id! } : {}),
    };
}
