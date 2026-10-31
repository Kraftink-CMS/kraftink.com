# Importing plugin data

A plugin can convert its data from a source supported by the [import wizard](migration.md). Keep converters in `src/Services/Imports/`, with a subdirectory per source format.

## Declaring conversions

Call your entry point from the provider:

```php
app(ImportMappings::class)->register(app(\App\Kraft\Migration\MappingRegistry::class));
```

`ImportMappings` is your plugin’s class. The manifest lists recognised source prefixes so the wizard can suggest the package:

```json
"imports": {
    "azuriom": ["example_"],
    "mineweb": ["example__"]
}
```

Register a mapping per convertible table:

```php
$registry->register(
    'azuriom',
    'example_documents',
    function (array $row, ImportContext $context): array {
        return [
            'target_table' => 'example__documents',
            'target_id' => $context->insert('example__documents', [
                'title' => $row['title'],
                'body' => Html::clean($row['body']),
            ]),
        ];
    },
    priority: 30,
    plugin: 'example',
);
```

Import `App\Kraft\Migration\ImportContext` and `App\Kraft\Html`. Priorities put parents before children. `dependencies` declares required source tables and `identity` replaces the default source key `id` when needed.

The context provides `required($table, $id)` to find a mandatory relation and `mapped($table, $id)` for an optional relation. To retain non-sensitive context, add `metadata` to the mapping’s returned array. A later mapping can read it with `$context->metadata($table, $id)`. `$context->report($kind, $details)` records outstanding items with their source reference.

## Settings and replacement

`$registry->settings($source, $handler, $plugin)` registers a settings conversion on the same `MappingRegistry` instance. The callback receives `['key' => ..., 'value' => ...]` and the context. Write only recognised equivalents through `$context->setting($key, $value)` without copying secrets or media identifiers.

To allow replacement, declare your domain’s tables and rows in the `replacements` argument:

```php
replacements: [
    'example__documents' => ['locale' => ['fr']],
]
```

An empty scope means the whole table. Include historical or derived data affected by cascades, with children before parents. Without this declaration, imports only add data. An optional `guard` checks blocking states without writing before replacement.

If replacement removes your notifications, add `notification_deliveries => ['owner' => ['example']]`. The engine handles associated native notifications and rejects replacement while a send is in progress.

Handlers run in a transaction. Do not change the schema or trigger payments, email or deliveries. Report files for manual transfer without reusing source identifiers.

## Supporting another format

For a missing source, your package can implement `App\Kraft\Migration\Contracts\SourceAdapter`, or extend `AbstractSourceAdapter`, and register its class in `imports.adapters.<id>` from its provider. The interface describes discovering accounts, extensions and mappings in the format.

Test missing relations, identity collisions, private content and invalid HTML, plus interruption, recovery and rollback. State supported source versions and data that is only archived.
