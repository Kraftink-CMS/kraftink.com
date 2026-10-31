# Extension lifecycle

This guide is for plugin, theme and game-module authors. Start with [a plugin](developpement-plugins.md), [a theme](developpement-themes.md) or [a game](developpement-jeux.md) to create your first package.

## Packages and manifests

Bundled packages live in `extensions/bundled/`, and independent packages live in `extensions/installed/{plugins,themes,games}/`. The CMS does not load your development repository. Copying a directory does not install it: the receipt in the current database determines installation.

Paths are configured in `config/kraft.php`: `extensions.installed` and `extensions.bundled` each define the absolute `plugins`, `themes` and `games` roots. Official archives and updates use the locations above. Keep them to remain compatible with installation from those packages.

Place `manifest.json` at the archive root or inside a single top-level directory. Declare:

- `id`, matching the installed directory, `type` and `version`.
- `requires`, mapping `cms`, `php` and typed references for required dependencies to Composer constraints.
- `integrations` for optional integrations and `conflicts` for incompatibilities, using `type:identifier` keys and constraint values.
- `namespace` and `provider` for plugins and games, with classes under `src/`.

The core uses the same base fields in its `manifest.json`, with `type: "cms"`. It adds the `bundled` inventory (`game`, `plugin`, `theme`) and global `update.protected` rules. These packages ship and update with the CMS. Only declared packages that are present can boot before installation finishes, after dependency checks.

Receipts and enabled states remain in the site's database. An update does not re-enable disabled packages or change the selected game or themes.

Core metadata is available through `config('manifest.*')`, such as `config('manifest.version')`. Hosting settings stay in Laravel configuration.

The identifier is unique across plugins, themes and games. It remains unchanged during updates, as does the package type. Respect namespaces reserved by the core, dependencies and other extensions. Do not declare the internal properties `path`, `valid`, `enabled` or `error`. External packages cannot use an identifier from the `bundled` inventory.

The `cms` and `php` keys are required in `requires`. For an extension, `cms` identifies the required CMS version. For the core, it identifies the versions from which an update is accepted. Extension references use `type:identifier`:

```json
{
    "requires": {
        "cms": ">=0.0.1",
        "php": "^8.4.1",
        "plugin:shop": ">=0.0.1",
        "theme:horizon": ">=0.0.1",
        "game:minecraft": ">=0.0.1"
    },
    "integrations": {
        "plugin:wiki": ">=0.0.1"
    },
    "conflicts": {
        "plugin:incompatible-package": "<2.0"
    }
}
```

Constraints use Composer syntax. Supplied packages use a minimum version without an upper limit, such as `>=0.0.1`. Raise it when an extension needs a newer API.

A required dependency must be installed at a compatible version, with the declared type, then enabled before its consumer. It also prevents disabling, removing or incompatibly updating the required package. KraftInk dependencies are not downloaded automatically. A missing or incompatible optional integration does not block the extension. Its availability appears in the integration report.

`requires`, `integrations` and `conflicts` use this flat format. Apart from `cms` and `php` inside `requires`, every key has a `plugin:`, `theme:` or `game:` prefix. Type subsections, the `dependencies` field and a root-level `cms` field are rejected. Catalogue `author/slug` identities are not dependency references. Declare PHP libraries in the package's `composer.json` and JavaScript libraries in its `package.json`.

## Views and components

Core views are organized under `resources/views` by surface and resource. Pages, their partials and their components have distinct roles:

| Location | Purpose |
| --- | --- |
| `default/<resource>/` | Public pages |
| `admin/<resource>/` | Panel pages |
| `<surface>/layouts/` | Layouts for that surface |
| `<surface>/<resource>/partials/` | Fragments owned by that resource |
| `<surface>/layouts/partials/` | Layout fragments, such as navigation |
| `partials/` | Fragments used by several surfaces, such as pagination or validation messages |
| `components/` | Reusable generic Blade components, invoked with `<x-…>` |
| `admin/components/` | Blade components specific to the panel, invoked with `<x-admin::…>` |

