import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from './types';
import { normalizeIp } from '../shared/ip';
import { selectLocale } from '../shared/locales';

export type AppContext = Context<AppEnv>;

export function fail(status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 503, code: string, message = code): never {
    throw new HTTPException(status, { res: Response.json({ error: { code, message } }, { status }) });
}

export function requestIp(c: AppContext): string {
    const provided = normalizeIp(c.req.header('CF-Connecting-IP'));
    if (provided) {
        return provided;
    }
    if (c.env.ENVIRONMENT === 'development' || c.env.ENVIRONMENT === 'test') {
        return '127.0.0.1';
    }
    fail(503, 'client_ip_unavailable');
}

export async function requestBody(c: AppContext, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
    const reader = c.req.raw.body?.getReader();
    try {
        const header = c.req.header('Content-Length');
        const expected = header === undefined ? undefined : Number(header);
        if (header !== undefined && (!/^\d+$/.test(header) || !Number.isSafeInteger(expected))) {
            fail(400, 'invalid_request');
        }
        if (expected !== undefined && expected > maximum) {
            fail(413, 'payload_too_large');
        }
        if (!reader) {
            if (expected !== undefined && expected !== 0) {
                fail(400, 'invalid_request');
            }
            return new Uint8Array();
        }
        const buffer =
            expected === undefined ? new ArrayBuffer(0, { maxByteLength: maximum }) : new ArrayBuffer(expected);
        let length = 0;
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) {
                break;
            }
            const nextLength = length + chunk.value.length;
            if (nextLength > maximum) {
                fail(413, 'payload_too_large');
            }
            if (expected !== undefined && nextLength > expected) {
                fail(400, 'invalid_request');
            }
            if (expected === undefined) {
                buffer.resize(nextLength);
            }
            new Uint8Array(buffer).set(chunk.value, length);
            length = nextLength;
        }
        if (expected !== undefined && length !== expected) {
            fail(400, 'invalid_request');
        }
        return new Uint8Array(expected === undefined ? buffer.transferToFixedLength(length) : buffer);
    } catch (error) {
        await reader?.cancel().catch(() => undefined);
        throw error;
    } finally {
        reader?.releaseLock();
    }
}

export async function jsonBody(c: AppContext, maximum = 16384): Promise<Record<string, unknown>> {
    if (!c.req.header('Content-Type')?.toLowerCase().startsWith('application/json')) {
        fail(400, 'json_required');
    }
    const joined = await requestBody(c, maximum);
    try {
        const data: unknown = JSON.parse(new TextDecoder().decode(joined));
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            fail(400, 'invalid_json');
        }
        return data as Record<string, unknown>;
    } catch {
        fail(400, 'invalid_json');
    }
}

export function textField(value: unknown, minimum: number, maximum: number): string {
    if (
        typeof value !== 'string' ||
        value.length < minimum ||
        value.length > maximum ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    ) {
        fail(422, 'invalid_input');
    }
    return value;
}

export function sessionCookieName(c: AppContext): string {
    return new URL(c.env.APP_ORIGIN).protocol === 'https:' ? '__Host-kraftink_session' : 'kraftink_session';
}

export function requestLocale(c: AppContext): string {
    const preferences = (c.req.header('Accept-Language') ?? '')
        .split(',')
        .map((part, index) => {
            const [language, ...parameters] = part.trim().split(';');
            const quality = parameters
                .find((parameter) => parameter.trim().startsWith('q='))
                ?.trim()
                .slice(2);
            return { language, index, quality: quality === undefined ? 1 : Number(quality) };
        })
        .filter((item) => item.language && Number.isFinite(item.quality) && item.quality > 0 && item.quality <= 1)
        .sort((left, right) => right.quality - left.quality || left.index - right.index);
    return selectLocale(preferences.map((item) => item.language));
}
