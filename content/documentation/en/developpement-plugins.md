# Create a plugin

This guide walks through an independent Laravel extension. Your plugin owns its data, routes and interface, using CMS services for accounts, permissions and settings.

## Generate and install the package

From the CMS root:

```shell
php artisan kraft:make plugin "Example" --id=example --namespace="MyStudio\Example"
```

The generator creates `extensions/installed/plugins/example/` with a manifest, provider, controllers, routes, views and FR/EN translations. It refuses to overwrite an existing directory. Install the package from the panel: after validation, a new plugin is enabled automatically. Generation alone does not create its tables.

Keep this content in the plugin’s own repository. The CMS only executes the installed copy. Generator templates live in `resources/stubs/extensions/`.

## Declare the plugin

The generated manifest provides `id`, `type: "plugin"`, `version`, `namespace`, `provider` and CMS/PHP requirements. Declare required extensions under `requires` with references such as `plugin:shop` or `game:minecraft`. Add optional integrations under `integrations` with a `plugin:`, `theme:` or `game:` prefix. PHP libraries belong in `composer.json`, frontend libraries and their build command in `package.json`. These optional files belong to the plugin. See the [extension lifecycle](architecture-extensions.md).

```json
{
    "id": "example",
    "name": "Example",
    "type": "plugin",
    "version": "1.0.0",
    "namespace": "MyStudio\\Example\\",
    "provider": "MyStudio\\Example\\Providers\\PluginServiceProvider",
    "requires": {"cms": ">=0.0.1", "php": "^8.4.1"}
}
```

Your provider registers services and loads routes, views and translations. It must boot before its tables exist. Do not read another plugin’s directories: use a contract or event, declaring a dependency when required.

```text
manifest.json
src/Providers/PluginServiceProvider.php
src/Http/Controllers/
src/Http/Controllers/Admin/
src/Http/Middleware/
src/Models/
src/Contracts/
src/Data/
src/Services/
src/Services/Imports/
src/View/
src/Console/Commands/
src/Jobs/
src/Listeners/
src/Mail/
routes/web.php
routes/admin.php
database/migrations/
resources/views/default/documents/
resources/views/admin/documents/
lang/fr/messages.php
lang/en/messages.php
```

Create only the directories the package needs: `Http` for controllers and middleware, `Models` for Eloquent, `Services` for business operations and `Providers` for Laravel service providers. Views stay under `resources/views`, grouped by surface and resource.

Plugin tables use the `example__` prefix. Each has an Eloquent model used by the code, or a `Pivot` model for a relationship table. Use singular model names and explicitly declare `protected $table`, keys, timestamps, casts and relationships matching the schema. Laravel infrastructure tables retain their native behavior.

Models own relationships, scopes, casts and persistence rules. Services reuse them to coordinate operations, transactions and external integrations. Prefer Eloquent and eager loading with `with()`. Reserve lower level builders for imports, projections or bulk operations that need them. Forms use Laravel validation.

## Organize classes and APIs

Group operations with the same responsibility in a class, such as `Documents` for reading and changing documents. Add subdirectories when they make navigation easier, such as `Models/History`. Internal processing can remain a private method. Controllers call services directly.

Place integration and public API interfaces in `Contracts`, with input and result objects in `Data`. `View` prepares display context, such as the data for an account section.

Reuse CMS components for accounts, permissions, private images and notifications. Keep separate classes when access rules, transactions, protocols or lifecycles warrant it. Each plugin owns its business rules and data.

Declare events and widgets from `boot()`, using private methods when helpful. Listeners, commands, jobs and handlers implementing a contract keep their own classes. Group imports under `Services/Imports` by source format.

Internal core services are grouped by domain under `App\Kraft`. Its controllers and middleware use `App\Http`, mail classes use `App\Mail` and exceptions use `App\Exceptions`.

Document the parameters, results and effects of public API methods. Registry contracts allow extensions to add or replace behavior.

## Organize translations

Start with one `messages.php` per language, grouped by domain: `messages.documents.title`, `messages.documents.empty`, `messages.documents.actions.publish`. Add a catalogue when the volume warrants it, such as `admin.php` for a large panel. Keep the same keys and `:name` parameters in every language.

In the core, `common.php` holds shared labels, `site.php` covers the site and account, `admin.php` the panel, and `system.php` installation, extensions, imports and updates. Standard Laravel catalogues retain their role.

Reorganizing translations does not change setting, permission or event identifiers. When moving keys, also update dynamic calls, manifests and theme overrides.

## Routes and permissions

Use `/plugins/example` for the site and `/admin/plugins/example` for administration. Route names follow `plugins.example.<surface>.<resource>.<action>`. Private routes require authentication, panel access and a business permission. Menu entries never protect routes.

Permissions belong to your identifier. Declare their label and, when needed, initial values for role templates:

```json
"permissions": {
    "plugins.example.view": {
        "label": "example::messages.permission_view",
        "default": {"visitor": true, "member": true}
    },
    "plugins.example.manage": {
        "label": "example::messages.permission_manage",
        "default": {"admin": true}
    }
}
```

Templates are `visitor`, `member`, `mod` and `admin`. An owner’s explicit choice takes precedence. Administrative permissions cannot declare public `visitor` or `member` defaults.

```php
Route::get('/plugins/example', [DocumentController::class, 'index'])
    ->middleware(['web', 'permission:plugins.example.view'])
    ->name('plugins.example.public.documents.index');
```

Add `auth` when an account is required. For content queries and sessionless access, use `PermissionAccess::allows($user, $permission)` with a nullable user. Do not rebuild permissions from raw role data.

## Views and availability

Public views extend `default.layouts.layout`, panel views extend `admin.layouts.layout`. Bootstrap 5 and AdminLTE are already supplied locally. Translations are PHP arrays, called through `__('example::messages.title')`. Clean rich HTML with `App\Kraft\Html::clean` before storing it.

Register a feature from `boot()` so the CMS can hide an unavailable destination:

```php
app(\App\Kraft\Features::class)->register('example', function (?\App\Models\Accounts\User $user): bool {
    return app(PublicDocuments::class)->visibleTo($user)->exists();
});
```

The resolver reuses your visibility rules without writes or network calls. Add `capability:extension,example` to the relevant route. Public views use `$capabilities->extension('example')` or `$capabilities->routeAvailable($routeName)`. Every action must still enforce its own access checks.

Account sections, menus, AJAX forms and private images use the [interface primitives](ui-contributions.md). Themes can override your public views while retaining their relative paths.

## Secrets and sensitive actions

Store secrets with `app(App\Kraft\Secrets::class)->set('example.api_secret', $value)` and read them with `get()`. Do not return stored secrets in forms. Comparison-only tokens can be stored as hashes.

For sensitive operations, `app(App\Kraft\System\SensitiveAction::class)->confirm($request)` verifies credentials and the active second factor. Keep permissions and CSRF protection. Ordinary presentation settings do not require this confirmation.

## Further integration

- [Balances and idempotent operations](developpement-soldes.md)
- [Plugin services and events](api-plugins.md)
- [Personal data handling](privacy-extensions.md)
- [Import adapters and mappings](development-migrations.md)
- [Publishing an extension](extensions-publication.md)

Before distribution, verify installation without optional plugins, access with and without permissions, invalid input and upgrades on an existing populated site.
