import { and, asc, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { database } from '../../database';
import { emailChanges, siteLicenses, users } from '../../models';
import type { Role, User } from '../../types';
import { fail, textField } from '../../http';
import { now } from '../../lib/time';
import { randomToken, sha256 } from '../../security/crypto';
import { maxUploadBytes, minUserUploadBytes } from '../../upload-limits';
import { normalizeNetwork, type IpPolicy } from '../../../shared/ip';
import { hashPassword } from './authentication';

export const ipChangeInterval = 3 * 86400;
export const identityChangeInterval = 7 * 86400;
export const validRoles = new Set<Role>(['creator', 'moderator', 'admin']);

const authenticationChangeFrom = `FROM users u JOIN sessions s ON s.user_id = u.id
    JOIN sensitive_actions p ON p.user_id = u.id AND p.session_id = s.id`;
const authenticationChangeCondition = `u.id = ? AND u.banned_at IS NULL AND s.id = ? AND s.expires_at > ?
    AND p.token_hash = ? AND p.purpose = ? AND p.consumed_at IS NULL AND p.expires_at > ?
    AND u.github_id IS NOT NULL
    AND ((p.purpose = 'account.password' AND u.password_hash IS NULL)
        OR (p.purpose = 'account.github-unlink' AND u.password_hash IS NOT NULL))
    AND ((u.two_factor_enabled_at IS NOT NULL AND p.auth_method = 'two-factor'
            AND p.two_factor_revision = u.two_factor_revision AND s.two_factor_revision = u.two_factor_revision)
        OR (u.two_factor_enabled_at IS NULL AND p.two_factor_revision IS NULL
            AND ((u.password_hash IS NOT NULL AND p.auth_method = 'password')
                OR (u.password_hash IS NULL AND p.auth_method = 'github'))))`;

async function authenticationChangeProof(
    binding: D1Database,
    userId: string,
    sessionId: string,
    token: string,
    purpose: 'account.password' | 'account.github-unlink',
) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
        fail(403, 'reauthentication_required');
    }
    const hash = await sha256(token);
    const user = await binding
        .prepare(`SELECT u.github_id ${authenticationChangeFrom} WHERE ${authenticationChangeCondition}`)
        .bind(userId, sessionId, now(), hash, purpose, now())
        .first<{ github_id: string }>();
    if (!user) {
        fail(403, 'reauthentication_required');
    }
    return { hash, githubId: user.github_id, purpose };
}

async function applyAuthenticationChange(
    binding: D1Database,
    userId: string,
    sessionId: string,
    proof: Awaited<ReturnType<typeof authenticationChangeProof>>,
    passwordHash: string | null,
) {
    const id = crypto.randomUUID();
    const timestamp = now();
    const action = proof.purpose === 'account.password' ? 'account.password.created' : 'account.github-unlinked';
    const gate = 'EXISTS (SELECT 1 FROM audit_log WHERE id = ?)';
    const result = await binding.batch([
        binding
            .prepare(
                `INSERT INTO audit_log (id, actor_id, action, target, details_json, created_at)
            SELECT ?, u.id, ?, u.id, '{}', ? ${authenticationChangeFrom}
            WHERE ${authenticationChangeCondition} AND u.github_id = ? RETURNING id`,
            )
            .bind(
                id,
                action,
                timestamp,
                userId,
                sessionId,
                timestamp,
                proof.hash,
                proof.purpose,
                timestamp,
                proof.githubId,
            ),
        binding
            .prepare(
                passwordHash
                    ? `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? AND ${gate} RETURNING two_factor_revision`
                    : `UPDATE users SET github_id = NULL, updated_at = ? WHERE id = ? AND ${gate} RETURNING two_factor_revision`,
            )
            .bind(...(passwordHash ? [passwordHash, timestamp, userId, id] : [timestamp, userId, id])),
        binding
            .prepare(`DELETE FROM email_changes WHERE user_id = ? AND consumed_at IS NULL AND ${gate}`)
            .bind(userId, id),
        binding
            .prepare(
                `DELETE FROM oauth_states WHERE (user_id = ? OR session_id IN
            (SELECT id FROM sessions WHERE user_id = ?)) AND ${gate}`,
            )
            .bind(userId, userId, id),
        ...['authentication_challenges', 'password_resets', 'sensitive_actions'].map((table) =>
            binding.prepare(`DELETE FROM ${table} WHERE user_id = ? AND ${gate}`).bind(userId, id),
        ),
        binding.prepare(`DELETE FROM sessions WHERE user_id = ? AND id <> ? AND ${gate}`).bind(userId, sessionId, id),
        binding
            .prepare(`UPDATE sessions SET auth_method = 'password' WHERE id = ? AND user_id = ? AND ${gate}`)
            .bind(sessionId, userId, id),
    ]);
    if (result[1].results.length === 0) {
        fail(403, 'reauthentication_required');
    }
    return { revision: (result[1].results[0] as { two_factor_revision: string | null }).two_factor_revision };
}

