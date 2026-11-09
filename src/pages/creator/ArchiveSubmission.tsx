import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { localized, useLocale } from '../../lib/i18n';
import { maxArchiveBytes, type ArchiveInspection } from '../../../shared/packages/zip';
import type { RepositorySource } from '../../../shared/packages/repository';
import { externalLinkRel } from '../../../shared/links';
import { Link } from 'react-router-dom';
import { Card, ErrorNotice } from '../../components/UI';
import { ResourceMarkdown } from '../../components/market/ResourceMarkdown';
import { ResourceIcon } from '../../components/market/ResourceIcon';
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

function assetUrl(bytes: Uint8Array, mime: string): string {
    return URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
}

interface EncodedAsset {
    data: string;
    mime: string;
}

function decodedAsset({ data, mime }: EncodedAsset): string {
    return assetUrl(
        Uint8Array.from(atob(data.replaceAll('-', '+').replaceAll('_', '/')), (byte) => byte.charCodeAt(0)),
        mime,
    );
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
    const { locale, path } = useLocale();
    const t = workspace[locale];
    const { user } = useSession();
    const administrator = hasRole(user, 'admin');
    const [sourceKind, setSourceKind] = useState<'zip' | 'github'>(resource?.source ? 'github' : 'zip');
    const [preview, setPreview] = useState<{
        inspection: Pick<ArchiveInspection, 'manifest' | 'metadata' | 'entries' | 'expandedBytes'>;
        file?: File;
        source?: RepositorySource;
        sha256?: string;
        sizeBytes: number;
        price: number;
        imageUrl: string | null;
        images: Record<string, string>;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const [maxUploadBytes, setMaxUploadBytes] = useState<number | null>(null);
    const [inspecting, setInspecting] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const requestRef = useRef<AbortController | null>(null);
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
            requestRef.current?.abort();
            stopWorker();
        };
    }, []);
    useEffect(
        () => () => {
            if (preview?.imageUrl) {
                URL.revokeObjectURL(preview.imageUrl);
            }
            Object.values(preview?.images ?? {}).forEach((url) => URL.revokeObjectURL(url));
        },
        [preview],
    );

    function reset() {
        requestRef.current?.abort();
        requestRef.current = null;
        stopWorker();
        setInspecting(false);
        setPreview(null);
        setError(null);
        setLocalError(null);
    }

    async function inspect(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (disabled) {
            return;
        }
        const fields = new FormData(event.currentTarget);
        const file = fields.get('file');
        const price = cents(String(fields.get('price')));
        if (price === null) {
            setLocalError(t.invalidPrice);
            return;
        }
        if (sourceKind === 'github') {
            reset();
            setInspecting(true);
            const controller = new AbortController();
            requestRef.current = controller;
            try {
                const result = await api<{
                    source: RepositorySource;
                    inspection: Pick<ArchiveInspection, 'manifest' | 'metadata' | 'entries' | 'expandedBytes'>;
                    sha256: string;
                    sizeBytes: number;
                    cover?: EncodedAsset;
                    images?: Record<string, EncodedAsset>;
                }>('/api/creator/resources/preview-repository', {
                    method: 'POST',
                    json: { repository: String(fields.get('repository')).trim(), resourceId: resource?.id },
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) {
                    const { cover, images, ...details } = result;
                    setPreview({
                        ...details,
                        price,
                        imageUrl: cover ? decodedAsset(cover) : null,
                        images: Object.fromEntries(
                            Object.entries(images ?? {}).map(([path, asset]) => [path, decodedAsset(asset)]),
                        ),
                    });
                }
            } catch (cause) {
                if (!controller.signal.aborted) {
                    setError(cause);
                }
            } finally {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                    setInspecting(false);
                }
            }
            return;
        }
        if (
            !(file instanceof File) ||
            file.size <= 0 ||
            maxUploadBytes === null ||
            file.size > maxUploadBytes ||
            !file.name.toLowerCase().endsWith('.zip')
        ) {
            setLocalError(t.invalidArchive);
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
                    const errors: Record<string, string> = {
                        version_must_increase: t.versionHint,
                        archive_metadata: t.invalidManifestMetadata,
                        archive_readme: t.invalidMarketReadme,
                        archive_changelog: t.invalidMarketChangelog,
                        archive_image: t.invalidManifestImage,
                        archive_provider: t.invalidManifestFiles,
                        archive_assets: t.invalidManifestFiles,
                    };
                    setLocalError(errors[message.data.error ?? ''] ?? t.invalidArchive);
                    return;
                }
                const inspection = message.data.inspection;
                const imageUrl = inspection.image ? assetUrl(inspection.image.bytes, inspection.image.mime) : null;
                const images = Object.fromEntries(
                    Object.entries(inspection.marketAssets ?? {}).map(([path, asset]) => [
                        path,
                        assetUrl(asset.bytes, asset.mime),
                    ]),
                );
                setPreview({ inspection, file, sizeBytes: file.size, price, imageUrl, images });
            };
            worker.onerror = fail;
            timeoutRef.current = setTimeout(fail, 20000);
            worker.postMessage({
                file,
                maxUploadBytes,
                expected: { slug: resource?.slug, type: resource?.type, imageLocale: locale },
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
                preview.source
                    ? {
                          method: 'POST',
                          timeoutMs: 120000,
                          json: {
                              repository: preview.source.repository,
                              priceCents: preview.price,
                              expectedSource: { tag: preview.source.tag, sha256: preview.sha256 },
                          },
                      }
                    : {
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
                                disabled={
                                    disabled ||
                                    busy ||
                                    inspecting ||
                                    (sourceKind === 'zip' ? maxUploadBytes === null : !user?.githubLinked)
                                }
                            >
                                {inspecting ? t.inspectingResource : t.previewArchive}
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
                    <fieldset className="mb-4" disabled={disabled || inspecting || busy}>
                        <legend className="fs-6 fw-semibold">{t.resourceSource}</legend>
                        <div className="row g-3">
                            {(['zip', 'github'] as const).map((kind) => (
                                <div className="col-md-6" key={kind}>
                                    <label
                                        className={`border rounded p-3 d-flex gap-3 h-100 ${sourceKind === kind ? 'border-primary' : ''}`}
                                        htmlFor={`${prefix}-source-${kind}`}
                                    >
                                        <input
                                            className="form-check-input flex-shrink-0"
                                            id={`${prefix}-source-${kind}`}
                                            type="radio"
                                            name="sourceKind"
                                            value={kind}
                                            checked={sourceKind === kind}
                                            onChange={() => {
                                                reset();
                                                setSourceKind(kind);
                                            }}
                                        />
                                        <span>
                                            <span className="d-block fw-semibold">
                                                {kind === 'zip' ? t.zip : t.publicRepository}
                                            </span>
                                            <span className="small text-body-secondary">
                                                {kind === 'zip' ? t.zipSourceHint : t.repositorySourceHint}
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </fieldset>
                    <p>{t.manifestOnlyHint}</p>
                    <div className="row g-3">
                        <div className="col-md-8">
                            {sourceKind === 'zip' ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    <label className="form-label" htmlFor={`${prefix}-repository`}>
                                        {t.repositoryUrl}
                                    </label>
                                    <input
                                        className="form-control"
                                        id={`${prefix}-repository`}
                                        name="repository"
                                        type="url"
                                        placeholder="https://github.com/owner/repository"
                                        defaultValue={resource?.source?.repository ?? ''}
                                        maxLength={300}
                                        aria-describedby={`${prefix}-repository-help`}
                                        required
                                        disabled={disabled || inspecting || busy}
                                    />
                                    <p className="form-text" id={`${prefix}-repository-help`}>
                                        {t.repositoryOwnershipHint}
                                    </p>
                                    {!user?.githubLinked && (
                                        <p className="alert alert-warning">
                                            {t.repositoryLinkRequired}{' '}
                                            <Link to={path('/account')}>{t.linkGithubAccount}</Link>
                                        </p>
                                    )}
                                    <p className="small text-body-secondary">{t.repositoryReleaseHint}</p>
                                </>
                            )}
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
                    <p className="small text-body-secondary mb-0">
                        {sourceKind === 'zip' ? t.localPreviewHint : t.paidOpenSourceHint}
                    </p>
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
                                {t.changeSource}
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
                            <div className="d-flex align-items-center gap-3 mb-3">
                                {!preview.imageUrl && (
                                    <ResourceIcon
                                        resource={preview.inspection.metadata}
                                        previewImage={preview.images[preview.inspection.metadata.icon ?? '']}
                                    />
                                )}
                                <h2 className="h4 mb-0">{localized(preview.inspection.metadata.name, locale)}</h2>
                            </div>
                            <p className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
                                {localized(preview.inspection.metadata.description, locale)}
                            </p>
                            {preview.inspection.metadata.readme && (
                                <ResourceMarkdown
                                    markdown={localized(preview.inspection.metadata.readme, locale)}
                                    previewImages={preview.images}
                                />
                            )}
                            {preview.inspection.metadata.changelog && (
                                <>
                                    <h3 className="h5">{t.marketChangelog}</h3>
                                    <ResourceMarkdown
                                        markdown={localized(preview.inspection.metadata.changelog, locale)}
                                    />
                                </>
                            )}
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
                                        preview.sizeBytes / 1024 / 1024,
                                    )}{' '}
                                    {t.megabytes}
                                </dd>
                                {preview.source && (
                                    <>
                                        <dt className="col-sm-4">{t.publicRepository}</dt>
                                        <dd className="col-sm-8 text-break">
                                            <a
                                                className="text-break"
                                                href={preview.source.repository}
                                                target="_blank"
                                                rel={externalLinkRel(preview.source.repository)}
                                            >
                                                {preview.source.repository} ↗
                                            </a>
                                        </dd>
                                        <dt className="col-sm-4">{t.repositoryTag}</dt>
                                        <dd className="col-sm-8">
                                            <code>{preview.source.tag}</code>
                                        </dd>
                                    </>
                                )}
                            </dl>
                        </div>
                    </div>
                    <p className="alert alert-info mt-4 mb-0">
                        {administrator
                            ? t.adminPublicationHint
                            : preview.source
                              ? t.repositoryReviewHint
                              : t.reviewHint}
                    </p>
                </Card>
            )}
        </div>
    );
}
