import { Select } from '../../components/Select';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import { localized, useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { announcementMessages } from '../../lib/translations';
import { fallbackLocale, localeRegistry } from '../../../shared/locales';
import { Card, Empty, ErrorNotice, Loading, PageTitle } from '../../components/UI';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import { externalLinkRel } from '../../../shared/links';

interface Announcement {
    id: string;
    title: Record<string, string>;
    body: Record<string, string>;
    severity: 'info' | 'warning' | 'danger';
    url?: string;
    starts_at: number;
    expires_at: number;
}

function localDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AnnouncementsPage() {
    const { locale } = useLocale();
    const { sensitive } = useSession();
    const text = announcementMessages[locale];
    const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
    const [editing, setEditing] = useState<Announcement | 'new' | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [translations, setTranslations] = useState<Record<string, { title?: string; body?: string }>>({});
    const value = editing && editing !== 'new' ? editing : null;
    const languages = [
        ...new Set([
            locale,
            fallbackLocale,
            ...Object.keys(localeRegistry),
            ...Object.keys(value?.title ?? {}),
            ...Object.keys(value?.body ?? {}),
        ]),
    ];
    const reload = useCallback(async () => {
        try {
            setAnnouncements((await api<{ announcements: Announcement[] }>('/api/admin/announcements')).announcements);
        } catch (failure) {
            setError(failure);
        }
    }, []);
    useEffect(() => {
        reload();
    }, [reload]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(null);
        setBusy(true);
        try {
            const translations = (field: 'title' | 'body') =>
                Object.fromEntries(
                    languages.flatMap((language) => {
                        const content = String(form.get(`${field}:${language}`) ?? '').trim();
                        return content ? [[language, content]] : [];
                    }),
                );
            const title = translations('title');
            const body = translations('body');
            if (!Object.keys(title).some((language) => body[language])) {
                throw new ApiError('invalid_announcement');
            }
            const sensitiveToken = await sensitive('admin.announcements');
            await api(
                editing && editing !== 'new' ? `/api/admin/announcements/${editing.id}` : '/api/admin/announcements',
                {
                    method: editing && editing !== 'new' ? 'PATCH' : 'POST',
                    sensitiveToken,
                    json: {
                        title,
                        body,
                        severity: form.get('severity'),
                        url: form.get('url') || '',
                        startsAt: Math.floor(new Date(String(form.get('starts'))).getTime() / 1000),
                        expiresAt: Math.floor(new Date(String(form.get('expires'))).getTime() / 1000),
                    },
                },
            );
            setEditing(null);
            setNotice(text.success);
            await reload();
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
        }
    }

    async function remove(announcement: Announcement) {
        if (!window.confirm(text.confirmRemove)) {
            return;
        }
        setBusy(true);
        try {
            const sensitiveToken = await sensitive('admin.announcements');
            await api(`/api/admin/announcements/${announcement.id}`, { method: 'DELETE', sensitiveToken });
            await reload();
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <PageTitle title={text.title} description={text.description}>
                <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => {
                        setEditing('new');
                        setTranslations({});
                        setNotice('');
                    }}
                >
                    {text.create}
                </button>
            </PageTitle>
            <ErrorNotice error={error} />
            {notice && (
                <div className="alert alert-success" role="status">
                    {notice}
                </div>
            )}
            {editing && (
                <form className="card mb-4" key={value?.id ?? 'new'} onSubmit={submit}>
                    <div className="card-header">
                        <h2 className="card-title">{value ? text.edit : text.create}</h2>
                    </div>
                    <div className="card-body">
                        <p className="form-text">{text.required}</p>
                        <div className="row g-3">
                            {languages.map((language) => {
                                const definition = localeRegistry[language];
                                const title = translations[language]?.title ?? value?.title[language] ?? '';
                                const body = translations[language]?.body ?? value?.body[language] ?? '';
                                const filled = Boolean(title.trim() || body.trim());
                                const fields = (
                                    <>
                                        <label className="form-label" htmlFor={`announcement-title-${language}`}>
                                            {text.fieldTitle}
                                        </label>
                                        <input
                                            className="form-control"
                                            id={`announcement-title-${language}`}
                                            name={`title:${language}`}
                                            lang={language.replaceAll('_', '-')}
                                            dir={definition?.direction ?? 'auto'}
                                            maxLength={160}
                                            value={title}
                                            onChange={(event) => {
                                                const content = event.currentTarget.value;
                                                setTranslations((previous) => ({
                                                    ...previous,
                                                    [language]: { ...previous[language], title: content },
                                                }));
                                            }}
                                        />
                                        <label className="form-label mt-3" htmlFor={`announcement-body-${language}`}>
                                            {text.fieldBody}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id={`announcement-body-${language}`}
                                            name={`body:${language}`}
                                            lang={language.replaceAll('_', '-')}
                                            dir={definition?.direction ?? 'auto'}
                                            rows={5}
                                            maxLength={4000}
                                            value={body}
                                            onChange={(event) => {
                                                const content = event.currentTarget.value;
                                                setTranslations((previous) => ({
                                                    ...previous,
                                                    [language]: { ...previous[language], body: content },
                                                }));
                                            }}
                                        />
                                    </>
                                );
                                return (
                                    <div className="col-12" key={language}>
                                        <details
                                            className="border rounded p-3"
                                            open={language === locale}
                                            onInvalidCapture={(event) => {
                                                event.currentTarget.open = true;
                                            }}
                                        >
                                            <summary className="d-flex flex-wrap align-items-center gap-2">
                                                <span>{definition?.nativeName ?? language}</span>
                                                <span className="small text-body-secondary">({text.optional})</span>
                                                <span
                                                    className={`badge ${filled ? 'text-bg-success' : 'text-bg-secondary'}`}
                                                    aria-live="polite"
                                                >
                                                    {filled ? text.filled : text.notFilled}
                                                </span>
                                                <span className="small text-primary ms-auto">{text.configure}</span>
                                            </summary>
                                            <div className="mt-3">{fields}</div>
                                        </details>
                                    </div>
                                );
                            })}
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="announcement-severity">
                                    {text.severity}
                                </label>
                                <Select
                                    className="form-select"
                                    id="announcement-severity"
                                    name="severity"
                                    defaultValue={value?.severity ?? 'info'}
                                >
                                    {(['info', 'warning', 'danger'] as const).map((level) => (
                                        <option key={level} value={level}>
                                            {text[level]}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="col-md-8">
                                <label className="form-label" htmlFor="announcement-url">
                                    {text.url}
                                </label>
                                <input
                                    className="form-control"
                                    id="announcement-url"
                                    type="url"
                                    name="url"
                                    pattern="https://.*"
                                    defaultValue={value?.url ?? ''}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="announcement-starts">
                                    {text.starts}
                                </label>
                                <input
                                    className="form-control"
                                    id="announcement-starts"
                                    type="datetime-local"
                                    name="starts"
                                    required
                                    defaultValue={localDate(value?.starts_at ?? Math.floor(Date.now() / 1000))}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="announcement-expires">
                                    {text.expires}
                                </label>
                                <input
                                    className="form-control"
                                    id="announcement-expires"
                                    type="datetime-local"
                                    name="expires"
                                    required
                                    defaultValue={localDate(
                                        value?.expires_at ?? Math.floor(Date.now() / 1000) + 7 * 86400,
                                    )}
                                />
                            </div>
                        </div>
                        <p className="form-text mb-0 mt-3">{text.lifetime}</p>
                    </div>
                    <div className="card-footer d-flex gap-2">
                        <SensitiveButton type="submit" className="btn btn-primary" disabled={busy}>
                            {value ? text.save : text.publish}
                        </SensitiveButton>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setEditing(null)}
                            disabled={busy}
                        >
                            {text.cancel}
                        </button>
                    </div>
                </form>
            )}
            {!announcements ? (
                <Loading />
            ) : announcements.length === 0 ? (
                <Card>
                    <Empty>{text.empty}</Empty>
                </Card>
            ) : (
                <div className="vstack gap-4">
                    {announcements.map((announcement) => (
                        <Card
                            key={announcement.id}
                            title={localized(announcement.title, locale)}
                            footer={
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setEditing(announcement);
                                            setTranslations({});
                                        }}
                                        disabled={busy}
                                    >
                                        {text.edit}
                                    </button>
                                    <SensitiveButton
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => remove(announcement)}
                                        disabled={busy}
                                    >
                                        {text.remove}
                                    </SensitiveButton>
                                </>
                            }
                        >
                            <div className={`alert alert-${announcement.severity} announcement-preview`}>
                                {localized(announcement.body, locale)}
                            </div>
                            <p className="small text-body-secondary mb-0">
                                {new Date(announcement.starts_at * 1000).toLocaleString(locale)} →{' '}
                                {new Date(announcement.expires_at * 1000).toLocaleString(locale)}
                            </p>
                            {announcement.url && (
                                <a href={announcement.url} target="_blank" rel={externalLinkRel(announcement.url)}>
                                    {announcement.url}
                                </a>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
