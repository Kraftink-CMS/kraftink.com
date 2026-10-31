import { useCallback, useState } from 'react';
import { accountCopy } from '../../lib/translations';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { Card } from '../../components/UI';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import type { AccountActions, SiteKeyState } from './types';

export function useSiteConnection() {
    const [site, setSite] = useState<SiteKeyState | null>(null);
    const [ips, setIps] = useState<string[]>(['']);
    const [revealedKey, setRevealedKey] = useState('');
    const [copied, setCopied] = useState(false);
    const replaceSite = useCallback((next: SiteKeyState) => {
        setSite(next);
        setIps(next.allowedIps.length > 0 ? next.allowedIps : ['']);
    }, []);

    return {
        site,
        ips,
        setIps,
        revealedKey,
        setRevealedKey,
        copied,
        setCopied,
        replaceSite,
    };
}

export function SiteConnectionPanel({
    connection,
    actions,
    reload: load,
}: {
    connection: ReturnType<typeof useSiteConnection>;
    actions: AccountActions;
    reload: () => Promise<void>;
}) {
    const { locale } = useLocale();
    const copy = accountCopy[locale];
    const { user, sensitive } = useSession();
    const { site, ips, setIps, revealedKey, setRevealedKey, copied, setCopied } = connection;
    const { busy, action, setNotice } = actions;
    const date = (timestamp: number) =>
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp * 1000);
    const lockedIp =
        site?.nextIpChangeAt !== null && site?.nextIpChangeAt !== undefined && site.nextIpChangeAt > Date.now() / 1000;
    if (!user) {
        return null;
    }

    return (
        <div className="row g-4">
            <div className="col-12 col-lg-6">
                <Card
                    title={copy.keyTitle}
                    footer={
                        <div className="d-flex flex-wrap gap-2">
                            <SensitiveButton
                                className="btn btn-primary"
                                type="button"
                                disabled={busy || !user.emailVerified}
                                onClick={() =>
                                    void action(async () => {
                                        const result = await api<{ siteKey: string }>('/api/account/site-key', {
                                            method: 'POST',
                                            json: {},
                                            sensitiveToken: await sensitive('account.site-key'),
                                        });
                                        setRevealedKey(result.siteKey);
                                        setCopied(false);
                                        await load();
                                    })
                                }
                            >
                                {site?.hasKey ? copy.rotateKey : copy.generateKey}
                            </SensitiveButton>
                            {site?.hasKey && (
                                <button
                                    className="btn btn-outline-danger"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                        if (window.confirm(copy.revokeConfirm)) {
                                            void action(async () => {
                                                await api('/api/account/site-key', {
                                                    method: 'DELETE',
                                                });
                                                setRevealedKey('');
                                                setNotice(copy.keyRevoked);
                                                await load();
                                            });
                                        }
                                    }}
                                >
                                    {copy.revokeKey}
                                </button>
                            )}
                        </div>
                    }
                >
                    <p>{copy.keyHelp}</p>
                    <p className="mb-0">
                        {site?.hasKey ? (
                            <>
                                {copy.keyConfigured} <code>{site.prefix}…</code>
                            </>
                        ) : (
                            copy.noKey
                        )}
                    </p>
                    {revealedKey && (
                        <div className="mt-3">
                            <label className="form-label" htmlFor="site-key-once">
                                {copy.keyOnce}
                            </label>
                            <div className="input-group">
                                <input
                                    id="site-key-once"
                                    className="form-control font-monospace"
                                    value={revealedKey}
                                    readOnly
                                    autoComplete="off"
                                    spellCheck={false}
                                    onFocus={(event) => event.currentTarget.select()}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() =>
                                        void action(async () => {
                                            await navigator.clipboard.writeText(revealedKey);
                                            setCopied(true);
                                        })
                                    }
                                >
                                    {copied ? copy.copied : copy.copy}
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
            {site?.ipPolicy === 'networks' ? (
                <div className="col-12 col-lg-6">
                    <Card title={copy.ipNetworksTitle}>
                        <p>{copy.ipNetworksHelp}</p>
                        {site.allowedNetworks.length > 0 ? (
                            <ul className="list-unstyled vstack gap-2">
                                {site.allowedNetworks.map((network) => (
                                    <li key={network}>
                                        <code className="text-break">{network}</code>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-body-secondary">{copy.ipNetworksEmpty}</p>
                        )}
                        <p className="small text-body-secondary">{copy.ipNetworksManaged}</p>
                    </Card>
                </div>
            ) : (
                <div className="col-12 col-lg-6">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void action(async () => {
                                await api('/api/account/ip', {
                                    method: 'PATCH',
                                    json: {
                                        ips: ips.map((value) => value.trim()).filter(Boolean),
                                    },
                                    sensitiveToken: await sensitive('account.security'),
                                });
                                setNotice(copy.ipSaved);
                                await load();
                            });
                        }}
                    >
                        <Card
                            title={copy.ipTitle}
                            footer={
                                <SensitiveButton
                                    className="btn btn-primary"
                                    type="submit"
                                    disabled={busy || !user.emailVerified || Boolean(lockedIp)}
                                >
                                    {copy.saveIp}
                                </SensitiveButton>
                            }
                        >
                            <p>{copy.ipHelp}</p>
                            <p className="small text-body-secondary">
                                {copy.ipLimitHelp.replace('{count}', String(site?.ipLimit ?? 1))}
                            </p>
                            <div className="vstack gap-3">
                                {ips.map((value, index) => (
                                    <div key={index}>
                                        <label className="form-label" htmlFor={`site-ip-${index}`}>
                                            {copy.ip} {index + 1}
                                        </label>
                                        <div className="input-group">
                                            <input
                                                id={`site-ip-${index}`}
                                                className="form-control"
                                                value={value}
                                                onChange={(event) =>
                                                    setIps((current) =>
                                                        current.map((ip, position) =>
                                                            position === index ? event.target.value : ip,
                                                        ),
                                                    )
                                                }
                                                maxLength={45}
                                                spellCheck={false}
                                                autoComplete="off"
                                                required
                                                disabled={busy || Boolean(lockedIp)}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                disabled={busy || Boolean(lockedIp)}
                                                onClick={() =>
                                                    setIps((current) =>
                                                        current.filter((_, position) => position !== index),
                                                    )
                                                }
                                                aria-label={`${copy.removeIp} ${index + 1}`}
                                            >
                                                {copy.removeIp}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={busy || Boolean(lockedIp) || ips.length >= (site?.ipLimit ?? 1)}
                                        onClick={() => setIps((current) => [...current, ''])}
                                    >
                                        {copy.addIp}
                                    </button>
                                </div>
                            </div>
                            <div className="form-text">{copy.ipCooldown}</div>
                            {lockedIp && site?.nextIpChangeAt && (
                                <p className="small mt-2">
                                    {copy.nextChange} : {date(site.nextIpChangeAt)}
                                </p>
                            )}
                            <p className="small text-body-secondary mt-3 mb-1">
                                {copy.ipBrowser} : <code>{site?.clientIp}</code>
                            </p>
                            <p className="small text-body-secondary">{copy.ipBrowserHelp}</p>
                            <p className="small mb-0">{copy.ipDynamic}</p>
                        </Card>
                    </form>
                </div>
            )}
        </div>
    );
}