The core provides standalone rendering. A theme can override its layout or add only a CSS skin. Extensions use the shared navigation, slot and widget entry points.

Plugin pages extend `default.layouts.layout` or `admin.layouts.layout`, resolved from the active theme first, then the core. Reuse Bootstrap and CMS styles. Keep domain views and the styles they need in the plugin. Emails and printable documents may keep a standalone structure.

Inline a fragment used only once into its calling view. Keep a partial for reused or recursive content, or a layout override point. Use `@include` for partials and `@props` for component parameters. Components can also receive slots:

```blade
@include('my-plugin::admin.documents.partials.fields')
<x-forms.local-datetime name="published_at" :value="$document?->published_at" />
<x-admin::media-picker name="cover" :value="$document?->cover" />
```

A plugin’s `widgets/` views are renderers registered in the [widget registry](plugin-widgets.md). The `<x-widgets.zone>` component displays these contributions in a configured zone. Each plugin keeps its domain views and partials inside its own namespace.

## Libraries and frontend builds

Each file has a specific purpose:

| File | Purpose |
| --- | --- |
| `manifest.json` | KraftInk identity, CMS/PHP requirements, extension dependencies and exposed assets |
| `composer.json` and `composer.lock` | The package’s production PHP libraries and locked versions |
| `package.json` and `package-lock.json` | Frontend libraries, build tools and the `build` script |

Add only the files your extension needs. A plugin without PHP libraries or a frontend build can keep just its manifest.

Use normal Composer syntax in `composer.json`:

```json
{
    "require": {
        "guzzlehttp/guzzle": "^7.8.2 || ^8.0"
    }
}
```

Commit `composer.lock`. Publication installs production dependencies in a temporary directory. PHP-Scoper gives them a private namespace and adapts the package's references. The ZIP includes the prepared `vendor/`, licenses and loading index. Two plugins can therefore use different versions of a library. The manifest's `libraries` field is generated automatically.

The Composer file accepts metadata, requirements and a PSR-4 mapping from the manifest namespace to `src/`. Custom repositories, scripts and active configuration are rejected. Development dependencies are not distributed and Composer plugins do not run. `App`, `Illuminate` and `Laravel` contracts remain provided by the CMS.

Test the library after preparation, especially dynamic class names, reflection and references in views. Add PHP-Scoper `patchers` in `scoper.inc.php` if needed. The CMS loads private libraries: do not load `vendor/autoload.php` from your provider.

`vendor/` follows the package's files: uninstalling keeps it for reinstallation, deleting files removes it, removal archives it and restoration brings it back. None of these operations runs Composer on the server.

For frontend builds, declare libraries in `dependencies`, tools in `devDependencies`, and the compilation command in `scripts.build`. For example:

```json
{
    "private": true,
    "scripts": {
        "build": "sass resources/scss/theme.scss public/theme.css --style=compressed --no-source-map"
    },
    "devDependencies": {
        "sass": "1.106.1"
    }
}
```

Commit `package-lock.json`. Publication runs `npm ci` then `build` in a temporary copy of the commit and collects output from `public/`. Install hooks, `prebuild` and `postbuild` do not run. A missing or inconsistent lock blocks publication.

A theme can also declare its inputs through `build.scss` in the manifest, using the locked Sass dependencies from `package.json`. An explicit `build` script takes priority.

The ZIP contains compiled assets without `node_modules`. The server installs this prepared archive without Composer, PHP-Scoper or Node.js.

## Installation, boot and updates

Installation validates the package, backs up the affected state, runs its migrations and checks boot in a separate PHP process. The provider must register services, routes and events before its tables exist. Avoid SQL queries and network calls while booting the provider.

A first installation enables the plugin automatically after validation. An installed theme stays available until explicitly selected for its `site` or `admin` target. An installed game module must register a `GameAdapter` matching its manifest identifier. It becomes available without changing the site’s selected game.

