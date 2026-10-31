import type { CSSProperties, ReactNode } from 'react';
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
    title?: ReactNode;
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

export function Skeleton({
    width = '100%',
    height = '1rem',
    className = '',
}: {
    width?: CSSProperties['width'];
    height?: CSSProperties['height'];
    className?: string;
}) {
    return <span className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}

export function Loading({ children, className = '' }: { children?: ReactNode; className?: string }) {
    const { locale } = useLocale();
    return (
        <div className={`loading-state ${className}`} role="status" aria-label={commonMessages[locale].loading}>
            <div aria-hidden="true">
                {children ?? (
                    <div className="vstack gap-3">
                        <Skeleton />
                        <Skeleton width="85%" />
                        <Skeleton width="60%" />
                    </div>
                )}
            </div>
        </div>
    );
}

export function TableLoading({
    columns,
    rows = 3,
    tableClassName = '',
}: {
    columns: ReactNode[];
    rows?: number;
    tableClassName?: string;
}) {
    return (
        <Loading>
            <div className="table-responsive">
                <table className={`table align-middle mb-0 skeleton-table ${tableClassName}`}>
                    <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} scope="col">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }, (_, row) => (
                            <tr key={row}>
                                {columns.map((_, column) => (
                                    <td key={column}>
                                        <Skeleton width={column === 0 ? '80%' : '65%'} />
                                        {column === 0 && <Skeleton width="55%" height="0.875rem" className="mt-2" />}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Loading>
    );
}

export function CardsLoading({
    count = 3,
    image = false,
    columnClassName = 'col-md-6 col-xl-4',
}: {
    count?: number;
    image?: boolean;
    columnClassName?: string;
}) {
    return (
        <Loading>
            <div className="row g-4">
                {Array.from({ length: count }, (_, index) => (
                    <div className={columnClassName} key={index}>
                        <div className="card h-100 overflow-hidden">
                            {image && <div className="resource-art skeleton" />}
                            <div className="card-body vstack gap-3">
                                <Skeleton width="65%" height="1.25rem" />
                                <Skeleton />
                                <Skeleton width="85%" />
                                <Skeleton width="50%" />
                            </div>
                            <div className="card-footer">
                                <Skeleton width="35%" height="1.5rem" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Loading>
    );
}

export function FormLoading({ fields = 4 }: { fields?: number }) {
    return (
        <Loading>
            <div className="row g-4">
                {Array.from({ length: fields }, (_, index) => (
                    <div className="col-md-6" key={index}>
                        <Skeleton width="40%" height="0.875rem" className="mb-2" />
                        <Skeleton height="2.625rem" />
                    </div>
                ))}
            </div>
        </Loading>
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