export async function setInitialPassword(
    binding: D1Database,
    userId: string,
    sessionId: string,
    token: string,
    password: string,
) {
    const proof = await authenticationChangeProof(binding, userId, sessionId, token, 'account.password');
    return applyAuthenticationChange(binding, userId, sessionId, proof, await hashPassword(password));
}

export async function unlinkGithub(binding: D1Database, userId: string, sessionId: string, token: string) {
    const proof = await authenticationChangeProof(binding, userId, sessionId, token, 'account.github-unlink');
    return applyAuthenticationChange(binding, userId, sessionId, proof, null);
}

const deletionRestrictions = {
    purchases: `EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status <> 'created')
        OR EXISTS (SELECT 1 FROM entitlements e WHERE e.user_id = u.id)`,
    pending_payments: `EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'created')`,
    resources: 'EXISTS (SELECT 1 FROM resources r WHERE r.author_id = u.id)',
    sales: 'EXISTS (SELECT 1 FROM orders o WHERE o.seller_id = u.id)',
    seller_account:
        'EXISTS (SELECT 1 FROM seller_accounts a WHERE a.user_id = u.id AND a.stripe_account_id IS NOT NULL)',
    uploads: "EXISTS (SELECT 1 FROM upload_reservations r WHERE r.user_id = u.id AND r.status <> 'released')",
    announcements: 'EXISTS (SELECT 1 FROM announcements a WHERE a.created_by = u.id)',
    last_admin: `u.role IS 'admin' AND NOT EXISTS (SELECT 1 FROM users other
        WHERE other.role = 'admin' AND other.id <> u.id AND other.banned_at IS NULL)`,
};

export async function accountDeletionEligibility(binding: D1Database, userId: string) {
    const restrictions = Object.entries(deletionRestrictions);
    const row = await database(binding)
        .select({
            has_password: sql<number>`u.password_hash IS NOT NULL`,
            ...Object.fromEntries(
                restrictions.map(([reason, condition]) => [reason, sql<number>`(${sql.raw(condition)})`]),
            ),
        })
        .from(sql`${users} u`)
        .where(sql`u.id = ${userId}`)
        .get();
    if (!row) {
        fail(401, 'authentication_required');
    }
    const reasons = restrictions
        .map(([reason]) => reason)
        .filter((reason) => Boolean((row as Record<string, unknown>)[reason]));
    return { eligible: reasons.length === 0, reasons, hasPassword: Boolean(row.has_password) };
}

