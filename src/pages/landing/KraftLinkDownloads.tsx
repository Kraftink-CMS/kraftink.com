import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kraftLinkRepository } from '../../../shared/links';
import { api } from '../../lib/api';
import { useLocale, useSiteCopy } from '../../lib/i18n';
import { usePublicPageData } from '../../lib/rendering';
import { kraftLinkRelease } from './releases';

export function KraftLinkDownloads() {
    const copy = useSiteCopy().downloads.kraftLink;
    const { path } = useLocale();
    const { data: initial, update } = usePublicPageData();
    const [release, setRelease] = useState(() => kraftLinkRelease(initial.kraftLink));
    useEffect(() => {
        const controller = new AbortController();
        api<{ data: unknown }>('/api/metadata?source=kraftlink', { signal: controller.signal })
            .then(({ data }) => {
                const result = kraftLinkRelease(data);
                if (!controller.signal.aborted && result) {
                    setRelease(result);
                    update({ kraftLink: data });
                }
            })
            .catch(() => undefined);
        return () => controller.abort();
    }, [update]);

    const releasesUrl = `https://github.com/${kraftLinkRepository}/releases`;
    return (
        <section className="card card-body p-4 mt-4" aria-labelledby="kraftlink-downloads">
            <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                    <h2 className="h4" id="kraftlink-downloads">
                        {copy.title}
                    </h2>
                    <p className="text-body-secondary">{copy.description}</p>
                </div>
                {release && <span className="download-channel">{release.version}</span>}
            </div>
            {release && (
                <ul className="row g-2 list-unstyled mb-3">
                    {release.assets.map((asset) => (
                        <li className="col-sm-6 col-lg-4" key={asset.name}>
                            <a className="btn btn-outline-dark text-start w-100" href={asset.url} rel="noreferrer">
                                {asset.platform === 'Universal'
                                    ? copy.universal
                                    : asset.platform === 'Bukkit'
                                      ? 'Bukkit, Spigot, Paper, Folia'
                                      : asset.platform === 'API'
                                        ? copy.api
                                        : asset.platform}
                                <small className="d-block text-break">{asset.name}</small>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
            <div className="d-flex flex-wrap gap-3 small">
                <Link className="text-link" to={path('/documentation/kraftlink')}>
                    {copy.guide}
                </Link>
                <a className="text-link" href={release?.notesUrl ?? releasesUrl} rel="noreferrer">
                    {copy.releases}
                </a>
                {release?.checksumUrl && (
                    <a className="text-link" href={release.checksumUrl} rel="noreferrer">
                        {copy.checksums}
                    </a>
                )}
            </div>
        </section>
    );
}
