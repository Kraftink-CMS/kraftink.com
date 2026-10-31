import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import type { OAuthProvider } from '../../../shared/auth';
import { accountCopy, twoFactorMessages } from '../../lib/translations';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { Card, ErrorNotice, PageTitle } from '../../components/UI';
import { Turnstile } from '../../components/Turnstile';
import { OAuthButton } from '../../components/auth/OAuthButton';
import { TwoFactorCodeField } from '../../components/auth/TwoFactorCodeField';

export function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' | 'reset' | 'verify' }) {
    const { locale, path } = useLocale();
    const copy = accountCopy[locale];
    const { user, refresh, oauthProviders, turnstileSiteKey } = useSession();
    const location = useLocation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [notice, setNotice] = useState('');
    const [challengeToken, setChallengeToken] = useState('');
    const [challengeKey, setChallengeKey] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [remember, setRemember] = useState(false);
    const [factorChallenge, setFactorChallenge] = useState(
        () => new URLSearchParams(window.location.hash.slice(1)).get('two_factor') ?? '',
    );
    const [factorNext, setFactorNext] = useState(
        () => new URLSearchParams(window.location.hash.slice(1)).get('next') ?? '',
    );
    const [factorCode, setFactorCode] = useState('');
    const factorCopy = twoFactorMessages[locale];
    const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
    const emailChange =
        mode === 'verify' && new URLSearchParams(location.hash.slice(1)).get('purpose') === 'email-change';
    const requestedNext = new URLSearchParams(location.search).get('next') ?? factorNext;
    let next = path('/account');
    if (
        requestedNext &&
        requestedNext.startsWith('/') &&
        !requestedNext.startsWith('//') &&
        !/[\\\u0000-\u0020\u007f]/.test(requestedNext)
    ) {
        const destination = new URL(requestedNext, window.location.origin);
        if (
            destination.origin === window.location.origin &&
            /^\/[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*\/(?:market|account|creator|moderation|admin)(?:[/?#]|$)/.test(
                destination.pathname,
            )
        ) {
            next = destination.pathname + destination.search + destination.hash;
        }
    }
    const authPath = (target: string) => path(target) + (requestedNext ? `?next=${encodeURIComponent(next)}` : '');
    const requiresToken = mode === 'reset' || mode === 'verify';
    const needsChallenge = mode !== 'verify';
    const title = emailChange ? copy.emailChangeVerifyTitle : copy[mode];
    const description = emailChange ? copy.emailChangeVerifyDescription : copy[`${mode}Description`];
    const submitLabel =
        mode === 'login'
            ? copy.loginAction
            : mode === 'register'
              ? copy.registerAction
              : mode === 'forgot'
                ? copy.sendReset
                : mode === 'reset'
                  ? copy.savePassword
                  : copy.verifyAction;

    useEffect(() => {
        const code = new URLSearchParams(location.search).get('error');
        setError(null);
        setNotice(
            code === 'github_link_required'
                ? copy.githubLinkRequired
                : code === 'terms_acceptance_required'
                  ? copy.termsRequired
                  : '',
        );
    }, [mode, location.search, copy.githubLinkRequired, copy.termsRequired]);

    useEffect(() => {
        setTermsAccepted(false);
        setRemember(false);
    }, [mode]);

    useEffect(() => {
        if (new URLSearchParams(location.hash.slice(1)).has('two_factor')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, [location.hash]);

    if (user && !factorChallenge && (mode === 'login' || mode === 'register')) {
        return <Navigate replace to={next} />;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setNotice('');
        const fields = new FormData(event.currentTarget);
        const password = String(fields.get('password') ?? '');
        if (mode === 'register' && !termsAccepted) {
            setNotice(copy.termsRequired);
            return;
        }
        if ((mode === 'register' || mode === 'reset') && password !== fields.get('confirmation')) {
            setNotice(copy.passwordMismatch);
            return;
        }
        setBusy(true);
        const form = event.currentTarget;
        try {
            const endpoint =
                mode === 'forgot'
                    ? 'forgot-password'
                    : mode === 'reset'
                      ? 'reset-password'
                      : mode === 'verify'
                        ? 'verify-email'
                        : mode;
            const result = await api<{ twoFactorRequired?: boolean; challenge?: string }>(`/api/auth/${endpoint}`, {
                method: 'POST',
                json: {
                    email: fields.get('email'),
                    identifier: fields.get('identifier'),
                    password,
                    username: fields.get('username'),
                    token,
                    turnstileToken: challengeToken,
                    next,
                    ...(mode === 'register' ? { termsAccepted } : {}),
                    ...(mode === 'login' ? { remember } : {}),
                    ...(emailChange ? { purpose: 'email-change' } : {}),
                },
            });
            if (mode === 'login') {
                if (result.twoFactorRequired && result.challenge) {
                    setFactorChallenge(result.challenge);
                    setFactorCode('');
                } else {
                    await refresh();
                }
            } else {
                setNotice(
                    mode === 'register'
                        ? copy.registrationSent
                        : mode === 'forgot'
                          ? copy.resetSent
                          : mode === 'reset'
                            ? copy.passwordSaved
                            : emailChange
                              ? copy.emailChangeVerified
                              : copy.emailVerified,
                );
                form.reset();
                if (mode === 'register') {
                    setTermsAccepted(false);
                }
                if (mode === 'verify') {
                    await refresh();
                }
            }
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
            setChallengeToken('');
            setChallengeKey((value) => value + 1);
        }
    }

    async function startOAuth(provider: OAuthProvider) {
        if (busy) {
            return;
        }
        if (mode === 'register' && !termsAccepted) {
            setNotice(copy.termsRequired);
            return;
        }
        setBusy(true);
        setError(null);
        setNotice('');
        try {
            if (mode === 'register') {
                const result = await api<{ url: string }>(`/api/auth/${provider.id}/register`, {
                    method: 'POST',
                    json: { termsAccepted, remember: false, next },
                });
                window.location.assign(result.url);
            } else {
                const query = new URLSearchParams({ next, remember: String(remember) });
                window.location.assign(`/api/auth/${provider.id}?${query.toString()}`);
            }
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
        }
    }

    async function verifyFactor(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const result = await api<{ next?: string }>('/api/auth/two-factor/verify', {
                method: 'POST',
                json: { challenge: factorChallenge, code: factorCode },
            });
            setFactorNext(result.next ?? next);
            setFactorChallenge('');
            await refresh();
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
            setFactorCode('');
        }
    }

    if (factorChallenge) {
        return (
            <div className="row justify-content-center">
                <div className="col-12 col-md-9 col-lg-6">
                    <PageTitle title={factorCopy.challengeTitle} description={factorCopy.challengeDescription} />
                    <ErrorNotice error={error} />
                    <form onSubmit={verifyFactor}>
                        <Card
                            footer={
                                <>
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        disabled={busy}
                                        onClick={() => {
                                            setFactorChallenge('');
                                            setFactorCode('');
                                            setError(null);
                                        }}
                                    >
                                        {factorCopy.backToLogin}
                                    </button>
                                    <button className="btn btn-primary" type="submit" disabled={busy}>
                                        {busy ? copy.loading : factorCopy.verify}
                                    </button>
                                </>
                            }
                        >
                            <TwoFactorCodeField id="login-two-factor" value={factorCode} onChange={setFactorCode} />
                            <p className="text-body-secondary mb-0">{factorCopy.recoveryHelp}</p>
                        </Card>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="row justify-content-center">
            <div className="col-12 col-md-9 col-lg-6">
                <PageTitle title={title} description={mode === 'verify' ? undefined : description} />
                <ErrorNotice error={error} />
                {notice && (
                    <div className="alert alert-info" role="status">
                        {notice}
                    </div>
                )}
                {requiresToken && !token && (
                    <div className="alert alert-warning" role="alert">
                        {copy.tokenMissing}
                    </div>
                )}
                <form onSubmit={submit}>
                    <Card
                        footer={
                            <button
                                className="btn btn-primary w-100"
                                type="submit"
                                disabled={
                                    busy ||
                                    (mode === 'register' && !termsAccepted) ||
                                    (requiresToken && !token) ||
                                    (needsChallenge && Boolean(turnstileSiteKey) && !challengeToken)
                                }
                            >
                                {busy ? copy.loading : submitLabel}
                            </button>
                        }
                    >
                        {mode === 'register' && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="auth-username">
                                    {copy.username}
                                </label>
                                <input
                                    className="form-control"
                                    id="auth-username"
                                    name="username"
                                    autoComplete="username"
                                    minLength={3}
                                    maxLength={30}
                                    pattern="[A-Za-z0-9_][A-Za-z0-9_.\-]{2,29}"
                                    required
                                />
                                <div className="form-text">{copy.usernameHelp}</div>
                            </div>
                        )}
                        {mode === 'login' && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="auth-identifier">
                                    {copy.identifier}
                                </label>
                                <input
                                    className="form-control"
                                    id="auth-identifier"
                                    name="identifier"
                                    type="text"
                                    autoComplete="username"
                                    maxLength={254}
                                    required
                                />
                            </div>
                        )}
                        {['register', 'forgot'].includes(mode) && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="auth-email">
                                    {copy.email}
                                </label>
                                <input
                                    className="form-control"
                                    id="auth-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    maxLength={254}
                                    required
                                />
                            </div>
                        )}
                        {['login', 'register', 'reset'].includes(mode) && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="auth-password">
                                    {copy.password}
                                </label>
                                <input
                                    className="form-control"
                                    id="auth-password"
                                    name="password"
                                    type="password"
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    minLength={mode === 'login' ? 1 : 12}
                                    maxLength={128}
                                    required
                                />
                                {mode !== 'login' && <div className="form-text">{copy.passwordHelp}</div>}
                            </div>
                        )}
                        {['register', 'reset'].includes(mode) && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="auth-confirmation">
                                    {copy.confirmPassword}
                                </label>
                                <input
                                    className="form-control"
                                    id="auth-confirmation"
                                    name="confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={12}
                                    maxLength={128}
                                    required
                                />
                            </div>
                        )}
                        {mode === 'verify' && <p className="mb-0">{description}</p>}
                        {mode === 'login' && (
                            <div className="form-check mb-3">
                                <input
                                    className="form-check-input"
                                    id="auth-remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="auth-remember">
                                    {copy.rememberMe}
                                </label>
                            </div>
                        )}
                        {mode === 'register' && (
                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        id="auth-terms"
                                        name="termsAccepted"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(event) => setTermsAccepted(event.target.checked)}
                                        required
                                    />
                                    <label className="form-check-label" htmlFor="auth-terms">
                                        {copy.acceptTermsPrefix} <Link to={path('/terms')}>{copy.termsOfUse}</Link>.
                                    </label>
                                </div>
                                <p className="form-text mb-0">
                                    {copy.privacyInformation} <Link to={path('/privacy')}>{copy.privacyPolicy}</Link>.
                                </p>
                            </div>
                        )}
                        {needsChallenge && (
                            <Turnstile
                                key={challengeKey}
                                siteKey={turnstileSiteKey ?? undefined}
                                onToken={setChallengeToken}
                            />
                        )}
                    </Card>
                </form>
                {(mode === 'login' || mode === 'register') && oauthProviders.length > 0 && (
                    <section className="mt-4" aria-labelledby="auth-oauth-title">
                        <h2 id="auth-oauth-title" className="h6 mb-2">
                            {mode === 'register' ? copy.oauthRegisterTitle : copy.oauthLoginTitle}
                        </h2>
                        <div className="d-flex flex-wrap gap-2">
                            {oauthProviders.map((provider) => (
                                <OAuthButton
                                    key={provider.id}
                                    provider={provider}
                                    onClick={() => void startOAuth(provider)}
                                    disabled={busy || (mode === 'register' && !termsAccepted)}
                                />
                            ))}
                        </div>
                    </section>
                )}
                <div className="d-flex flex-column gap-2 mt-4">
                    {user ? (
                        <Link to={path('/account')}>{copy.account}</Link>
                    ) : mode === 'login' ? (
                        <>
                            <Link to={path('/forgot-password')}>{copy.forgotten}</Link>
                            <span>
                                {copy.needAccount} <Link to={authPath('/register')}>{copy.register}</Link>
                            </span>
                        </>
                    ) : mode === 'register' ? (
                        <span>
                            {copy.alreadyAccount} <Link to={authPath('/login')}>{copy.login}</Link>
                        </span>
                    ) : (
                        <Link to={authPath('/login')}>{copy.login}</Link>
                    )}
                </div>
            </div>
        </div>
    );
}
