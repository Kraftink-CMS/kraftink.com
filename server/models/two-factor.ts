import { relations, sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './accounts';

export const recoveryCodes = sqliteTable(
    'recovery_codes',
    {
        code_hash: text('code_hash').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        revision: text('revision').notNull(),
        consumed_at: integer('consumed_at'),
        consumption_id: text('consumption_id'),
        created_at: integer('created_at').notNull(),
    },
    (table) => [index('recovery_codes_user').on(table.user_id, table.revision)],
);

export const authenticationChallenges = sqliteTable(
    'authentication_challenges',
    {
        token_hash: text('token_hash').primaryKey(),
        browser_hash: text('browser_hash').notNull(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        auth_method: text('auth_method', { enum: ['password', 'github'] }).notNull(),
        remember: integer('remember').$type<0 | 1>().notNull().default(0),
        revision: text('revision').notNull(),
        return_path: text('return_path').notNull().default('/account'),
        expires_at: integer('expires_at').notNull(),
        consumed_at: integer('consumed_at'),
        completion_id: text('completion_id'),
    },
    (table) => [
        index('authentication_challenges_expiry').on(table.expires_at),
        index('authentication_challenges_user').on(table.user_id),
        index('authentication_challenges_browser').on(table.browser_hash),
        check('authentication_challenges_method', sql`${table.auth_method} IN ('password', 'github')`),
        check('authentication_challenges_remember', sql`${table.remember} IN (0, 1)`),
    ],
);

export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
    user: one(users, { fields: [recoveryCodes.user_id], references: [users.id] }),
}));
export const authenticationChallengesRelations = relations(authenticationChallenges, ({ one }) => ({
    user: one(users, { fields: [authenticationChallenges.user_id], references: [users.id] }),
}));
export type RecoveryCodeRow = typeof recoveryCodes.$inferSelect;
export type AuthenticationChallengeRow = typeof authenticationChallenges.$inferSelect;
