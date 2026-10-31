# Intégrer une interface

Les plugins et thèmes utilisent les points d’insertion et composants du CMS pour leurs menus, formulaires et contenus. Les layouts chargent Bootstrap, TinyMCE et les gestionnaires AJAX.

## Menus et blocs

Déclarez les liens dans `manifest.navigation.public`, `admin` ou `footer`. Une entrée possède une clé de traduction `label`, une `route` GET sans paramètre obligatoire et, si nécessaire, `permission` :

```json
"navigation": {
    "admin": [{
        "label": "example::messages.title",
        "route": "plugins.example.admin.documents.index",
        "permission": "example.manage",
        "icon": "file-earmark"
    }]
}
```

Dans le menu du panneau, remplacez `permission` par `permissions` pour afficher le lien avec l’une ou l’autre de deux permissions déclarées par votre plugin :

```json
{
    "label": "example::messages.title",
    "route": "plugins.example.admin.documents.index",
    "permissions": ["example.manage", "example.moderate"]
}
```

Cette liste utilise une condition **OU**, sans demander les deux droits. Elle contrôle l’affichage du lien. Les routes et actions conservent leurs propres contrôles d’accès.

`children` regroupe des entrées. `parent` vise un groupe du panneau : `content` pour les contenus, `presentation` pour l’apparence, `members` pour les membres, `servers` pour les jeux et serveurs, ou `settings`, `security`, `integrations`, `operations` et `deployment` pour l’administration. Sans champ `parent`, le lien rejoint les outils des extensions.

Avec `parent: null`, le lien apparaît directement dans la section choisie par `section` : `site`, `community` ou `administration`. `position` fixe son ordre dans le groupe ou la section. Les entrées natives sont espacées de 100, ce qui permet d’insérer une contribution entre deux liens.

Pour ajouter un bloc sans remplacer une vue, inscrivez un slot depuis le fournisseur :

```php
app(\App\Kraft\Extensions\SlotRegistry::class)->add(
    owner: 'example',
    slot: 'admin.dashboard.metrics',
    id: 'summary',
    render: fn (array $context) => view('example::admin.dashboard.partials.summary'),
    permission: 'example.manage',
    priority: 20,
);
```

`owner` est l’identifiant du paquet. La permission est vérifiée avant le rendu. Les emplacements courants sont `admin.dashboard.metrics`, `admin.dashboard.activity`, `admin.page.before/after`, `site.page.before/after`, `site.home.before/after` et `account.sections`. Le compte fournit `user`, l’accueil `news`, le tableau de bord `stats` ou `logs` selon le slot.

Un thème peut définir un emplacement avec `<x-extensions.slot name="example.area" :context="['record' => $record]">Repli</x-extensions.slot>`. Les modes `before`, `after` et `replace` placent la contribution par rapport au repli. Les erreurs de rendu conservent le reste de la page.

Les [widgets](plugin-widgets.md) permettent au propriétaire de placer, configurer et réordonner des blocs depuis le panneau. Utilisez les slots pour les contributions fixes.

## Formulaires AJAX

Ajoutez `data-ajax="true"` à un formulaire POST conservant son action Laravel et son jeton CSRF :

```blade
<form method="post" action="{{ route('plugins.example.admin.settings.update') }}" data-ajax="true">
    @csrf
    <div data-ajax-messages hidden></div>
    <input class="form-control" name="title" required>
    <button class="btn btn-primary" type="submit">{{ __('common.actions.save') }}</button>
</form>
```

Le gestionnaire synchronise les éditeurs, envoie les fichiers avec `FormData` et affiche les erreurs près des champs. Le formulaire continue de fonctionner sans JavaScript.

| Attribut | Effet |
| --- | --- |
| `data-redirect-url="response"` | Suivre la destination de la réponse |
| `data-redirect-url="/account"` | Rejoindre cette URL de même origine |
| `data-redirect-url="false"` | Rester sur la page, comportement par défaut |
| `data-success-callback="example.saved"` | Appeler une fonction globale après succès |
| `data-reset="true"` | Réinitialiser les champs et éditeurs |
| `data-message-target="#feedback"` | Choisir le conteneur des messages |
| `data-success-message="false"` | Masquer la confirmation de succès, y compris après redirection, en conservant les erreurs et avertissements |

Pour une action dont le nouvel état confirme déjà le résultat (notification lue, réaction, suivi ou déplacement), utilisez `data-success-message="false"`. Les événements et callbacks de succès ainsi que la navigation restent actifs.

Le middleware adapte les redirections et messages Laravel habituels. Une réponse JSON explicite utilise `{"success": true, "data": {"message": "...", "redirect_url": "..."}}`. Les erreurs gardent leur statut HTTP et ajoutent `data.errors`. Le callback reçoit `(data, form, submitter)` et peut renvoyer `false` pour annuler la navigation. Les événements `ajax:success`, `ajax:error` et `ajax:complete` sont disponibles.

