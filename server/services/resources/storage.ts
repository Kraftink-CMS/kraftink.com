import type { Env } from '../../types';
import { fail } from '../../http';
import { now } from '../../lib/time';

async function reserveOperation(env: Env, operation: 'A' | 'B'): Promise<void> {
    const day = Math.floor(now() / 86400);
    const prefix = `storage.operations:${operation}:`;
    const key = prefix + new Date(day * 86400000).toISOString().slice(0, 10);
    const firstKey = prefix + new Date((day - 31) * 86400000).toISOString().slice(0, 10);
    const maximum = operation === 'A' ? 900000 : 9000000;
    const reservation = await env.DB.prepare(
        `INSERT INTO rate_limits (key, count, expires_at)
        SELECT ?, 1, ? WHERE COALESCE((SELECT SUM(count) FROM rate_limits WHERE key >= ? AND key <= ?), 0) < ?
        ON CONFLICT(key) DO UPDATE SET count = rate_limits.count + 1
        RETURNING count`,
    )
        .bind(key, (day + 32) * 86400, firstKey, key, maximum)
        .first<{ count: number }>();
    if (!reservation) {
        fail(503, 'storage_unavailable');
    }
}

export function resourceStorage(env: Env) {
    return {
        async get(key: string) {
            await reserveOperation(env, 'B');
            return env.BUCKET.get(key);
        },
        async head(key: string) {
            await reserveOperation(env, 'B');
            return env.BUCKET.head(key);
        },
        async put(key: string, value: Parameters<R2Bucket['put']>[1], options?: R2PutOptions) {
            await reserveOperation(env, 'A');
            return env.BUCKET.put(key, value, options);
        },
        async list(options?: R2ListOptions) {
            await reserveOperation(env, 'A');
            return env.BUCKET.list(options);
        },
        delete(keys: string | string[]) {
            return env.BUCKET.delete(keys);
        },
    };
}