Incompatibility, an incomplete schema or a boot error suspends loading without deleting data. `KRAFT_SAFE_MODE=true` suspends all providers for diagnosis. Privacy handlers load independently. See [Privacy](privacy-extensions.md).

CMS updates replace bundled packages and leave independent extensions to their own update cycle. An extension update can replace code throughout its directories, including `vendor/`, within the package's boundaries.

Keep variable data in private storage or settings. Permanent `update.protected` rules in the CMS manifest also apply to extensions. They cover local data, environment files and `config/local.php` and `config/custom.php` configurations. They do not target classes in `src/Cache` or libraries such as `vendor/psr/cache`. The `.env.example` template remains distributable.

To initialize other local files and then retain them, declare:

```json
"update": {
    "preserve": ["config/site.php", "resources/private-data"]
}
```

These paths are file or directory prefixes inside the package, without wildcards. They cannot cover `manifest.json`, regardless of case. Only the target version's list applies, including for bundled packages:

- An absent file is created with the package's value.
- An existing file or link, even if broken, is retained and cannot be deleted.
- Removing a rule allows replacement or deletion again. Migrate any content to retain before removing it, even when the site skips versions.

Permanent protections take priority and also prevent creating absent files they cover.

The engine checks paths, backs up data and supports rollback. It rechecks absent initialization files under the operation lock before making changes. If the operation fails, recovery also removes files it created.

## Schema and cleanup

Each plugin owns its migrations and tables prefixed with its identifier and `__`, such as `example__documents`. The core does not create your business tables. Import source tables keep their original names.

Define the schema with Laravel's `Schema` facade in `database/migrations`. The initial migration describes a complete fresh installation. Use private methods for long steps.

A push adds at most one migration per repository, separately for the CMS and each plugin. Until the batch is pushed, complete its existing migration. Once pushed, it is immutable.

Keep distributed migrations to support direct updates from any compatible version. They must run with the target code, without booting intermediate versions or relying on business models that may change.

Check creation, data preservation and rollback, dropping children before parents. An applied migration does not run again when files are synchronized. Correct an old development database manually after backup, without adding local repairs to the package.

Disabling a package preserves data. Uninstall `down()` methods must only touch the package’s own tables. Declare additional owned resources in the manifest:

```json
"uninstall": {
    "settings": ["example.", "secret.example."],
    "storage": ["example/files"],
    "notices": ["example__notice_receipts"]
}
```

`storage` refers to directories under `storage/app/private`, scoped to your identifier or `editor-images/<id>`. `notices` lists your linking tables containing a `notice_id` column. Cleanup must preserve shared media and other extensions’ data.

## Shared trash

An active plugin can add deleted content to `/admin/trash` through `App\Kraft\Trash\TrashRegistry` and `TrashSource`. Data stays in its tables. Group source registration, restoration and purging in a service under `Services`, called from the provider.

Example for documents belonging to a member:

```php
use App\Kraft\Trash\TrashRegistry;
use App\Kraft\Trash\TrashSource;
use App\Models\Accounts\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use KraftInk\Plugins\Example\Services\DocumentTrash;

app(TrashRegistry::class)->register(new TrashSource(
    key: 'example.documents',
    label: 'example::messages.trash.documents',
    permissions: ['example.manage'],
    restorePermissions: ['example.restore'],
    query: fn (User $actor): Builder => DB::table('example__documents')
        ->where('owner_id', $actor->id)
        ->whereNotNull('deleted_at')
        ->select(['id', 'title', 'deleted_at'])
        ->selectRaw('NULL AS restore_reason'),
    restore: function (User $actor, int|string $id): void {
        app(DocumentTrash::class)->restore($actor, $id);
    },
    keyType: 'integer',
    purgePermissions: ['example.purge'],
    purge: function (User $actor, int|string $id): void {
        app(DocumentTrash::class)->purge($actor, $id);
    },
));
```

