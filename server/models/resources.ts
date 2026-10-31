import { relations, sql } from 'drizzle-orm';
import {
    check,
    foreignKey,
    index,
    integer,
    sqliteTable,
    text,
    unique,
    uniqueIndex,
    type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import { users } from './accounts';

export const resources = sqliteTable(
    'resources',
    {
        id: text('id').primaryKey(),
        author_id: text('author_id')
            .notNull()
            .references(() => users.id),
        slug: text('slug').notNull().unique(),
        type: text('type', { enum: ['plugin', 'theme', 'game'] }).notNull(),
        name: text('name').notNull(),
        description: text('description').notNull(),
        metadata_json: text('metadata_json').notNull().default('{}'),
        price_cents: integer('price_cents').notNull(),
        currency: text('currency', { enum: ['EUR'] })
            .notNull()
            .default('EUR'),
        status: text('status', { enum: ['draft', 'published', 'withdrawn', 'revoked'] })
            .notNull()
            .default('draft'),
        approved_version_id: text('approved_version_id'),
        created_at: integer('created_at').notNull(),
        updated_at: integer('updated_at').notNull(),
        deleted_at: integer('deleted_at'),
    },
    (table) => [
        foreignKey({
            name: 'resources_approved_version_resource',
            columns: [table.id, table.approved_version_id],
            foreignColumns: [resourceVersions.resource_id, resourceVersions.id],
        }),
        index('resources_author').on(table.author_id, sql`${table.created_at} DESC`),
        index('resources_public').on(table.status, table.name),
        check('resources_type', sql`${table.type} IN ('plugin', 'theme', 'game')`),
        check('resources_price_cents', sql`${table.price_cents} BETWEEN 50 AND 1000000`),
        check('resources_currency', sql`${table.currency} = 'EUR'`),
        check('resources_status', sql`${table.status} IN ('draft', 'published', 'withdrawn', 'revoked')`),
    ],
);

export const resourceVersions = sqliteTable(
    'resource_versions',
    {
        id: text('id').primaryKey(),
        resource_id: text('resource_id')
            .notNull()
            .references((): AnySQLiteColumn => resources.id),
        version: text('version').notNull(),
        status: text('status', { enum: ['pending', 'approved', 'rejected', 'superseded', 'cancelled'] })
            .notNull()
            .default('pending'),
        payload_json: text('payload_json').notNull(),
        manifest_json: text('manifest_json').notNull(),
        archive_key: text('archive_key'),
        image_key: text('image_key'),
        image_mime: text('image_mime', { enum: ['image/png', 'image/jpeg', 'image/webp'] }),
        image_size_bytes: integer('image_size_bytes').notNull().default(0),
        sha256: text('sha256').notNull(),
        size_bytes: integer('size_bytes').notNull(),
        reviewer_id: text('reviewer_id').references(() => users.id),
        review_note: text('review_note'),
        review_token: text('review_token'),
        created_at: integer('created_at').notNull(),
        reviewed_at: integer('reviewed_at'),
    },
    (table) => [
        unique('resource_versions_identity').on(table.resource_id, table.version),
        unique('resource_versions_resource_id').on(table.resource_id, table.id),
        uniqueIndex('resource_versions_pending')
            .on(table.resource_id)
            .where(sql`${table.status} = 'pending'`),
        index('resource_versions_review').on(table.status, table.created_at),
        check(
            'resource_versions_status',
            sql`${table.status} IN ('pending', 'approved', 'rejected', 'superseded', 'cancelled')`,
        ),
        check(
            'resource_versions_image_mime',
            sql`${table.image_mime} IS NULL OR ${table.image_mime} IN ('image/png', 'image/jpeg', 'image/webp')`,
        ),
        check('resource_versions_image_size', sql`${table.image_size_bytes} >= 0`),
        check('resource_versions_size', sql`${table.size_bytes} > 0`),
    ],
);

export const uploadReservations = sqliteTable(
    'upload_reservations',
    {
        id: text('id').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        resource_id: text('resource_id')
            .notNull()
            .references(() => resources.id),
        archive_key: text('archive_key').notNull().unique(),
        image_key: text('image_key'),
        size_bytes: integer('size_bytes').notNull(),
        status: text('status', { enum: ['reserved', 'stored', 'released'] })
            .notNull()
            .default('reserved'),
        created_at: integer('created_at').notNull(),
    },
    (table) => [
        index('upload_reservations_quota').on(table.status, table.user_id),
        uniqueIndex('upload_reservations_resource')
            .on(table.resource_id)
            .where(sql`${table.status} = 'reserved'`),
        check('upload_reservations_size', sql`${table.size_bytes} > 0`),
        check('upload_reservations_status', sql`${table.status} IN ('reserved', 'stored', 'released')`),
    ],
);

export const archiveCleanup = sqliteTable('archive_cleanup', {
    archive_key: text('archive_key').primaryKey(),
    image_key: text('image_key'),
    created_at: integer('created_at').notNull(),
});

export const marketRevocations = sqliteTable(
    'market_revocations',
    {
        resource_id: text('resource_id')
            .primaryKey()
            .references(() => resources.id),
        slug: text('slug').notNull(),
        type: text('type', { enum: ['plugin', 'theme', 'game'] }).notNull(),
        versions_json: text('versions_json').notNull(),
        reason: text('reason').notNull(),
        created_at: integer('created_at').notNull(),
    },
    (table) => [check('market_revocations_type', sql`${table.type} IN ('plugin', 'theme', 'game')`)],
);

export const marketState = sqliteTable(
    'market_state',
    {
        id: integer('id').primaryKey(),
        sequence: integer('sequence').notNull().default(0),
    },
    (table) => [
        check('market_state_singleton', sql`${table.id} = 1`),
        check('market_state_sequence', sql`${table.sequence} >= 0`),
    ],
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
    author: one(users, { fields: [resources.author_id], references: [users.id] }),
    approvedVersion: one(resourceVersions, {
        fields: [resources.approved_version_id],
        references: [resourceVersions.id],
        relationName: 'approvedVersion',
    }),
    versions: many(resourceVersions, { relationName: 'resourceVersions' }),
    uploads: many(uploadReservations),
    revocation: one(marketRevocations),
}));
export const resourceVersionsRelations = relations(resourceVersions, ({ one }) => ({
    resource: one(resources, {
        fields: [resourceVersions.resource_id],
        references: [resources.id],
        relationName: 'resourceVersions',
    }),
    reviewer: one(users, { fields: [resourceVersions.reviewer_id], references: [users.id] }),
}));
export const uploadReservationsRelations = relations(uploadReservations, ({ one }) => ({
    user: one(users, { fields: [uploadReservations.user_id], references: [users.id] }),
    resource: one(resources, { fields: [uploadReservations.resource_id], references: [resources.id] }),
}));
export const marketRevocationsRelations = relations(marketRevocations, ({ one }) => ({
    resource: one(resources, { fields: [marketRevocations.resource_id], references: [resources.id] }),
}));

export type ResourceRow = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ResourceVersionRow = typeof resourceVersions.$inferSelect;
export type NewResourceVersion = typeof resourceVersions.$inferInsert;
export type UploadReservationRow = typeof uploadReservations.$inferSelect;
export type NewUploadReservation = typeof uploadReservations.$inferInsert;
export type ArchiveCleanupRow = typeof archiveCleanup.$inferSelect;
export type NewArchiveCleanup = typeof archiveCleanup.$inferInsert;
export type MarketRevocationRow = typeof marketRevocations.$inferSelect;
export type NewMarketRevocation = typeof marketRevocations.$inferInsert;
export type MarketStateRow = typeof marketState.$inferSelect;
export type NewMarketState = typeof marketState.$inferInsert;
