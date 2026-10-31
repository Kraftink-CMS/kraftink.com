import type { IpPolicy } from '../../../shared/ip';

export interface SiteKeyState {
    hasKey: boolean;
    prefix: string | null;
    allowedIps: string[];
    ipLimit: number;
    ipChangedAt: number | null;
    nextIpChangeAt: number | null;
    ipPolicy: IpPolicy;
    allowedNetworks: string[];
    clientIp: string;
}

export interface AccountProfile {
    createdAt: number;
    emailChangedAt: number | null;
    usernameChangedAt: number | null;
    nextEmailChangeAt: number | null;
    nextUsernameChangeAt: number | null;
    pendingEmail: { email: string; expiresAt: number } | null;
}

export interface Order {
    id: string;
    resource_name: string;
    seller_name: string;
    amount_cents: number;
    currency: string;
    status: string;
    document_available: number;
    created_at: number;
}

export interface Purchase {
    resource_id: string;
    name: string;
    resource_name: string;
    version: string | null;
    type: string;
    status: string;
    access_status: string;
    order_id: string;
}

export interface PaymentDocument {
    invoiceUrl: string | null;
}

export interface AccountActions {
    busy: boolean;
    action: (work: () => Promise<void>) => Promise<void>;
    setNotice: (message: string) => void;
}
