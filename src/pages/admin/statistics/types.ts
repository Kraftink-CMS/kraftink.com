export interface SalesSummary {
    paidOrders: number;
    paidVolumeCents: number;
    averageOrderCents: number;
    buyers: number;
    refundedOrders: number;
    disputedOrders: number;
}

export interface SalesStatistics {
    generatedAt: number;
    timeZone: 'Europe/Paris';
    currency: string;
    currencies: string[];
    range: { from: string; to: string; startAt: number; endAt: number };
    global: SalesSummary;
    period: SalesSummary;
    monthly: Array<SalesSummary & { month: string }>;
    topResources: Array<{ resourceId: string; name: string; paidOrders: number; paidVolumeCents: number }>;
    topSellers: Array<{ sellerId: string; username: string; paidOrders: number; paidVolumeCents: number }>;
}
