# Install KraftInk

The installation archive is ready to upload to your hosting account. You do not need Composer or Node.js to use it.

## Prepare the hosting

You need **PHP 8.4.1 or later, 64-bit**, HTTPS and an SQLite, MySQL or MariaDB database. The installer checks the required PHP extensions and write permissions.

- **SQLite**: no database account is needed. KraftInk creates its database file during installation.
- **MySQL or MariaDB**: create an empty database and a user allowed to manage it, and keep their credentials.

PHP’s `proc_open` function and a matching PHP CLI version must be available during installation to check built-in modules in isolated processes. If PHP CLI is not detected automatically, set its executable path in `KRAFT_PHP_BINARY` in the `.env` file.

Regular actions work without cron with the default `QUEUE_CONNECTION=sync` setting. Cron access remains strongly recommended for scheduled publication, retries after failure, synchronization, server status checks and automatic cleanup. Plan a single `schedule:run` task every minute as described in the [operations guide](operations.md#scheduler).

## Upload the files

1. Download **`KraftInk-VERSION.zip`** from the official downloads. Choose the installation archive rather than GitHub’s source archives.
2. Extract it into the site directory, for example `/var/www/kraftink`.
3. Point the domain at **`/var/www/kraftink/public`**. Only this subdirectory should be accessible from the Web.
4. Allow PHP to write to `storage/`, `bootstrap/cache/`, the `.env` file and its parent directory. SQLite also needs write access to `database/`.
5. Enable HTTPS and open your domain.

On Apache, enable URL rewriting and allow the supplied `.htaccess`. On Nginx, send requests without a matching file to `public/index.php` and allow `public/update-status.php` for update progress. If you cannot choose the web root, ask your host to adjust the setup before continuing.

The release’s `.zip.sha256` file lets you check the download: compare its value with `Get-FileHash .\KraftInk-VERSION.zip -Algorithm SHA256` in PowerShell, or run `sha256sum -c KraftInk-VERSION.zip.sha256` on Linux.

## Complete the installer

Follow the steps and fix any failed requirements before confirming. Use the site’s final HTTPS address. Suggested plugins and themes are optional. The native presentation already works without a theme.

Once complete, you are signed in as the owner. Continue with [configuration](configuration.md), then prepare [scheduled tasks and backups](operations.md).

## Resume a blocked installer

Installation is reserved for the connection and browser used on the first visit. Changing your browser, connection or cookies can produce a **403 Access denied** page. To resume, delete only `storage/app/private/installation/access.json`, then open the installer from the browser you want to use.

After an interruption, reopen the same site to resume its steps. Keep the database, `.env` and tracking files under `storage/app/private/installation/`. The `installed.json` marker identifies a completed installation and the files in `journals/` allow recovery checks. Do not delete them to restart the installer.

If your host uses `LARAVEL_STORAGE_PATH`, the paths above are relative to that storage directory instead of the site’s `storage/` directory.
