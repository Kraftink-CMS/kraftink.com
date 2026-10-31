# Frequently asked questions

## The installer displays “Access denied”

The first browser and connection reserve the installation. After changing either, delete only the access file shown on the access-denied page, normally `storage/app/private/installation/access.json`, then resume the installer. Keep the database, configuration and other tracking files. See [Install KraftInk](installation.md#resume-a-blocked-installer).

## Do I need a theme or every plugin?

The native presentation is enough to open your site. Install only the functions you need, using the catalogue or a trusted archive. See [extensions](extensions-catalogue.md).

## The email test succeeds, but automatic messages do not arrive

With `QUEUE_CONNECTION=sync`, regular notifications and OAuth recoveries attempt delivery after the operation commits without waiting for cron. Check member preferences, their verified address, spam folders and provider errors. Scheduled publication, retries after failure and `database` mode need later processing. The email test does not verify the [scheduler](operations.md#scheduler).

## Can the site work without cron?

Regular actions work without cron with `QUEUE_CONNECTION=sync`, including notifications and immediately published announcements. Still configure cron for timed publication, retries, synchronizations, server status and hourly cleanup. A deferred delivery or command waiting for an offline player cannot be guaranteed without that processing. See the [scheduler](operations.md#scheduler).

## Can I import an old SQL export?

Restore it into a separate source database, then connect the import assistant to that database. Images and attachments need a separate transfer. See [Import an existing site](migration.md).

## An extension is suspended or an update failed

Keep its data and tracking files. Follow the screen’s diagnosis to repair the [extension](extensions-catalogue.md) or resume the [update](updates.md#resume-after-an-interruption). Do not reinstall the site to work around the error.
