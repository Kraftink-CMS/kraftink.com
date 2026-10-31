# Backups and operation

This guide covers tasks to set up with your host and checks to make when a service stops working.

## Scheduler

With the default `QUEUE_CONNECTION=sync` setting, KraftInk attempts delivery of regular notifications, immediate announcements, audit webhooks, OAuth recovery links and game commands using direct transports after the database operation commits. These first attempts work without cron. Native notifications are created within the transaction and disappear if it rolls back.

All OAuth recovery requests are stored durably before the first delivery. At most three new requests are processed immediately, with a five second budget checked between deliveries. An ongoing delivery keeps its own timeout. The remaining requests and retries wait for cron. When `DB_QUEUE_CONNECTION` points to a separate connection, these recoveries remain asynchronous after commit.

Cron remains strongly recommended for scheduled publication, failed delivery retries, server status checks, synchronizations and expired data cleanup. A game command waiting for an offline player or a deferred delivery cannot be guaranteed without later processing. Add this single cron task using your hosting paths:

```cron
* * * * * cd /var/www/kraftink && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

`/var/www/kraftink` is the directory containing `artisan`, rather than `public/`. The PHP CLI executable must be version 8.4.1 or later.

If your hosting panel separates the frequency and command, choose **every minute** and copy only the command starting with `cd`. Without cron access, give this line to your host.

This single cron runs tasks when they are due. Deliveries and retries are checked every minute, while `kraft:maintenance` cleans expired data hourly. No permanent worker is needed. Verify a real scheduled action: the email settings test runs immediately and does not prove that cron works.

To inspect the inventory and upcoming runs:

```shell
php artisan schedule:list
```

Plugin notifications keep their recipient rules, grouping and preferences. In `sync` mode, email and Discord delivery is attempted after commit without waiting for cron. Pending messages, external service delays and recoverable failures stay tracked for retry. An uncertain external result may require manual verification before another attempt to limit duplicates.

## Deferred sending

The default, `QUEUE_CONNECTION=sync`, avoids a cron dependency for regular actions. On a high-volume site, a technical administrator can set `QUEUE_CONNECTION=database` in `.env` to defer sending, then run from the CMS root:

```shell
php artisan config:clear
```

Cron then processes deferred messages. `kraft:tasks-run` handles the `database` queue in batches of at most 25 jobs, with a 40-second processing limit checked between jobs. It also handles retries kept after a failed delivery in `sync` mode. A job already running remains subject to its own execution timeout.

To process the Laravel queue continuously, hosting can optionally manage and automatically restart a worker:

```shell
php artisan queue:work database --tries=3
```

Keep cron even when using this worker. It also processes business deadlines and service-specific delivery queues. After an update or restoration, the old worker stops and its process manager must restart it.

## Data retention

Under **Operations → Data retention**, choose the durations applied by hourly cleanup. Defaults are:

| Data | Default retention |
| --- | --- |
| Previous versions | 90 days, at most 50 versions per content item |
| Temporary data, including unchanged unreferenced editor images | 2 days |
| Noncritical technical details for completed operations | 90 days |

Versions exceeding the duration or count are removed while current content remains intact. Saved drafts, published content, scheduled content, manual trash and imported content under review are preserved until deliberate deletion. Images still referenced by current content, drafts or retained versions stay available. Financial data, recoverable operations and identifiers needed for duplicate protection are preserved. A failed or uncertain delivery is not treated as completed data eligible for deletion.

Some data has a separate expiry: private exports last 24 hours by default, completed audit webhooks last 7 days, and pending notifications have a 90-day functional expiry. Database sessions, password reset links and cache entries follow their own expiry. The audit log keeps its own configurable duration under **History → Audit log**. Disabled or quarantined plugins do not run cleanup.

Settings take effect at the next hourly run. Saving the form does not immediately delete data. With technical access, preview affected data without deleting it:

```shell
php artisan kraft:maintenance --dry-run
```

Run `php artisan kraft:maintenance` for actual cleanup. The standard cron runs it hourly and combines audit logs, history, temporary data, expired private exports and supported abandoned files. Retention settings and financial or protected data exclusions still apply. Back up the database and files before a significant policy change, then check the preview. Cleanup does not replace backups, and deleted versions cannot be recovered from the website’s history.

## Backups

Back up **the database, site files and `.env` together**, including hidden files. The key in `.env` is required to read some protected data. Also copy files held in external storage if you use it.

Keep a protected copy outside the hosting account and test restoration in a separate location. Ask your host for a consistent database backup. Simply copying an SQLite file while writes are happening may produce an incomplete backup.

An update’s automatic backup covers that operation. It does not replace regular copies or undo an action already carried out on a game server or payment service.

## Move to another host

Put the site into maintenance and suspend external writes. Transfer the complete backup to compatible hosting, point its web root at `public/` and adjust database credentials if needed. Keep the original application key.

Restore write permissions, HTTPS and cron. If the domain changes, also follow the [URL and external services setup](configuration.md#domain-https-and-proxy). Check the copy before switching the domain and keep the old hosting until verification is complete.

## Troubleshooting

| Symptom | First check |
| --- | --- |
| Internal pages return 404 | `public/` web root, Apache rewriting or Nginx configuration |
| Error 500 or blank page | Write permissions, disk space and logs in `storage/logs/` |
| Missing email | SMTP test, provider logs, then cron for deferred messages |
| Stuck announcements or deliveries | Cron every minute, correct PHP CLI version and service connectivity |
| HTTP links or wrong domain | Public URL and proxy configuration |
| Configuration change not visible | Configuration cache, then browser cache |

Keep useful messages and the incident time before contacting your host. Logs, exports and backups can contain private information: share only the necessary extracts after removing secrets. Keep `APP_DEBUG=false` on a public site.
