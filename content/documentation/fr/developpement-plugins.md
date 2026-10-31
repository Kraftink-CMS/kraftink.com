# Créer un plugin

Ce guide accompagne la création d’une extension Laravel indépendante. Votre plugin possède ses données, ses routes et son interface. Il utilise les services du CMS pour les comptes, permissions et réglages.

## Générer et installer le paquet

Depuis la racine du CMS :

```shell
php artisan kraft:make plugin "Exemple" --id=exemple --namespace="MonStudio\Exemple"
```

Le générateur crée `extensions/installed/plugins/exemple/` avec le manifeste, le fournisseur, les contrôleurs, les routes, les vues et les traductions FR/EN. Il refuse l’écrasement d’un dossier existant. Installez ensuite le paquet depuis le panneau : après validation, un nouveau plugin est activé automatiquement. La génération seule ne crée pas ses tables.

Conservez ce contenu dans un dépôt propre au plugin. Le CMS exécute uniquement la copie installée. Les modèles du générateur se trouvent dans `resources/stubs/extensions/`.

## Déclarer le plugin

Le manifeste généré fournit `id`, `type: "plugin"`, `version`, `namespace`, `provider` et les exigences CMS/PHP. Ajoutez les dépendances entre extensions dans `requires`, avec des références comme `plugin:shop` ou `game:minecraft`. Les intégrations facultatives vont dans `integrations`, avec un préfixe `plugin:`, `theme:` ou `game:`. Les bibliothèques PHP se déclarent dans `composer.json`, celles du frontend et leur compilation dans `package.json`. Ces fichiers sont facultatifs et restent propres au plugin. Voir le [cycle de vie des extensions](architecture-extensions.md).

```json
{
    "id": "exemple",
    "name": "Exemple",
    "type": "plugin",
    "version": "1.0.0",
    "namespace": "MonStudio\\Exemple\\",
    "provider": "MonStudio\\Exemple\\Providers\\PluginServiceProvider",
    "requires": {"cms": ">=0.0.1", "php": "^8.4.1"}
}
```

Votre fournisseur enregistre ses services et charge ses routes, vues et traductions. Il doit démarrer même avant la création de ses tables. Ne lisez pas les dossiers d’un autre plugin : utilisez un contrat ou un événement, avec une dépendance déclarée si elle est obligatoire.

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

Créez uniquement les dossiers utiles au paquet : `Http` pour les contrôleurs et middleware, `Models` pour Eloquent, `Services` pour les traitements métier et `Providers` pour les fournisseurs Laravel. Les vues restent sous `resources/views`, par surface et ressource.

Les tables du plugin portent le préfixe `exemple__`. Chacune possède un modèle Eloquent utilisé par le code, ou un modèle `Pivot` pour une table de liaison. Nommez les modèles au singulier et déclarez explicitement `protected $table`, les clés, timestamps, casts et relations du schéma. Les tables techniques de Laravel gardent leur fonctionnement natif.

Les modèles portent les relations, scopes, casts et règles de persistance. Les services les réutilisent pour coordonner les opérations, transactions et intégrations externes. Privilégiez Eloquent et le chargement groupé avec `with()`. Réservez les builders de bas niveau aux imports, projections ou traitements en lot qui le nécessitent. Les formulaires utilisent la validation Laravel.

## Organiser les classes et les API

Regroupez les opérations d’une même responsabilité dans une classe, par exemple `Documents` pour lire et modifier des documents. Ajoutez des sous-dossiers lorsqu’ils facilitent la navigation, comme `Models/History`. Un traitement interne peut rester une méthode privée. Les contrôleurs appellent les services directement.

Placez les interfaces d’intégration et d’API publique dans `Contracts`, leurs objets d’entrée et de résultat dans `Data`. `View` prépare le contexte d’affichage, par exemple les données d’une section de compte.

Réutilisez les composants du CMS pour les comptes, permissions, images privées et notifications. Gardez des classes distinctes lorsque leurs règles d’accès, transactions, protocoles ou cycles de vie le justifient. Chaque plugin conserve son métier et ses données.

Déclarez les événements et widgets depuis `boot()`, avec des méthodes privées si nécessaire. Les listeners, commandes, jobs et gestionnaires liés à un contrat gardent leur classe. Regroupez les imports sous `Services/Imports`, par format source.

Les services internes du noyau sont regroupés par domaine dans `App\Kraft`. Ses contrôleurs et middleware utilisent `App\Http`, ses courriels `App\Mail` et ses exceptions `App\Exceptions`.

Pour vos API publiques, documentez les paramètres, résultats et effets des méthodes exposées. Les contrats des registres permettent de compléter ou remplacer un comportement.

## Organiser les traductions

Commencez par un `messages.php` par langue, organisé par domaine : `messages.documents.title`, `messages.documents.empty`, `messages.documents.actions.publish`. Ajoutez un catalogue lorsque le volume le justifie, par exemple `admin.php` pour un panneau important. Gardez les mêmes clés et paramètres `:name` dans chaque langue.

