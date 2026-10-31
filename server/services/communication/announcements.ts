import { desc, eq, isNull } from 'drizzle-orm';
import { database } from '../../database';
import { fail } from '../../http';
import { now } from '../../lib/time';
import { announcements, announcementState, type AnnouncementRow } from '../../models';
import { signDocument } from '../../security/crypto';

export interface AnnouncementInput {
    title: Record<string, string>;
    body: Record<string, string>;
    severity: 'info' | 'warning' | 'danger';
    url?: string;
    startsAt: number;
    expiresAt: number;
}

const activeIds = `COALESCE((SELECT group_concat(id, ',') FROM (
    SELECT id FROM announcements WHERE deleted_at IS NULL AND starts_at <= ? AND expires_at > ? ORDER BY id
)), '')`;

function publicAnnouncement(row: AnnouncementRow) {
    return {
        id: row.id,
        title: JSON.parse(row.title_json),
        body: JSON.parse(row.body_json),
        severity: row.severity,
        ...(row.url ? { url: row.url } : {}),
        starts_at: row.starts_at,
        expires_at: row.expires_at,
    };
}

export async function listAnnouncements(binding: D1Database) {
    const rows = await database(binding)
        .select()
        .from(announcements)
        .where(isNull(announcements.deleted_at))
        .orderBy(desc(announcements.created_at))
        .limit(20);

    return rows.map(publicAnnouncement);
}

export async function createAnnouncement(
    binding: D1Database,
    creator: string,
    value: AnnouncementInput,
): Promise<string> {
    const id = crypto.randomUUID();
    const time = now();
    const result = await binding.batch([
        binding
            .prepare(
                `INSERT INTO announcements (id, title_json, body_json, severity, url, starts_at, expires_at, created_by, created_at, updated_at)
                SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM announcements WHERE deleted_at IS NULL) < 20`,
            )
            .bind(
                id,
                JSON.stringify(value.title),
                JSON.stringify(value.body),
                value.severity,
                value.url || null,
                value.startsAt,
                value.expiresAt,
                creator,
                time,
                time,
            ),
        binding
            .prepare(
                `UPDATE announcement_state SET sequence = sequence + 1, issued_at = ?, active_ids = ${activeIds}
                WHERE id = 1 AND EXISTS (SELECT 1 FROM announcements WHERE id = ?)`,
            )
            .bind(time, time, time, id),
    ]);
    if (!result[0].meta.changes) {
        fail(409, 'announcement_limit');
    }

    return id;
}

export async function updateAnnouncement(binding: D1Database, id: string, value: AnnouncementInput): Promise<void> {
    const time = now();
    const result = await binding.batch([
        binding
            .prepare(
                `UPDATE announcements SET title_json = ?, body_json = ?, severity = ?, url = ?, starts_at = ?, expires_at = ?, updated_at = ?
                WHERE id = ? AND deleted_at IS NULL`,
            )
            .bind(
                JSON.stringify(value.title),
                JSON.stringify(value.body),
                value.severity,
                value.url || null,
                value.startsAt,
                value.expiresAt,
                time,
                id,
            ),
        binding
            .prepare(
                `UPDATE announcement_state SET sequence = sequence + 1, issued_at = ?, active_ids = ${activeIds}
                WHERE id = 1`,
            )
            .bind(time, time, time),
    ]);
    if (!result[0].meta.changes) {
        fail(404, 'announcement_not_found');
    }
}

export async function deleteAnnouncement(binding: D1Database, id: string): Promise<void> {
    const time = now();
    const result = await binding.batch([
        binding
            .prepare('UPDATE announcements SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
            .bind(time, time, id),
        binding
            .prepare(
                `UPDATE announcement_state SET sequence = sequence + 1, issued_at = ?, active_ids = ${activeIds}
                WHERE id = 1`,
            )
            .bind(time, time, time),
    ]);
    if (!result[0].meta.changes) {
        fail(404, 'announcement_not_found');
    }
}

export async function signedAnnouncements(binding: D1Database, encodedPrivateKey: string) {
    const time = now();
    const stateQuery = database(binding)
        .select({ sequence: announcementState.sequence, issued_at: announcementState.issued_at })
        .from(announcementState)
        .where(eq(announcementState.id, 1))
        .toSQL();
    const [, state, rows] = await binding.batch<Record<string, unknown>>([
        binding
            .prepare(
                `UPDATE announcement_state SET sequence = sequence + 1, issued_at = ?, active_ids = ${activeIds}
                WHERE id = 1 AND active_ids != ${activeIds}`,
            )
            .bind(time, time, time, time, time),
        binding.prepare(stateQuery.sql).bind(...stateQuery.params),
        binding
            .prepare(
                `SELECT * FROM announcements WHERE deleted_at IS NULL
                AND starts_at <= ? AND expires_at > ? ORDER BY created_at, id LIMIT 20`,
            )
            .bind(time, time),
    ]);

    return signDocument(
        {
            schema_version: 1,
            sequence: Number(state.results[0]?.sequence ?? 0),
            issued_at: Number(state.results[0]?.issued_at ?? 0),
            announcements: (rows.results as unknown as AnnouncementRow[]).map(publicAnnouncement),
        },
        encodedPrivateKey,
    );
}
