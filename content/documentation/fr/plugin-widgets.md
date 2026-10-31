# Widgets configurables

Un widget est un bloc que le propriétaire place et configure dans **Présentation → Widgets**. L’accueil natif propose la zone `home`. Plusieurs instances du même widget peuvent avoir des réglages différents.

## Définir le widget

Depuis `boot()` du fournisseur :

```php
app(\App\Kraft\Widgets\WidgetRegistry::class)->register(
    owner: 'example',
    id: 'latest-documents',
    label: 'example::widgets.latest_documents',
    render: function (array $context, array $config) {
        $documents = app(PublicDocuments::class)
            ->visibleTo($context['user'])
            ->forLocale($context['locale'])
            ->latest('published_at')
            ->limit($config['limit'])
            ->get();

        return view('example::widgets.latest-documents', compact('documents'));
    },
    fields: [
        'limit' => [
            'type' => 'integer',
            'label' => 'example::widgets.limit',
            'min' => 1,
            'max' => 20,
            'default' => 5,
        ],
    ],
    permission: 'example.view',
    zones: ['home'],
);
```

`owner` est l’identifiant du paquet et la clé publique devient `example:latest-documents`. `render` accepte une vue ou un callback renvoyant une vue, du HTML ou une chaîne vide. Gardez l’enregistrement sans requête SQL, les données sont lues au rendu.

Le contexte fournit `user`, `locale` et `instance`. Le callback filtre les contenus par publication, langue et droits. Les autres valeurs de contexte ne sont pas une preuve d’autorisation.

Pour un contenu fixe, une vue suffit à la place du callback :

```php
app(\App\Kraft\Widgets\WidgetRegistry::class)->register(
    owner: 'example',
    id: 'welcome',
    label: 'example::widgets.welcome',
    render: 'example::widgets.welcome',
);
```

La vue `resources/views/widgets/welcome.blade.php` reçoit `$context` et `$config`. Utilisez le callback du premier exemple lorsqu’il faut préparer des données avant le rendu.

## Champs de configuration

Le registre accepte vingt champs scalaires au maximum, avec un identifiant stable et un `label` traduit. `help` fournit une clé d’aide facultative.

| Type | Options |
| --- | --- |
| `integer` | `min`, `max`, `default`. Bornes initiales de 1 à 100 |
| `text` | `max`, `default`. 255 caractères par défaut, 1 000 au maximum |
| `boolean` | `default`, faux par défaut |
| `choice` | `options` associant les valeurs aux clés de traduction, `default` |

L’argument `defaults` peut remplacer les valeurs initiales des champs. Les anciennes configurations sont aussi validées avant rendu. Gardez des valeurs initiales compatibles quand votre définition évolue.

## Ajouter une zone

Déclarez la zone avant d’y enregistrer les widgets :

```php
app(\App\Kraft\Widgets\WidgetRegistry::class)->zone(
    'community.sidebar',
    'my-theme::messages.sidebar',
);
```

Puis affichez-la dans la vue :

```blade
<x-widgets.zone name="community.sidebar" :context="['entry' => $entry]" />
```

Le composant produit une grille Bootstrap selon les largeurs choisies. Utilisez les [slots](ui-contributions.md#menus-et-blocs) pour une contribution fixe qui ne doit pas être déplacée par le propriétaire.

Un widget indisponible ne s’exécute pas et conserve sa configuration. Un rendu défaillant n’empêche pas les autres blocs de s’afficher. Les widgets restent en lecture seule, les actions utilisent leurs routes et autorisations.
