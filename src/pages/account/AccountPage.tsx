import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { accountCopy } from '../../lib/translations';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { ErrorNotice, PageTitle } from '../../components/UI';
import type { SiteKeyState, AccountProfile, Order } from './types';
import { useAccountCommerce } from './useAccountCommerce';
import { PurchasesPanel } from './PurchasesPanel';
import { OrdersPanel } from './OrdersPanel';
import { SiteConnectionPanel, useSiteConnection } from './SiteConnectionPanel';
import { ProfilePanel } from './ProfilePanel';
import { TwoFactorPanel } from './TwoFactorPanel';
import { AccountDeletionPanel } from './AccountDeletionPanel';
import { AccountLoading } from './AccountLoading';

export function AccountPage() {
    const { locale, path } = useLocale();
    const location = useLocation();
    const checkoutSearch = new URLSearchParams(location.search);
    const checkoutReturned = checkoutSearch.get('checkout') === 'success';
    const requestedOrder = checkoutSearch.get('order');
    const checkoutOrder =
        requestedOrder && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedOrder)
            ? requestedOrder
            : null;
    const copy = accountCopy[locale];
    const { user } = useSession();
    const userId = user?.id;
    const [tab, setTab] = useState<'purchases' | 'orders' | 'site' | 'profile'>(
        location.state?.accountTab === 'profile' ? 'profile' : 'purchases',
    );
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [notice, setNotice] = useState('');
    const [profile, setProfile] = useState<AccountProfile | null>(null);
    const connection = useSiteConnection();
    const { replaceSite } = connection;
    const commerce = useAccountCommerce();
    const { loadCommerce, latestOrders, resetCommerce } = commerce;
    const [checkoutState, setCheckoutState] = useState<'none' | 'pending' | 'confirmed' | 'delayed' | 'failed'>(
        checkoutReturned ? 'pending' : 'none',
    );
    const [checkoutRefreshing, setCheckoutRefreshing] = useState(false);
    const stopCheckoutPolling = useRef<(() => void) | null>(null);
    const manualCheckoutRefresh = useRef<AbortController | null>(null);
    useEffect(() => {
        if (location.state?.accountTab === 'profile') {
            setTab('profile');
        }
    }, [location.state]);
    const load = useCallback(
        async (signal?: AbortSignal) => {
            const [profileData, siteData] = await Promise.all([
                api<AccountProfile>('/api/account'),
                api<SiteKeyState>('/api/account/site-key'),
                loadCommerce(signal, true),
            ]);
            if (signal?.aborted) {
                return;
            }
            setProfile(profileData);
            replaceSite(siteData);
        },
        [loadCommerce, replaceSite],
    );

    useEffect(() => {
        if (!userId) {
            return;
        }
        let active = true;
        const controller = new AbortController();
        setLoading(true);
        resetCommerce();
        load(controller.signal)
            .catch((failure) => {
                if (active) {
                    setError(failure);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
            controller.abort();
        };
    }, [userId, load, resetCommerce]);

    useEffect(() => {
        if (!userId || !checkoutReturned || loading) {
            return;
        }
        const controller = new AbortController();
        const delays = [1000, 2000, 4000, 8000, 15000];
        let attempt = 0;
        let active = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let deadline: ReturnType<typeof setTimeout> | undefined;
        const stop = () => {
            active = false;
            clearTimeout(timer);
            clearTimeout(deadline);
            controller.abort();
        };
        stopCheckoutPolling.current = stop;
        const settled = (items: Order[]): boolean => {
            const order = checkoutOrder ? items.find((item) => item.id === checkoutOrder) : null;
            if (order?.status === 'paid') {
                setCheckoutState('confirmed');
                stop();
                return true;
            }
            if (order && ['failed', 'expired', 'refunded', 'disputed'].includes(order.status)) {
                setCheckoutState('failed');
                stop();
                return true;
            }
            return false;
        };
        setCheckoutState('pending');
        if (!settled(latestOrders.current)) {
            const poll = async () => {
                try {
                    const data = await loadCommerce(controller.signal);
                    if (!active || settled(data)) {
                        return;
                    }
                } catch {
                    if (!active) {
                        return;
                    }
                }
                if (attempt < delays.length) {
                    timer = setTimeout(() => void poll(), delays[attempt++]);
                } else {
                    setCheckoutState('delayed');
                    stop();
                }
            };
            timer = setTimeout(() => void poll(), delays[attempt++]);
            deadline = setTimeout(() => {
                if (active) {
                    setCheckoutState('delayed');
                    stop();
                }
            }, 31000);
        }
        return () => {
            stop();
            if (stopCheckoutPolling.current === stop) {
                stopCheckoutPolling.current = null;
            }
        };
    }, [userId, checkoutReturned, checkoutOrder, loading, loadCommerce, latestOrders]);

    useEffect(
        () => () => {
            manualCheckoutRefresh.current?.abort();
            manualCheckoutRefresh.current = null;
        },
        [],
    );

    async function refreshCheckout() {
        stopCheckoutPolling.current?.();
        manualCheckoutRefresh.current?.abort();
        const controller = new AbortController();
        manualCheckoutRefresh.current = controller;
        const timeout = setTimeout(() => controller.abort(), 10000);
        setCheckoutRefreshing(true);
        setError(null);
        try {
            const data = await loadCommerce(controller.signal);
            const order = checkoutOrder ? data.find((item) => item.id === checkoutOrder) : null;
            setCheckoutState(
                order?.status === 'paid'
                    ? 'confirmed'
                    : order && ['failed', 'expired', 'refunded', 'disputed'].includes(order.status)
                      ? 'failed'
                      : 'delayed',
            );
        } catch (failure) {
            if (manualCheckoutRefresh.current === controller) {
                setCheckoutState('delayed');
                if (!controller.signal.aborted) {
                    setError(failure);
                }
            }
        } finally {
            clearTimeout(timeout);
            if (manualCheckoutRefresh.current === controller) {
                manualCheckoutRefresh.current = null;
                setCheckoutRefreshing(false);
            }
        }
    }

    if (!user) {
        return <Navigate replace to={path('/login')} />;
    }

    async function action(work: () => Promise<void>) {
        setBusy(true);
        setError(null);
        setNotice('');
        try {
            await work();
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
        }
    }

    const actions = { busy, action, setNotice };

    return (
        <>
            <PageTitle title={copy.account} description={copy.accountDescription} />
            <ErrorNotice error={error} />
            {notice && (
                <div className="alert alert-success" role="status">
                    {notice}
                </div>
            )}
            {checkoutReturned && checkoutState !== 'none' && (
                <div
                    className={`alert ${checkoutState === 'confirmed' ? 'alert-success' : checkoutState === 'failed' ? 'alert-warning' : 'alert-info'}`}
                    role="status"
                    aria-live="polite"
                >
                    <p className="mb-2">
                        {checkoutState === 'confirmed'
                            ? copy.checkoutConfirmed
                            : checkoutState === 'delayed'
                              ? copy.checkoutDelayed
                              : checkoutState === 'failed'
                                ? copy.checkoutNotConfirmed
                                : copy.checkoutPending}
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                        {checkoutState !== 'confirmed' && (
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                type="button"
                                disabled={checkoutRefreshing || loading}
                                onClick={() => void refreshCheckout()}
                            >
                                {checkoutRefreshing ? copy.loading : copy.refreshPurchases}
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            type="button"
                            onClick={() => setTab('orders')}
                        >
                            {copy.viewOrders}
                        </button>
                    </div>
                </div>
            )}
            {!user.emailVerified && (
                <div className="alert alert-warning d-flex flex-wrap align-items-center gap-3">
                    <span>{copy.verifyWarning}</span>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            void action(async () => {
                                await api('/api/auth/resend-verification', { method: 'POST', json: {} });
                                setNotice(copy.verificationSent);
                            })
                        }
                    >
                        {copy.resendVerification}
                    </button>
                </div>
            )}
            <nav className="nav nav-pills gap-2 mb-4" aria-label={copy.account}>
                {(['purchases', 'orders', 'site', 'profile'] as const).map((item) => (
                    <button
                        key={item}
                        className={`nav-link${tab === item ? ' active' : ''}`}
                        type="button"
                        aria-current={tab === item ? 'page' : undefined}
                        onClick={() => setTab(item)}
                    >
                        {copy[item]}
                    </button>
                ))}
            </nav>
            {loading && !profile ? (
                <AccountLoading tab={tab} />
            ) : (
                <>
                    {tab === 'purchases' && (
                        <PurchasesPanel commerce={commerce} actions={actions} onConnectCms={() => setTab('site')} />
                    )}
                    {tab === 'orders' && <OrdersPanel commerce={commerce} actions={actions} />}
                    {tab === 'site' && <SiteConnectionPanel connection={connection} actions={actions} reload={load} />}
                    {tab === 'profile' && (
                        <ProfilePanel profile={profile} onProfileChanged={setProfile} actions={actions} />
                    )}
                </>
            )}
            {tab === 'profile' && (
                <div className="vstack gap-4 mt-4">
                    <TwoFactorPanel key={user.id} />
                    <AccountDeletionPanel key={`deletion-${user.id}`} />
                </div>
            )}
        </>
    );
}
