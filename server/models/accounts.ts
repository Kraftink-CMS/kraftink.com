import { relations, sql } from 'drizzle-orm';
import { check, customType, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const nocaseText = customType<{ data: string; driverData: string }>({
    dataType: () => 'text COLLATE NOCASE',
});

export const users = sqliteTable(
    'users',
    {
        id: text('id').primaryKey(),
        email: nocaseText('email').notNull().unique(),
        username: nocaseText('username').notNull().unique(),
        password_hash: text('password_hash'),
        role: text('role', { enum: ['creator', 'moderator', 'admin'] }),
        github_id: text('github_id').unique(),
        email_verified_at: integer('email_verified_at'),
        email_changed_at: integer('email_changed_at'),
        username_changed_at: integer('username_changed_at'),
        banned_at: integer('banned_at'),
        banned_reason: text('banned_reason'),
        max_upload_bytes: integer('max_upload_bytes'),
        two_factor_secret: text('two_factor_secret'),
        two_factor_enabled_at: integer('two_factor_enabled_at'),
        two_factor_pending_session_id: text('two_factor_pending_session_id'),
        two_factor_pending_expires_at: integer('two_factor_pending_expires_at'),
        two_factor_last_step: integer('two_factor_last_step').notNull().default(-1),
        two_factor_revision: text('two_factor_revision'),
        two_factor_last_verification: text('two_factor_last_verification'),
        terms_accepted_at: integer('terms_accepted_at'),
        terms_version: text('terms_version'),
        created_at: integer('created_at').notNull(),
        updated_at: integer('updated_at').notNull(),
    },
    (table) => [
        index('users_role').on(table.role, table.banned_at),
        check('users_role', sql`${table.role} IS NULL OR ${table.role} IN ('creator', 'moderator', 'admin')`),
        index('users_two_factor_pending_expiry')
            .on(table.two_factor_pending_expires_at)
            .where(sql`${table.two_factor_enabled_at} IS NULL AND ${table.two_factor_pending_expires_at} IS NOT NULL`),
        check(
            'users_username',
            sql`length(${table.username}) BETWEEN 3 AND 30 AND ${table.username} NOT GLOB '*[^A-Za-z0-9_.-]*' AND substr(${table.username}, 1, 1) GLOB '[A-Za-z0-9_]'`,
        ),
        check(
            'users_max_upload_bytes',
            sql`${table.max_upload_bytes} IS NULL OR ${table.max_upload_bytes} BETWEEN 1048576 AND 104857600`,
        ),
    ],
);

export const sessions = sqliteTable(
    'sessions',
    {
        id: text('id').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        csrf_token: text('csrf_token').notNull(),
        auth_method: text('auth_method', { enum: ['password', 'github'] }).notNull(),
        two_factor_revision: text('two_factor_revision'),
        remember: integer('remember').$type<0 | 1>().notNull().default(0),
        created_at: integer('created_at').notNull(),
        expires_at: integer('expires_at').notNull(),
    },
    (table) => [
        index('sessions_user_id').on(table.user_id),
        index('sessions_expiry').on(table.expires_at),
        check('sessions_auth_method', sql`${table.auth_method} IN ('password', 'github')`),
        check('sessions_remember', sql`${table.remember} IN (0, 1)`),
    ],
);

export const passwordResets = sqliteTable(
    'password_resets',
    {
        token_hash: text('token_hash').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        expires_at: integer('expires_at').notNull(),
        consumed_at: integer('consumed_at'),
        created_at: integer('created_at').notNull(),
    },
    (table) => [index('password_resets_user').on(table.user_id), index('password_resets_expiry').on(table.expires_at)],
);

export const emailVerifications = sqliteTable(
    'email_verifications',
    {
        token_hash: text('token_hash').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        expires_at: integer('expires_at').notNull(),
        consumed_at: integer('consumed_at'),
        created_at: integer('created_at').notNull(),
    },
    (table) => [index('email_verifications_expiry').on(table.expires_at)],
);

export const emailChanges = sqliteTable(
    'email_changes',
    {
        token_hash: text('token_hash').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        previous_email: nocaseText('previous_email').notNull(),
        new_email: nocaseText('new_email').notNull(),
        expires_at: integer('expires_at').notNull(),
        consumed_at: integer('consumed_at'),
        created_at: integer('created_at').notNull(),
    },
    (table) => [
        uniqueIndex('email_changes_pending_user')
            .on(table.user_id)
            .where(sql`${table.consumed_at} IS NULL`),
        index('email_changes_expiry').on(table.expires_at),
    ],
);

export const oauthStates = sqliteTable(
    'oauth_states',
    {
        state_hash: text('state_hash').primaryKey(),
        browser_hash: text('browser_hash').notNull(),
        code_verifier: text('code_verifier').notNull(),
        purpose: text('purpose', { enum: ['login', 'link', 'reauthenticate'] }).notNull(),
        action_purpose: text('action_purpose'),
        return_path: text('return_path').notNull().default('/account'),
        remember: integer('remember').$type<0 | 1>().notNull().default(0),
        terms_accepted_at: integer('terms_accepted_at'),
        terms_version: text('terms_version'),
        user_id: text('user_id').references(() => users.id),
        session_id: text('session_id'),
        expires_at: integer('expires_at').notNull(),
        consumed_at: integer('consumed_at'),
    },
    (table) => [
        index('oauth_states_expiry').on(table.expires_at),
        check('oauth_states_purpose', sql`${table.purpose} IN ('login', 'link', 'reauthenticate')`),
        check('oauth_states_remember', sql`${table.remember} IN (0, 1)`),
    ],
);

export const sensitiveActions = sqliteTable(
    'sensitive_actions',
    {
        token_hash: text('token_hash').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        session_id: text('session_id')
            .notNull()
            .references(() => sessions.id),
        purpose: text('purpose').notNull(),
        auth_method: text('auth_method', { enum: ['password', 'github', 'two-factor'] }),
        two_factor_revision: text('two_factor_revision'),
        expires_at: integer('expires_at').notNull(),
        consumed_at: integer('consumed_at'),
    },
    (table) => [
        index('sensitive_actions_expiry').on(table.expires_at),
        index('sensitive_actions_session').on(table.session_id),
        check(
            'sensitive_actions_auth_method',
            sql`${table.auth_method} IS NULL OR ${table.auth_method} IN ('password', 'github', 'two-factor')`,
        ),
    ],
);

export const siteLicenses = sqliteTable(
    'site_licenses',
    {
        user_id: text('user_id')
            .primaryKey()
            .references(() => users.id),
        key_hash: text('key_hash').unique(),
        key_prefix: text('key_prefix'),
        ip_policy: text('ip_policy', { enum: ['addresses', 'networks'] })
            .notNull()
            .default('addresses'),
        allowed_ips_json: text('allowed_ips_json').notNull().default('[]'),
        allowed_networks_json: text('allowed_networks_json').notNull().default('[]'),
        ip_limit: integer('ip_limit').notNull().default(1),
        ip_changed_at: integer('ip_changed_at'),
        revoked_at: integer('revoked_at'),
        created_at: integer('created_at').notNull(),
        updated_at: integer('updated_at').notNull(),
    },
    (table) => [
        check(
            'site_licenses_allowed_ips',
            sql`json_valid(${table.allowed_ips_json}) AND json_type(${table.allowed_ips_json}) = 'array' AND json_array_length(${table.allowed_ips_json}) <= 100`,
        ),
        check('site_licenses_ip_limit', sql`${table.ip_limit} BETWEEN 1 AND 100`),
        check('site_licenses_ip_policy', sql`${table.ip_policy} IN ('addresses', 'networks')`),
        check(
            'site_licenses_allowed_networks',
            sql`json_valid(${table.allowed_networks_json}) AND json_type(${table.allowed_networks_json}) = 'array' AND json_array_length(${table.allowed_networks_json}) <= 100`,
        ),
        check(
            'site_license_policy_exclusive',
            sql`(${table.ip_policy} = 'addresses' AND json_array_length(${table.allowed_networks_json}) = 0)
            OR (${table.ip_policy} = 'networks' AND json_array_length(${table.allowed_ips_json}) = 0
                AND json_array_length(${table.allowed_networks_json}) > 0 AND ${table.ip_limit} = 1)`,
        ),
        check('site_license_ip_limit', sql`json_array_length(${table.allowed_ips_json}) <= ${table.ip_limit}`),
    ],
);

export const usersRelations = relations(users, ({ many, one }) => ({
    sessions: many(sessions),
    passwordResets: many(passwordResets),
    emailVerifications: many(emailVerifications),
    emailChanges: many(emailChanges),
    oauthStates: many(oauthStates),
    sensitiveActions: many(sensitiveActions),
    siteLicense: one(siteLicenses),
}));
export const sessionsRelations = relations(sessions, ({ one, many }) => ({
    user: one(users, { fields: [sessions.user_id], references: [users.id] }),
    sensitiveActions: many(sensitiveActions),
}));
export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
    user: one(users, { fields: [passwordResets.user_id], references: [users.id] }),
}));
export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
    user: one(users, { fields: [emailVerifications.user_id], references: [users.id] }),
}));
export const emailChangesRelations = relations(emailChanges, ({ one }) => ({
    user: one(users, { fields: [emailChanges.user_id], references: [users.id] }),
}));
export const oauthStatesRelations = relations(oauthStates, ({ one }) => ({
    user: one(users, { fields: [oauthStates.user_id], references: [users.id] }),
}));
export const sensitiveActionsRelations = relations(sensitiveActions, ({ one }) => ({
    user: one(users, { fields: [sensitiveActions.user_id], references: [users.id] }),
    session: one(sessions, { fields: [sensitiveActions.session_id], references: [sessions.id] }),
}));
export const siteLicensesRelations = relations(siteLicenses, ({ one }) => ({
    user: one(users, { fields: [siteLicenses.user_id], references: [users.id] }),
}));

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type PasswordResetRow = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
export type EmailVerificationRow = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type EmailChangeRow = typeof emailChanges.$inferSelect;
export type NewEmailChange = typeof emailChanges.$inferInsert;
export type OAuthStateRow = typeof oauthStates.$inferSelect;
export type NewOAuthState = typeof oauthStates.$inferInsert;
export type SensitiveActionRow = typeof sensitiveActions.$inferSelect;
export type NewSensitiveAction = typeof sensitiveActions.$inferInsert;
export type SiteLicenseRow = typeof siteLicenses.$inferSelect;
export type NewSiteLicense = typeof siteLicenses.$inferInsert;
