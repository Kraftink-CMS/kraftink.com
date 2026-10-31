import { createConnection } from 'node:net';
import { connect as connectTls } from 'node:tls';
import nodemailer, { type SMTPTransportOptions } from 'nodemailer';
import type { Env } from '../../types';
import { fail } from '../../http';
import { sha256 } from '../../security/crypto';
import { fallbackLocale, resolveLocale } from '../../../shared/locales';

type MailCopy = typeof import('../../../src/lang/en/mail').default;
const copies = import.meta.glob('../../../src/lang/*/mail.ts', { eager: true, import: 'default' }) as Record<
    string,
    MailCopy
>;

const templates = {
    verify: ['verifySubject', 'verifyText'],
    reset: ['resetSubject', 'resetText'],
    'email-change': ['changeSubject', 'changeText'],
    'email-change-requested': ['changeRequestedSubject', 'changeRequestedText'],
    'email-changed': ['changedSubject', 'changedText'],
} as const;

function mailConfiguration(env: Env): SMTPTransportOptions | null {
    const host = env.SMTP_HOST?.trim();
    const port = env.SMTP_PORT?.trim() || '465';
    if (
        !host ||
        host.length > 253 ||
        /[\s/:@\\?#]/.test(host) ||
        !['465', '587'].includes(port) ||
        !env.SMTP_USER?.trim() ||
        !env.SMTP_PASSWORD ||
        !env.MAIL_FROM?.trim() ||
        /[\r\n]/.test(env.MAIL_FROM)
    ) {
        return null;
    }
    return {
        host,
        port: Number(port),
        secure: port === '465',
        requireTLS: port === '587',
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
        tls: { servername: host, rejectUnauthorized: true },
        pool: false,
        logger: false,
        debug: false,
        transactionLog: false,
        disableFileAccess: true,
        disableUrlAccess: true,
        dnsTimeout: 5000,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        getSocket(_options, callback) {
            const secure = port === '465';
            const connection = secure
                ? connectTls({ host, port: Number(port), servername: host, rejectUnauthorized: true })
                : createConnection({ host, port: Number(port) });
            let finished = false;
            const timeout = setTimeout(() => {
                connection.destroy(Object.assign(new Error('SMTP connection timed out'), { code: 'ETIMEDOUT' }));
            }, 10000);
            const onError = (error: Error) => {
                if (finished) {
                    return;
                }
                finished = true;
                clearTimeout(timeout);
                connection.destroy();
                callback(error);
            };
            connection.once('error', onError);
            connection.once(secure ? 'secureConnect' : 'connect', () => {
                if (finished) {
                    return;
                }
                finished = true;
                clearTimeout(timeout);
                connection.removeListener('error', onError);
                callback(null, { connection, secured: secure });
            });
        },
    };
}

export function mailConfigured(env: Env): boolean {
    return mailConfiguration(env) !== null;
}

export function ensureMailConfigured(env: Env): void {
    if (env.ENVIRONMENT === 'production' && !mailConfigured(env)) {
        fail(503, 'email_service_unavailable');
    }
}

export async function sendAccountMail(
    env: Env,
    email: string,
    kind: keyof typeof templates,
    value: string,
    operationId = value,
    locale = fallbackLocale,
): Promise<void> {
    const configuration = mailConfiguration(env);
    if (!configuration) {
        ensureMailConfigured(env);
        return;
    }
    const path =
        kind === 'verify' || kind === 'email-change'
            ? '/verify-email'
            : kind === 'reset'
              ? '/reset-password'
              : '/account';
    const link = new URL(path, env.APP_ORIGIN);
    if (kind === 'verify' || kind === 'reset' || kind === 'email-change') {
        link.hash = new URLSearchParams({
            token: value,
            ...(kind === 'email-change' ? { purpose: 'email-change' } : {}),
        }).toString();
    }
    const language = resolveLocale(locale);
    const fallback = copies[`../../../src/lang/${fallbackLocale}/mail.ts`];
    const copy = copies[`../../../src/lang/${language}/mail.ts`] ?? fallback;
    const [subjectKey, textKey] = templates[kind];
    const subject = copy[subjectKey] || fallback[subjectKey];
    const template = copy[textKey] || fallback[textKey];
    const text = template.replace(':link', () => link.toString()).replace(':email', () => value);
    const transport = nodemailer.createTransport(configuration);
    try {
        await transport.sendMail({
            from: env.MAIL_FROM,
            to: [email],
            subject,
            text,
            messageId: `<kraftink-${kind}-${await sha256(operationId)}@${link.hostname}>`,
        });
    } catch (error) {
        const details =
            typeof error === 'object' && error !== null
                ? (error as { code?: unknown; responseCode?: unknown; command?: unknown })
                : {};
        console.warn('account_email_delivery_unavailable', {
            kind,
            code:
                typeof details.code === 'string' && /^[A-Z][A-Z0-9_]{0,39}$/.test(details.code)
                    ? details.code
                    : 'UNKNOWN',
            smtpCode:
                typeof details.responseCode === 'number' &&
                Number.isInteger(details.responseCode) &&
                details.responseCode >= 100 &&
                details.responseCode <= 599
                    ? details.responseCode
                    : undefined,
            command:
                typeof details.command === 'string'
                    ? /^(?:CONN|AUTH|STARTTLS|MAIL|RCPT|DATA|QUIT|EHLO|HELO|API)(?:\s|$)/
                          .exec(details.command)?.[0]
                          .trim()
                    : undefined,
        });
    } finally {
        transport.close();
    }
}
