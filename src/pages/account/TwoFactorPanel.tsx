import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card, ErrorNotice, Loading, Skeleton } from '../../components/UI';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { twoFactorMessages } from '../../lib/translations';

interface TwoFactorStatus {
    enabled: boolean;
    recoveryCodesRemaining: number;
}

interface TwoFactorSetup {
    secret: string;
    uri: string;
    expiresAt: number;
}

export function TwoFactorPanel() {
    const { locale } = useLocale();
    const copy = twoFactorMessages[locale];
    const { sensitive, refresh } = useSession();
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [code, setCode] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [qrFailed, setQrFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [notice, setNotice] = useState('');

    const loadStatus = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const result = await api<TwoFactorStatus>('/api/account/two-factor', { signal });
            if (!signal?.aborted) {
                setStatus(result);
            }
        } catch (failure) {
            if (!signal?.aborted) {
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
        void loadStatus(controller.signal);
        return () => controller.abort();
    }, [loadStatus]);

    useEffect(() => {
        if (!setup) {
            return;
        }
        let active = true;
        setQrCode('');
        setQrFailed(false);
        void import('qrcode')
            .then(({ default: QRCode }) =>
                QRCode.toDataURL(setup.uri, { width: 224, margin: 4, errorCorrectionLevel: 'M' }),
            )
            .then((image) => {
                if (active) {
                    setQrCode(image);
                }
            })
            .catch(() => {
                if (active) {
                    setQrFailed(true);
                }
            });
        const expiry = setTimeout(
            () => {
                setSetup(null);
                setCode('');
                setQrCode('');
                setNotice(copy.setupExpired);
            },
            Math.max(0, setup.expiresAt * 1000 - Date.now()),
        );
        return () => {
            active = false;
            clearTimeout(expiry);
        };
    }, [setup, copy.setupExpired]);

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

    async function startSetup() {
        await action(async () => {
            const token = await sensitive('account.two-factor');
            const result = await api<TwoFactorSetup>('/api/account/two-factor/setup', {
                method: 'POST',
                json: {},
                sensitiveToken: token,
            });
            setCode('');
            setSetup(result);
        });
    }

    async function confirmSetup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await action(async () => {
            const result = await api<{ recoveryCodes: string[] }>('/api/account/two-factor/confirm', {
                method: 'POST',
                json: { code },
            });
            setRecoveryCodes(result.recoveryCodes);
            setSetup(null);
            setQrCode('');
            setCode('');
            setStatus({ enabled: true, recoveryCodesRemaining: result.recoveryCodes.length });
            setNotice(copy.enabledNotice);
            await refresh();
        });
    }

    async function manage(mode: 'disable' | 'regenerate') {
        await action(async () => {
            const token = await sensitive('account.two-factor');
            if (mode === 'disable') {
                await api('/api/account/two-factor', {
                    method: 'DELETE',
                    json: {},
                    sensitiveToken: token,
                });
                setStatus({ enabled: false, recoveryCodesRemaining: 0 });
                setNotice(copy.disabledNotice);
            } else {
                const result = await api<{ recoveryCodes: string[] }>('/api/account/two-factor/recovery-codes', {
                    method: 'POST',
                    json: {},
                    sensitiveToken: token,
                });
                setRecoveryCodes(result.recoveryCodes);
                setStatus({ enabled: true, recoveryCodesRemaining: result.recoveryCodes.length });
                setNotice(copy.regeneratedNotice);
            }
            await refresh();
        });
    }

    async function copyValue(value: string) {
        if (!navigator.clipboard) {
            setNotice(copy.copyUnavailable);
            return;
        }
        try {
            await navigator.clipboard.writeText(value);
            setNotice(copy.copied);
        } catch {
            setNotice(copy.copyUnavailable);
        }
    }

    if (loading) {
        return (
            <Card title={copy.title} footer={<Skeleton width="11rem" height="2.625rem" />}>
                <Loading />
            </Card>
        );
    }

    const notices = (
        <>
            <ErrorNotice error={error} />
            {notice && (
                <p className="alert alert-info" role="status">
                    {notice}
                </p>
            )}
        </>
    );

    if (recoveryCodes.length > 0) {
        return (
            <Card
                title={copy.recoveryTitle}
                footer={
                    <>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => void copyValue(recoveryCodes.join('\n'))}
                        >
                            {copy.copyCodes}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setRecoveryCodes([]);
                                setNotice('');
                            }}
                        >
                            {copy.savedCodes}
                        </button>
                    </>
                }
            >
                {notices}
                <p>{copy.recoveryDescription}</p>
                <label className="form-label" htmlFor="two-factor-recovery-codes">
                    {copy.recoveryCodes}
                </label>
                <textarea
                    id="two-factor-recovery-codes"
                    className="form-control font-monospace"
                    value={recoveryCodes.join('\n')}
                    rows={Math.min(recoveryCodes.length, 10)}
                    readOnly
                    autoComplete="off"
                    spellCheck={false}
                    onFocus={(event) => event.currentTarget.select()}
                />
            </Card>
        );
    }

    if (setup) {
        return (
            <form onSubmit={(event) => void confirmSetup(event)}>
                <Card
                    title={copy.setupTitle}
                    footer={
                        <>
                            <button type="submit" className="btn btn-primary" disabled={busy}>
                                {copy.confirmSetup}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={busy}
                                onClick={() => {
                                    setSetup(null);
                                    setQrCode('');
                                    setCode('');
                                    setError(null);
                                    setNotice('');
                                }}
                            >
                                {copy.cancel}
                            </button>
                        </>
                    }
                >
                    {notices}
                    <p>{copy.setupHelp}</p>
                    <div className="row g-4 align-items-center">
                        <div className="col-md-auto text-center">
                            {qrCode ? (
                                <img src={qrCode} width="224" height="224" alt={copy.qrCode} />
                            ) : qrFailed ? (
                                <p className="text-body-secondary small mb-0">{copy.qrUnavailable}</p>
                            ) : (
                                <Loading>
                                    <Skeleton width={224} height={224} />
                                </Loading>
                            )}
                        </div>
                        <div className="col-md">
                            <label className="form-label" htmlFor="two-factor-setup-key">
                                {copy.setupKey}
                            </label>
                            <div className="input-group">
                                <input
                                    id="two-factor-setup-key"
                                    className="form-control font-monospace"
                                    value={setup.secret}
                                    readOnly
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-describedby="two-factor-setup-key-help"
                                    onFocus={(event) => event.currentTarget.select()}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    aria-label={copy.copyKey}
                                    onClick={() => void copyValue(setup.secret)}
                                >
                                    {copy.copy}
                                </button>
                            </div>
                            <p id="two-factor-setup-key-help" className="form-text mb-3">
                                {copy.setupKeyHelp}
                            </p>
                            <label className="form-label" htmlFor="two-factor-setup-code">
                                {copy.setupCodeLabel}
                            </label>
                            <input
                                id="two-factor-setup-code"
                                className="form-control"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                aria-describedby="two-factor-setup-code-help"
                                required
                            />
                            <p id="two-factor-setup-code-help" className="form-text mb-0">
                                {copy.setupCodeHelp}
                            </p>
                        </div>
                    </div>
                    <p className="small text-body-secondary mt-3 mb-0">
                        {copy.setupExpires.replace(
                            '{time}',
                            new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(setup.expiresAt * 1000),
                        )}
                    </p>
                </Card>
            </form>
        );
    }

    return (
        <Card
            title={copy.title}
            footer={
                !status ? (
                    <button type="button" className="btn btn-outline-secondary" onClick={() => void loadStatus()}>
                        {copy.retry}
                    </button>
                ) : status.enabled ? (
                    <>
                        <SensitiveButton
                            type="button"
                            className="btn btn-outline-secondary"
                            disabled={busy}
                            onClick={() => void manage('regenerate')}
                        >
                            {copy.regenerateCodes}
                        </SensitiveButton>
                        <SensitiveButton
                            type="button"
                            className="btn btn-outline-danger"
                            disabled={busy}
                            onClick={() => void manage('disable')}
                        >
                            {copy.disable}
                        </SensitiveButton>
                    </>
                ) : (
                    <SensitiveButton
                        type="button"
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => void startSetup()}
                    >
                        {copy.enable}
                    </SensitiveButton>
                )
            }
        >
            {notices}
            <p>{copy.description}</p>
            {status && (
                <>
                    <p>
                        <span className={`badge ${status.enabled ? 'text-bg-success' : 'text-bg-secondary'}`}>
                            {status.enabled ? copy.enabled : copy.disabled}
                        </span>
                    </p>
                    {status.enabled && (
                        <>
                            <p>
                                {copy.recoveryCodesRemaining.replace('{count}', String(status.recoveryCodesRemaining))}
                            </p>
                            <p className="small text-body-secondary">{copy.regenerateHelp}</p>
                        </>
                    )}
                </>
            )}
        </Card>
    );
}
