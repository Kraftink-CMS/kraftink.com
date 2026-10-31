export interface Resource {
    id: string;
    slug: string;
    name: string;
    description: string;
    type: 'plugin' | 'theme' | 'game';
    price_cents: number;
    currency: string;
    status: string;
    published_version: string | null;
    pending_count: number;
}

export interface Version {
    id: string;
    version: string;
    status: string;
    review_note: string | null;
    created_at: number;
}

export interface Seller {
    stripe_account_id: string | null;
    charges_enabled: number;
    payouts_enabled: number;
    details_submitted: number;
    business_type: string | null;
    country: string | null;
    disabled_at: number | null;
}

export interface SellerStatus {
    seller: Seller | null;
    managedByPlatform: boolean;
    accountReady: boolean;
    taxReady: boolean;
    ready: boolean;
    reason: 'seller_not_ready' | 'seller_tax_not_ready' | 'payments_unavailable' | null;
}

export interface Sale {
    id: string;
    resource_name: string;
    amount_cents: number;
    currency: string;
    status: string;
    created_at: number;
}
