CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE
        CHECK (length(username) BETWEEN 3 AND 30 AND username NOT GLOB '*[^A-Za-z0-9_.-]*' AND substr(username, 1, 1) GLOB '[A-Za-z0-9_]'),
    password_hash TEXT,
    role TEXT CHECK (role IS NULL OR role IN ('creator', 'moderator', 'admin')),
    github_id TEXT UNIQUE,
    email_verified_at INTEGER,
    email_changed_at INTEGER,
    username_changed_at INTEGER,
    banned_at INTEGER,
    banned_reason TEXT,
    max_upload_bytes INTEGER CHECK (max_upload_bytes IS NULL OR max_upload_bytes BETWEEN 1048576 AND 104857600),
    two_factor_secret TEXT,
    two_factor_enabled_at INTEGER,
    two_factor_pending_session_id TEXT,
    two_factor_pending_expires_at INTEGER,
    two_factor_last_step INTEGER NOT NULL DEFAULT -1,
    two_factor_revision TEXT,
    two_factor_last_verification TEXT,
    terms_accepted_at INTEGER,
    terms_version TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX users_role ON users(role, banned_at);
CREATE INDEX users_two_factor_pending_expiry ON users(two_factor_pending_expires_at)
    WHERE two_factor_enabled_at IS NULL AND two_factor_pending_expires_at IS NOT NULL;

CREATE TRIGGER protect_last_admin_grade
BEFORE UPDATE OF role ON users
WHEN OLD.role = 'admin' AND NEW.role IS NOT 'admin' AND OLD.banned_at IS NULL
    AND (SELECT COUNT(*) FROM users WHERE role = 'admin' AND banned_at IS NULL) <= 1
BEGIN
    SELECT RAISE(ABORT, 'last_admin_protected');
END;

CREATE TRIGGER protect_last_admin_ban
BEFORE UPDATE OF banned_at ON users
WHEN OLD.banned_at IS NULL AND NEW.banned_at IS NOT NULL
    AND OLD.role = 'admin'
    AND (SELECT COUNT(*) FROM users WHERE role = 'admin' AND banned_at IS NULL) <= 1
BEGIN
    SELECT RAISE(ABORT, 'last_admin_protected');
END;

CREATE TRIGGER protect_last_admin_deletion
BEFORE DELETE ON users
WHEN OLD.role = 'admin' AND OLD.banned_at IS NULL
    AND (SELECT COUNT(*) FROM users WHERE role = 'admin' AND banned_at IS NULL) <= 1
BEGIN
    SELECT RAISE(ABORT, 'last_admin_protected');
END;

CREATE TABLE sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    csrf_token TEXT NOT NULL,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('password', 'github')),
    two_factor_revision TEXT,
    remember INTEGER NOT NULL DEFAULT 0 CHECK (remember IN (0, 1)),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user_id ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);

CREATE TABLE password_resets (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    created_at INTEGER NOT NULL
);
CREATE INDEX password_resets_user ON password_resets(user_id);
CREATE INDEX password_resets_expiry ON password_resets(expires_at);

CREATE TABLE email_verifications (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    created_at INTEGER NOT NULL
);
CREATE INDEX email_verifications_expiry ON email_verifications(expires_at);

CREATE TABLE email_changes (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    previous_email TEXT NOT NULL COLLATE NOCASE,
    new_email TEXT NOT NULL COLLATE NOCASE,
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX email_changes_pending_user ON email_changes(user_id) WHERE consumed_at IS NULL;
CREATE INDEX email_changes_expiry ON email_changes(expires_at);

CREATE TABLE oauth_states (
    state_hash TEXT PRIMARY KEY NOT NULL,
    browser_hash TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'link', 'reauthenticate')),
    action_purpose TEXT,
    return_path TEXT NOT NULL DEFAULT '/account',
    remember INTEGER NOT NULL DEFAULT 0 CHECK (remember IN (0, 1)),
    terms_accepted_at INTEGER,
    terms_version TEXT,
    user_id TEXT REFERENCES users(id),
    session_id TEXT,
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER
);
CREATE INDEX oauth_states_expiry ON oauth_states(expires_at);

