import { resolveLocale } from '../../shared/locales';

let csrfToken = '';

export class ApiError extends Error {
    constructor(
        public code: string,
        public status = 0,
    ) {
        super(code);
    }
}

export function setCsrfToken(value: string): void {
    csrfToken = value;
}

export interface ApiOptions {
    headers?: Record<string, string>;
    method?: string;
    json?: unknown;
    body?: BodyInit;
    sensitiveToken?: string;
    signal?: AbortSignal;
    timeoutMs?: number;
}

export async function api<T = Record<string, unknown>>(path: string, options: ApiOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
        ...options.headers,
        Accept: 'application/json',
        'Accept-Language': resolveLocale(document.documentElement.lang),
    };
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    if (options.json !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (options.sensitiveToken) {
        headers['X-Sensitive-Token'] = options.sensitiveToken;
    }
    let response: Response;
    const deadline = AbortSignal.timeout(
        options.timeoutMs ??
            (options.body !== undefined ? 300000 : options.method && options.method !== 'GET' ? 60000 : 15000),
    );
    const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
    try {
        response = await fetch(path, {
            method: options.method ?? 'GET',
            headers,
            credentials: 'same-origin',
            cache: 'no-store',
            body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
            signal,
        });
    } catch (error) {
        if (deadline.aborted && !options.signal?.aborted) {
            throw new ApiError('request_timeout');
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        throw new ApiError('network_unavailable');
    }
    const data = (await response.json().catch(() => null)) as T & { error?: { code?: string }; csrfToken?: string };
    if (!response.ok || data === null) {
        throw new ApiError(data?.error?.code ?? 'service_unavailable', response.status);
    }
    if (typeof data.csrfToken === 'string') {
        setCsrfToken(data.csrfToken);
    }
    return data;
}