export async function deleteOwnAccount(
    binding: D1Database,
    userId: string,
    sessionId: string,
    sensitiveToken: string,
): Promise<void> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(sensitiveToken)) {
        fail(403, 'reauthentication_required');
    }
    const operationId = crypto.randomUUID();
    const tokenHash = await sha256(sensitiveToken);
    const timestamp = now();
    const gate = "EXISTS (SELECT 1 FROM audit_log WHERE id = ? AND action = 'account.deleted')";
    const conditions = Object.values(deletionRestrictions)
        .map((condition) => `NOT (${condition})`)
        .join(' AND ');
    const statements = [
        binding
            .prepare(
                `INSERT INTO audit_log (id, actor_id, action, target, details_json, created_at)
            SELECT ?, NULL, 'account.deleted', 'deleted-user', '{}', ? FROM users u
            JOIN sessions s ON s.user_id = u.id
            JOIN sensitive_actions p ON p.user_id = u.id AND p.session_id = s.id
            WHERE u.id = ? AND u.banned_at IS NULL AND s.id = ? AND s.expires_at > ?
            AND p.token_hash = ? AND p.purpose = 'account.delete' AND p.consumed_at IS NULL AND p.expires_at > ?
            AND ((u.two_factor_enabled_at IS NOT NULL AND p.auth_method = 'two-factor'
                    AND p.two_factor_revision = u.two_factor_revision AND s.two_factor_revision = u.two_factor_revision)
                OR (u.two_factor_enabled_at IS NULL AND p.two_factor_revision IS NULL
                    AND ((u.password_hash IS NOT NULL AND p.auth_method = 'password')
                        OR (u.password_hash IS NULL AND u.github_id IS NOT NULL AND p.auth_method = 'github'))))
            AND ${conditions} RETURNING id`,
            )
            .bind(operationId, timestamp, userId, sessionId, timestamp, tokenHash, timestamp),
        binding
            .prepare(
                `UPDATE audit_log SET actor_id = CASE WHEN actor_id = ? THEN NULL ELSE actor_id END,
            ip = CASE WHEN actor_id = ? OR target = ? THEN NULL ELSE ip END,
            details_json = CASE WHEN target = ? THEN '{}' ELSE details_json END,
            target = CASE WHEN target = ? THEN 'deleted-user' ELSE target END
            WHERE (actor_id = ? OR target = ?) AND ${gate}`,
            )
            .bind(userId, userId, userId, userId, userId, userId, userId, operationId),
        binding
            .prepare(`UPDATE resource_versions SET reviewer_id = NULL WHERE reviewer_id = ? AND ${gate}`)
            .bind(userId, operationId),
        binding
            .prepare(
                `DELETE FROM oauth_states WHERE (user_id = ? OR session_id IN
            (SELECT id FROM sessions WHERE user_id = ?)) AND ${gate}`,
            )
            .bind(userId, userId, operationId),
        ...[
            'recovery_codes',
            'authentication_challenges',
            'password_resets',
            'email_verifications',
            'email_changes',
            'site_licenses',
            'upload_reservations',
            'seller_accounts',
            'sensitive_actions',
            'sessions',
        ].map((table) =>
            binding.prepare(`DELETE FROM ${table} WHERE user_id = ? AND ${gate}`).bind(userId, operationId),
        ),
        binding.prepare(`DELETE FROM users WHERE id = ? AND ${gate} RETURNING id`).bind(userId, operationId),
    ];
    const result = await binding.batch(statements);
    if (result.at(-1)!.results.length > 0) {
        return;
    }
    const eligibility = await accountDeletionEligibility(binding, userId);
    if (!eligibility.eligible) {
        fail(409, 'account_deletion_blocked');
    }
    fail(403, 'reauthentication_required');
}

export function nextIpChangeAt(lastChange: number | null): number | null {
    return lastChange === null ? null : lastChange + ipChangeInterval;
}

