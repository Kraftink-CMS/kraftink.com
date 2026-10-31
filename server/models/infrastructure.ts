import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './accounts';

export const auditLog = sqliteTable(
    'audit_log',
    {
        id: text('id').primaryKey(),
        actor_id: text('actor_id').references(() => users.id),
        action: text('action').notNull(),
        target: text('target').notNull(),
        details_json: text('details_json').notNull().default('{}'),
        ip: text('ip'),
        created_at: integer('created_at').notNull(),
    },
    (table) => [
        index('audit_log_actor').on(table.actor_id, table.created_at),
        index('audit_log_target').on(table.target, table.created_at),
    ],
);

export const rateLimits = sqliteTable(
    'rate_limits',
    {
        key: text('key').primaryKey(),
        count: integer('count').notNull(),
        expires_at: integer('expires_at').notNull(),
    },
    (table) => [index('rate_limits_expiry').on(table.expires_at)],
);

export const metadataCache = sqliteTable('metadata_cache', {
    key: text('key').primaryKey(),
    payload_json: text('payload_json'),
    fetched_at: integer('fetched_at'),
    retry_at: integer('retry_at').notNull().default(0),
});

export const auditLogRelations = relations(auditLog, ({ one }) => ({
    actor: one(users, { fields: [auditLog.actor_id], references: [users.id] }),
}));

export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type RateLimitRow = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
export type MetadataCacheRow = typeof metadataCache.$inferSelect;
export type NewMetadataCache = typeof metadataCache.$inferInsert;
