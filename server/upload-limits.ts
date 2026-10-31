import type { Env } from './types';
import { maxArchiveBytes } from '../shared/packages/zip';

export const minUserUploadBytes = 1024 * 1024;
export const maxUploadBytes = maxArchiveBytes;

export function defaultUploadLimit(env: Env): number {
    const configured = Number(env.MAX_UPLOAD_BYTES);
    return Number.isSafeInteger(configured) && configured > 0 ? Math.min(configured, maxUploadBytes) : 25 * 1024 * 1024;
}

export async function effectiveUploadLimit(env: Env, userId?: string): Promise<number> {
    if (!userId) {
        return defaultUploadLimit(env);
    }
    const user = await env.DB.prepare('SELECT max_upload_bytes FROM users WHERE id = ?')
        .bind(userId)
        .first<{ max_upload_bytes: number | null }>();
    return user?.max_upload_bytes != null &&
        Number.isSafeInteger(user.max_upload_bytes) &&
        user.max_upload_bytes >= minUserUploadBytes &&
        user.max_upload_bytes <= maxUploadBytes
        ? user.max_upload_bytes
        : defaultUploadLimit(env);
}
