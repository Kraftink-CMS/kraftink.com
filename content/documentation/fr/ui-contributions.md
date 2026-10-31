# Intégrer une interface

Ce guide s’adresse aux auteurs de plugins et de thèmes qui ajoutent des menus, des blocs, des formulaires ou des tableaux. Les layouts du CMS fournissent Bootstrap, les gestionnaires de formulaires et de tableaux ainsi que TinyMCE.

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

`permissions` accepte plusieurs permissions alternatives à la place de `permission`. `children` regroupe des entrées. `parent` vise un groupe du panneau : `content` pour les contenus, `presentation` pour l’apparence, `members` pour les membres, `servers` pour les jeux et serveurs, ou `settings`, `security`, `integrations`, `operations` et `deployment` pour l’administration. Sans champ `parent`, le lien rejoint les outils des extensions.

Avec `parent: null`, le lien apparaît directement dans la section choisie par `section` : `site`, `community` ou `administration`. `position` fixe son ordre dans le groupe ou la section. Les entrées natives sont espacées de 100, ce qui permet d’insérer une contribution entre deux liens. Protégez aussi la route.

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

Les [widgets](plugin-widgets.md) permettent au propriétaire de placer, configurer et réordonner des blocs depuis le panneau. Utilisez les slots pour les contributions fixes. Le noyau fournit le registre et le rendu, chaque extension conserve ses requêtes, permissions et modèles.

## Formulaires AJAX

Ajoutez `data-ajax="true"` à un formulaire POST conservant son action Laravel et son jeton CSRF :

```blade
<form method="post" action="{{ route('plugins.example.admin.settings.update') }}" data-ajax="true">
    @csrf
    <div data-ajax-messages hidden></div>
    <input class="form-control" name="title" required>
    <button class="btn btn-primary" type="submit">{{ __('common.save') }}</button>
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

`App\Kraft\Media\PrivateEditorImages` gère les images privées avec un `EditorImageScope` défini par le code du paquet : identifiant fixe, tables d’images/usages/ressources, route de lecture, permission de gestion et requête des ressources accessibles au membre.

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
