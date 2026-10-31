import type { RefObject } from 'react';
import { useLocale } from '../../lib/i18n';
import { twoFactorMessages } from '../../lib/translations';

export function TwoFactorCodeField({
    id,
    value,
    onChange,
    inputRef,
    autoFocus = true,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    inputRef?: RefObject<HTMLInputElement | null>;
    autoFocus?: boolean;
}) {
    const { locale } = useLocale();
    const copy = twoFactorMessages[locale];
    return (
        <div className="mb-3">
            <label className="form-label" htmlFor={id}>
                {copy.codeLabel}
            </label>
            <input
                id={id}
                ref={inputRef}
                name="code"
                type="text"
                className="form-control"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                autoComplete="one-time-code"
                inputMode="text"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={40}
                aria-describedby={`${id}-help`}
                required
                autoFocus={autoFocus}
            />
            <div id={`${id}-help`} className="form-text">
                {copy.codeHelp}
            </div>
        </div>
    );
}