CREATE TABLE authentication_challenges (
    token_hash TEXT PRIMARY KEY NOT NULL,
    browser_hash TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    auth_method TEXT NOT NULL CHECK (auth_method IN ('password', 'github')),
    remember INTEGER NOT NULL DEFAULT 0 CHECK (remember IN (0, 1)),
    revision TEXT NOT NULL,
    return_path TEXT NOT NULL DEFAULT '/account',
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    completion_id TEXT
);
CREATE INDEX authentication_challenges_expiry ON authentication_challenges(expires_at);
CREATE INDEX authentication_challenges_user ON authentication_challenges(user_id);
CREATE INDEX authentication_challenges_browser ON authentication_challenges(browser_hash);

CREATE TABLE recovery_codes (
    code_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    revision TEXT NOT NULL,
    consumed_at INTEGER,
    consumption_id TEXT,
    created_at INTEGER NOT NULL
);
CREATE INDEX recovery_codes_user ON recovery_codes(user_id, revision);

CREATE TABLE sensitive_actions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    session_id TEXT NOT NULL REFERENCES sessions(id),
    purpose TEXT NOT NULL,
    auth_method TEXT CHECK (auth_method IS NULL OR auth_method IN ('password', 'github', 'two-factor')),
    two_factor_revision TEXT,
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER
);
CREATE INDEX sensitive_actions_expiry ON sensitive_actions(expires_at);
CREATE INDEX sensitive_actions_session ON sensitive_actions(session_id);

CREATE TABLE site_licenses (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id),
    key_hash TEXT UNIQUE,
    key_prefix TEXT,
    ip_policy TEXT NOT NULL DEFAULT 'addresses' CHECK (ip_policy IN ('addresses', 'networks')),
    allowed_ips_json TEXT NOT NULL DEFAULT '[]'
        CHECK (json_valid(allowed_ips_json) AND json_type(allowed_ips_json) = 'array' AND json_array_length(allowed_ips_json) <= 100),
    allowed_networks_json TEXT NOT NULL DEFAULT '[]'
        CHECK (json_valid(allowed_networks_json) AND json_type(allowed_networks_json) = 'array' AND json_array_length(allowed_networks_json) <= 100),
    ip_limit INTEGER NOT NULL DEFAULT 1 CHECK (ip_limit BETWEEN 1 AND 100),
    ip_changed_at INTEGER,
    revoked_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CONSTRAINT site_license_policy_exclusive CHECK (
        (ip_policy = 'addresses' AND json_array_length(allowed_networks_json) = 0)
        OR (ip_policy = 'networks' AND json_array_length(allowed_ips_json) = 0
            AND json_array_length(allowed_networks_json) > 0 AND ip_limit = 1)),
    CONSTRAINT site_license_ip_limit CHECK (json_array_length(allowed_ips_json) <= ip_limit)
);

CREATE TABLE resources (
    id TEXT PRIMARY KEY NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id),
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('plugin', 'theme', 'game')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    price_cents INTEGER NOT NULL CHECK (price_cents BETWEEN 50 AND 1000000),
    currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'withdrawn', 'revoked')),
    approved_version_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    CONSTRAINT resources_approved_version_resource FOREIGN KEY (id, approved_version_id) REFERENCES resource_versions(resource_id, id)
);
CREATE INDEX resources_author ON resources(author_id, created_at DESC);
CREATE INDEX resources_public ON resources(status, name);

CREATE TABLE resource_versions (
    id TEXT PRIMARY KEY NOT NULL,
    resource_id TEXT NOT NULL REFERENCES resources(id),
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'superseded', 'cancelled')),
    payload_json TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    archive_key TEXT,
    image_key TEXT,
    image_mime TEXT CHECK (image_mime IS NULL OR image_mime IN ('image/png', 'image/jpeg', 'image/webp')),
    image_size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (image_size_bytes >= 0),
    sha256 TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    reviewer_id TEXT REFERENCES users(id),
    review_note TEXT,
    review_token TEXT,
    created_at INTEGER NOT NULL,
    reviewed_at INTEGER,
    UNIQUE(resource_id, id),
    UNIQUE(resource_id, version)
);
CREATE UNIQUE INDEX resource_versions_pending ON resource_versions(resource_id) WHERE status = 'pending';
CREATE INDEX resource_versions_review ON resource_versions(status, created_at);

CREATE TABLE upload_reservations (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    resource_id TEXT NOT NULL REFERENCES resources(id),
    archive_key TEXT NOT NULL UNIQUE,
    image_key TEXT,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'stored', 'released')),
    created_at INTEGER NOT NULL
);
CREATE INDEX upload_reservations_quota ON upload_reservations(status, user_id);
CREATE UNIQUE INDEX upload_reservations_resource ON upload_reservations(resource_id) WHERE status = 'reserved';

