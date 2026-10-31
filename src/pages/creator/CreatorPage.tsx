import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useLocale } from '../../lib/i18n';
import { Card, Empty, ErrorNotice, Loading, PageTitle, StatusBadge } from '../../components/UI';
import { workspace } from '../../lib/translations';

import { ArchiveSubmission } from './ArchiveSubmission';
import { ResourceEditor } from './ResourceEditor';
import { LegalNotice } from '../../components/legal/LegalNotice';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import type { Resource, SellerStatus, Sale } from './types';
import { hasRole } from '../../../shared/auth';

export function CreatorPage() {
    const { locale } = useLocale();
    const t = workspace[locale];
    const { user, loading: sessionLoading, sensitive } = useSession();
    const [tab, setTab] = useState<'resources' | 'payments' | 'sales'>('resources');
    const [resources, setResources] = useState<Resource[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [salesCursor, setSalesCursor] = useState<string | null>(null);
    const [sellerState, setSellerState] = useState<SellerStatus>({
        seller: null,
        managedByPlatform: false,
        accountReady: false,
        taxReady: false,
        ready: false,
        reason: 'seller_not_ready',
    });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [success, setSuccess] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const onboarding = useRef(false);
    const { accountReady, taxReady, ready, reason } = sellerState;
    const administrator = hasRole(user, 'admin');
    const managedByPlatform = administrator || sellerState.managedByPlatform;
    const allowed = hasRole(user, 'creator');
    const formatMoney = (value: number, currency = 'EUR') =>
        new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value / 100);

    const reloadResources = useCallback(async () => {
        const data = await api<{ resources: Resource[] }>('/api/creator/resources');
        setResources(data.resources);
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        const results = await Promise.allSettled([
            reloadResources(),
            api<SellerStatus>('/api/creator/stripe/status'),
            api<{ orders: Sale[]; nextCursor: string | null }>('/api/creator/orders'),
        ]);
        if (results[0].status === 'rejected') {
            setError(results[0].reason);
        }
        if (results[1].status === 'fulfilled') {
            setSellerState(results[1].value);
            if (!results[1].value.ready) {
                setCreating(false);
            }
        } else {
            setSellerState((current) => ({
                ...current,
                managedByPlatform: administrator,
                accountReady: false,
                taxReady: false,
                ready: false,
                reason: 'payments_unavailable',
            }));
            setCreating(false);
        }
        if (results[2].status === 'fulfilled') {
            setSales(results[2].value.orders);
            setSalesCursor(results[2].value.nextCursor);
        } else {
            setError(results[2].reason);
        }
        setLoading(false);
    }, [reloadResources, administrator]);

    useEffect(() => {
        if (!sessionLoading && allowed) {
            void reload();
        } else if (!sessionLoading) {
            setLoading(false);
        }
    }, [sessionLoading, user?.id, allowed, reload]);

    useEffect(() => {
        function restore(event: PageTransitionEvent) {
            if (event.persisted && onboarding.current) {
                onboarding.current = false;
                setBusy(false);
                void reload();
            }
        }
        window.addEventListener('pageshow', restore);
        return () => window.removeEventListener('pageshow', restore);
    }, [reload]);

    async function action(callback: () => Promise<void>) {
        setBusy(true);
        setError(null);
        setSuccess(false);
        try {
            await callback();
            setSuccess(true);
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    async function onboard(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (onboarding.current || managedByPlatform) {
            return;
        }
        onboarding.current = true;
        setBusy(true);
        setError(null);
        setSuccess(false);
        try {
            const token = await sensitive('creator.payments');
            const data = await api<{ url: string }>('/api/creator/stripe/onboard', {
                method: 'POST',
                json: {},
                sensitiveToken: token,
            });
            window.location.assign(data.url);
        } catch (failure) {
            setError(failure);
            setBusy(false);
            onboarding.current = false;
        }
    }

    if (sessionLoading) {
        return <Loading />;
    }
    return (
        <>
            <PageTitle title={t.creatorTitle} description={t.creatorDescription}>
                {allowed && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={busy || loading}
                        onClick={() => void reload()}
                    >
                        {t.refresh}
                    </button>
                )}
            </PageTitle>
            {!allowed ? (
                <Empty>{t.creatorRequired}</Empty>
            ) : (
                <>
                    <nav className="nav nav-pills gap-2 mb-4" aria-label={t.creatorTitle}>
                        {(['resources', 'payments', 'sales'] as const).map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`nav-link ${tab === value ? 'active' : ''}`}
                                aria-current={tab === value ? 'page' : undefined}
                                onClick={() => setTab(value)}
                            >
                                {t[value]}
                            </button>
                        ))}
                    </nav>
                    <ErrorNotice error={error} />
                    {success && (
                        <p className="alert alert-success" role="status">
                            {t.success}
                        </p>
                    )}
                    {loading ? (
                        <Loading />
                    ) : (
                        <>
                            {tab === 'resources' && (
                                <div className="vstack gap-4">
                                    {!ready && (
                                        <div className="alert alert-warning mb-0" role="alert">
                                            <p>
                                                {managedByPlatform || reason === 'payments_unavailable'
                                                    ? t.publicationUnavailable
                                                    : t.publicationSetupRequired}
                                            </p>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                disabled={busy}
                                                onClick={() => setTab('payments')}
                                            >
                                                {t.payments}
                                            </button>
                                        </div>
                                    )}
                                    {!creating && (
                                        <Card
                                            title={t.resources}
                                            footer={
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    disabled={busy || !ready}
                                                    onClick={() => setCreating(true)}
                                                >
                                                    {t.create}
                                                </button>
                                            }
                                        >
                                            {resources.length === 0 ? (
                                                <Empty>{t.noResources}</Empty>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table align-middle mb-0">
                                                        <thead className="text-nowrap">
                                                            <tr>
                                                                <th scope="col">{t.name}</th>
                                                                <th scope="col">{t.type}</th>
                                                                <th scope="col">{t.price}</th>
                                                                <th scope="col">{t.status}</th>
                                                                <th scope="col">{t.actions}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {resources.map((resource) => (
                                                                <tr key={resource.id}>
                                                                    <th scope="row">
                                                                        {resource.name}
                                                                        <small className="d-block text-body-secondary">
                                                                            {resource.slug}
                                                                        </small>
                                                                    </th>
                                                                    <td>{t[resource.type]}</td>
                                                                    <td>
                                                                        {formatMoney(
                                                                            resource.price_cents,
                                                                            resource.currency,
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <StatusBadge value={resource.status} />
                                                                        {resource.pending_count > 0 && (
                                                                            <span className="d-block small text-body-secondary">
                                                                                {t.pendingVersion}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            onClick={() => {
                                                                                setSelected(resource.id);
                                                                                setCreating(false);
                                                                            }}
                                                                        >
                                                                            {t.open}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                    {creating && ready && (
                                        <ArchiveSubmission
                                            onCancel={() => setCreating(false)}
                                            onSubmitted={async (id) => {
                                                await reloadResources();
                                                setSelected(id);
                                                setCreating(false);
                                            }}
                                        />
                                    )}
                                    {selected && !creating && (
                                        <ResourceEditor
                                            key={selected}
                                            resourceId={selected}
                                            canSubmit={ready}
                                            onChanged={reloadResources}
                                        />
                                    )}
                                </div>
                            )}
                            {tab === 'payments' && managedByPlatform && (
                                <Card title={t.stripeTitle}>
                                    <p
                                        className={`alert ${ready ? 'alert-success' : 'alert-warning'} mb-0`}
                                        role="status"
                                    >
                                        {ready ? t.paymentsReady : t.paymentsUnavailable}
                                    </p>
                                </Card>
                            )}
                            {tab === 'payments' && !managedByPlatform && (
                                <form onSubmit={(event) => void onboard(event)}>
                                    <Card
                                        title={t.stripeTitle}
                                        footer={
                                            <SensitiveButton className="btn btn-primary" type="submit" disabled={busy}>
                                                {ready
                                                    ? t.openStripeDashboard
                                                    : reason === 'payments_unavailable'
                                                      ? t.continueStripe
                                                      : accountReady
                                                        ? t.configureTax
                                                        : t.configureStripe}
                                            </SensitiveButton>
                                        }
                                    >
                                        {!ready && <p>{t.stripeHint}</p>}
                                        <p className={`alert ${ready ? 'alert-success' : 'alert-info'}`}>
                                            {ready
                                                ? t.paymentsReady
                                                : reason === 'payments_unavailable'
                                                  ? t.stripeStatusUnavailable
                                                  : accountReady
                                                    ? t.taxPending
                                                    : t.stripePending}
                                        </p>
                                        {!ready && (
                                            <ol className="list-group list-group-numbered mb-4">
                                                <li className="list-group-item d-flex align-items-start gap-2">
                                                    <div className="me-auto">
                                                        <span className="d-block">{t.stripeAccountStep}</span>
                                                        <small className="text-body-secondary">
                                                            {t.stripeAccountStepHint}
                                                        </small>
                                                    </div>
                                                    <span
                                                        className={`badge ${accountReady ? 'text-bg-success' : 'text-bg-secondary'}`}
                                                    >
                                                        {accountReady
                                                            ? t.stepComplete
                                                            : reason === 'payments_unavailable'
                                                              ? t.stepUnavailable
                                                              : t.stepPending}
                                                    </span>
                                                </li>
                                                <li className="list-group-item d-flex align-items-start gap-2">
                                                    <div className="me-auto">
                                                        <span className="d-block">{t.documentTitle}</span>
                                                        <small className="text-body-secondary">
                                                            {t.stripeTaxStepHint}
                                                        </small>
                                                    </div>
                                                    <span
                                                        className={`badge ${taxReady ? 'text-bg-success' : 'text-bg-secondary'}`}
                                                    >
                                                        {taxReady
                                                            ? t.stepComplete
                                                            : reason === 'payments_unavailable'
                                                              ? t.stepUnavailable
                                                              : t.stepPending}
                                                    </span>
                                                </li>
                                            </ol>
                                        )}
                                        <details className="mb-3">
                                            <summary>{t.paymentDetails}</summary>
                                            <p className="mt-3">{t.documentHint}</p>
                                            <p>{t.invoiceSettingsHint}</p>
                                            <p className="small text-body-secondary">{t.invoiceFeesHint}</p>
                                        </details>
                                        <LegalNotice context={ready ? undefined : 'creator'} className="mb-0" />
                                    </Card>
                                </form>
                            )}
                            {tab === 'sales' && (
                                <Card
                                    title={t.sales}
                                    footer={
                                        salesCursor && (
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    void action(async () => {
                                                        const page = await api<{
                                                            orders: Sale[];
                                                            nextCursor: string | null;
                                                        }>(
                                                            `/api/creator/orders?before=${encodeURIComponent(salesCursor)}`,
                                                        );
                                                        setSales((previous) => [...previous, ...page.orders]);
                                                        setSalesCursor(page.nextCursor);
                                                    })
                                                }
                                            >
                                                {t.loadOlder}
                                            </button>
                                        )
                                    }
                                >
                                    {sales.length === 0 ? (
                                        <Empty>{t.noSales}</Empty>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle mb-0">
                                                <thead className="text-nowrap">
                                                    <tr>
                                                        <th scope="col">{t.order}</th>
                                                        <th scope="col">{t.name}</th>
                                                        <th scope="col">{t.date}</th>
                                                        <th scope="col">{t.amount}</th>
                                                        <th scope="col">{t.status}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sales.map((sale) => (
                                                        <tr key={sale.id}>
                                                            <th scope="row">
                                                                <small>{sale.id}</small>
                                                            </th>
                                                            <td>{sale.resource_name}</td>
                                                            <td>
                                                                {new Date(sale.created_at * 1000).toLocaleDateString(
                                                                    locale,
                                                                )}
                                                            </td>
                                                            <td>{formatMoney(sale.amount_cents, sale.currency)}</td>
                                                            <td>
                                                                <StatusBadge value={sale.status} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );
}