Each source defines the following:

| Property | Contract |
| --- | --- |
| `key` | Stable, unique key prefixed with the plugin identifier |
| `label` | Package translation key |
| `permissions` | Required viewing permissions, all of which must be granted |
| `restorePermissions` | Additional permissions for restoration |
| `authorize` | Optional `(User $actor): bool` callback shared by viewing, restoration and purging |
| `query` | `Illuminate\Database\Query\Builder` selecting `id`, `title`, `deleted_at` and `restore_reason` |
| `restore` | `(User $actor, int\|string $id): void` callback calling the domain service |
| `keyType` | `integer` by default, or `string` for UUIDs and other text identifiers |

The registry rejects invalid keys, labels, permissions, types and queries with an `InvalidArgumentException`. Query requirements also apply to empty sources. For alternative permissions, leave the relevant permission lists empty and express the alternative in `authorize`. Additional purge permissions remain required.

The query filters deleted items according to plugin rules, including ownership and personal data. Keep viewable items that cannot be restored: `restore_reason` then contains the translation key explaining the refusal, otherwise `null`. `canRestoreItem($actor, $row)` combines this value with permissions. The domain service rechecks state in a transaction with locking before making changes.

An `integer` identifier is a positive decimal integer within PHP's range, without a sign or leading zero. A `string` identifier contains 1 to 255 bytes, without spaces, slashes or control characters. It is passed without conversion. Also validate the domain's format, such as UUID syntax.

The main methods are:

| Method | Result |
| --- | --- |
| `sources($actor)` | Viewable sources |
| `source($key, $actor)` | Accessible source or `null` |
| `query($actor, $source, $search)` | Shared list with optional filters |
| `restore($actor, $source, $id)` | Permission and identifier checks, then the restoration callback |

An unknown or inaccessible source, or an invalid identifier, returns 404. Restoration without permission returns 403. The callback receives the user and identifier, then applies all domain rules for permissions, parents, files and personal data. It does not automatically restore a deleted parent or anonymized data. An error must leave data intact.

Disabling content does not move it to the trash. Saved drafts do not expire there, and no automatic purge runs. Sources from disabled or quarantined plugins become inaccessible without deleting data or booting their providers.

### Permanent deletion

The optional `purge` callback enables permanent deletion. `purgePermissions` adds permissions to those for viewing, independently of restoration rights. Without a callback, `canPurge($actor)` returns `false`. `purge($actor, $source, $id)` checks the source, permissions and identifier before calling the domain service.

This service locks the deleted resource in a transaction and rejects active items. It removes children, versions and references it owns. Before cascades, it collects files and checks their paths and use in content, drafts, trash and retained versions, even when historical usage links are missing. Media library files and external files stay protected. Physical files are deleted after commit.

`purgeableSources($actor)` and `purgeableQuery($actor)` expose purgeable sources and items. `empty($actor)` fixes the authorized candidate set in a memory-bounded read transaction, completed before purging. Items moved to trash afterward are excluded. Each candidate uses its callback, without a global transaction across sources.

`TrashPurgeResult` exposes `purged`, `skipped` and `failed`. An item restored or removed in the meantime is skipped. If the service rejects a purge, it rolls back its transaction. Other errors are counted without interrupting later candidates. A subsequent attempt can process remaining items.

The `DELETE /admin/trash/{source}/{item}` and `DELETE /admin/trash` routes check permissions, request confirmation and use `SensitiveAction`, including the second factor when enabled. Like `POST /admin/trash/{source}/{item}/restore`, they use `throttle:sensitive`. Also provide confirmation for irreversible internal calls. Emptying the trash covers all authorized sources, regardless of displayed filters.

### Private file cleanup

In the transaction that removes metadata, call `schedule($path, $prefix, $references)` on `App\Kraft\Media\FileDeletionQueue`. The prefix restricts paths to the source's private directory. References map tables to path columns, such as `['example__files' => 'path']`, with an array for multiple columns.

