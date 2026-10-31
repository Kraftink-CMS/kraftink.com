import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';
import { fail, jsonBody } from '../http';
import { rateLimit } from '../security/abuse';
import { audit, requireRole, requireSensitive } from '../security/authorization';
import {
    createAnnouncement,
    deleteAnnouncement,
    listAnnouncements,
    signedAnnouncements,
    updateAnnouncement,
} from '../services/communication/announcements';

const localeCode = z
    .string()
    .max(35)
    .regex(/^[a-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/)
    .refine((value) => !/[\uD800-\uDFFF]/u.test(value));
const localizedText = (maximum: number) =>
    z
        .record(
            localeCode,
            z
                .string()
                .trim()
                .min(1)
                .max(maximum)
                .refine((value) => !/[\uD800-\uDFFF]/u.test(value)),
        )
        .refine((value) => Object.keys(value).length >= 1 && Object.keys(value).length <= 20);

const announcementInput = z
    .object({
        title: localizedText(160),
        body: localizedText(4000),
        severity: z.enum(['info', 'warning', 'danger']),
        url: z.string().url().max(2048).optional().or(z.literal('')),
        startsAt: z.number().int().nonnegative(),
        expiresAt: z.number().int().positive(),
    })
    .strict()
    .refine((value) => Object.keys(value.title).some((locale) => Object.hasOwn(value.body, locale)))
    .refine((value) => value.expiresAt > value.startsAt && value.expiresAt - value.startsAt <= 90 * 86400)
    .refine((value) => {
        if (!value.url) {
            return true;
        }
        const url = new URL(value.url);
        return (
            url.protocol === 'https:' &&
            !url.username &&
            !url.password &&
            !url.port &&
            !/[\x00-\x20\x7f]/.test(value.url)
        );
    });

const app = new Hono<AppEnv>();

app.get('/admin/announcements', async (c) => {
    requireRole(c, 'admin');
    return c.json({ announcements: await listAnnouncements(c.env.DB) });
});

app.post('/admin/announcements', async (c) => {
    const user = requireRole(c, 'admin');
    const parsed = announcementInput.safeParse(await jsonBody(c, 65536));
    if (!parsed.success) {
        fail(422, 'invalid_announcement');
    }
    if (!c.env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY) {
        fail(503, 'revocation_signing_unavailable');
    }
    await requireSensitive(c, 'admin.announcements');
    const id = await createAnnouncement(c.env.DB, user.id, parsed.data);
    await audit(c, 'announcement.created', id);
    return c.json({ id }, 201);
});

app.patch('/admin/announcements/:id', async (c) => {
    requireRole(c, 'admin');
    const parsed = announcementInput.safeParse(await jsonBody(c, 65536));
    if (!parsed.success) {
        fail(422, 'invalid_announcement');
    }
    await requireSensitive(c, 'admin.announcements');
    const id = c.req.param('id');
    await updateAnnouncement(c.env.DB, id, parsed.data);
    await audit(c, 'announcement.updated', id);
    return c.json({ ok: true });
});

app.delete('/admin/announcements/:id', async (c) => {
    requireRole(c, 'admin');
    await requireSensitive(c, 'admin.announcements');
    const id = c.req.param('id');
    await deleteAnnouncement(c.env.DB, id);
    await audit(c, 'announcement.deleted', id);
    return c.json({ ok: true });
});

app.get('/market/announcements', async (c) => {
    await rateLimit(c, 'market.announcements', 120, 60);
    if (!c.env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY) {
        fail(503, 'revocation_signing_unavailable');
    }
    return c.json(await signedAnnouncements(c.env.DB, c.env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY));
});

export default app;
