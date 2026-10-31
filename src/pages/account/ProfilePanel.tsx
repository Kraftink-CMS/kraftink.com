import { useRef, useState } from 'react';
import { accountCopy } from '../../lib/translations';
import { api, ApiError } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { Card } from '../../components/UI';
import { OAuthButton } from '../../components/auth/OAuthButton';
import { SensitiveActionHint, SensitiveButton } from '../../components/auth/SensitiveButton';
import type { AccountActions, AccountProfile } from './types';

export function ProfilePanel({
    profile,
    onProfileChanged: setProfile,
    actions,
}: {
    profile: AccountProfile | null;
    onProfileChanged: (profile: AccountProfile) => void;
    actions: AccountActions;
}) {
    const { locale } = useLocale();
    const copy = accountCopy[locale];
    const { user, sensitive, logout, refresh, oauthProviders } = useSession();
    const github = oauthProviders.find((provider) => provider.id === 'github');
    const { busy, action, setNotice } = actions;
    const [passwordReady, setPasswordReady] = useState(false);
    const passwordProof = useRef('');
    const date = (timestamp: number) =>
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp * 1000);
    const lockedUsername = Boolean(profile?.nextUsernameChangeAt && profile.nextUsernameChangeAt > Date.now() / 1000);
    const lockedEmail = Boolean(profile?.nextEmailChangeAt && profile.nextEmailChangeAt > Date.now() / 1000);
    if (!user) {
        return null;
    }

    return (
        <div className="row g-4">
            <div className="col-12 col-lg-6">
                <Card
                    title={copy.profile}
                    footer={
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                void action(async () => {
                                    await logout();
                                })
                            }
                        >
                            {copy.logout}
                        </button>
                    }
                >
                    <dl className="row mb-0">
                        <dt className="col-5">{copy.username}</dt>
                        <dd className="col-7">{user.username}</dd>
                        <dt className="col-5">{copy.email}</dt>
                        <dd className="col-7 text-break">
                            {user.email}
                            <br />
                            <span className="small">{user.emailVerified ? copy.verified : copy.unverified}</span>
                        </dd>
                        <dt className="col-5">{copy.role}</dt>
                        <dd className="col-7">
                            <span className="badge text-bg-secondary">{copy[user.role ?? 'user']}</span>
                        </dd>
                        {profile?.createdAt && (
                            <>
                                <dt className="col-5">{copy.createdAt}</dt>
                                <dd className="col-7">{date(profile.createdAt)}</dd>
                            </>
                        )}
                    </dl>
                </Card>
            </div>
            <div className="col-12 col-lg-6">
                <Card
                    title={copy.githubTitle}
                    footer={
                        user.githubLinked ? (
                            <SensitiveButton
                                className="btn btn-outline-danger"
                                type="button"
                                disabled={busy || !user.hasPassword}
                                onClick={() =>
                                    void action(async () => {
                                        await api('/api/account/github', {
                                            method: 'DELETE',
                                            sensitiveToken: await sensitive('account.github-unlink'),
                                        });
                                        await refresh();
                                        setNotice(copy.githubUnlinkedNotice);
                                    })
                                }
                            >
                                {copy.unlinkGithub}
                            </SensitiveButton>
                        ) : github ? (
                            <OAuthButton
                                provider={github}
                                aria-label={copy.linkGithub}
                                disabled={busy || !user.emailVerified}
                                onClick={() =>
                                    void action(async () => {
                                        const result = await api<{ url: string }>('/api/auth/github/link', {
                                            method: 'POST',
                                            json: {},
                                            sensitiveToken: await sensitive('account.github-link'),
                                        });
                                        window.location.assign(result.url);
                                        await refresh();
                                    })
                                }
                            >
                                <SensitiveActionHint />
                            </OAuthButton>
                        ) : undefined
                    }
                >
                    <p className="mb-0">{user.githubLinked ? copy.githubLinked : copy.githubUnlinked}</p>
                    {user.githubLinked && !user.hasPassword && (
                        <p className="small text-body-secondary mt-3 mb-0">{copy.githubPasswordRequired}</p>
                    )}
                </Card>
            </div>
            {!user.hasPassword && user.githubLinked && (
                <div className="col-12 col-lg-6">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!passwordReady || !passwordProof.current) {
                                return;
                            }
                            const form = event.currentTarget;
                            const fields = new FormData(form);
                            const password = String(fields.get('password') ?? '');
                            const passwordConfirmation = String(fields.get('passwordConfirmation') ?? '');
                            form.reset();
                            void action(async () => {
                                if (password !== passwordConfirmation) {
                                    throw new ApiError('password_confirmation_mismatch', 422);
                                }
                                const token = passwordProof.current;
                                passwordProof.current = '';
                                setPasswordReady(false);
                                await api('/api/account/password', {
                                    method: 'POST',
                                    json: { password, passwordConfirmation },
                                    sensitiveToken: token,
                                });
                                await refresh();
                                setNotice(copy.passwordSet);
                            });
                        }}
                    >
                        <Card
                            title={copy.setPasswordTitle}
                            footer={
                                passwordReady ? (
                                    <button className="btn btn-primary" type="submit" disabled={busy}>
                                        {copy.setPassword}
                                    </button>
                                ) : (
                                    <SensitiveButton
                                        className="btn btn-primary"
                                        type="button"
                                        disabled={busy || (!user.twoFactorEnabled && !github)}
                                        onClick={() =>
                                            void action(async () => {
                                                passwordProof.current = await sensitive('account.password');
                                                setPasswordReady(true);
                                            })
                                        }
                                    >
                                        {copy.preparePassword}
                                    </SensitiveButton>
                                )
                            }
                        >
                            <p>{copy.setPasswordHelp}</p>
                            {passwordReady && (
                                <>
                                    <input
                                        className="visually-hidden"
                                        name="username"
                                        autoComplete="username"
                                        value={user.email}
                                        readOnly
                                        tabIndex={-1}
                                        aria-hidden="true"
                                    />
                                    <label className="form-label" htmlFor="profile-new-password">
                                        {copy.password}
                                    </label>
                                    <input
                                        id="profile-new-password"
                                        className="form-control"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={12}
                                        maxLength={128}
                                        disabled={busy}
                                        required
                                    />
                                    <div className="form-text mb-3">{copy.passwordHelp}</div>
                                    <label className="form-label" htmlFor="profile-password-confirmation">
                                        {copy.confirmPassword}
                                    </label>
                                    <input
                                        id="profile-password-confirmation"
                                        className="form-control"
                                        name="passwordConfirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={12}
                                        maxLength={128}
                                        disabled={busy}
                                        required
                                    />
                                </>
                            )}
                        </Card>
                    </form>
                </div>
            )}
            <div className="col-12 col-lg-6">
                <form
                    key={user.username}
                    onSubmit={(event) => {
                        event.preventDefault();
                        const username = String(new FormData(event.currentTarget).get('username') ?? '');
                        void action(async () => {
                            await api('/api/account/username', {
                                method: 'PATCH',
                                json: { username },
                                sensitiveToken: await sensitive('account.security'),
                            });
                            await refresh();
                            setProfile(await api<AccountProfile>('/api/account'));
                            setNotice(copy.usernameSaved);
                        });
                    }}
                >
                    <Card
                        title={copy.usernameChangeTitle}
                        footer={
                            <SensitiveButton
                                className="btn btn-primary"
                                type="submit"
                                disabled={busy || lockedUsername}
                            >
                                {copy.saveUsername}
                            </SensitiveButton>
                        }
                    >
                        <label className="form-label" htmlFor="profile-username">
                            {copy.username}
                        </label>
                        <input
                            className="form-control"
                            id="profile-username"
                            name="username"
                            defaultValue={user.username}
                            autoComplete="username"
                            minLength={3}
                            maxLength={30}
                            pattern="[A-Za-z0-9_][A-Za-z0-9_.\-]{2,29}"
                            disabled={busy || lockedUsername}
                            required
                        />
                        <div className="form-text">{copy.usernameHelp}</div>
                        <p className="small text-body-secondary mt-3 mb-0">{copy.usernameCooldown}</p>
                        {lockedUsername && profile?.nextUsernameChangeAt && (
                            <p className="small mt-2 mb-0">
                                {copy.nextChange} : {date(profile.nextUsernameChangeAt)}
                            </p>
                        )}
                    </Card>
                </form>
            </div>
            <div className="col-12 col-lg-6">
                <form
                    key={user.email}
                    onSubmit={(event) => {
                        event.preventDefault();
                        const email = String(new FormData(event.currentTarget).get('email') ?? '');
                        void action(async () => {
                            await api('/api/account/email', {
                                method: 'POST',
                                json: { email },
                                sensitiveToken: await sensitive('account.security'),
                            });
                            setProfile(await api<AccountProfile>('/api/account'));
                            setNotice(copy.emailChangeSent);
                        });
                    }}
                >
                    <Card
                        title={copy.emailChangeTitle}
                        footer={
                            <SensitiveButton className="btn btn-primary" type="submit" disabled={busy || lockedEmail}>
                                {copy.sendEmailChange}
                            </SensitiveButton>
                        }
                    >
                        <label className="form-label" htmlFor="profile-email">
                            {copy.email}
                        </label>
                        <input
                            className="form-control"
                            id="profile-email"
                            name="email"
                            type="email"
                            defaultValue={user.email}
                            autoComplete="email"
                            maxLength={254}
                            disabled={busy || lockedEmail}
                            required
                        />
                        <div className="form-text">{copy.emailChangeHelp}</div>
                        <p className="small text-body-secondary mt-3 mb-0">{copy.emailCooldown}</p>
                        {lockedEmail && profile?.nextEmailChangeAt && (
                            <p className="small mt-2 mb-0">
                                {copy.nextChange} : {date(profile.nextEmailChangeAt)}
                            </p>
                        )}
                        {profile?.pendingEmail && (
                            <div className="alert alert-info mt-3 mb-0">
                                <p className="mb-1">
                                    {copy.pendingEmail} :{' '}
                                    <strong className="text-break">{profile.pendingEmail.email}</strong>
                                </p>
                                <p className="small">
                                    {copy.emailChangeExpires} : {date(profile.pendingEmail.expiresAt)}
                                </p>
                                <SensitiveButton
                                    className="btn btn-sm btn-outline-secondary"
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                        void action(async () => {
                                            await api('/api/account/email', {
                                                method: 'DELETE',
                                                sensitiveToken: await sensitive('account.security'),
                                            });
                                            setProfile(await api<AccountProfile>('/api/account'));
                                            setNotice(copy.emailChangeCancelled);
                                        })
                                    }
                                >
                                    {copy.cancelEmailChange}
                                </SensitiveButton>
                            </div>
                        )}
                    </Card>
                </form>
            </div>
        </div>
    );
}
