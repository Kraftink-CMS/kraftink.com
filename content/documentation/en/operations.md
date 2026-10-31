# Scheduled tasks and backups

Set up a cron task with your host for scheduled actions, then arrange regular backups outside the site.

## Scheduler

Add this task **every minute**, using your hosting paths:

```cron
* * * * * cd /var/www/kraftink && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

Use the directory containing `artisan`, not `public/`. Command-line PHP must meet the [CMS requirements](installation.md#hosting-requirements). If the hosting panel separates frequency and command, copy only the command starting with `cd`.

This cron handles scheduled publications, delivery retries, synchronisation, server monitoring and cleanup. The default configuration does not require a permanent worker. Check it with a scheduled publication.

Without cron, regular actions attempt immediate delivery with the default `QUEUE_CONNECTION=sync` setting. Deferred actions and retries after a failure remain pending. A successful SMTP test does not check the scheduler.

## Backups

Back up **the database, all site files and `.env`** together, including hidden files. Its application key is required to read encrypted data. Also include files kept in external storage.

Keep a protected copy outside the hosting account and test restoration on a separate installation. Ask your host for a consistent database copy, particularly when SQLite is being written to.

Automatic update backups cover that operation and do not replace regular copies. Restoring the site does not undo a payment or a command already executed in a game.

## Trash and retention

Use **Content → Trash** to restore deleted items. Restore a topic or ticket before its messages. **Empty trash** covers all items you can delete, even when the list is filtered.

In **Operations → Data retention**, choose retention periods for old versions, temporary data and technical records. Cleanup takes effect at the next hourly run. Defaults are 90 days and 50 versions per content item for history, 2 days for temporary data and 90 days for technical records.

These settings do not delete saved content, including drafts, or manually trashed items. Files still in use and financial data are kept. Audit logs have their own retention setting in **History → Audit log**.

## Moving to another host

Put the site into maintenance, transfer a full backup to a compatible host and keep the application key. Restore the `public/` web root, database access, write permissions, HTTPS and cron. If the domain changes, also update the [site configuration](configuration.md#domain-and-proxy).

## Troubleshooting

| Problem | Check |
| --- | --- |
| Internal pages return 404 | `public/` web root and web server rewriting |
| Error 500 or blank page | Write permissions, disk space and `storage/logs/` |
| Missing email | SMTP test, spam, provider logs, then cron for deferred sends |
| Pending publications or deliveries | Cron every minute and access to the remote service |
| Wrong domain or HTTP links | Site address and proxy mode |

For an interrupted operation, follow the [update guide](updates.md#recovering-after-a-failure) or the [extension diagnostic](extensions-catalogue.md#updating-or-removing).
