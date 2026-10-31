import { lte, sql } from 'drizzle-orm';
import type { AppContext } from '../http';
import { fail, requestIp } from '../http';
import { now } from '../lib/time';
import { sha256 } from './crypto';
import { database } from '../database';
import { rateLimits } from '../models';

export async function rateLimit(
    c: AppContext,
    purpose: string,
    limit: number,
    seconds: number,
    subject = requestIp(c),
): Promise<void> {
    const timestamp = now();
    const bucket = Math.floor(timestamp / seconds);
    const key = `${purpose}:${await sha256(subject)}:${bucket}`;
    const entry = await database(c.env.DB)
        .insert(rateLimits)
        .values({ key, count: 1, expires_at: (bucket + 1) * seconds })
        .onConflictDoUpdate({
            target: rateLimits.key,
            set: { count: sql`${rateLimits.count} + 1` },
            setWhere: lte(rateLimits.count, limit),
        })
        .returning({ count: rateLimits.count })
        .get();
    if (!entry || entry.count > limit) {
        c.header('Retry-After', String((bucket + 1) * seconds - timestamp));
        fail(429, 'rate_limit_exceeded');
    }
}

export async function verifyTurnstile(c: AppContext, token: unknown): Promise<void> {
    const secret = c.env.TURNSTILE_SECRET_KEY;
    if (!secret && c.env.ENVIRONMENT !== 'production') {
        return;
    }
    if (!secret || typeof token !== 'string' || token.length > 2048 || token.length === 0) {
        fail(403, 'challenge_required');
    }
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token, remoteip: requestIp(c) }),
        signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) {
        fail(503, 'challenge_unavailable');
    }
    const verification = await result.json<{ success?: boolean; hostname?: string }>();
    if (!verification.success || verification.hostname !== new URL(c.env.APP_ORIGIN).hostname) {
        fail(403, 'challenge_failed');
    }
}
