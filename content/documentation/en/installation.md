# Installing KraftInk

Download the `KraftInk-VERSION.zip` installation archive. It includes the dependencies and compiled assets. Your hosting account does not need Composer or Node.js.

## Hosting requirements

Use **64-bit PHP 8.4.1 or later**, HTTPS and SQLite, MySQL or MariaDB. The installer checks PHP extensions and write permissions.

With SQLite, the CMS creates its database during installation. For MySQL or MariaDB, create an empty database and keep its credentials.

The host must allow `proc_open` and provide command-line PHP matching the version used by the site. If it is not detected, ask your host to set its path in `KRAFT_PHP_BINARY` in `.env`. You also need cron access for [scheduled tasks](operations.md#scheduler).

## Installation

1. Extract the archive into the site directory, such as `/var/www/kraftink`.
2. Point the domain to **`/var/www/kraftink/public`**. Keep the other directories inaccessible from the Web.
3. Allow PHP to write to `storage/`, `bootstrap/cache/`, `.env` and its parent directory. With SQLite, also make `database/` writable.
4. Enable HTTPS, open the domain and follow the installer.

On Apache, enable rewriting and allow the supplied `.htaccess`. On Nginx, send requests without a matching file to `public/index.php` and allow `public/update-status.php` for update progress.

The suggested plugins and themes are optional. When installation finishes, your owner account is signed into the panel. Continue with [site configuration](configuration.md).

## Interrupted installation or access denied

After an interruption, reopen the site in the same browser to resume. Keep the database, `.env` and tracking files.

The first browser and connection reserve the installer. If changing browser, connection or cookies causes an access denial, delete only `storage/app/private/installation/access.json`, then open the installer again. With custom storage, use the path shown on the denial page.
