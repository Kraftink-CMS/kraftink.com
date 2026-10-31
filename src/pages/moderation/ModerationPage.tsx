import { Select } from '../../components/Select';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { localized, useLocale } from '../../lib/i18n';
import { Card, Empty, ErrorNotice, Loading, PageTitle, StatusBadge } from '../../components/UI';
import { workspace } from '../../lib/translations';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import { hasRole } from '../../../shared/auth';

interface Review {
    id: string;
    resource_id: string;
    version: string;
    payload_json: string;
    manifest_json: string;
    sha256: string;
    size_bytes: number;
    created_at: number;
    slug: string;
    type: 'plugin' | 'theme' | 'game';
    current_name: string;
    author_id: string;
    author_name: string;
    image_key?: string | null;
}

interface ManagedResource {
    id: string;
    slug: string;
    type: 'plugin' | 'theme' | 'game';
    name: string;
    author_name: string;
    status: string;
    published_version: string | null;
}

interface Proposal {
    name: string | Record<string, string>;
    description: string | Record<string, string>;
    priceCents: number;
    currency: string;
}

function proposal(review: Review): Proposal {
    try {
        return JSON.parse(review.payload_json) as Proposal;
    } catch {
        return { name: review.current_name, description: '', priceCents: 0, currency: 'EUR' };
    }
}

