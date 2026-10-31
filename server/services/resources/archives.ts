import type { Env } from '../../types';
import { and, eq, inArray } from 'drizzle-orm';
import { database } from '../../database';
import { resourceVersions, type UploadReservationRow } from '../../models/resources';
import { now } from '../../lib/time';
import { resourceStorage } from './storage';

export async function cleanupArchives(env: Env): Promise<void> {
    const timestamp = now();
    await env.DB.prepare(
        `INSERT OR IGNORE INTO archive_cleanup (archive_key, image_key, created_at)
        SELECT u.archive_key, u.image_key, ? FROM upload_reservations u
        WHERE u.status = 'reserved' AND u.created_at < ?
        AND NOT EXISTS (SELECT 1 FROM resource_versions v WHERE v.archive_key = u.archive_key)
        AND NOT EXISTS (SELECT 1 FROM archive_cleanup c WHERE c.archive_key = u.archive_key)
        ORDER BY u.created_at LIMIT 20`,
    )
        .bind(timestamp, timestamp - 3600)
        .run();
    const result = await env.DB.prepare(
        `SELECT c.archive_key, COALESCE(c.image_key, v.image_key) AS image_key, u.status AS upload_status
        FROM archive_cleanup c LEFT JOIN resource_versions v ON v.archive_key = c.archive_key
        LEFT JOIN upload_reservations u ON u.archive_key = c.archive_key
        ORDER BY u.status = 'reserved', c.created_at LIMIT 20`,
    ).all<{
        archive_key: string;
        image_key: string | null;
        upload_status: UploadReservationRow['status'] | null;
    }>();
    for (const row of result.results) {
        const active = await database(env.DB)
            .select({ id: resourceVersions.id })
            .from(resourceVersions)
            .where(
                and(
                    eq(resourceVersions.archive_key, row.archive_key),
                    inArray(resourceVersions.status, ['pending', 'approved']),
                ),
            )
            .limit(1)
            .get();
        if (active) {
            continue;
        }
        try {
            if (row.image_key) {
                await resourceStorage(env).delete(row.image_key);
            }
            await resourceStorage(env).delete(row.archive_key);
            if (row.upload_status === 'reserved') {
                continue;
            }
            await env.DB.batch([
                env.DB.prepare(
                    'UPDATE resource_versions SET archive_key = NULL, image_key = NULL WHERE archive_key = ?',
                ).bind(row.archive_key),
                env.DB.prepare(
                    "UPDATE upload_reservations SET status = 'released' WHERE archive_key = ? AND status != 'reserved'",
                ).bind(row.archive_key),
                env.DB.prepare(
                    `DELETE FROM archive_cleanup WHERE archive_key = ?
                    AND NOT EXISTS (SELECT 1 FROM upload_reservations u WHERE u.archive_key = archive_cleanup.archive_key AND u.status = 'reserved')`,
                ).bind(row.archive_key),
            ]);
        } catch {
            continue;
        }
    }
}
