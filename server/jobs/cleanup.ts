import type { Env } from '../types';
import { now } from '../lib/time';

export async function cleanupExpiredRecords(env: Env): Promise<void> {
    const timestamp = now();
    await env.DB.batch([
        env.DB.prepare(
            'DELETE FROM sensitive_actions WHERE expires_at < ? OR session_id IN (SELECT id FROM sessions WHERE expires_at < ?)',
        ).bind(timestamp, timestamp),
        env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(timestamp),
        env.DB.prepare('DELETE FROM password_resets WHERE expires_at < ?').bind(timestamp - 86400),
        env.DB.prepare('DELETE FROM email_verifications WHERE expires_at < ?').bind(timestamp - 86400),
        env.DB.prepare('DELETE FROM email_changes WHERE expires_at < ?').bind(timestamp - 86400),
        env.DB.prepare('DELETE FROM oauth_states WHERE expires_at < ?').bind(timestamp),
        env.DB.prepare('DELETE FROM authentication_challenges WHERE expires_at < ?').bind(timestamp),
        env.DB.prepare(
            `UPDATE users SET two_factor_secret = NULL, two_factor_revision = NULL,
            two_factor_pending_session_id = NULL, two_factor_pending_expires_at = NULL
            WHERE two_factor_enabled_at IS NULL AND two_factor_pending_expires_at < ?`,
        ).bind(timestamp),
        env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(timestamp),
        env.DB.prepare(
            `DELETE FROM upload_reservations WHERE status = 'released'
            AND NOT EXISTS (SELECT 1 FROM archive_cleanup c WHERE c.archive_key = upload_reservations.archive_key)
            AND NOT EXISTS (SELECT 1 FROM resource_versions v WHERE v.archive_key = upload_reservations.archive_key)`,
        ),
    ]);
}
