# Updating KraftInk

Open **Administration → Updates** to install a CMS version. Separately added plugins and themes are updated from their own pages.

## Applying an update

1. Read the changes and requirements for the proposed version.
2. Keep a [full backup](operations.md#backups) outside the hosting account.
3. Start preparation and resolve any reported problems, then confirm the summary.
4. Wait for completion before checking the site’s pages and services.

The panel downloads the release or accepts its official **update archive**. Installation archives and GitHub source archives cannot be used for this operation.

Keep **Stable** on a public site. Alpha and Beta are trial releases. Switching back to Stable waits for a compatible version and does not restore an earlier site state.

The host must support database backup and restoration. MySQL requires `mysqldump` and `mysql`. MariaDB requires `mariadb-dump` and `mariadb`.

## Data and customisations

The site enters maintenance during installation. Accounts, content, uploaded files and `.env` are kept. Official code may be replaced, so put customisations in a theme or plugin.

Bundled extensions follow the CMS version. An extension that becomes incompatible may be suspended with its data preserved until a compatible version is installed.

## Recovering after a failure

KraftInk attempts to restore the affected database and files. If the screen requests recovery, keep maintenance enabled and retain tracking files. Give the operation identifier to your hosting manager.

They can resume from the directory containing `artisan`:

```shell
php artisan kraft:update --recover=IDENTIFIER
```

Resolve the stated cause before reopening the site. Deleting tracking files or replacing files manually can prevent recovery.
