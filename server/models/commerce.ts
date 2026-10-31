import { relations, sql } from 'drizzle-orm';
import {
    check,
    foreignKey,
    index,
    integer,
    primaryKey,
    sqliteTable,
    text,
    unique,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { users } from './accounts';
import { resources } from './resources';

export const sellerAccounts = sqliteTable(
    'seller_accounts',
    {
        user_id: text('user_id')
            .primaryKey()
            .references(() => users.id),
        stripe_account_id: text('stripe_account_id').unique(),
        charges_enabled: integer('charges_enabled').$type<0 | 1>().notNull().default(0),
        payouts_enabled: integer('payouts_enabled').$type<0 | 1>().notNull().default(0),
        details_submitted: integer('details_submitted').$type<0 | 1>().notNull().default(0),
        business_type: text('business_type'),
        legal_name: text('legal_name'),
        country: text('country'),
        disabled_at: integer('disabled_at'),
        created_at: integer('created_at').notNull(),
        updated_at: integer('updated_at').notNull(),
    },
    (table) => [
        check('seller_accounts_charges', sql`${table.charges_enabled} IN (0, 1)`),
        check('seller_accounts_payouts', sql`${table.payouts_enabled} IN (0, 1)`),
        check('seller_accounts_details', sql`${table.details_submitted} IN (0, 1)`),
    ],
);

export const orders = sqliteTable(
    'orders',
    {
        id: text('id').primaryKey(),
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        resource_id: text('resource_id')
            .notNull()
            .references(() => resources.id),
        seller_id: text('seller_id')
            .notNull()
            .references(() => users.id),
        connected_account_id: text('connected_account_id').notNull(),
        resource_name: text('resource_name').notNull(),
        seller_name: text('seller_name').notNull(),
        seller_email: text('seller_email').notNull(),
        amount_cents: integer('amount_cents').notNull(),
        currency: text('currency').notNull(),
        status: text('status', { enum: ['created', 'paid', 'failed', 'expired', 'refunded', 'disputed'] })
            .notNull()
            .default('created'),
        stripe_session_id: text('stripe_session_id').unique(),
        checkout_closed_at: integer('checkout_closed_at'),
        stripe_payment_intent_id: text('stripe_payment_intent_id'),
        stripe_charge_id: text('stripe_charge_id'),
        stripe_invoice_id: text('stripe_invoice_id'),
        stripe_event_created: integer('stripe_event_created').notNull().default(0),
        stripe_last_event: text('stripe_last_event'),
        payment_revision: integer('payment_revision').notNull().default(0),
        invoice_url: text('invoice_url'),
        created_at: integer('created_at').notNull(),
        paid_at: integer('paid_at'),
        updated_at: integer('updated_at').notNull(),
    },
    (table) => [
        index('orders_buyer').on(table.user_id, sql`${table.created_at} DESC`),
        unique('orders_entitlement_identity').on(table.id, table.user_id, table.resource_id),
        index('orders_seller').on(table.seller_id, sql`${table.created_at} DESC`),
        index('orders_statistics')
            .on(table.currency, table.paid_at)
            .where(sql`${table.paid_at} IS NOT NULL`),
        index('orders_payment').on(table.connected_account_id, table.stripe_payment_intent_id),
        index('orders_charge').on(table.connected_account_id, table.stripe_charge_id),
        index('orders_checkout_expiry')
            .on(table.updated_at, table.id)
            .where(
                sql`${table.status} = 'expired' AND ${table.stripe_session_id} IS NOT NULL AND ${table.checkout_closed_at} IS NULL`,
            ),
        uniqueIndex('orders_one_current')
            .on(table.user_id, table.resource_id)
            .where(sql`${table.status} IN ('created', 'paid')`),
        check('orders_amount', sql`${table.amount_cents} > 0`),
        check(
            'orders_status',
            sql`${table.status} IN ('created', 'paid', 'failed', 'expired', 'refunded', 'disputed')`,
        ),
    ],
);

export const entitlements = sqliteTable(
    'entitlements',
    {
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        resource_id: text('resource_id')
            .notNull()
            .references(() => resources.id),
        order_id: text('order_id').notNull(),
        status: text('status', { enum: ['active', 'revoked'] }).notNull(),
        created_at: integer('created_at').notNull(),
        updated_at: integer('updated_at').notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.user_id, table.resource_id] }),
        foreignKey({
            name: 'entitlements_order_identity',
            columns: [table.order_id, table.user_id, table.resource_id],
            foreignColumns: [orders.id, orders.user_id, orders.resource_id],
        }),
        check('entitlements_status', sql`${table.status} IN ('active', 'revoked')`),
    ],
);

export const stripeEvents = sqliteTable('stripe_events', {
    id: text('id').primaryKey(),
    account_id: text('account_id'),
    type: text('type').notNull(),
    created_at: integer('created_at').notNull(),
    processed_at: integer('processed_at'),
});

export const sellerAccountsRelations = relations(sellerAccounts, ({ one }) => ({
    user: one(users, { fields: [sellerAccounts.user_id], references: [users.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
    buyer: one(users, { fields: [orders.user_id], references: [users.id], relationName: 'orderBuyer' }),
    seller: one(users, { fields: [orders.seller_id], references: [users.id], relationName: 'orderSeller' }),
    resource: one(resources, { fields: [orders.resource_id], references: [resources.id] }),
    entitlements: many(entitlements),
}));
export const entitlementsRelations = relations(entitlements, ({ one }) => ({
    user: one(users, { fields: [entitlements.user_id], references: [users.id] }),
    resource: one(resources, { fields: [entitlements.resource_id], references: [resources.id] }),
    order: one(orders, { fields: [entitlements.order_id], references: [orders.id] }),
}));

export type SellerAccountRow = typeof sellerAccounts.$inferSelect;
export type NewSellerAccount = typeof sellerAccounts.$inferInsert;
export type OrderRow = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type EntitlementRow = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;
export type StripeEventRow = typeof stripeEvents.$inferSelect;
export type NewStripeEvent = typeof stripeEvents.$inferInsert;
