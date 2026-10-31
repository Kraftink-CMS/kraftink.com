import type { User, Session } from '../shared/auth';
export type { Role, User, Session } from '../shared/auth';

export interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    ASSETS: Fetcher;
    APP_ORIGIN: string;
    ENVIRONMENT: string;
    GITHUB_CATALOGUE_URL?: string;
    GITHUB_RELEASES_URL?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    MAIL_FROM?: string;
    TURNSTILE_SECRET_KEY?: string;
    TURNSTILE_SITE_KEY?: string;
    BOOTSTRAP_ADMIN_EMAIL?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_PLATFORM_ACCOUNT_ID?: string;
    STRIPE_CONNECT_WEBHOOK_SECRET?: string;
    STRIPE_PLATFORM_WEBHOOK_SECRET?: string;
    STRIPE_LIVE_MODE?: string;
    KRAFTINK_SITE_SIGNING_PRIVATE_KEY?: string;
    KRAFTINK_SITE_CACHE_SECRET?: string;
    TWO_FACTOR_ENCRYPTION_KEY?: string;
    MAX_UPLOAD_BYTES?: string;
    MAX_ACCOUNT_STORAGE_BYTES?: string;
    MAX_TOTAL_STORAGE_BYTES?: string;
}

export interface AppEnv {
    Bindings: Env;
    Variables: {
        user: User | null;
        session: Session | null;
    };
}
