import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
    type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { OAuthProvider, User } from '../../shared/auth';
import { api, ApiError, setCsrfToken } from './api';
import { useLocale } from './i18n';
import { commonMessages, twoFactorMessages } from './translations';
import { ErrorNotice } from '../components/UI';
import { OAuthButton } from '../components/auth/OAuthButton';
import { TwoFactorCodeField } from '../components/auth/TwoFactorCodeField';
import { Modal } from '../components/Modal';

interface SessionData {
    user: User | null;
    csrfToken: string | null;
    oauthProviders: OAuthProvider[];
    turnstileSiteKey: string | null;
}

interface SessionContextValue extends SessionData {
    loading: boolean;
    confirming: boolean;
    sessionError: unknown;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
    sensitive: (purpose: string) => Promise<string>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<SessionData>({
        user: null,
        csrfToken: null,
        oauthProviders: [],
        turnstileSiteKey: null,
    });
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<unknown>(null);
    const [pending, setPending] = useState<{
        purpose: string;
        method: 'two-factor' | 'password' | 'oauth';
        resolve: (token: string) => void;
        reject: (error: Error) => void;
    } | null>(null);
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<unknown>(null);
    const [busy, setBusy] = useState(false);
    const proof = useRef<{ token: string; purpose: string } | null>(null);
    const passwordField = useRef<HTMLInputElement>(null);
    const codeField = useRef<HTMLInputElement>(null);
    const { locale, path } = useLocale();
    const navigate = useNavigate();
    const text = commonMessages[locale];
    const twoFactorText = twoFactorMessages[locale];

    const refresh = useCallback(async () => {
        try {
            const data = await api<SessionData>('/api/auth/session');
            setCsrfToken(data.csrfToken ?? '');
            setSession(data);
            setSessionError(null);
        } catch (failure) {
            setSessionError(failure);
            throw failure;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh().catch(() => undefined);
    }, [refresh]);
    useEffect(() => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const token = fragment.get('sensitive');
        const purpose = fragment.get('purpose');
        if (token && purpose && /^[A-Za-z0-9_-]{43}$/.test(token)) {
            proof.current = { token, purpose };
            history.replaceState(null, '', window.location.pathname + window.location.search);
            const destination =
                purpose.startsWith('moderation.') || purpose === 'admin.resource-revoke'
                    ? '/moderation'
                    : purpose === 'admin.users' || purpose === 'admin.roles'
                      ? '/admin/users'
                      : purpose === 'admin.announcements'
                        ? '/admin/announcements'
                        : purpose === 'creator.payments'
                          ? '/creator'
                          : '/account';
            navigate(path(destination), {
                replace: true,
                ...(purpose === 'account.password' ? { state: { accountTab: 'profile' } } : {}),
            });
        }
    }, [navigate, path]);

    const sensitive = async (purpose: string): Promise<string> => {
        const user = session.user;
        if (!user) {
            throw new ApiError('authentication_required', 401);
        }
        const github = session.oauthProviders.find((provider) => provider.id === 'github');
        const method = user.twoFactorEnabled
            ? 'two-factor'
            : purpose === 'admin.roles' || user.hasPassword
              ? 'password'
              : user.githubLinked && github
                ? 'oauth'
                : null;
        if (!method) {
            throw new ApiError('authentication_method_unavailable', 409);
        }
        if (method === 'oauth' && proof.current?.purpose === purpose) {
            const token = proof.current.token;
            proof.current = null;
            return token;
        }
        setPassword('');
        setCode('');
        setError(null);
        return new Promise((resolve, reject) => setPending({ purpose, method, resolve, reject }));
    };

    function cancel() {
        pending?.reject(new Error('cancelled'));
        setPending(null);
        setPassword('');
        setCode('');
    }

    async function confirm(event: FormEvent) {
        event.preventDefault();
        if (!pending || pending.method === 'oauth') {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await api<{ sensitiveToken: string }>('/api/auth/reauthenticate', {
                method: 'POST',
                json:
                    pending.method === 'two-factor'
                        ? { code, purpose: pending.purpose }
                        : { password, purpose: pending.purpose },
            });
            pending.resolve(result.sensitiveToken);
            setPending(null);
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
            setPassword('');
            setCode('');
        }
    }

    const logout = async () => {
        await api('/api/auth/logout', { method: 'POST', json: {} });
        proof.current = null;
        setCsrfToken('');
        await refresh();
        navigate(path('/'));
    };

    return (
        <SessionContext.Provider
            value={{ ...session, loading, sessionError, confirming: Boolean(pending), refresh, logout, sensitive }}
        >
            {children}
            <Modal
                open={Boolean(pending)}
                onClose={cancel}
                labelledBy="sensitive-title"
                dismissible={!busy}
                initialFocus={pending?.method === 'two-factor' ? codeField : passwordField}
            >
                <form
                    className="modal-content"
                    name="sensitive-confirmation"
                    action="/api/auth/reauthenticate"
                    method="post"
                    autoComplete="on"
                    onSubmit={confirm}
                >
                    <div className="modal-body p-4">
                        <h2 id="sensitive-title" className="h4">
                            {text.reauthenticate}
                        </h2>
                        <p className="text-body-secondary">
                            {pending?.method === 'two-factor'
                                ? twoFactorText.confirmationHelp
                                : pending?.purpose === 'admin.roles'
                                  ? text.roleConfirmationHelp
                                  : pending?.method === 'password'
                                    ? text.passwordConfirmationHelp
                                    : pending?.method === 'oauth'
                                      ? text.oauthConfirmationHelp
                                      : text.sensitiveHelp}
                        </p>
                        <ErrorNotice error={error} />
                        {(pending?.method === 'password' || pending?.method === 'two-factor') && (
                            <div className="visually-hidden" aria-hidden="true">
                                <label htmlFor="sensitive-username">{text.username}</label>
                                <input
                                    id="sensitive-username"
                                    name="username"
                                    autoComplete="username"
                                    value={session.user?.email ?? ''}
                                    readOnly
                                    tabIndex={-1}
                                />
                            </div>
                        )}
                        {pending?.method === 'two-factor' && (
                            <TwoFactorCodeField
                                id="sensitive-code"
                                value={code}
                                onChange={setCode}
                                inputRef={codeField}
                                autoFocus={false}
                            />
                        )}
                        {pending?.method === 'password' && (
                            <>
                                <label className="form-label" htmlFor="sensitive-password">
                                    {text.password}
                                </label>
                                <input
                                    id="sensitive-password"
                                    ref={passwordField}
                                    name="password"
                                    className="form-control"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
                            </>
                        )}
                        {pending?.method === 'oauth' &&
                            session.oauthProviders
                                .filter((provider) => provider.id === 'github' && session.user?.githubLinked)
                                .map((provider) => (
                                    <OAuthButton
                                        key={provider.id}
                                        provider={provider}
                                        className="w-100 mt-3"
                                        href={`/api/auth/${provider.id}?purpose=reauthenticate&action=${encodeURIComponent(pending?.purpose ?? '')}`}
                                    />
                                ))}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={cancel} disabled={busy}>
                            {text.cancel}
                        </button>
                        {pending?.method !== 'oauth' && (
                            <button type="submit" className="btn btn-primary" disabled={busy}>
                                {busy ? text.loading : text.confirm}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </SessionContext.Provider>
    );
}

export function useSession(): SessionContextValue {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('SessionProvider required');
    }
    return context;
}
