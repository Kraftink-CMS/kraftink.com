import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, ErrorNotice, Loading, Skeleton } from '../../components/UI';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { accountCopy } from '../../lib/translations';

type DeletionReason =
    | 'purchases'
    | 'pending_payments'
    | 'resources'
    | 'sales'
    | 'seller_account'
    | 'uploads'
    | 'announcements'
    | 'last_admin';

interface DeletionEligibility {
    eligible: boolean;
    reasons: DeletionReason[];
    hasPassword: boolean;
}

export function AccountDeletionPanel() {
    const { locale, path } = useLocale();
    const copy = accountCopy[locale];
    const { sensitive, refresh } = useSession();
    const navigate = useNavigate();
    const [eligibility, setEligibility] = useState<DeletionEligibility | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const loadEligibility = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const result = await api<DeletionEligibility>('/api/account/deletion', { signal });
            if (!signal?.aborted) {
                setEligibility(result);
            }
        } catch (failure) {
            if (!signal?.aborted) {
                setEligibility(null);
                setError(failure);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadEligibility(controller.signal);
        return () => controller.abort();
    }, [loadEligibility]);

    async function deleteAccount() {
        if (busy || loading || !eligibility?.eligible) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const token = await sensitive('account.delete');
            await api('/api/account', { method: 'DELETE', json: {}, sensitiveToken: token });
            await refresh();
            navigate(path('/'), { replace: true });
        } catch (failure) {
            setError(failure);
            await loadEligibility();
        } finally {
            setBusy(false);
        }
    }

    const reasons: Record<DeletionReason, string> = {
        purchases: copy.deletionPurchases,
        pending_payments: copy.deletionPendingPayments,
        resources: copy.deletionResources,
        sales: copy.deletionSales,
        seller_account: copy.deletionSellerAccount,
        uploads: copy.deletionUploads,
        announcements: copy.deletionAnnouncements,
        last_admin: copy.deletionLastAdmin,
    };

    return (
        <Card
            title={copy.deletionTitle}
            className="border-danger"
            footer={
                <>
                    <SensitiveButton
                        type="button"
                        className="btn btn-danger"
                        disabled={busy || loading || !eligibility?.eligible}
                        onClick={() => void deleteAccount()}
                    >
                        {busy ? copy.deletionDeleting : copy.deletionAction}
                    </SensitiveButton>
                    {!loading && !eligibility && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            disabled={busy}
                            onClick={() => {
                                setError(null);
                                void loadEligibility();
                            }}
                        >
                            {copy.deletionRetry}
                        </button>
                    )}
                </>
            }
        >
            <ErrorNotice error={error} />
            <p>{copy.deletionDescription}</p>
            {loading ? (
                <Loading>
                    <Skeleton width="85%" className="mb-2" />
                    <Skeleton width="60%" />
                </Loading>
            ) : eligibility && !eligibility.eligible ? (
                <div className="alert alert-warning mb-0" role="status">
                    <p className={eligibility.reasons.length > 0 ? 'mb-2' : 'mb-0'}>{copy.deletionBlocked}</p>
                    {eligibility.reasons.length > 0 && (
                        <ul className="mb-0">
                            {eligibility.reasons.map((reason) => (
                                <li key={reason}>{reasons[reason]}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </Card>
    );
}
