import { useCallback, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { Order, Purchase, PaymentDocument } from './types';

export function useAccountCommerce() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [ordersCursor, setOrdersCursor] = useState<string | null>(null);
    const [purchasesCursor, setPurchasesCursor] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Record<string, PaymentDocument>>({});
    const commerceInitialized = useRef(false);
    const latestOrders = useRef<Order[]>([]);
    const resetCommerce = useCallback(() => {
        commerceInitialized.current = false;
    }, []);

    const loadCommerce = useCallback(async (signal?: AbortSignal, replace = false) => {
        const [ordersData, purchasesData] = await Promise.all([
            api<{ orders: Order[]; nextCursor: string | null }>('/api/account/orders', { signal }),
            api<{ purchases: Purchase[]; nextCursor: string | null }>('/api/account/purchases', { signal }),
        ]);
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }
        const initial = !commerceInitialized.current;
        latestOrders.current = ordersData.orders;
        setOrders((current) =>
            initial || replace
                ? ordersData.orders
                : [
                      ...ordersData.orders,
                      ...current.filter((order) => !ordersData.orders.some((updated) => updated.id === order.id)),
                  ],
        );
        setPurchases((current) =>
            initial || replace
                ? purchasesData.purchases
                : [
                      ...purchasesData.purchases,
                      ...current.filter(
                          (purchase) =>
                              !purchasesData.purchases.some((updated) => updated.resource_id === purchase.resource_id),
                      ),
                  ],
        );
        if (initial || replace) {
            setOrdersCursor(ordersData.nextCursor);
            setPurchasesCursor(purchasesData.nextCursor);
        }
        commerceInitialized.current = true;
        return ordersData.orders;
    }, []);

    return {
        orders,
        setOrders,
        purchases,
        setPurchases,
        ordersCursor,
        setOrdersCursor,
        purchasesCursor,
        setPurchasesCursor,
        documents,
        setDocuments,
        latestOrders,
        loadCommerce,
        resetCommerce,
    };
}

export type AccountCommerce = ReturnType<typeof useAccountCommerce>;
