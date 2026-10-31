import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { localized, useLocale } from '../../lib/i18n';
import { maxArchiveBytes, type ArchiveInspection } from '../../../shared/packages/zip';
import { Card, ErrorNotice } from '../../components/UI';
import { workspace } from '../../lib/translations';
import { useSession } from '../../lib/session';
import { hasRole } from '../../../shared/auth';

import type { Resource } from './types';

function cents(input: string): number | null {
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(input)) {
        return null;
    }
    const value = Math.round(Number(input.replace(',', '.')) * 100);
    return value >= 50 && value <= 1000000 ? value : null;
}

export function ArchiveSubmission({
    resource,
    previousVersion,
    disabled = false,
    onCancel,
    onSubmitted,
}: {
    resource?: Resource;
    previousVersion?: string;
    disabled?: boolean;
    onCancel?: () => void;
    onSubmitted: (id: string) => Promise<void>;
}) {
    const { locale } = useLocale();
    const t = workspace[locale];
    const { user } = useSession();
    const administrator = hasRole(user, 'admin');
    const [preview, setPreview] = useState<{
        inspection: ArchiveInspection;
        file: File;
        price: number;
        imageUrl: string | null;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const [maxUploadBytes, setMaxUploadBytes] = useState<number | null>(null);
    const [inspecting, setInspecting] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);
    const prefix = resource ? `archive-${resource.id}` : 'archive-new';

    function stopWorker() {
        workerRef.current?.terminate();
        workerRef.current = null;
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        void api<{ maxUploadBytes: number }>('/api/config', { signal: controller.signal })
            .then((config) => {
                if (!controller.signal.aborted) {
                    setMaxUploadBytes(
                        Number.isSafeInteger(config.maxUploadBytes) && config.maxUploadBytes > 0
                            ? Math.min(config.maxUploadBytes, maxArchiveBytes)
                            : 25 * 1024 * 1024,
                    );
                }
            })
            .catch((cause) => {
                if (!controller.signal.aborted) setError(cause);
            });
        return () => {
            controller.abort();
            stopWorker();
        };
    }, []);
    useEffect(
        () => () => {
            if (preview?.imageUrl) {
                URL.revokeObjectURL(preview.imageUrl);
            }
        },
        [preview?.imageUrl],
    );

    function reset() {
        stopWorker();
        setInspecting(false);
        setPreview(null);
        setError(null);
        setLocalError(null);
    }

    function inspect(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (disabled) {
            return;
        }
        const fields = new FormData(event.currentTarget);
        const file = fields.get('file');
        const price = cents(String(fields.get('price')));
        if (
            price === null ||
            !(file instanceof File) ||
            file.size <= 0 ||
            maxUploadBytes === null ||
            file.size > maxUploadBytes ||
            !file.name.toLowerCase().endsWith('.zip')
        ) {
            setLocalError(price === null ? t.invalidPrice : t.invalidArchive);
            return;
        }
        reset();
        setInspecting(true);
        try {
            const worker = new Worker(new URL('../../lib/archive-preview.worker.ts', import.meta.url), {
                type: 'module',
            });
            workerRef.current = worker;
            const fail = () => {
                if (workerRef.current !== worker) {
                    return;
                }
                stopWorker();
                setInspecting(false);
                setLocalError(t.invalidArchive);
            };
            worker.onmessage = (message: MessageEvent<{ inspection?: ArchiveInspection; error?: string }>) => {
                if (workerRef.current !== worker) {
                    return;
                }
                stopWorker();
                setInspecting(false);
                if (!message.data.inspection) {
                    const code = message.data.error;
                    setLocalError(
                        code === 'version_must_increase'
                            ? t.versionHint
                            : code === 'archive_metadata'
                              ? t.invalidManifestMetadata
                              : code === 'archive_image'
                                ? t.invalidManifestImage
                                : code === 'archive_provider' || code === 'archive_assets'
                                  ? t.invalidManifestFiles
                                  : t.invalidArchive,
                    );
                    return;
                }
                const inspection = message.data.inspection;
                const imageUrl = inspection.image
                    ? URL.createObjectURL(
                          new Blob([new Uint8Array(inspection.image.bytes)], { type: inspection.image.mime }),
                      )
                    : null;
                setPreview({ inspection, file, price, imageUrl });
            };
            worker.onerror = fail;
            timeoutRef.current = setTimeout(fail, 20000);
            worker.postMessage({
                file,
                maxUploadBytes,
                expected: resource ? { slug: resource.slug, type: resource.type } : undefined,
                previousVersion,
            });
        } catch {
            stopWorker();
            setInspecting(false);
            setLocalError(t.invalidArchive);
        }
    }

    async function confirm() {
        if (!preview || busy || disabled) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await api<{ resource: { id: string } }>(
                resource ? `/api/creator/resources/${resource.id}/versions` : '/api/creator/resources',
                {
                    method: 'POST',
                    body: preview.file,
                    headers: { 'Content-Type': 'application/zip', 'X-Resource-Price': String(preview.price) },
                },
            );
            await onSubmitted(result.resource.id);
            reset();
            formRef.current?.reset();
        } catch (cause) {
            setError(cause);
        } finally {
            setBusy(false);
        }
    }

    const money = (value: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value / 100);
    return (
        <div className="vstack gap-3">
            <ErrorNotice error={error} />
            {localError && (
                <p className="alert alert-danger" role="alert">
                    {localError}
                </p>
            )}
            <form ref={formRef} onSubmit={inspect} hidden={Boolean(preview)}>
                <Card
                    title={resource ? `${resource.name} · ${t.publishVersion}` : t.newResource}
                    footer={
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={disabled || busy || inspecting || maxUploadBytes === null}
                            >
                                {inspecting ? t.inspectingArchive : t.previewArchive}
                            </button>
                            {onCancel && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    disabled={busy}
                                    onClick={onCancel}
                                >
                                    {t.cancel}
                                </button>
                            )}
                        </div>
                    }
                >
                    <p>{t.manifestOnlyHint}</p>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <label className="form-label" htmlFor={`${prefix}-file`}>
                                {t.zip}
                            </label>
                            <input
                                className="form-control"
                                id={`${prefix}-file`}
                                name="file"
                                type="file"
                                accept=".zip,application/zip"
                                required
                                disabled={disabled || inspecting || busy}
                            />
                            <p className="form-text">
                                {t.zipStructureHint}{' '}
                                {maxUploadBytes !== null && (
                                    <>
                                        {t.uploadLimit}{' '}
                                        {new Intl.NumberFormat(locale).format(maxUploadBytes / 1024 / 1024)}{' '}
                                        {t.megabytes}.
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor={`${prefix}-price`}>
                                {t.price}
                            </label>
                            <input
                                className="form-control"
                                id={`${prefix}-price`}
                                name="price"
                                type="number"
                                min="0.50"
                                max="10000"
                                step="0.01"
                                defaultValue={((resource?.price_cents ?? 1000) / 100).toFixed(2)}
                                aria-describedby={`${prefix}-price-help`}
                                required
                                disabled={disabled || inspecting || busy}
                            />
                            <p className="form-text" id={`${prefix}-price-help`}>
                                {t.priceHint}
                            </p>
                        </div>
                    </div>
                    <p className="small text-body-secondary mb-0">{t.localPreviewHint}</p>
                </Card>
            </form>
            {preview && (
                <Card
                    title={t.resourcePreview}
                    footer={
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={disabled || busy}
                                onClick={() => void confirm()}
                            >
                                {busy ? t.submitting : administrator ? t.publish : t.submit}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={reset}>
                                {t.changeArchive}
                            </button>
                            {onCancel && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    disabled={busy}
                                    onClick={onCancel}
                                >
                                    {t.cancel}
                                </button>
                            )}
                        </div>
                    }
                >
                    <div className="row g-4 align-items-start">
                        {preview.imageUrl && (
                            <div className="col-md-4">
                                <img
                                    src={preview.imageUrl}
                                    className="img-fluid rounded border"
                                    alt={localized(preview.inspection.metadata.name, locale)}
                                />
                            </div>
                        )}
                        <div className={preview.imageUrl ? 'col-md-8' : 'col-12'}>
                            <h2 className="h4">{localized(preview.inspection.metadata.name, locale)}</h2>
                            <p className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
                                {localized(preview.inspection.metadata.description, locale)}
                            </p>
                            <dl className="row mb-0">
                                <dt className="col-sm-4">{t.slug}</dt>
                                <dd className="col-sm-8">{preview.inspection.manifest.id}</dd>
                                <dt className="col-sm-4">{t.type}</dt>
                                <dd className="col-sm-8">{t[preview.inspection.manifest.type]}</dd>
                                <dt className="col-sm-4">{t.version}</dt>
                                <dd className="col-sm-8">{preview.inspection.manifest.version}</dd>
                                <dt className="col-sm-4">{t.price}</dt>
                                <dd className="col-sm-8">{money(preview.price)}</dd>
                                <dt className="col-sm-4">{t.archiveSize}</dt>
                                <dd className="col-sm-8">
                                    {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
                                        preview.file.size / 1024 / 1024,
                                    )}{' '}
                                    {t.megabytes}
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <p className="alert alert-info mt-4 mb-0">
                        {administrator ? t.adminPublicationHint : t.reviewHint}
                    </p>
                </Card>
            )}
        </div>
    );
}
