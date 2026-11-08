# Installing KraftInk

Download the `KraftInk-VERSION.zip` installation archive. It includes the dependencies and compiled assets. Your hosting account does not need Composer or Node.js.

## Hosting requirements

Use **64-bit PHP 8.4.1 or later**, HTTPS and SQLite, MySQL, MariaDB or PostgreSQL. The installer checks PHP extensions and write permissions.

With SQLite, the CMS creates its database during installation. For MySQL, MariaDB or PostgreSQL, create an empty database and keep its credentials. For PostgreSQL, use version 14 or later and enable `pdo_pgsql`. The KraftInk database account must own the database and its `public` schema.

The host must allow `proc_open` and provide command-line PHP matching the version used by the site. If it is not detected, ask your host to set its path in `KRAFT_PHP_BINARY` in `.env`. You also need cron access for [scheduled tasks](operations.md#scheduler).

## Installation

1. Extract the archive into the site directory, such as `/var/www/kraftink`.
2. Point the domain to **`/var/www/kraftink/public`**. Keep the other directories inaccessible from the Web.
3. Allow PHP to write to `storage/`, `bootstrap/cache/`, `.env` and its parent directory. With SQLite, also make `database/` writable.
4. Enable HTTPS, open the domain and follow the installer.

On Apache, enable rewriting and allow the supplied `.htaccess`. On Nginx, send requests without a matching file to `public/index.php` and allow `public/update-status.php` for update progress.

The suggested plugins and themes are optional. When installation finishes, your owner account is signed into the panel. Continue with [site configuration](configuration.md).

## Docker Compose

From the extracted installation archive, run `docker compose up -d --build` to use SQLite or a database you already run. Open [http://localhost:8080](http://localhost:8080) to finish setup. Set `KRAFTINK_HTTP_PORT` before starting Compose if you need a different web port.

To use the included MariaDB service, set `KRAFTINK_DB_PASSWORD` to a strong password in a `.env` file next to `compose.yaml`. Run `docker compose --profile mariadb up --build --wait`. In the installer, choose **MySQL / MariaDB**, enter `db` as the host and `3306` as the port, then use `kraftink` for both the database name and user. Enter the password you set.

Compose stores KraftInk and the included MariaDB data in separate volumes. Back up both volumes if you use the MariaDB service. The supplied web port listens only on your machine. To host a public site, configure HTTPS in front of the web service.

## Interrupted installation or access denied

After an interruption, reopen the site in the same browser to resume. Keep the database, `.env` and tracking files.

The first browser and connection reserve the installer. If changing browser, connection or cookies causes an access denial, delete only `storage/app/private/installation/access.json`, then open the installer again. With custom storage, use the path shown on the denial page.