CREATE TABLE archive_cleanup (
    archive_key TEXT PRIMARY KEY NOT NULL,
    image_key TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE market_revocations (
    resource_id TEXT PRIMARY KEY NOT NULL REFERENCES resources(id),
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('plugin', 'theme', 'game')),
    versions_json TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE market_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    sequence INTEGER NOT NULL DEFAULT 0 CHECK (sequence >= 0)
);
INSERT INTO market_state (id, sequence) VALUES (1, 0);

CREATE TABLE seller_accounts (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id),
    stripe_account_id TEXT UNIQUE,
    charges_enabled INTEGER NOT NULL DEFAULT 0 CHECK (charges_enabled IN (0, 1)),
    payouts_enabled INTEGER NOT NULL DEFAULT 0 CHECK (payouts_enabled IN (0, 1)),
    details_submitted INTEGER NOT NULL DEFAULT 0 CHECK (details_submitted IN (0, 1)),
    business_type TEXT,
    legal_name TEXT,
    country TEXT,
    disabled_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE orders (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    resource_id TEXT NOT NULL REFERENCES resources(id),
    seller_id TEXT NOT NULL REFERENCES users(id),
    connected_account_id TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'expired', 'refunded', 'disputed')),
    stripe_session_id TEXT UNIQUE,
    checkout_closed_at INTEGER,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    stripe_invoice_id TEXT,
    stripe_event_created INTEGER NOT NULL DEFAULT 0,
    stripe_last_event TEXT,
    payment_revision INTEGER NOT NULL DEFAULT 0,
    invoice_url TEXT,
    created_at INTEGER NOT NULL,
    paid_at INTEGER,
    updated_at INTEGER NOT NULL,
    UNIQUE(id, user_id, resource_id)
);
CREATE INDEX orders_buyer ON orders(user_id, created_at DESC);
CREATE INDEX orders_seller ON orders(seller_id, created_at DESC);
CREATE INDEX orders_statistics ON orders(currency, paid_at) WHERE paid_at IS NOT NULL;
CREATE INDEX orders_payment ON orders(connected_account_id, stripe_payment_intent_id);
CREATE INDEX orders_charge ON orders(connected_account_id, stripe_charge_id);
CREATE INDEX orders_checkout_expiry ON orders(updated_at, id) WHERE status = 'expired' AND stripe_session_id IS NOT NULL AND checkout_closed_at IS NULL;
CREATE UNIQUE INDEX orders_one_current ON orders(user_id, resource_id) WHERE status IN ('created', 'paid');

CREATE TABLE entitlements (
    user_id TEXT NOT NULL REFERENCES users(id),
    resource_id TEXT NOT NULL REFERENCES resources(id),
    order_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, resource_id),
    CONSTRAINT entitlements_order_identity FOREIGN KEY (order_id, user_id, resource_id) REFERENCES orders(id, user_id, resource_id)
);

CREATE TABLE stripe_events (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT,
    type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    processed_at INTEGER
);

CREATE TABLE announcements (
    id TEXT PRIMARY KEY NOT NULL,
    title_json TEXT NOT NULL,
    body_json TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'danger')),
    url TEXT,
    starts_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);

CREATE TABLE announcement_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    sequence INTEGER NOT NULL DEFAULT 0,
    issued_at INTEGER NOT NULL DEFAULT 0,
    active_ids TEXT NOT NULL DEFAULT ''
);
INSERT INTO announcement_state (id, sequence, issued_at) VALUES (1, 0, 0);

CREATE TABLE audit_log (
    id TEXT PRIMARY KEY NOT NULL,
    actor_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details_json TEXT NOT NULL DEFAULT '{}',
    ip TEXT,
    created_at INTEGER NOT NULL
);
CREATE INDEX audit_log_actor ON audit_log(actor_id, created_at);
CREATE INDEX audit_log_target ON audit_log(target, created_at);

CREATE TABLE rate_limits (
    key TEXT PRIMARY KEY NOT NULL,
    count INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE INDEX rate_limits_expiry ON rate_limits(expires_at);

CREATE TABLE metadata_cache (
    key TEXT PRIMARY KEY NOT NULL,
    payload_json TEXT,
    fetched_at INTEGER,
    retry_at INTEGER NOT NULL DEFAULT 0
);
