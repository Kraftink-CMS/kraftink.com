import { relations, sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './accounts';

export const announcements = sqliteTable(
    'announcements',
    {
        id: text('id').primaryKey(),
        title_json: text('title_json').notNull(),
        body_json: text('body_json').notNull(),
        severity: text('severity', { enum: ['info', 'warning', 'danger'] }).notNull(),
        url: text('url'),
        starts_at: integer('starts_at').notNull(),
        expires_at: integer('expires_at').notNull(),
        created_by: text('created_by')
            .notNull()
            .references(() => users.id),
        created_at: integer('created_at').notNull(),
        updated_at: integer('updated_at').notNull(),
        deleted_at: integer('deleted_at'),
    },
    (table) => [check('announcements_severity', sql`${table.severity} IN ('info', 'warning', 'danger')`)],
);

export const announcementState = sqliteTable(
    'announcement_state',
    {
        id: integer('id').primaryKey(),
        sequence: integer('sequence').notNull().default(0),
        issued_at: integer('issued_at').notNull().default(0),
        active_ids: text('active_ids').notNull().default(''),
    },
    (table) => [check('announcement_state_singleton', sql`${table.id} = 1`)],
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
    creator: one(users, { fields: [announcements.created_by], references: [users.id] }),
}));

export type AnnouncementRow = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementStateRow = typeof announcementState.$inferSelect;
export type NewAnnouncementState = typeof announcementState.$inferInsert;
