import {
    forwardRef,
    useCallback,
    useId,
    useLayoutEffect,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
    type SelectHTMLAttributes,
} from 'react';
import { useLocale } from '../lib/i18n';
import { commonMessages } from '../lib/translations';
import '../styles/select.css';

interface SelectOption {
    index: number;
    value: string;
    label: string;
    disabled: boolean;
    hidden: boolean;
    group: string | null;
    lang: string | undefined;
}

function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
    { children, className = '', id, hidden, onChange, onInvalid, onFocus, multiple, size, ...props },
    forwardedRef,
) {
    const { locale } = useLocale();
    const text = commonMessages[locale];
    const ariaLabelledBy = props['aria-labelledby'];
    const generatedId = useId().replace(/[^A-Za-z0-9_-]/g, '');
    const nativeId = id ?? `select-${generatedId}`;
    const triggerId = `${nativeId}-trigger`;
    const listId = `${nativeId}-listbox`;
    const validationId = `${nativeId}-validation`;
    const root = useRef<HTMLDivElement>(null);
    const native = useRef<HTMLSelectElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const typeahead = useRef({ value: '', at: 0 });
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [query, setQuery] = useState('');
    const [labelledBy, setLabelledBy] = useState<string | undefined>(ariaLabelledBy);
    const [validationMessage, setValidationMessage] = useState('');
    const [placement, setPlacement] = useState({ upwards: false, maxHeight: 320 });
    const enhanced = !multiple && (!size || size <= 1);
    const searchable = options.filter((option) => !option.hidden).length >= 8;
    const visible = options.filter(
        (option) =>
            !option.hidden &&
            (!searchable || normalize(option.label + ' ' + (option.group ?? '')).includes(normalize(query))),
    );
    const enabled = visible.filter((option) => !option.disabled);
    const selected = options.find((option) => option.index === selectedIndex);
    const invalid =
        Boolean(validationMessage) ||
        props['aria-invalid'] === true ||
        props['aria-invalid'] === 'true' ||
        className.split(/\s+/).includes('is-invalid');
    const description =
        [props['aria-describedby'], validationMessage ? validationId : undefined].filter(Boolean).join(' ') ||
        undefined;

    const nativeRef = useCallback(
        (element: HTMLSelectElement | null) => {
            native.current = element;
            if (typeof forwardedRef === 'function') {
                forwardedRef(element);
            } else if (forwardedRef) {
                forwardedRef.current = element;
            }
        },
        [forwardedRef],
    );

    const sync = useCallback(() => {
        const select = native.current;
        if (!select) {
            return;
        }
        setOptions(
            Array.from(select.options, (option, index) => ({
                index,
                value: option.value,
                label: option.label,
                disabled: option.matches(':disabled'),
                hidden: option.hidden,
                group:
                    option.parentElement?.tagName === 'OPTGROUP'
                        ? (option.parentElement as HTMLOptGroupElement).label
                        : null,
                lang: option.getAttribute('lang') ?? undefined,
            })),
        );
        setSelectedIndex(select.selectedIndex);
        if (select.validity.valid) {
            setValidationMessage('');
        }
        if (select.matches(':disabled')) {
            setOpen(false);
        }
    }, []);

    useLayoutEffect(() => {
        sync();
    }, [children, props.value, props.defaultValue, props.disabled, props.required, enhanced, sync]);

    useLayoutEffect(() => {
        if (!enhanced || !native.current) {
            return;
        }
        const labels = Array.from(native.current.labels ?? []);
        const original = labels.map((label, index) => {
            const originalFor = label.htmlFor;
            const originalId = label.id;
            label.id ||= `${triggerId}-label-${index}`;
            if (originalFor === nativeId) {
                label.htmlFor = triggerId;
            }
            return { label, originalFor, originalId };
        });
        setLabelledBy(ariaLabelledBy || labels.map((label) => label.id).join(' ') || undefined);
        return () => {
            for (const { label, originalFor, originalId } of original) {
                if (label.htmlFor === triggerId) {
                    label.htmlFor = originalFor;
                }
                if (!originalId && label.id.startsWith(`${triggerId}-label-`)) {
                    label.removeAttribute('id');
                }
            }
        };
    }, [enhanced, nativeId, triggerId, ariaLabelledBy]);

    useEffect(() => {
        const form = native.current?.form;
        if (!form) {
            return;
        }
        let timer: ReturnType<typeof setTimeout> | undefined;
        const reset = () => {
            timer = setTimeout(() => {
                setOpen(false);
                setValidationMessage('');
                sync();
            }, 0);
        };
        form.addEventListener('reset', reset);
        return () => {
            clearTimeout(timer);
            form.removeEventListener('reset', reset);
        };
    }, [props.form, enhanced, sync]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const outside = (event: Event) => {
            if (event.target && !root.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('focusin', outside);
        if (searchable) {
            search.current?.focus();
        }
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('focusin', outside);
        };
    }, [open, searchable]);

    useLayoutEffect(() => {
        if (!open || !trigger.current || !menu.current) {
            return;
        }
        const position = () => {
            if (!trigger.current || !menu.current) {
                return;
            }
            const rect = trigger.current.getBoundingClientRect();
            const below = window.innerHeight - rect.bottom;
            const upwards = below < Math.min(menu.current.scrollHeight, 320) + 12 && rect.top > below;
            const available = (upwards ? rect.top : below) - 16;
            setPlacement({ upwards, maxHeight: Math.max(44, Math.min(320, available)) });
        };
        position();
        window.addEventListener('resize', position);
        return () => window.removeEventListener('resize', position);
    }, [open, query, options.length]);

    useLayoutEffect(() => {
        if (!open || !menu.current || active < 0) {
            return;
        }
        const element = document.getElementById(`${listId}-option-${active}`);
        if (!element) {
            return;
        }
        const top = element.offsetTop;
        const bottom = top + element.offsetHeight;
        const searchHeight = search.current?.parentElement?.offsetHeight ?? 0;
        if (top < menu.current.scrollTop + searchHeight) {
            menu.current.scrollTop = top - searchHeight;
        } else if (bottom > menu.current.scrollTop + menu.current.clientHeight) {
            menu.current.scrollTop = bottom - menu.current.clientHeight;
        }
    }, [open, active, query, listId]);

    function close(focus = false) {
        setOpen(false);
        if (focus) {
            trigger.current?.focus();
        }
    }

    function show() {
        if (!native.current || native.current.matches(':disabled')) {
            return;
        }
        setQuery('');
        setActive(
            options.find(
                (option) => option.index === native.current!.selectedIndex && !option.disabled && !option.hidden,
            )?.index ??
                options.find((option) => !option.disabled && !option.hidden)?.index ??
                -1,
        );
        setOpen(true);
    }

    function choose(index: number) {
        const select = native.current;
        const option = options.find((item) => item.index === index);
        if (!select || select.matches(':disabled') || !option || option.disabled || option.hidden) {
            return;
        }
        const changed = select.selectedIndex !== index;
        select.selectedIndex = index;
        close(true);
        if (changed) {
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        queueMicrotask(sync);
    }

    function keyboard(event: KeyboardEvent<HTMLElement>) {
        if (event.key === 'Tab') {
            close();
            return;
        }
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            close(true);
            return;
        }
        const searching = event.target === search.current;
        if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key) || (event.key === ' ' && !searching)) {
            event.preventDefault();
            if (!open) {
                show();
                if (event.key === 'Home' || event.key === 'End') {
                    const available = options.filter((option) => !option.disabled && !option.hidden);
                    setActive(available[event.key === 'Home' ? 0 : available.length - 1]?.index ?? -1);
                }
                return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
                choose(active);
                return;
            }
            const position = enabled.findIndex((option) => option.index === active);
            const next =
                event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? enabled.length - 1
                      : position < 0
                        ? event.key === 'ArrowUp'
                            ? enabled.length - 1
                            : 0
                        : (position + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
            setActive(enabled[next]?.index ?? -1);
        } else if (!searching && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            if (!open) {
                show();
            }
            const timestamp = Date.now();
            const input = timestamp - typeahead.current.at < 700 ? typeahead.current.value + event.key : event.key;
            typeahead.current = { value: input, at: timestamp };
            if (searchable) {
                setQuery(input);
            }
            const match = options.find(
                (option) => !option.disabled && !option.hidden && normalize(option.label).startsWith(normalize(input)),
            );
            setActive(match?.index ?? -1);
        }
    }

    function change(event: ChangeEvent<HTMLSelectElement>) {
        sync();
        onChange?.(event);
        queueMicrotask(sync);
    }

    function invalidControl(event: FormEvent<HTMLSelectElement>) {
        onInvalid?.(event);
        if (event.defaultPrevented || !enhanced) {
            return;
        }
        event.preventDefault();
        setValidationMessage(event.currentTarget.validationMessage);
        const firstInvalid = event.currentTarget.form?.querySelector('input:invalid, select:invalid, textarea:invalid');
        if (!firstInvalid || firstInvalid.getAttribute('id') === event.currentTarget.id) {
            trigger.current?.focus();
        }
    }

    if (!enhanced) {
        return (
            <select
                {...props}
                id={id}
                hidden={hidden}
                ref={nativeRef}
                className={className}
                multiple={multiple}
                size={size}
                onChange={change}
                onInvalid={invalidControl}
                onFocus={onFocus}
            >
                {children}
            </select>
        );
    }

    return (
        <div
            ref={root}
            className={`site-select${open ? ' is-open' : ''}${placement.upwards ? ' opens-up' : ''}`}
            hidden={hidden}
        >
            <select
                {...props}
                ref={nativeRef}
                id={nativeId}
                className="site-select-native"
                tabIndex={-1}
                aria-hidden="true"
                onChange={change}
                onInvalid={invalidControl}
                onFocus={(event) => {
                    onFocus?.(event);
                    trigger.current?.focus();
                }}
            >
                {children}
            </select>
            <button
                ref={trigger}
                id={triggerId}
                className={`${className || 'form-select'} site-select-trigger${invalid && !className.includes('is-invalid') ? ' is-invalid' : ''}`}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-controls={listId}
                aria-expanded={open}
                aria-activedescendant={open && active >= 0 ? `${listId}-option-${active}` : undefined}
                aria-label={props['aria-label']}
                aria-labelledby={labelledBy}
                aria-describedby={description}
                aria-required={props.required || undefined}
                aria-invalid={invalid || undefined}
                autoFocus={props.autoFocus}
                disabled={props.disabled}
                title={props.title}
                onClick={() => (open ? close() : show())}
                onKeyDown={keyboard}
            >
                <span className="site-select-value" lang={selected?.lang}>
                    {selected?.label ?? ''}
                </span>
                <svg className="bi" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path
                        fillRule="evenodd"
                        d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
                    />
                </svg>
            </button>
            {open && (
                <div ref={menu} className="site-select-menu" style={{ maxHeight: placement.maxHeight }}>
                    {searchable && (
                        <div className="site-select-search">
                            <label className="visually-hidden" htmlFor={`${nativeId}-search`}>
                                {text.search}
                            </label>
                            <input
                                ref={search}
                                id={`${nativeId}-search`}
                                type="search"
                                className="form-control form-control-sm"
                                value={query}
                                placeholder={text.search}
                                autoComplete="off"
                                aria-controls={listId}
                                aria-activedescendant={active >= 0 ? `${listId}-option-${active}` : undefined}
                                onChange={(event) => {
                                    const input = event.target.value;
                                    setQuery(input);
                                    setActive(
                                        options.find(
                                            (option) =>
                                                !option.disabled &&
                                                !option.hidden &&
                                                normalize(option.label + ' ' + (option.group ?? '')).includes(
                                                    normalize(input),
                                                ),
                                        )?.index ?? -1,
                                    );
                                }}
                                onKeyDown={keyboard}
                            />
                        </div>
                    )}
                    <div id={listId} role="listbox" aria-labelledby={labelledBy ?? triggerId}>
                        {visible.map((option, index) => (
                            <div key={option.index}>
                                {option.group && option.group !== visible[index - 1]?.group && (
                                    <div className="site-select-group" role="presentation">
                                        {option.group}
                                    </div>
                                )}
                                <div
                                    id={`${listId}-option-${option.index}`}
                                    className={`site-select-option${active === option.index ? ' is-active' : ''}`}
                                    role="option"
                                    aria-selected={selectedIndex === option.index}
                                    aria-disabled={option.disabled}
                                    aria-label={option.group ? `${option.group}: ${option.label}` : undefined}
                                    lang={option.lang}
                                    onPointerDown={(event) => event.preventDefault()}
                                    onPointerMove={() => {
                                        if (!option.disabled) {
                                            setActive(option.index);
                                        }
                                    }}
                                    onClick={() => choose(option.index)}
                                >
                                    {option.label}
                                </div>
                            </div>
                        ))}
                    </div>
                    {visible.length === 0 && (
                        <div className="site-select-empty" role="status">
                            {text.empty}
                        </div>
                    )}
                </div>
            )}
            {validationMessage && (
                <div id={validationId} className="invalid-feedback d-block" role="alert">
                    {validationMessage}
                </div>
            )}
        </div>
    );
});