Dans le noyau, `common.php` contient les libellés partagés, `site.php` le site et le compte, `admin.php` le panneau et `system.php` l’installation, les extensions, les imports et les mises à jour. Les catalogues standards de Laravel conservent leur rôle.

Réorganiser les traductions ne change pas les identifiants de réglages, permissions ou événements. Lors d’un déplacement de clés, adaptez aussi les appels dynamiques, manifestes et surcharges de thèmes.

## Routes et permissions

Utilisez `/plugins/exemple` pour le site et `/admin/plugins/exemple` pour le panneau. Les noms de routes suivent `plugins.exemple.<surface>.<ressource>.<action>`. Les routes privées exigent authentification, accès au panneau et permission métier. Une entrée de menu ne protège jamais une route.

Les permissions appartiennent à votre identifiant. Déclarez leur libellé et, si nécessaire, leurs valeurs initiales par modèle de rang :

```json
"permissions": {
    "plugins.exemple.view": {
        "label": "exemple::messages.permission_view",
        "default": {"visitor": true, "member": true}
    },
    "plugins.exemple.manage": {
        "label": "exemple::messages.permission_manage",
        "default": {"admin": true}
    }
}
```

Les modèles sont `visitor`, `member`, `mod` et `admin`. Un choix explicite du propriétaire reste prioritaire. Les permissions administratives ne peuvent pas déclarer de valeurs publiques `visitor` ou `member`.

```php
Route::get('/plugins/exemple', [DocumentController::class, 'index'])
    ->middleware(['web', 'permission:plugins.exemple.view'])
    ->name('plugins.exemple.public.documents.index');
```

Ajoutez `auth` lorsqu’un compte est nécessaire. Pour les requêtes de contenu et les accès sans session, utilisez `PermissionAccess::allows($user, $permission)` avec un utilisateur nullable. Ne reconstruisez pas les permissions à partir des rangs bruts.

## Vues et disponibilité

Les vues publiques utilisent `default.layouts.layout`, celles du panneau `admin.layouts.layout`. Bootstrap 5 et AdminLTE sont déjà fournis localement. Les traductions sont des tableaux PHP, appelés avec `__('exemple::messages.title')`. Nettoyez le HTML riche avec `App\Kraft\Html::clean` avant stockage.

Enregistrez une fonctionnalité depuis `boot()` pour que le CMS puisse masquer une destination indisponible :

```php
app(\App\Kraft\Features::class)->register('exemple', function (?\App\Models\Accounts\User $user): bool {
    return app(PublicDocuments::class)->visibleTo($user)->exists();
});
```

Le résolveur réutilise vos règles de visibilité, sans écriture ni appel réseau. Ajoutez `capability:extension,exemple` à la route concernée. Les vues publiques consultent `$capabilities->extension('exemple')` ou `$capabilities->routeAvailable($routeName)`. Les contrôles d’accès restent obligatoires sur chaque action.

Les sections de compte, menus, formulaires AJAX et images privées utilisent les [primitives d’interface](ui-contributions.md). Les thèmes peuvent remplacer vos vues publiques en conservant leur chemin relatif.

Les listes tabulaires réutilisent le [système commun de tableaux](tables.md) pour la pagination, la recherche, le tri et le nombre de lignes. Déclarez les colonnes autorisées côté serveur et les composants Blade, sans ajouter un script à chaque page. Appliquez vos règles d’accès à la requête avant sa pagination.

Pour intégrer vos pages au même écran SEO que le noyau, déclarez leurs routes et variables avec `CollectingSeoPages`, puis fournissez leurs valeurs dans `$seoVariables`. Le [guide SEO des extensions](seo.md#intégrer-un-plugin) présente le contrat, les sections de métadonnées et les contrôles de confidentialité.

## Secrets et actions sensibles

Enregistrez les secrets avec `app(App\Kraft\Secrets::class)->set('exemple.api_secret', $value)` et lisez-les avec `get()`. Ne renvoyez pas leur valeur dans les formulaires. Un jeton uniquement comparé peut être stocké sous forme d’empreinte.

Pour une opération sensible, `app(App\Kraft\System\SensitiveAction::class)->confirm($request)` contrôle les identifiants et le second facteur actif. Conservez aussi permissions et CSRF. Les réglages de présentation ordinaires n’exigent pas cette confirmation.

## Aller plus loin

- [Soldes et opérations idempotentes](developpement-soldes.md)
- [Services des plugins](api-plugins.md)
- [Événements métier](plugin-events.md)
- [Widgets configurables](plugin-widgets.md)
- [Notifications unifiées](plugin-notifications.md)
- [Permissions et jetons API](plugin-api-scopes.md)
- [Gestion des données personnelles](privacy-extensions.md)
- [Adaptateurs et mappings d’import](development-migrations.md)
- [Publication d’une extension](extensions-publication.md)

Avant distribution, vérifiez l’installation sans autre plugin facultatif, les accès avec et sans permission, les entrées invalides et la mise à jour d’un site contenant déjà des données.
