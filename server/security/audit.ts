import type { Env } from '../types';
import { database } from '../database';
import { auditLog } from '../models';
import { now } from '../lib/time';

export interface AuditActor {
    userId: string | null;
    ip: string;
}

export async function recordAudit(
    env: Env,
    actor: AuditActor,
    action: string,
    target: string,
    details: Record<string, unknown> = {},
): Promise<void> {
    await database(env.DB)
        .insert(auditLog)
        .values({
            id: crypto.randomUUID(),
            actor_id: actor.userId,
            action,
            target,
            details_json: JSON.stringify(details),
            ip: actor.ip,
            created_at: now(),
        });
}
