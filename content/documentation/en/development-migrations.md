# Create an import adapter

This guide is for adapter and converter authors. To transfer a site from the panel, see [Import data](migration.md).

## Declare a source

Create an adapter under `App\Kraft\Migration\Adapters\YourSource` and register its identifier in `config/imports.php`. Extend `App\Kraft\Migration\AbstractSourceAdapter` or implement `Contracts\SourceAdapter` directly. The engine, controller, extension inventory and catalogue use this contract. They contain no selection by CMS name and require no changes when adding a source.

Each source owns its reading and conversion classes. The supplied adapters live under `Adapters/KraftInk/`, `Adapters/Azuriom/` and `Adapters/MineWeb/`. Schema rules, configuration formats, restrictions and legacy URLs belong in these directories. The `Adapters/` directory contains only CMS sources. Shared tools such as `CoreMappings`, `SettingsMappings` and `NavigationMappings` live under `App\Kraft\Migration`, without identifying the CMS.

| Method | Responsibility |
| --- | --- |
| `id()` | Identifier declared in the registry. |
| `requirements()` | Tables and columns required for analysis. |
| `userTable()` | Source account table, or `null` when accounts are not imported. The engine does not assume a `users` table. |
| `user($row)` | Normalized account for identity and balance checks. |
| `roleTable()` and `newsTable()` | Relation tables used by conversion helpers. |
| `sourceLocale($connection, $tables)` | Language read from the source schema, or `null` for the configured fallback. |
| `extensionNames($connection, $tables)` | Source extension names as `['plugin' => [...], 'theme' => [...]]`. The first theme is the active theme. |
| `registerMappings($registry, $core)` | Source conversions and dependencies. |
| `afterMapping($row, $context, $table)` | Additional work inside the row transaction, such as reporting source files to transfer. |

`AbstractSourceAdapter` supplies a `users` account table, no source language, an empty inventory and a callback that performs no action. Override the values required by your source. `tests/Fixtures/SourceAdapters/ExampleAdapter.php` demonstrates a source with `members`, `teams`, `articles`, `preferences` and `packages` tables. Its test covers analysis, collisions, conversion, extension discovery and recovery without changing the engine.

Core mappings handle core domains, and plugins own their business mappings. A mapping receives a source row and an `ImportContext`, writes to the destination and returns `target_table` and `target_id`:

```php
$registry->register(
    'example',
    'articles',
    fn (array $row, ImportContext $context) => [
        'target_table' => 'content_entries',
        'target_id' => $context->insert('content_entries', [
            'kind' => 'page',
            'locale' => 'en',
            'slug' => 'legacy-'.$row['id'],
            'title' => $row['title'],
            'body' => Html::clean($row['body']),
        ]),
    ],
    priority: 30,
);
```

Priorities place parents before children. `required()` requires a mapping, while `mapped()` accepts optional relations. `metadata()` retains small, non-sensitive context. The default source identity is `id`. `identity` selects another key.

`CoreMappings` helpers write native domains from normalized data. They never select rules by CMS name. The content helper requires explicit access rules supplied by the converter. Another source can write directly through `ImportContext` when the helpers do not fit its format.

## Plugin converters

Register mappings from the provider using `app(ImportMappings::class)->register(app(MappingRegistry::class))`. Declare recognized source prefixes in your manifest:

For a plugin that provides imports, `Services/Imports/ImportMappings` is the entry point for converters. Place conversions under `Services/Imports/KraftInk/`, `Services/Imports/Azuriom/` or `Services/Imports/MineWeb/` for supported sources. Standalone imports can also call this entry point without booting the provider. Shared tools receive normalized values and never branch on the CMS identifier.

```json
"imports": {
    "azuriom": ["example_"],
    "mineweb": ["example__"]
}
```

Prefixes support suggestions. Only registered conversions can be selected. Add `plugin: 'example'` and required source `dependencies` to the mapping.

For shared source settings, register `MappingRegistry::settings($source, $handler, $plugin)`. The callback receives `['key' => ..., 'value' => ...]` and the context. Read only recognized keys and write equivalents with `$context->setting($key, $value)`. Do not copy media identifiers or secrets. Contributions from unselected or inactive plugins are not applied.

`$context->report($kind, $details)` retains an action with its source table, identifier, field and optional file path. Use stable reason codes and non-sensitive metadata. Media paths have URL credentials and parameters removed. Reports should explain rules without an equivalent and file transfer, never expose keys or passwords.

## Replacement and recovery

`replacements` declares only your target tables and rows to replace:

```php
replacements: [
    'example__documents' => ['locale' => ['en']],
]
```

An empty scope means the whole table. Include historical or derived tables affected by cascades, with children before parents. Without a declaration, the domain remains additive.

The engine backs up before deletion and rolls back the transaction if conversion fails. Do not execute DDL or irreversible external actions in handlers. Imported history must never replay payments, mail, votes or deliveries.

Preflight includes a checksum of each table’s values, checked when creating the archive. Recovery then uses that encrypted archive. Databases must be genuinely separate, including when a host alias or another path refers to the destination. Scope SQL table listings to the connection’s current schema.

An optional `guard` checks blocking states without writes. It runs during preview and again inside the transaction before deletion. Use the validated game from `$context->options['game']` for game-specific data.

## Verify the adapter

Use synthetic fixtures for read-only analysis, missing columns, identity collisions, dependencies, hostile HTML and missing relations. Verify repeated imports, interruption and resume, replacement rollback and absence of replayed external effects. Document supported source versions and archive-only data.
