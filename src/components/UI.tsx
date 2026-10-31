import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';
import { useLocale } from '../lib/i18n';
import { commonMessages } from '../lib/translations';

export function PageTitle({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <header className="page-heading">
            <div>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
        </header>
    );
}

export function Card({
    title,
    children,
    footer,
    className = '',
}: {
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <section className={`card ${className}`}>
            {title && (
                <div className="card-header">
                    <h2 className="card-title">{title}</h2>
                </div>
            )}
            <div className="card-body">{children}</div>
            {footer && <div className="card-footer d-flex flex-wrap gap-2">{footer}</div>}
        </section>
    );
}

export function Loading() {
    const { locale } = useLocale();
    return (
        <div className="loading-state" role="status">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            {commonMessages[locale].loading}
        </div>
    );
}

export function ErrorNotice({ error }: { error: unknown }) {
    const { locale } = useLocale();
    if (!error || (error instanceof Error && error.message === 'cancelled')) {
        return null;
    }
    const messages = commonMessages[locale];
    const code = error instanceof ApiError ? error.code : error instanceof Error ? error.message : 'request_failed';
    return (
        <div className="alert alert-danger" role="alert">
            {messages.errors[code] ?? messages.errors.request_failed}
        </div>
    );
}

export function Empty({ children }: { children?: ReactNode }) {
    const { locale } = useLocale();
    return <div className="empty-state">{children ?? commonMessages[locale].empty}</div>;
}

export function StatusBadge({ value }: { value: string }) {
    const { locale } = useLocale();
    const texts = commonMessages[locale] as unknown as Record<string, string>;
    const style = ['active', 'paid', 'approved', 'published'].includes(value)
        ? 'success'
        : ['revoked', 'rejected', 'failed', 'disputed'].includes(value)
          ? 'danger'
          : 'secondary';
    return <span className={`badge text-bg-${style}`}>{texts[value] ?? value}</span>;
}
