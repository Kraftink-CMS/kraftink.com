# Prepare a development environment

Use a dedicated installation to create extensions or modify the CMS. Production accounts, files and databases are not test fixtures.

## Install the sources

The CMS repository contains `artisan`, `app/` and `public/` directly at its root. It requires 64-bit PHP 8.4.1 or later, Composer and Node 22.12 or later to build assets.

From the root:

```shell
composer install
npm ci
npm run build
```

Expose only `public/` through your local server, then open the site and complete installation. With Laragon, the [virtual-host template](local/kraftink-cms.local.conf) provides a starting point. Adapt its path and domain to your machine.

Set `APP_URL` to this address. After installation, the site URL stored in the panel must match: it takes precedence for generated links. Run `php artisan config:clear` after environment changes.

## Organize generated files

Private application files belong in `storage/app/private/`, files intended for publication in `storage/app/public/`, Laravel sessions and caches in `storage/framework/` and logs in `storage/logs/`. Laravel’s `local` disk is relative to `app/private/`. The `public` disk is relative to `app/public/`.

A new installation keeps its files together in `storage/app/private/installation/`:

| File | Purpose |
| --- | --- |
| `installed.json` | Durable completion marker that can be checked without SQL access |
| `access.json` | Installer reservation using the IP address and a digest of the browser token |
| `install.lock` | Exclusive lock preventing simultaneous installations |
| `journals/<database-digest>.json` | Signed recovery journal tied to the database and installed sources |

These files have distinct write lifecycles. The marker and journals are published atomically. Access and lock files retain their identity while in use with `flock`. These mechanisms need local files, independently of the selected media disk. They respect `LARAVEL_STORAGE_PATH`.

Update operations use `storage/app/updates/` and locks shared with standalone workers to coordinate execution and allow recovery.

## Work on an extension

Generate a package using `php artisan kraft:make`, then install it from the panel. Independent sources remain in their own repository. The CMS only scans the copy under `extensions/installed/`.

To test an update, use an archive on a populated test database. Manually replacing files does not verify installation behavior.

## Verify a change

```shell
php artisan test --compact --exclude-group=bundled-extensions
node --test tests/Frontend/*.test.mjs tests/Release/*.test.mjs
```

These commands cover the standalone core repository. Tests in `bundled-extensions` require the corresponding external projects. Run `php artisan test --compact` in the complete workspace.

The [testing guide](contribuer-tests.md) explains fixtures and isolation. Also verify the changed flow in a browser. Rebuild assets after CSS or JavaScript changes.

The KraftInk presentation website is an independent project with its own build instructions. It is not required to develop a CMS extension.
