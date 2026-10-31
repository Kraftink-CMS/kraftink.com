# Creating a plugin

A plugin owns its routes, views, translations and data. It reuses CMS accounts and services. First prepare your [local installation](developpeurs.md#preparing-a-local-installation).

## Generating the package

```shell
php artisan kraft:make plugin "Example" --id=example --namespace="MyStudio\Example"
```

The generator creates `extensions/installed/plugins/example/`. Install the package in the panel to create its tables and enable the plugin.

```text
manifest.json
src/Providers/PluginServiceProvider.php
src/Http/Controllers/
src/Http/Controllers/Admin/
src/Models/
src/Services/
routes/web.php
routes/admin.php
database/migrations/
resources/views/default/
resources/views/admin/
lang/fr/messages.php
lang/en/messages.php
```

The manifest namespace maps to `src/`. Controllers belong under `Http`, Eloquent models under `Models` and business operations under `Services`. Add `Contracts`, `Data`, `Jobs`, `Listeners` or domain subdirectories when your code needs them. Use English names and avoid empty directories added only to complete this structure.

## Manifest and provider

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

The generated provider loads routes, views and translations. Register services in `register()` and contributions in `boot()`. Booting must not read tables or contact a remote service, because it is also checked before data installation.

Declare required dependencies in `requires`, such as `"plugin:shop": ">=0.0.1"`. Optional integrations belong in `integrations`. Package libraries and migrations follow the [shared contract](architecture-extensions.md).

## Data and translations

Prefix tables with `example__`. Each business table has an Eloquent model with `protected $table`, relations and casts. Use an appropriate `Pivot` for join tables. Services coordinate transactions and integrations by reusing these models.

Translations are PHP arrays with matching keys across languages. For example, `documents.title` in `lang/en/messages.php` is called with `__('example::messages.documents.title')`. Add other catalogues when their size warrants it.

## Routes and permissions

Public routes use `/plugins/example` and names `plugins.example.public.*`. Panel routes use `/admin/plugins/example` and `plugins.example.admin.*`.

Declare permissions in the manifest:

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

Defaults accept `visitor`, `member`, `mod` and `admin`. Owner choices take priority. Administrative permissions cannot be public.

```php
Route::get('/plugins/example', [DocumentController::class, 'index'])
    ->middleware(['web', 'permission:plugins.example.view'])
    ->name('plugins.example.public.documents.index');
```

Add `auth` for member-only actions. Panel routes also require `permission:admin.access` and your management permission. A menu entry does not protect its route. Outside middleware, use `PermissionAccess::allows($user, $permission)` with a nullable user.

## Views and site integration

Pages extend `default.layouts.layout` or `admin.layouts.layout` so the active theme can style them. Bootstrap 5, AdminLTE and shared components come with the CMS. Plugin views use its namespace, such as `example::default.documents.index`.

Register a conditional destination with `Features`:

```php
app(\App\Kraft\Features::class)->register('example', function (?\App\Models\Accounts\User $user): bool {
    return app(PublicDocuments::class)->visibleTo($user)->exists();
});
```

Add `capability:extension,example` to the relevant routes. In views, `$capabilities->extension('example')` or `routeAvailable($routeName)` reports availability. Keep visibility checks for each resource.

[Menus, forms and metadata](ui-contributions.md) and [tables](tables.md) use CMS components. Clean rich HTML with `App\Kraft\Html::clean` before storage.

Store secrets through `app(App\Kraft\Secrets::class)->set($key, $value)` and `get($key)`. For a sensitive action, call `app(App\Kraft\System\SensitiveAction::class)->confirm($request)` alongside permissions and CSRF.

Before distribution, test allowed and denied access, invalid input and updates with existing data. Add a [privacy handler](privacy-extensions.md) if the plugin keeps member data.