The request is recorded with metadata deletion, then attempted after commit. After a disk failure, `kraft:maintenance` retries it when due, even if the plugin is disabled. An existing reference cancels deletion. A missing reference table blocks deletion of an existing file. Completed requests are removed.

A purge can therefore delete content while reporting files awaiting cleanup. The plugin remains responsible for permissions and historical uses. The queue rechecks paths and references before each attempt.

With `PrivateEditorImages`, provide `EditorImageScope` with a `history` callback selecting `resource_id` and `body`. This check serves purging, maintenance and anonymization. Retention repairs missing links with `active=false`, without making old images public.

## Data retention

The hourly `kraft:maintenance` command cleans supported histories, temporary data, abandoned files and expired exports. Use `App\Kraft\System\RetentionPolicy` to read `days('history')`, `days('temporary')`, `days('technical')` and `historyLimit()`. Defaults come from `config/retention.php`, with site settings under `retention.*`. Audit logs and private exports keep their own durations.

An active plugin can participate from its provider through the synchronous `App\Events\PruningData` event:

```php
use App\Events\PruningData;
use Illuminate\Support\Facades\Event;

Event::listen(PruningData::class, function (PruningData $event): void {
    $count = app(TemporaryDataCleanup::class)->prune($event->dryRun);
    $event->add('example.temporary', $count);
});
```

`TemporaryDataCleanup` represents your service. Check its tables before queries and limit it to plugin-owned resources. In `dryRun`, count without writing, deleting files or calling external services. Prefix counters with the plugin identifier, including during previews.

Remove only versions exceeding the maximum age or count. Retain current content, closed tickets and saved drafts. Temporary form autosaves may expire separately.

Preserve financial data, acquired rights, rewards, recoverable operations and idempotency references. A `failed` or `uncertain` state is not sufficient grounds for cleanup. Keep files still used by content or a retained version. For files to delete, validate their paths and remove them after commit.

Disabled or quarantined providers do not participate in cleanup. Privacy handlers keep their own lifecycle. Check `kraft:maintenance --dry-run`, batch limits and concurrent editing.

## Jobs and external operations

The native schedule is centralized in the CMS `routes/console.php` file. Plugin providers only register tasks belonging to their own domain. `php artisan schedule:list` shows the effective inventory, including active extensions. Hosting runs a single `php artisan schedule:run` entry every minute.

With the default `sync` queue driver, external notifications, immediate announcements, audit webhooks and OAuth recoveries attempt delivery after the business transaction commits. A rollback must trigger no external call. An explicitly chosen asynchronous driver keeps sending deferred. The notification service’s `deferred: true` option also requests explicit deferral.

Persist events before attempting delivery and reuse their identifiers for retries. An unavailable operation lock or retry delay must leave the operation pending. Cron remains necessary for scheduled publication, delayed retries, synchronization, server status checks and maintenance. `kraft:tasks-run` handles the Laravel `database` queue with at most 25 jobs and a 40-second limit checked between jobs. Business queues retain their dedicated commands.

Ordinary HTTP requests already use CMS coordination. A new CLI entry point or delivery service must hold a shared guard from reservation through recording the result:

```php
use App\Kraft\System\OperationLock;

return app(OperationLock::class)->shared(function () use ($service) {
    return $service->sendAndRecordResult();
});
```

An operation taking a snapshot before changing a schema or restoring a database holds exclusivity throughout snapshot, mutation, validation and any rollback. `DatabaseSnapshots::make()` alone does not retain a lock after returning. Shared guards cannot implicitly become exclusive.

Processes must share storage with compatible filesystem locks. A refused acquisition must leave state intact for retry. Bound network calls and make external operations idempotent: a local restore cannot undo a command or payment already executed.

Before distribution, test standalone installation, missing dependencies, a boot error, an interrupted update and concurrent operations using isolated data.
