import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Select } from '../../components/Select';
import { ErrorNotice, FormLoading, Loading, Skeleton, PageTitle } from '../../components/UI';
import { api } from '../../lib/api';
import { useLocale, useSiteCopy } from '../../lib/i18n';
import { publicMessages } from '../../lib/translations';
import { usePublicPageData } from '../../lib/rendering';
import {
    installationReleases,
    releaseSource,
    type InstallationRelease,
    type ReleaseChannel,
    type ReleaseSource,
} from './releases';

export function DownloadsPage() {
    const copy = useSiteCopy();
    const { locale, path } = useLocale();
    const { data: initial, update } = usePublicPageData();
    const [source, setSource] = useState<ReleaseSource | null>(() =>
        initial.sources ? releaseSource(initial.sources) : null,
    );
    const [releases, setReleases] = useState<InstallationRelease[] | null>(() =>
        initial.sources && initial.releases
            ? installationReleases(initial.releases, releaseSource(initial.sources))
            : null,
    );
    const [error, setError] = useState<unknown>(null);
    const [channel, setChannel] = useState<ReleaseChannel>('stable');
    const [tag, setTag] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        const metadata = api<{ data: unknown }>('/api/metadata?source=releases', { signal: controller.signal });
        const sources = fetch('/generated/sources.json', { signal: controller.signal }).then(async (response) => {
            if (!response.ok) {
                throw new Error('service_unavailable');
            }
            const document: unknown = await response.json();
            const result = releaseSource(document);
            if (!controller.signal.aborted) {
                setSource(result);
                update({ sources: document });
            }
            return result;
        });
        Promise.all([sources, metadata])
            .then(([sources, metadata]) => {
                if (!controller.signal.aborted) {
                    setReleases(installationReleases(metadata.data, sources));
                    update({ releases: metadata.data });
                }
            })
            .catch((failure) => {
                if (!controller.signal.aborted) {
                    setError(failure);
                    setReleases((current) => current ?? []);
                }
            });
        return () => controller.abort();
    }, [update]);
    const channels = (['stable', 'beta', 'alpha', 'prerelease'] as const).filter((value) =>
        releases?.some((release) => release.channel === value),
    );
    const selectedChannel = channels.includes(channel) ? channel : channels[0];
    const versions = releases?.filter((release) => release.channel === selectedChannel) ?? [];
    const selected = versions.find((release) => release.tag === tag) ?? versions[0];
    const channelLabel = (value: ReleaseChannel) =>
        value === 'alpha' ? 'Alpha' : value === 'beta' ? 'Beta' : copy.downloads[value];
    return (
        <>
            <PageTitle title={copy.downloads.pageTitle} description={copy.downloads.lead} />
            <div className="row g-4">
                <section className="col-lg-8">
                    <ErrorNotice error={error} />
                    <div data-releases>
                        <div className="card card-body p-4 download-panel">
                            {selected ? (
                                <>
                                    <div className="row g-3 mb-4">
                                        <div className="col-sm-6">
                                            <label className="form-label" htmlFor="release-channel">
                                                {copy.downloads.channel}
                                            </label>
                                            <Select
                                                className="form-select"
                                                id="release-channel"
                                                value={selectedChannel}
                                                disabled={channels.length === 1}
                                                onChange={(event) => {
                                                    setChannel(event.target.value as ReleaseChannel);
                                                    setTag('');
                                                }}
                                            >
                                                {channels.map((value) => (
                                                    <option key={value} value={value}>
                                                        {channelLabel(value)}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="form-label" htmlFor="release-version">
                                                {copy.downloads.version}
                                            </label>
                                            <Select
                                                className="form-select"
                                                id="release-version"
                                                value={selected.tag}
                                                onChange={(event) => setTag(event.target.value)}
                                            >
                                                {versions.map((release) => (
                                                    <option key={release.tag} value={release.tag}>
                                                        {release.tag}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="row g-4">
                                        <div className="col-lg-7">
                                            <span className="download-channel">{channelLabel(selected.channel)}</span>
                                            <h2>{selected.name}</h2>
                                            <p>{copy.downloads.includes}</p>
                                            <p className="download-meta">{copy.downloads.platform}</p>
                                            {selected.channel !== 'stable' && (
                                                <p className="development-notice">{copy.downloads.prereleaseNotice}</p>
                                            )}
                                        </div>
                                        <div className="col-lg-5 download-summary">
                                            <h3 className="h5">{copy.downloads.archive}</h3>
                                            <p className="text-break">{selected.filename}</p>
                                            <dl className="detail-facts">
                                                <div>
                                                    <dt>{copy.downloads.tag}</dt>
                                                    <dd>{selected.tag}</dd>
                                                </div>
                                                <div>
                                                    <dt>{copy.downloads.published}</dt>
                                                    <dd>
                                                        {new Intl.DateTimeFormat(locale, {
                                                            dateStyle: 'long',
                                                            timeZone: 'UTC',
                                                        }).format(selected.published)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt>{copy.downloads.size}</dt>
                                                    <dd>
                                                        {new Intl.NumberFormat(locale, {
                                                            maximumFractionDigits: 1,
                                                        }).format(selected.bytes / 1000000)}{' '}
                                                        {copy.downloads.megabytes}
                                                    </dd>
                                                </div>
                                            </dl>
                                            <a
                                                className="btn btn-primary w-100"
                                                href={selected.downloadUrl}
                                                rel="noreferrer"
                                            >
                                                {copy.downloads.download}
                                            </a>
                                            {selected.checksumUrl && (
                                                <p className="checksum">
                                                    <a
                                                        className="text-link"
                                                        href={selected.checksumUrl}
                                                        rel="noreferrer"
                                                    >
                                                        {copy.downloads.checksumFile}
                                                    </a>
                                                </p>
                                            )}
                                            <p className="mt-3 mb-0">
                                                <a className="text-link" href={selected.notesUrl} rel="noreferrer">
                                                    {copy.downloads.notes}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : releases === null ? (
                                <Loading>
                                    <div className="vstack gap-4">
                                        <FormLoading fields={2} />
                                        <Skeleton width="60%" height="2rem" />
                                        <Skeleton />
                                        <Skeleton width="75%" />
                                        <Skeleton width="12rem" height="2.75rem" />
                                    </div>
                                </Loading>
                            ) : (
                                <>
                                    <p className="text-body-secondary">{publicMessages[locale].noReleases}</p>
                                    <p>{copy.downloads.includes}</p>
                                    <p className="download-meta">{copy.downloads.platform}</p>
                                </>
                            )}
                        </div>
                        {selected && (
                            <p
                                data-release-state
                                className="small text-body-secondary mt-3 mb-0"
                                role="status"
                                aria-live="polite"
                            >
                                {copy.downloads.selected.replace('{version}', selected.tag)}
                            </p>
                        )}
                        <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
                            {source && (
                                <a className="btn btn-outline-dark" href={source.releasesUrl} rel="noreferrer">
                                    {copy.downloads.allVersions}
                                </a>
                            )}
                            <Link className="small text-decoration-none" to={path('/documentation/installation')}>
                                {copy.downloads.verify}
                            </Link>
                        </div>
                    </div>
                </section>
                <aside className="col-lg-4">
                    <section className="card">
                        <div className="card-body p-4">
                            <span className="community-mark" aria-hidden="true">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    focusable="false"
                                >
                                    <path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4" />
                                </svg>
                            </span>
                            <h2 className="h5">{copy.downloads.after}</h2>
                            <ol className="steps">
                                {copy.downloads.steps.map(([heading, summary]) => (
                                    <li key={heading}>
                                        <h3 className="h6">{heading}</h3>
                                        <p className="text-body-secondary small">{summary}</p>
                                    </li>
                                ))}
                            </ol>
                            <Link className="btn btn-outline-primary w-100" to={path('/documentation/installation')}>
                                {copy.downloads.guide}
                            </Link>
                        </div>
                    </section>
                </aside>
            </div>
        </>
    );
}