export async function accountProfile(binding: D1Database, user: User) {
    const db = database(binding);
    const profile = await db
        .select({
            created_at: users.created_at,
            email_changed_at: users.email_changed_at,
            username_changed_at: users.username_changed_at,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .get();
    const pending = await db
        .select({ new_email: emailChanges.new_email, expires_at: emailChanges.expires_at })
        .from(emailChanges)
        .where(
            and(
                eq(emailChanges.user_id, user.id),
                isNull(emailChanges.consumed_at),
                gt(emailChanges.expires_at, now()),
            ),
        )
        .get();
    return {
        user,
        createdAt: profile?.created_at,
        emailChangedAt: profile?.email_changed_at ?? null,
        usernameChangedAt: profile?.username_changed_at ?? null,
        nextEmailChangeAt:
            profile?.email_changed_at === null || profile?.email_changed_at === undefined
                ? null
                : profile.email_changed_at + identityChangeInterval,
        nextUsernameChangeAt:
            profile?.username_changed_at === null || profile?.username_changed_at === undefined
                ? null
                : profile.username_changed_at + identityChangeInterval,
        pendingEmail: pending ? { email: pending.new_email, expiresAt: pending.expires_at } : null,
    };
}

export async function changeUsername(binding: D1Database, user: User, username: string): Promise<number> {
    const timestamp = now();
    const changed = await binding
        .prepare(
            `UPDATE users SET username = ?, username_changed_at = ?, updated_at = ?
         WHERE id = ? AND banned_at IS NULL AND (username_changed_at IS NULL OR username_changed_at <= ?)
         AND NOT EXISTS (SELECT 1 FROM users other WHERE other.username = ? COLLATE NOCASE AND other.id <> ?)
         RETURNING id`,
        )
        .bind(username, timestamp, timestamp, user.id, timestamp - identityChangeInterval, username, user.id)
        .first<{ id: string }>();
    if (!changed) {
        const row = await database(binding)
            .select({ username_changed_at: users.username_changed_at })
            .from(users)
            .where(eq(users.id, user.id))
            .get();
        fail(
            409,
            row?.username_changed_at !== null &&
                row?.username_changed_at !== undefined &&
                row.username_changed_at > timestamp - identityChangeInterval
                ? 'username_change_cooldown'
                : 'username_unavailable',
        );
    }
    return timestamp + identityChangeInterval;
}

export async function requestEmailChange(binding: D1Database, user: User, email: string): Promise<string> {
    const token = randomToken();
    const timestamp = now();
    const created = await binding.batch([
        binding.prepare('DELETE FROM email_changes WHERE user_id = ? AND consumed_at IS NULL').bind(user.id),
        binding
            .prepare(
                `INSERT INTO email_changes (token_hash, user_id, previous_email, new_email, expires_at, created_at)
             SELECT ?, id, email, ?, ?, ? FROM users WHERE id = ? AND banned_at IS NULL
             AND (email_changed_at IS NULL OR email_changed_at <= ?) RETURNING user_id`,
            )
            .bind(
                await sha256(token),
                email,
                timestamp + 86400,
                timestamp,
                user.id,
                timestamp - identityChangeInterval,
            ),
    ]);
    if (created[1].results.length === 0) {
        fail(409, 'email_change_cooldown');
    }
    return token;
}

export async function cancelEmailChange(binding: D1Database, userId: string): Promise<void> {
    await database(binding)
        .delete(emailChanges)
        .where(and(eq(emailChanges.user_id, userId), isNull(emailChanges.consumed_at)));
}

export async function siteKeyState(binding: D1Database, userId: string) {
    const row = await database(binding).select().from(siteLicenses).where(eq(siteLicenses.user_id, userId)).get();
    return {
        hasKey: Boolean(row?.key_hash && !row.revoked_at),
        prefix: row?.key_prefix ?? null,
        allowedIps: row ? (JSON.parse(row.allowed_ips_json) as string[]) : [],
        ipPolicy: row?.ip_policy ?? 'addresses',
        allowedNetworks: row ? (JSON.parse(row.allowed_networks_json) as string[]) : [],
        ipLimit: row?.ip_limit ?? 1,
        ipChangedAt: row?.ip_changed_at ?? null,
        nextIpChangeAt: nextIpChangeAt(row?.ip_changed_at ?? null),
        revokedAt: row?.revoked_at ?? null,
    };
}

export async function rotateSiteKey(binding: D1Database, userId: string): Promise<string> {
    const token = `ki_${randomToken()}`;
    const timestamp = now();
    const values = {
        user_id: userId,
        key_hash: await sha256(token),
        key_prefix: token.slice(0, 11),
        created_at: timestamp,
        updated_at: timestamp,
    };
    await database(binding)
        .insert(siteLicenses)
        .values(values)
        .onConflictDoUpdate({
            target: siteLicenses.user_id,
            set: { key_hash: values.key_hash, key_prefix: values.key_prefix, revoked_at: null, updated_at: timestamp },
        });
    return token;
}

export async function revokeSiteKey(binding: D1Database, userId: string): Promise<void> {
    await database(binding)
        .update(siteLicenses)
        .set({ key_hash: null, key_prefix: null, revoked_at: now(), updated_at: now() })
        .where(eq(siteLicenses.user_id, userId));
}

export async function changeAllowedIps(binding: D1Database, userId: string, ips: string[]) {
    const timestamp = now();
    await database(binding)
        .insert(siteLicenses)
        .values({ user_id: userId, created_at: timestamp, updated_at: timestamp })
        .onConflictDoNothing();
    const current = await database(binding).select().from(siteLicenses).where(eq(siteLicenses.user_id, userId)).get();
    if (!current || current.ip_policy !== 'addresses') {
        fail(409, 'ip_policy_managed');
    }
    if (ips.length > current.ip_limit) {
        fail(422, 'ip_limit_exceeded');
    }
    const previousIps = JSON.parse(current.allowed_ips_json) as string[];
    if (JSON.stringify(previousIps.slice().sort()) === JSON.stringify(ips)) {
        return { allowedIps: ips, nextIpChangeAt: nextIpChangeAt(current.ip_changed_at), previousIps, changed: false };
    }
    const changed = await binding
        .prepare(
            `UPDATE site_licenses SET allowed_ips_json = ?, ip_changed_at = ?, updated_at = ?
         WHERE user_id = ? AND ip_policy = 'addresses' AND ip_limit >= ?
         AND (ip_changed_at IS NULL OR ip_changed_at <= ?)
         RETURNING ip_changed_at`,
        )
        .bind(JSON.stringify(ips), timestamp, timestamp, userId, ips.length, timestamp - ipChangeInterval)
        .first<{ ip_changed_at: number }>();
    if (!changed) {
        const latest = await database(binding)
            .select({ ip_policy: siteLicenses.ip_policy, ip_limit: siteLicenses.ip_limit })
            .from(siteLicenses)
            .where(eq(siteLicenses.user_id, userId))
            .get();
        if (latest?.ip_policy !== 'addresses') {
            fail(409, 'ip_policy_managed');
        }
        if (ips.length > latest.ip_limit) {
            fail(422, 'ip_limit_exceeded');
        }
        fail(409, 'ip_change_cooldown');
    }
    return { allowedIps: ips, nextIpChangeAt: timestamp + ipChangeInterval, previousIps, changed: true };
}

export async function listUsers(binding: D1Database, query: string, offset: number) {
    const limit = 50;
    const escaped = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    const result = await database(binding).query.users.findMany({
        columns: {
            id: true,
            email: true,
            username: true,
            email_verified_at: true,
            banned_at: true,
            banned_reason: true,
            created_at: true,
            max_upload_bytes: true,
            role: true,
        },
        where:
            query.length > 0
                ? or(
                      sql`${users.email} LIKE ${escaped} ESCAPE '\\'`,
                      sql`${users.username} LIKE ${escaped} ESCAPE '\\'`,
                  )
                : undefined,
        with: { siteLicense: true },
        orderBy: [desc(users.created_at), asc(users.id)],
        limit: limit + 1,
        offset,
    });
    return {
        users: result.slice(0, limit).map((row) => ({
            id: row.id,
            email: row.email,
            username: row.username,
            role: row.role,
            emailVerified: row.email_verified_at !== null,
            banned: row.banned_at !== null,
            banReason: row.banned_reason,
            createdAt: row.created_at,
            maxUploadBytes: row.max_upload_bytes,
            allowedIps: row.siteLicense ? (JSON.parse(row.siteLicense.allowed_ips_json) as string[]) : [],
            ipPolicy: row.siteLicense?.ip_policy ?? 'addresses',
            allowedNetworks: row.siteLicense ? (JSON.parse(row.siteLicense.allowed_networks_json) as string[]) : [],
            ipLimit: row.siteLicense?.ip_limit ?? 1,
            ipChangedAt: row.siteLicense?.ip_changed_at ?? null,
            siteKeyPrefix: row.siteLicense?.key_prefix ?? null,
        })),
        nextOffset: result.length > limit ? offset + limit : null,
    };
}

export async function prepareUserUpdate(
    binding: D1Database,
    actorId: string,
    targetId: string,
    body: Record<string, unknown>,
) {
    const target = await database(binding)
        .select({ id: users.id, banned_at: users.banned_at })
        .from(users)
        .where(eq(users.id, targetId))
        .get();
    if (!target) {
        fail(404, 'user_not_found');
    }
    const allowedFields = new Set([
        'role',
        'banned',
        'banReason',
        'ipPolicy',
        'allowedNetworks',
        'ipLimit',
        'maxUploadBytes',
    ]);
    if (Object.keys(body).length === 0 || Object.keys(body).some((key) => !allowedFields.has(key))) {
        fail(422, 'invalid_input');
    }
    const role = body.role as Role | null | undefined;
    if (role !== undefined && role !== null && !validRoles.has(role)) {
        fail(422, 'role_invalid');
    }
    if (body.banned !== undefined && typeof body.banned !== 'boolean') {
        fail(422, 'invalid_input');
    }
    if (
        body.maxUploadBytes !== undefined &&
        body.maxUploadBytes !== null &&
        (typeof body.maxUploadBytes !== 'number' ||
            !Number.isSafeInteger(body.maxUploadBytes) ||
            body.maxUploadBytes < minUserUploadBytes ||
            body.maxUploadBytes > maxUploadBytes)
    ) {
        fail(422, 'upload_limit_invalid');
    }
    let ipConfiguration: { policy: IpPolicy; limit: number; networks: string[] } | undefined;
    if (body.ipPolicy !== undefined || body.ipLimit !== undefined || body.allowedNetworks !== undefined) {
        if (body.ipPolicy === 'addresses') {
            if (
                body.allowedNetworks !== undefined ||
                typeof body.ipLimit !== 'number' ||
                !Number.isSafeInteger(body.ipLimit) ||
                body.ipLimit < 1 ||
                body.ipLimit > 100
            ) {
                fail(422, 'ip_policy_invalid');
            }
            const existing = await database(binding)
                .select({ count: sql<number>`json_array_length(${siteLicenses.allowed_ips_json})` })
                .from(siteLicenses)
                .where(eq(siteLicenses.user_id, target.id))
                .get();
            if ((existing?.count ?? 0) > body.ipLimit) {
                fail(409, 'ip_limit_below_current');
            }
            ipConfiguration = { policy: 'addresses', limit: body.ipLimit, networks: [] };
        } else if (body.ipPolicy === 'networks') {
            if (
                body.ipLimit !== undefined ||
                !Array.isArray(body.allowedNetworks) ||
                body.allowedNetworks.length === 0 ||
                body.allowedNetworks.length > 100
            ) {
                fail(422, 'ip_networks_invalid');
            }
            const networks = body.allowedNetworks.map(normalizeNetwork);
            if (networks.some((network) => network === null) || new Set(networks).size !== networks.length) {
                fail(422, 'ip_networks_invalid');
            }
            ipConfiguration = { policy: 'networks', limit: 1, networks: (networks as string[]).sort() };
        } else {
            fail(422, 'ip_policy_invalid');
        }
    }
    if (actorId === target.id && (body.banned === true || (role !== undefined && role !== 'admin'))) {
        fail(403, 'self_admin_action_forbidden');
    }
    const reason =
        body.banned === true
            ? textField(typeof body.banReason === 'string' ? body.banReason.trim() : body.banReason, 8, 1000)
            : null;
    return { targetId: target.id, role, reason, ipConfiguration, body };
}

export async function applyUserUpdate(binding: D1Database, changes: Awaited<ReturnType<typeof prepareUserUpdate>>) {
    const { targetId, role, reason, ipConfiguration, body } = changes;
    const statements: D1PreparedStatement[] = [];
    if (body.maxUploadBytes !== undefined) {
        statements.push(
            binding
                .prepare('UPDATE users SET max_upload_bytes = ?, updated_at = ? WHERE id = ?')
                .bind(body.maxUploadBytes, now(), targetId),
        );
    }
    if (role !== undefined) {
        statements.push(
            binding.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').bind(role, now(), targetId),
        );
    }
    if (body.banned !== undefined) {
        statements.push(
            binding
                .prepare('UPDATE users SET banned_at = ?, banned_reason = ?, updated_at = ? WHERE id = ?')
                .bind(body.banned ? now() : null, reason, now(), targetId),
        );
    }
    if (body.banned === true) {
        statements.push(
            binding.prepare('DELETE FROM sensitive_actions WHERE user_id = ?').bind(targetId),
            binding.prepare('DELETE FROM sessions WHERE user_id = ?').bind(targetId),
            binding.prepare('DELETE FROM oauth_states WHERE user_id = ?').bind(targetId),
            binding.prepare('DELETE FROM authentication_challenges WHERE user_id = ?').bind(targetId),
            binding
                .prepare(
                    'UPDATE site_licenses SET key_hash = NULL, key_prefix = NULL, revoked_at = ?, updated_at = ? WHERE user_id = ?',
                )
                .bind(now(), now(), targetId),
            binding
                .prepare(
                    "UPDATE orders SET status = 'expired', updated_at = ? WHERE user_id = ? AND status = 'created'",
                )
                .bind(now(), targetId),
        );
    }
    if (ipConfiguration) {
        statements.push(
            binding
                .prepare(
                    `INSERT INTO site_licenses (user_id, ip_policy, allowed_networks_json, ip_limit, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET ip_policy = excluded.ip_policy,
             allowed_networks_json = excluded.allowed_networks_json,
             allowed_ips_json = CASE WHEN excluded.ip_policy = 'networks' THEN '[]' ELSE site_licenses.allowed_ips_json END,
             ip_changed_at = CASE WHEN excluded.ip_policy <> site_licenses.ip_policy THEN NULL ELSE site_licenses.ip_changed_at END,
             ip_limit = excluded.ip_limit,
             updated_at = excluded.updated_at`,
                )
                .bind(
                    targetId,
                    ipConfiguration.policy,
                    JSON.stringify(ipConfiguration.networks),
                    ipConfiguration.limit,
                    now(),
                    now(),
                ),
        );
    }
    try {
        await binding.batch(statements);
    } catch (error) {
        if (error instanceof Error && error.message.includes('last_admin_protected')) {
            fail(409, 'last_admin_protected');
        }
        if (error instanceof Error && error.message.includes('site_license_ip_limit')) {
            fail(409, 'ip_limit_below_current');
        }
        throw error;
    }
    return {
        ...(role !== undefined ? { role } : {}),
        ...(body.banned !== undefined ? { banned: body.banned, reason } : {}),
        ...(ipConfiguration
            ? {
                  ipPolicy: ipConfiguration.policy,
                  allowedNetworks: ipConfiguration.networks,
                  ...(ipConfiguration.policy === 'addresses' ? { ipLimit: ipConfiguration.limit } : {}),
              }
            : {}),
        ...(body.maxUploadBytes !== undefined ? { maxUploadBytes: body.maxUploadBytes } : {}),
    };
}
