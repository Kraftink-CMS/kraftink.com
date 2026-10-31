import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { Card, Empty, ErrorNotice, Loading, Skeleton, TableLoading, StatusBadge } from '../../components/UI';
import { workspace } from '../../lib/translations';

import { ArchiveSubmission } from './ArchiveSubmission';
import type { Resource, Version } from './types';

export function ResourceEditor({
    resourceId,
    canSubmit,
    onChanged,
}: {
    resourceId: string;
    canSubmit: boolean;
    onChanged: () => Promise<void>;
}) {
    const { locale } = useLocale();
    const t = workspace[locale];
    const [resource, setResource] = useState<Resource | null>(null);
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [success, setSuccess] = useState(false);
    const [cancelId, setCancelId] = useState<string | null>(null);

    const reload = useCallback(async () => {
        const data = await api<{ resource: Resource; versions: Version[] }>(`/api/creator/resources/${resourceId}`);
        setResource(data.resource);
        setVersions(data.versions);
    }, [resourceId]);

    useEffect(() => {
        void reload()
            .catch(setError)
            .finally(() => setLoading(false));
    }, [reload]);

    async function cancel() {
        if (!cancelId) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await api(`/api/creator/resources/${resourceId}/versions/${cancelId}`, { method: 'DELETE' });
            setCancelId(null);
            await reload();
            await onChanged();
            setSuccess(true);
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="vstack gap-4">
                <Card title={t.publishVersion} footer={<Skeleton width="12rem" height="2.625rem" />}>
                    <p>{t.manifestOnlyHint}</p>
                    <Loading>
                        <div className="row g-3 mb-3">
                            {[
                                [t.zip, 'col-md-8'],
                                [t.price, 'col-md-4'],
                            ].map(([label, className]) => (
                                <div className={className} key={label}>
                                    <div className="form-label">{label}</div>
                                    <Skeleton height="2.625rem" className="mb-2" />
                                    <Skeleton width="85%" height="0.875rem" />
                                </div>
                            ))}
                        </div>
                    </Loading>
                    <p className="small text-body-secondary mb-0">{t.localPreviewHint}</p>
                </Card>
                <Card title={t.versionHistory}>
                    <TableLoading columns={[t.version, t.status, t.submittedAt, t.reviewNote, t.actions]} />
                </Card>
            </div>
        );
    }
    const pending = versions.some((version) => version.status === 'pending');
    const available = resource && ['draft', 'published'].includes(resource.status);
    return (
        <section className="vstack gap-4" aria-label={resource?.name ?? t.details}>
            <ErrorNotice error={error} />
            {success && (
                <p className="alert alert-success" role="status">
                    {t.success}
                </p>
            )}
            {resource && (
                <>
                    {pending ? (
                        <p className="alert alert-info">{t.pendingHint}</p>
                    ) : !available ? (
                        <p className="alert alert-warning">{t.unavailableHint}</p>
                    ) : (
                        <ArchiveSubmission
                            resource={resource}
                            disabled={!canSubmit}
                            previousVersion={versions.find((version) => version.status === 'approved')?.version}
                            onSubmitted={async () => {
                                await reload();
                                await onChanged();
                                setSuccess(true);
                            }}
                        />
                    )}
                    <Card title={`${resource.name} · ${t.versionHistory}`}>
                        {versions.length === 0 ? (
                            <Empty>{t.noVersions}</Empty>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead className="text-nowrap">
                                        <tr>
                                            <th scope="col">{t.version}</th>
                                            <th scope="col">{t.status}</th>
                                            <th scope="col">{t.submittedAt}</th>
                                            <th scope="col">{t.reviewNote}</th>
                                            <th scope="col">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {versions.map((version) => (
                                            <tr key={version.id}>
                                                <th scope="row">{version.version}</th>
                                                <td>
                                                    <StatusBadge value={version.status} />
                                                </td>
                                                <td>{new Date(version.created_at * 1000).toLocaleString(locale)}</td>
                                                <td>{version.review_note ?? t.emptyReason}</td>
                                                <td>
                                                    {version.status === 'pending' && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={busy}
                                                            onClick={() => setCancelId(version.id)}
                                                        >
                                                            {t.cancelVersion}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                    {cancelId && (
                        <Card
                            title={t.confirmCancel}
                            footer={
                                <div className="d-flex flex-wrap gap-2">
                                    <button
                                        className="btn btn-danger"
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void cancel()}
                                    >
                                        {t.confirmCancel}
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        disabled={busy}
                                        onClick={() => setCancelId(null)}
                                    >
                                        {t.back}
                                    </button>
                                </div>
                            }
                        >
                            <p className="mb-0">{t.cancelHint}</p>
                        </Card>
                    )}
                </>
            )}
        </section>
    );
}
