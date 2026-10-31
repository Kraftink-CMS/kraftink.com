# Ajouter des widgets configurables

Les widgets sont des blocs d’extension que le propriétaire ajoute, configure et déplace depuis **Présentation → Widgets**. Une instance possède un emplacement, une largeur et éventuellement une liste de langues. Une liste vide de langues autorise toutes les langues du site. Plusieurs instances d’un même widget peuvent avoir des configurations différentes.

L’accueil natif affiche l’emplacement `home`. Un thème peut intégrer cet emplacement à sa propre présentation. Le site ne crée aucun widget automatiquement : le propriétaire choisit ses blocs. Les données de disposition sont enregistrées dans les réglages du CMS, indépendamment des données métier du plugin.

## Enregistrer une définition

Le fournisseur enregistre les widgets depuis `boot()`. Une méthode privée `registerWidgets()` peut regrouper leurs définitions. L’enregistrement décrit le widget sans interroger les tables du plugin, qui peuvent ne pas exister lors de son installation. Les requêtes et les contrôles d’accès sont exécutés par le callback de rendu.

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

La clé publique de cette définition est `example:latest-documents`. `owner` correspond à l’identifiant du paquet. `render` reçoit un nom de vue ou un callback. Le callback peut renvoyer une vue, du HTML ou une chaîne vide lorsqu’il n’existe aucun contenu à montrer. Les valeurs produites par les membres doivent rester échappées dans Blade.

Le contexte fournit toujours l’utilisateur authentifié courant dans `user`, la langue courante dans `locale` et l’instance dans `instance`. Un appelant ne peut pas remplacer ces trois valeurs. Les autres valeurs de contexte appartiennent à la zone appelante. Elles ne constituent pas une preuve d’autorisation.

## Configuration

Le registre accepte jusqu’à vingt champs scalaires par définition. Un champ possède un identifiant stable et un `label` traduit ; `help` peut fournir une clé d’aide.

| Type | Options |
| --- | --- |
| `integer` | `min`, `max`, `default` ; bornes par défaut de 1 à 100 |
| `text` | `max`, `default` ; 255 caractères par défaut, 1 000 au maximum |
| `boolean` | `default`, faux par défaut |
| `choice` | `options` associant chaque valeur à une clé de traduction, `default` |

L’argument facultatif `defaults` fournit aussi les valeurs initiales, avec priorité sur les valeurs `default` des champs. Les données enregistrées et les anciennes configurations relues avant rendu passent par les mêmes validations. Un champ inconnu est refusé ; les champs manquants reprennent leur valeur initiale. Une évolution du plugin doit donc conserver des valeurs initiales compatibles ou prendre en charge ses anciens choix.

Les identifiants de champs acceptent lettres minuscules, chiffres et tirets bas. Les textes de configuration sont du texte, sans exécution de code ou interprétation de Blade. L’interface ne permet pas de saisir un chemin de vue, une classe PHP ou une requête SQL.

## Emplacements supplémentaires

Un thème ou une extension peut déclarer un emplacement avant d’y enregistrer des widgets :

```php
app(\App\Kraft\Widgets\WidgetRegistry::class)->zone(
    'community.sidebar',
    'my-theme::messages.sidebar',
);
```

Puis le rendre dans une vue :

```blade
<x-widgets.zone name="community.sidebar" :context="['entry' => $entry]" />
```

La sortie fournit une grille Bootstrap avec les largeurs choisies. Les déplacements d’instance restent dans leur emplacement. Une zone non déclarée ne produit aucune sortie. Les thèmes conservent aussi les slots pour leurs contributions programmatiques fixes ; les widgets servent à la composition contrôlée par le propriétaire.

## Accès et disponibilité

Le CMS vérifie la permission déclarée avant d’appeler le rendu. Le plugin doit en plus filtrer chaque requête par publication, langue, permissions propres aux catégories et visibilité de l’utilisateur. La permission d’une page ne rend pas tous ses enregistrements publics. Les tickets d’un membre ne doivent jamais être sélectionnés depuis un identifiant fourni dans le contexte.

Les widgets d’une extension désactivée, absente, incompatible, mise en quarantaine ou signalée en erreur ne s’exécutent pas. Le mode sûr masque aussi les widgets. Leurs instances et paramètres sont conservés pour une éventuelle réactivation et restent supprimables depuis le panneau. Le rendu d’un bloc défaillant est ignoré, sans empêcher les blocs suivants ou le reste de la page de s’afficher ; le journal conserve uniquement l’identifiant et la classe d’erreur.

L’activation d’un widget ne doit déclencher ni écriture métier, ni paiement, ni exécution de commande serveur. Ces actions gardent leurs routes, protections CSRF et autorisations dédiées.
