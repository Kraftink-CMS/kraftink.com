# Extension manifests and data

Plugins, themes and game modules share the dependency and installation rules described here. Each creation guide covers its own package structure.

## Manifest and dependencies

The ZIP contains `manifest.json` at its root or in a single top-level directory. `id`, `type` and `version` identify the package. The identifier is unique across all three types and stays fixed during updates. For plugins and games, `namespace` maps to `src/` and `provider` names the Laravel provider.

```json
{
    "requires": {
        "cms": ">=0.0.1",
        "php": "^8.4.1",
        "plugin:shop": ">=0.0.1"
    },
    "integrations": {"plugin:wiki": ">=0.0.1"},
    "conflicts": {"plugin:incompatible-package": "<2.0"}
}
```

`requires.cms` and `requires.php` are mandatory. Constraints use Composer syntax. Choose the minimum version that provides the APIs you use. Other keys have the form `plugin:id`, `theme:id` or `game:id`.

A required dependency must be installed and active. `integrations` describes optional compatibility, which your code must tolerate being absent. `conflicts` blocks incompatible combinations. These declarations do not download dependencies.

Declare PHP and frontend libraries in the package’s Composer and npm files. Their preparation is covered in [Distributing an extension](extensions-publication.md#libraries-and-assets).

## Installation and updates

A directory under `extensions/installed/` still needs installation from the panel. The CMS runs its migrations and checks booting. Providers must therefore register services without reading tables or contacting a remote service.

A plugin is enabled after installation. Themes and games become available for selection. Updates retain these choices and activation state. A boot error or incomplete schema may suspend the package without deleting data.

Package files may be replaced or removed during updates. Store variable data in CMS settings or storage. To ship an initial file without overwriting its local copy later:

```json
"update": {
    "preserve": ["config/site.php", "resources/private-data"]
}
```

Paths are relative to the package without wildcards. Missing files are created and existing files are kept. Only the target version’s rules apply. Before removing a rule, plan migration of the previously protected data. This option cannot preserve `manifest.json`.

## Migrations and uninstallation

Place Laravel migrations in `database/migrations/` and prefix tables with `id__`. Keep distributed migrations and add changes needed to upgrade supported older versions. They must work with the target code without relying on intermediate business models.

Disabling keeps data. During uninstallation, `down()` methods remove only package-owned tables. Declare other owned resources in the manifest:

```json
"uninstall": {
    "settings": ["example.", "secret.example."],
    "storage": ["example/files"],
    "notices": ["example__notice_receipts"]
}
```

`settings` contains setting prefixes. `storage` targets private directories under your identifier or `editor-images/<id>`. `notices` identifies join tables with `notice_id`. Keep shared media and other extensions’ data.

## Trash

Register a `TrashSource` in `TrashRegistry` from the provider to show deleted content in the shared trash:

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

`key` is stable and prefixed by your identifier. `query` returns an `Illuminate\Database\Query\Builder` selecting `id`, `title`, `deleted_at` and `restore_reason`, filtered by the operator’s access. `restore_reason` is a translation key when restoration is blocked, otherwise `null`.

`permissions` protects reading, `restorePermissions` restoration and `purgePermissions` purging. Every permission in each list is required. Optional `authorize` accepts `(User $actor): bool` for an additional rule. `keyType` is `integer`, or `string` for an opaque identifier.

Callbacks recheck state, parents and permissions in a transaction. Optional `purge` must accept only deleted items. Remove owned children and references, then files after commit. A disabled plugin’s sources become unavailable with their data kept.

To retry failed file deletion, call `FileDeletionQueue::schedule($path, $prefix, $references)` on an `App\Kraft\Media\FileDeletionQueue` instance in the transaction removing its metadata. `$references` maps your tables to path columns. For editor images, also provide revision usages through the `history` callback of `EditorImageScope`.

## Retention and privacy

An active plugin can join hourly cleanup with `PruningData`:

```php
use App\Events\PruningData;
use Illuminate\Support\Facades\Event;

Event::listen(PruningData::class, function (PruningData $event): void {
    $count = app(TemporaryDataCleanup::class)->prune($event->dryRun);
    $event->add('example.temporary', $count);
});
```

Read periods through `App\Kraft\System\RetentionPolicy`: `days('history')`, `days('temporary')`, `days('technical')` and `historyLimit()`. Your service limits cleanup to its own data. In dry-run mode, count without writing or deleting files.

Keep current content, drafts, used files, financial history and recoverable operations. Deduplication identifiers must not expire with technical records. Account exports and anonymisation use the [privacy contract](privacy-extensions.md).

## Jobs and external operations

Providers can register business tasks with Laravel’s scheduler. CMS cron runs them alongside site tasks. External sends wait for transaction commit and keep stable identifiers for retries.

HTTP requests are already coordinated with CMS operations. For a new delivery CLI command, hold a shared guard until its result is recorded:

```php
use App\Kraft\System\OperationLock;

return app(OperationLock::class)->shared(function () use ($service) {
    return $service->sendAndRecordResult();
});
```

If the lock is unavailable, leave the operation pending. Bound network calls and distinguish a confirmed rejection from an uncertain outcome. A local restoration does not undo external effects.