export function ModerationPage() {
    const { locale } = useLocale();
    const t = workspace[locale];
    const { user, sensitive } = useSession();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [resources, setResources] = useState<ManagedResource[]>([]);
    const [reviewCursor, setReviewCursor] = useState<string | null>(null);
    const [resourceCursor, setResourceCursor] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [success, setSuccess] = useState(false);
    const [tab, setTab] = useState<'reviews' | 'allResources'>('reviews');
    const [selected, setSelected] = useState<Review | null>(null);
    const [withdrawal, setWithdrawal] = useState<ManagedResource | null>(null);
    const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
    const [reason, setReason] = useState('');
    const [force, setForce] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const allowed = hasRole(user, 'moderator');
    const admin = hasRole(user, 'admin');

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pending, all] = await Promise.all([
                api<{ reviews: Review[]; nextCursor: string | null }>(
                    `/api/moderation/reviews?q=${encodeURIComponent(submittedQuery)}`,
                ),
                api<{ resources: ManagedResource[]; nextCursor: string | null }>(
                    `/api/moderation/resources?q=${encodeURIComponent(submittedQuery)}`,
                ),
            ]);
            setReviews(pending.reviews);
            setResources(all.resources);
            setReviewCursor(pending.nextCursor);
            setResourceCursor(all.nextCursor);
        } catch (cause) {
            setError(cause);
        } finally {
            setLoading(false);
        }
    }, [submittedQuery]);

    useEffect(() => {
        if (allowed) {
            void reload();
        } else {
            setLoading(false);
        }
    }, [user?.id, allowed, reload]);

    async function loadMore(kind: 'reviews' | 'resources') {
        const cursor = kind === 'reviews' ? reviewCursor : resourceCursor;
        if (!cursor) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const url = `/api/moderation/${kind}?q=${encodeURIComponent(submittedQuery)}&before=${encodeURIComponent(cursor)}`;
            if (kind === 'reviews') {
                const data = await api<{ reviews: Review[]; nextCursor: string | null }>(url);
                setReviews((current) => [
                    ...current,
                    ...data.reviews.filter((item) => !current.some((existing) => existing.id === item.id)),
                ]);
                setReviewCursor(data.nextCursor);
            } else {
                const data = await api<{ resources: ManagedResource[]; nextCursor: string | null }>(url);
                setResources((current) => [
                    ...current,
                    ...data.resources.filter((item) => !current.some((existing) => existing.id === item.id)),
                ]);
                setResourceCursor(data.nextCursor);
            }
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    function chooseReview(review: Review) {
        setSelected(review);
        setWithdrawal(null);
        setDecision('approve');
        setReason('');
        setError(null);
        setSuccess(false);
    }

    function chooseWithdrawal(resource: ManagedResource) {
        setWithdrawal(resource);
        setSelected(null);
        setReason('');
        setForce(false);
        setConfirmed(false);
        setError(null);
        setSuccess(false);
    }

    async function review(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected || (selected.author_id === user?.id && !admin)) {
            return;
        }
        setBusy(true);
        setError(null);
        setSuccess(false);
        try {
            const token = await sensitive('moderation.review');
            await api(`/api/moderation/reviews/${selected.id}`, {
                method: 'PATCH',
                json: { action: decision, reason },
                sensitiveToken: token,
            });
            setSelected(null);
            await reload();
            setSuccess(true);
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    async function withdraw(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!withdrawal || !confirmed) {
            return;
        }
        setBusy(true);
        setError(null);
        setSuccess(false);
        try {
            const token = force ? await sensitive('admin.resource-revoke') : undefined;
            await api(`/api/moderation/resources/${withdrawal.id}`, {
                method: 'DELETE',
                json: { force, reason },
                sensitiveToken: token,
            });
            setWithdrawal(null);
            await reload();
            setSuccess(true);
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    async function download(review: Review) {
        setBusy(true);
        setError(null);
        try {
            const response = await fetch(`/api/moderation/versions/${review.id}/archive`, {
                credentials: 'same-origin',
            });
            if (!response.ok) {
                throw new Error('archive_unavailable');
            }
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement('a');
            link.href = url;
            link.download = `${review.slug}-${review.version}.zip`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    const payload = selected ? proposal(selected) : null;
    return (
        <>
            <PageTitle title={t.moderationTitle} description={t.moderationDescription}>
                {allowed && (
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        disabled={busy || loading}
                        onClick={() => void reload()}
                    >
                        {t.refresh}
                    </button>
                )}
            </PageTitle>
            {!allowed ? (
                <Empty>{t.moderationRequired}</Empty>
            ) : (
                <div className="vstack gap-4">
                    <nav className="nav nav-pills gap-2" aria-label={t.moderationTitle}>
                        <button
                            type="button"
                            className={`nav-link ${tab === 'reviews' ? 'active' : ''}`}
                            aria-current={tab === 'reviews' ? 'page' : undefined}
                            onClick={() => {
                                setTab('reviews');
                                setWithdrawal(null);
                            }}
                        >
                            {t.reviews}{' '}
                            <span className="badge text-bg-secondary ms-1">
                                {reviews.length}
                                {reviewCursor ? '+' : ''}
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`nav-link ${tab === 'allResources' ? 'active' : ''}`}
                            aria-current={tab === 'allResources' ? 'page' : undefined}
                            onClick={() => {
                                setTab('allResources');
                                setSelected(null);
                            }}
                        >
                            {t.allResources}
                        </button>
                    </nav>
                    <form
                        className="row g-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setSelected(null);
                            setWithdrawal(null);
                            if (query === submittedQuery) {
                                void reload();
                            } else {
                                setSubmittedQuery(query);
                            }
                        }}
                    >
                        <div className="col">
                            <label className="visually-hidden" htmlFor="moderation-search">
                                {t.searchResources}
                            </label>
                            <input
                                className="form-control"
                                id="moderation-search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                maxLength={100}
                                placeholder={t.searchResources}
                            />
                        </div>
                        <div className="col-auto">
                            <button className="btn btn-outline-secondary" type="submit" disabled={busy || loading}>
                                {t.searchAction}
                            </button>
                        </div>
                    </form>
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
                            {tab === 'reviews' && (
                                <Card
                                    title={t.reviews}
                                    footer={
                                        reviewCursor ? (
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                disabled={busy}
                                                onClick={() => void loadMore('reviews')}
                                            >
                                                {t.loadMoreReviews}
                                            </button>
                                        ) : undefined
                                    }
                                >
                                    {reviews.length === 0 ? (
                                        <Empty>{t.noReviews}</Empty>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle mb-0">
                                                <thead className="text-nowrap">
                                                    <tr>
                                                        <th scope="col">{t.name}</th>
                                                        <th scope="col">{t.author}</th>
                                                        <th scope="col">{t.type}</th>
                                                        <th scope="col">{t.version}</th>
                                                        <th scope="col">{t.submittedAt}</th>
                                                        <th scope="col">{t.actions}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reviews.map((entry) => (
                                                        <tr key={entry.id}>
                                                            <th scope="row">
                                                                {localized(proposal(entry).name, locale)}
                                                                <small className="d-block text-body-secondary">
                                                                    {entry.slug}
                                                                </small>
                                                            </th>
                                                            <td>{entry.author_name}</td>
                                                            <td>{t[entry.type]}</td>
                                                            <td>{entry.version}</td>
                                                            <td>
                                                                {new Date(entry.created_at * 1000).toLocaleDateString(
                                                                    locale,
                                                                )}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    type="button"
                                                                    disabled={busy}
                                                                    onClick={() => chooseReview(entry)}
                                                                >
                                                                    {t.details}
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
                            {selected && payload && (
                                <form onSubmit={(event) => void review(event)}>
                                    <Card
                                        title={`${localized(payload.name, locale)} · ${selected.version}`}
                                        footer={
                                            <div className="d-flex flex-wrap gap-2">
                                                <SensitiveButton
                                                    className={`btn ${decision === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                                    type="submit"
                                                    disabled={busy || (selected.author_id === user?.id && !admin)}
                                                >
                                                    {busy
                                                        ? t.reviewBusy
                                                        : decision === 'approve'
                                                          ? t.approve
                                                          : t.reject}
                                                </SensitiveButton>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => setSelected(null)}
                                                >
                                                    {t.cancel}
                                                </button>
                                            </div>
                                        }
                                    >
                                        {selected.image_key && (
                                            <img
                                                src={`/api/moderation/versions/${selected.id}/image`}
                                                alt={localized(payload.name, locale)}
                                                className="img-fluid rounded mb-4"
                                                style={{ maxHeight: 280 }}
                                            />
                                        )}
                                        <dl className="row">
                                            <dt className="col-sm-4">{t.author}</dt>
                                            <dd className="col-sm-8">{selected.author_name}</dd>
                                            <dt className="col-sm-4">{t.proposedName}</dt>
                                            <dd className="col-sm-8">{localized(payload.name, locale)}</dd>
                                            <dt className="col-sm-4">{t.proposedDescription}</dt>
                                            <dd className="col-sm-8" style={{ whiteSpace: 'pre-wrap' }}>
                                                {localized(payload.description, locale)}
                                            </dd>
                                            <dt className="col-sm-4">{t.proposedPrice}</dt>
                                            <dd className="col-sm-8">
                                                {new Intl.NumberFormat(locale, {
                                                    style: 'currency',
                                                    currency: payload.currency,
                                                }).format(payload.priceCents / 100)}
                                            </dd>
                                            <dt className="col-sm-4">{t.archiveSize}</dt>
                                            <dd className="col-sm-8">
                                                {new Intl.NumberFormat(locale, {
                                                    style: 'unit',
                                                    unit: 'megabyte',
                                                    maximumFractionDigits: 2,
                                                }).format(selected.size_bytes / 1000000)}
                                            </dd>
                                            <dt className="col-sm-4">{t.archiveDigest}</dt>
                                            <dd className="col-sm-8 text-break">
                                                <code>{selected.sha256}</code>
                                            </dd>
                                        </dl>
                                        <details className="mb-3">
                                            <summary>{t.manifest}</summary>
                                            <pre className="mt-2 p-3 bg-body-tertiary rounded overflow-auto">
                                                {selected.manifest_json}
                                            </pre>
                                        </details>
                                        <p className="alert alert-warning">{t.archiveWarning}</p>
                                        <button
                                            className="btn btn-outline-secondary mb-3"
                                            type="button"
                                            disabled={busy}
                                            onClick={() => void download(selected)}
                                        >
                                            {t.downloadReview}
                                        </button>
                                        {selected.author_id === user?.id && !admin && (
                                            <p className="alert alert-info">{t.selfReviewHint}</p>
                                        )}
                                        <div className="row g-3">
                                            <div className="col-md-5">
                                                <label className="form-label" htmlFor="review-decision">
                                                    {t.decision}
                                                </label>
                                                <Select
                                                    className="form-select"
                                                    id="review-decision"
                                                    value={decision}
                                                    onChange={(event) =>
                                                        setDecision(event.target.value as 'approve' | 'reject')
                                                    }
                                                    disabled={busy}
                                                >
                                                    <option value="approve">{t.approve}</option>
                                                    <option value="reject">{t.reject}</option>
                                                </Select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label" htmlFor="review-reason">
                                                    {t.reason}
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="review-reason"
                                                    rows={3}
                                                    minLength={3}
                                                    maxLength={2000}
                                                    value={reason}
                                                    onChange={(event) => setReason(event.target.value)}
                                                    disabled={busy}
                                                    required
                                                />
                                                <p className="form-text">{t.reasonHint}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </form>
                            )}
                            {tab === 'allResources' && (
                                <Card
                                    title={t.allResources}
                                    footer={
                                        resourceCursor ? (
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                disabled={busy}
                                                onClick={() => void loadMore('resources')}
                                            >
                                                {t.loadMoreResources}
                                            </button>
                                        ) : undefined
                                    }
                                >
                                    {resources.length === 0 ? (
                                        <Empty>{t.noManagedResources}</Empty>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle mb-0">
                                                <thead className="text-nowrap">
                                                    <tr>
                                                        <th scope="col">{t.name}</th>
                                                        <th scope="col">{t.author}</th>
                                                        <th scope="col">{t.type}</th>
                                                        <th scope="col">{t.publishedVersion}</th>
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
                                                            <td>{resource.author_name}</td>
                                                            <td>{t[resource.type]}</td>
                                                            <td>{resource.published_version ?? '—'}</td>
                                                            <td>
                                                                <StatusBadge value={resource.status} />
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    type="button"
                                                                    disabled={busy || resource.status === 'revoked'}
                                                                    onClick={() => chooseWithdrawal(resource)}
                                                                >
                                                                    {t.withdraw}
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
                            {withdrawal && (
                                <form onSubmit={(event) => void withdraw(event)}>
                                    <Card
                                        title={`${t.withdrawalTitle} · ${withdrawal.name}`}
                                        footer={
                                            <div className="d-flex flex-wrap gap-2">
                                                <SensitiveButton
                                                    className="btn btn-danger"
                                                    type="submit"
                                                    requiresConfirmation={force}
                                                    disabled={busy || !confirmed}
                                                >
                                                    {force ? t.applyRevocation : t.applyWithdrawal}
                                                </SensitiveButton>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => setWithdrawal(null)}
                                                >
                                                    {t.cancel}
                                                </button>
                                            </div>
                                        }
                                    >
                                        <p>{t.withdrawalHint}</p>
                                        {admin && (
                                            <div className="form-check mb-3">
                                                <input
                                                    className="form-check-input"
                                                    id="security-revocation"
                                                    type="checkbox"
                                                    checked={force}
                                                    disabled={busy}
                                                    onChange={(event) => {
                                                        setForce(event.target.checked);
                                                        setConfirmed(false);
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor="security-revocation">
                                                    {t.forceRevoke}
                                                </label>
                                            </div>
                                        )}
                                        {force && (
                                            <div className="alert alert-danger">
                                                <p>{t.forceHint}</p>
                                                <p className="mb-0 fw-bold">{t.forcePermanent}</p>
                                            </div>
                                        )}
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="withdrawal-reason">
                                                {t.reason}
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id="withdrawal-reason"
                                                rows={3}
                                                minLength={3}
                                                maxLength={1000}
                                                value={reason}
                                                onChange={(event) => setReason(event.target.value)}
                                                disabled={busy}
                                                required
                                            />
                                            <p className="form-text">{t.reasonHint}</p>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                id="withdrawal-confirmed"
                                                type="checkbox"
                                                checked={confirmed}
                                                disabled={busy}
                                                onChange={(event) => setConfirmed(event.target.checked)}
                                                required
                                            />
                                            <label className="form-check-label" htmlFor="withdrawal-confirmed">
                                                {force ? t.confirmRevocation : t.confirmWithdrawal}
                                            </label>
                                        </div>
                                    </Card>
                                </form>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
}