Pour un envoi programmatique, utilisez `KraftForms.submit(form, submitter)`. Gardez une navigation après création/suppression ou lorsque la page doit afficher un secret nouvellement généré. Les paiements externes, OAuth, téléchargements et opérations ayant leur propre progression conservent leur parcours dédié.

## Tableaux AJAX

Utilisez `App\Kraft\System\TableQuery`, `<x-tables.controls>` et une région `data-ajax-pagination data-table` pour la recherche, le tri et la pagination. Le [guide des tableaux](tables.md) explique les filtres, le choix du nombre de lignes et la gestion de plusieurs tableaux, avec les styles du thème et le JavaScript commun.

## Éditeurs et images privées

`data-editor="tinymce"` active l’éditeur riche. Nettoyez son HTML avec `App\Kraft\Html::clean`. Un contenu réservé doit utiliser une route d’upload privée dans `data-editor-upload-url`. La médiathèque commune produit des fichiers publics.

`App\Kraft\Media\PrivateEditorImages` reçoit un `EditorImageScope` défini par votre paquet. Fournissez `id`, les classes Eloquent `imageModel`, `usageModel` et `resourceModel`, puis `route`, `permission` et le callback `visible`. Le scope déduit les tables depuis les modèles. `visible` renvoie une requête Eloquent des ressources accessibles au membre.

Le paquet possède les tables et leurs migrations. Les images conservent `id` UUID, `uploader_id` nullable, `path`, `hash`, `original_name`, `mime`, `size`, `width`, `height` et les dates. Les usages associent `resource_id`, `image_id` et `active`, avec unicité du couple et clés étrangères. La requête de visibilité doit inclure vos règles de langue, publication et permissions.

Le cycle d’intégration est :

1. Valider `file`, authentification, permission et débit, puis appeler `store($user, $file)`. Renvoyer `location` avec `url($image)`.
2. Après nettoyage HTML, appeler `attach($resourceId, $body, $actor)` dans la transaction enregistrant le contenu et sa version.
3. Servir la lecture par `response($id, $user)`, qui vérifie les usages et la requête d’accès fournie.
4. Planifier `cleanup()` et appeler `anonymizeUser($id)` depuis le gestionnaire de confidentialité.

Conservez les usages historiques pour restaurer une version. Une restauration échoue si un fichier nécessaire manque. Les chemins privés ne doivent jamais devenir des URL publiques.

## Dates locales

Stockez les dates en UTC. Pour un champ local, utilisez le composant et normalisez avant validation :

```blade
<x-forms.local-datetime name="published_at" :value="$entry?->published_at" />
```

```php
app(\App\Kraft\SiteDates::class)->normalize($request, ['published_at']);
```

Le composant gère le fuseau du site et le choix `earlier/later` lors d’une heure ambiguë. Le normalisateur ne convertit que les champs déclarés accompagnés du marqueur. `format()` affiche une date locale. `iso()` conserve une valeur machine UTC. Ne convertissez pas une seconde fois une date d’API déjà en UTC.

## Référencement des pages

Déclarez vos destinations dans `boot()` avec `App\Events\CollectingSeoPages` pour proposer leurs modèles dans le panneau :

```php
Event::listen(CollectingSeoPages::class, function (CollectingSeoPages $event): void {
    $event->add(
        'plugins.example.public.products.show',
        __('example::messages.seo.product'),
        ['product_name' => __('example::messages.seo.product_name')],
        defaults: ['title' => '{product_name}'],
    );
});
```

Importez l’événement et `Illuminate\Support\Facades\Event`. `add()` reçoit la route, son libellé, les variables, les routes alternatives éventuelles et les valeurs initiales. Déclarez séparément les listes et détails. Les routes sont publiques et acceptent GET.

Fournissez les données au rendu depuis le contrôleur :

```php
return view('example::default.products.show', [
    'product' => $product,
    'seo' => [
        'title' => $product->name,
        'description' => \App\Kraft\Site\Seo::excerpt($product->description),
    ],
    'seoVariables' => [
        'product_name' => $product->name,
    ],
]);
```

Les sections Blade `seo_title` et `seo_description` remplacent les personnalisations du modèle de page. `canonical`, `og_type`, `og_image` et `robots` complètent les métadonnées. Un layout personnalisé conserve `default.layouts.partials.metadata`.

Appliquez vos règles de visibilité au contrôleur et à `CollectingSitemapEntries`. Un contenu réservé sur une route publique doit aussi déclarer `noindex,nofollow`. Les métadonnées ne remplacent pas les contrôles d’accès.
