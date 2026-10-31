# Créer un plugin

Un plugin possède ses routes, vues, traductions et données. Il réutilise les comptes et les services du CMS. Préparez d’abord votre [installation locale](developpeurs.md#preparer-votre-installation-locale).

## Générer le paquet

```shell
php artisan kraft:make plugin "Example" --id=example --namespace="MyStudio\Example"
```

Le générateur crée `extensions/installed/plugins/example/`. Installez le paquet dans le panneau pour créer ses tables et activer le plugin.

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

Le namespace du manifeste correspond à `src/`. Les contrôleurs restent sous `Http`, les modèles Eloquent sous `Models` et les traitements métier sous `Services`. Ajoutez `Contracts`, `Data`, `Jobs`, `Listeners` ou des sous-dossiers métier lorsque votre code en a besoin. Gardez des noms anglais et ne créez pas de dossiers vides pour compléter cette structure.

## Manifeste et fournisseur

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

Le fournisseur généré charge les routes, vues et traductions. Enregistrez vos services dans `register()` et vos contributions dans `boot()`. Son démarrage ne doit pas lire de tables ni appeler un service distant, car il est aussi vérifié avant l’installation des données.

Déclarez les dépendances obligatoires dans `requires`, par exemple `"plugin:shop": ">=0.0.1"`. Les intégrations facultatives vont dans `integrations`. Les bibliothèques du paquet et ses migrations suivent le [contrat commun](architecture-extensions.md).

## Données et traductions

Préfixez les tables par `example__`. Chaque table métier possède un modèle Eloquent avec `protected $table`, ses relations et ses casts. Utilisez un `Pivot` adapté pour les liaisons. Les services coordonnent les transactions et les intégrations en réutilisant ces modèles.

Les traductions sont des tableaux PHP avec les mêmes clés dans chaque langue. Par exemple, `documents.title` dans `lang/fr/messages.php` s’appelle avec `__('example::messages.documents.title')`. Ajoutez d’autres catalogues uniquement lorsque le volume le justifie.

## Routes et permissions

Les routes publiques utilisent `/plugins/example` et les noms `plugins.example.public.*`. Celles du panneau utilisent `/admin/plugins/example` et `plugins.example.admin.*`.

Déclarez les permissions dans le manifeste :

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

Les valeurs initiales acceptent `visitor`, `member`, `mod` et `admin`. Les choix du propriétaire restent prioritaires. Une permission administrative ne peut pas être publique.

```php
Route::get('/plugins/example', [DocumentController::class, 'index'])
    ->middleware(['web', 'permission:plugins.example.view'])
    ->name('plugins.example.public.documents.index');
```

Ajoutez `auth` pour une action réservée aux membres. Les routes du panneau demandent aussi `permission:admin.access` et votre permission de gestion. Une entrée de menu ne protège pas sa route. Pour les contrôles hors middleware, utilisez `PermissionAccess::allows($user, $permission)` avec un utilisateur éventuellement nul.

## Vues et intégration au site

Les pages étendent `default.layouts.layout` ou `admin.layouts.layout`. Le thème actif peut ainsi les habiller. Bootstrap 5, AdminLTE et les composants communs sont fournis par le CMS. Les vues du plugin s’appellent avec son namespace, par exemple `example::default.documents.index`.

Enregistrez une destination conditionnelle avec `Features` :

```php
app(\App\Kraft\Features::class)->register('example', function (?\App\Models\Accounts\User $user): bool {
    return app(PublicDocuments::class)->visibleTo($user)->exists();
});
```

Ajoutez `capability:extension,example` aux routes concernées. Dans les vues, `$capabilities->extension('example')` ou `routeAvailable($routeName)` indique leur disponibilité. Gardez les contrôles de visibilité sur chaque ressource.

Les [menus, formulaires et métadonnées](ui-contributions.md) et les [tableaux](tables.md) utilisent les composants du CMS. Nettoyez le HTML riche avec `App\Kraft\Html::clean` avant stockage.

Pour un secret, utilisez `app(App\Kraft\Secrets::class)->set($key, $value)` et `get($key)`. Pour une action sensible, appelez `app(App\Kraft\System\SensitiveAction::class)->confirm($request)` en conservant permissions et CSRF.

Avant distribution, testez les accès autorisés et refusés, les saisies invalides et la mise à jour avec des données existantes. Ajoutez un [gestionnaire de confidentialité](privacy-extensions.md) si le plugin conserve des données de membres.
