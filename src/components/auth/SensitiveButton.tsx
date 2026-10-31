import type { ButtonHTMLAttributes } from 'react';
import { useLocale } from '../../lib/i18n';
import { commonMessages } from '../../lib/translations';

export function SensitiveActionHint() {
    const { locale } = useLocale();
    const hint = commonMessages[locale].sensitiveConfirmationHint;

    return (
        <span
            className="d-inline-flex align-items-center align-middle flex-shrink-0 opacity-75"
            title={hint}
            role="img"
            aria-label={hint}
        >
            <svg
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                aria-hidden="true"
                focusable="false"
            >
                <rect x="3" y="7" width="10" height="8" rx="1.5" />
                <path d="M5 7V4a3 3 0 0 1 6 0v3M8 10v2" />
            </svg>
        </span>
    );
}

export function SensitiveButton({
    children,
    className = '',
    requiresConfirmation = true,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { requiresConfirmation?: boolean }) {
    return (
        <button {...props} className={`d-inline-flex align-items-center justify-content-center gap-2 ${className}`}>
            {children}
            {requiresConfirmation && <SensitiveActionHint />}
        </button>
    );
}
