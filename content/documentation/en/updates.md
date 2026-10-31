# Update KraftInk

Use **Administration → Updates** to prepare and apply a CMS version. Update [plugins and themes](extensions-catalogue.md) from their own pages.

## Prepare the maintenance

1. Read the proposed version’s changes and requirements.
2. Keep a [complete backup](operations.md#backups) outside the hosting account.
3. Check free disk space, write permissions and the ability to back up **and restore** the database.
4. Choose a quiet period and stop external applications that write directly to this database.
5. Prepare the update in the panel, check the summary and confirm.

MySQL hosting needs `mysqldump` and `mysql`. MariaDB needs `mariadb-dump` and `mariadb`. Updates also require `proc_open`. If a check fails, ask your host to fix the setup before continuing.

## Choose a version

Keep **Stable** on a public site. Beta and Alpha channels provide testing versions. Switching back to Stable does not restore older contents: the CMS waits for a compatible stable release that preserves or advances the installed contents.

The Alpha channel keeps the latest changes: a stable release built from an older alpha does not replace them.

The panel can download the package or accept its official **update** archive. Use that package rather than the installation archive or GitHub sources. Origin and integrity checks remain mandatory.

You can skip several versions if the proposed release is compatible with your installation and PHP version. The package contains the complete code, runs pending migrations in order and removes obsolete files.

## Replaced files and retained data

The signed package lists the files to add, replace or delete. Official code and configuration may be replaced in any directory. Dependencies in `vendor`, compiled assets in `public/build` and public libraries in `public/vendor` are synchronized with the package: old files missing from the new version are removed. Keep customizations in a theme or extension.

Before backing up affected files, KraftInk compares the declared directories with the verified package contents and adds obsolete files to the deletion list. This comparison also covers the directory of each bundled package declared by the new release. Protected data and files retained by a `preserve` rule remain excluded from deletions.

Local data stays protected: `.env` and its local variants, storage, uploads, caches, SQLite databases, logs, private configuration and installation metadata. This also covers configured custom locations for storage, file disks and the database.

The `.env.example` template can change without replacing your `.env`. The `config/local.php` and `config/custom.php` files are also retained.

The `manifest.json` file at the CMS root defines its version and update rules:

- `update.protected` prevents additions, replacements and deletions at protected paths, even when a file is absent. Protections from the installation and the new release apply together.
- `update.preserve` lets a package ship a file with initial values. The CMS creates it if absent, then keeps its local version while the rule remains.
- `update.sync` lists core directories to synchronize with the signed package. This also removes old generated files that are not tracked in Git.

The proposed release supplies the `preserve` rules. Removing a rule therefore allows the affected file to be replaced or deleted. Permanently protected data, such as `.env` and storage, retains its protection.

KraftInk verifies the entire archive before applying these rules. Operations targeting protected data are ignored. An invalid signature, an unsafe path or missing required metadata blocks the update.

Bundled games, plugins and themes follow core updates with their own preservation rules. Extensions installed separately in `extensions/installed` are updated from their own pages and remain outside the core update scope. During their updates, their directory is compared with the new package to remove old files while respecting protection and preservation rules.

## During the update

The site enters maintenance. KraftInk backs up the database and affected files, then displays progress. Keep the backups and tracking files until completion.

The update uses a temporary copy of its engine so it can finish or restore backups even when its own code is replaced. This PHP process starts automatically, without a permanent queue worker or Horizon.

An incompatible extension may be suspended without losing its data. Install a compatible version before reactivating it. After success, check the main pages, sign-in and services used on your site.

## Resume after an interruption

If an update fails, KraftInk tries to restore the database and files together. If recovery is required, keep maintenance enabled and give the operation ID to your technical administrator.

From the directory containing `artisan`, they can resume with:

```shell
php artisan kraft:update --recover=IDENTIFIER
```

Do not delete tracking files to unblock the site or replace its files manually. Fix the reported cause, complete recovery and check the result before reopening.
