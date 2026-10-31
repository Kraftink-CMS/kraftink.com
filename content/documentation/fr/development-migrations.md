# Importer les données d’un plugin

Un plugin peut convertir ses données depuis une source reconnue par l’[assistant d’import](migration.md). Ses convertisseurs restent dans `src/Services/Imports/`, avec un sous-dossier par format source.

## Déclarer les conversions

Dans le fournisseur, appelez votre point d’entrée :

```php
app(ImportMappings::class)->register(app(\App\Kraft\Migration\MappingRegistry::class));
```

`ImportMappings` est une classe de votre plugin. Le manifeste annonce les préfixes source reconnus pour permettre à l’assistant de suggérer le paquet :

```json
"imports": {
    "azuriom": ["example_"],
    "mineweb": ["example__"]
}
```

Enregistrez un mapping pour chaque table convertible :

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

Importez `App\Kraft\Migration\ImportContext` et `App\Kraft\Html`. Les priorités placent les parents avant les enfants. `dependencies` déclare les tables source nécessaires et `identity` remplace la clé source `id` si besoin.

Le contexte fournit `required()` pour une relation obligatoire, `mapped()` pour une relation facultative et `metadata()` pour un petit contexte non sensible. `$context->report($kind, $details)` conserve les éléments à reprendre avec leur référence source.

## Réglages et remplacement

`MappingRegistry::settings($source, $handler, $plugin)` enregistre une conversion de réglages. Le callback reçoit `['key' => ..., 'value' => ...]` et le contexte. Écrivez uniquement les équivalents reconnus avec `$context->setting($key, $value)`, sans copier de secret ou d’identifiant média.

Pour autoriser un remplacement, déclarez les tables et lignes de votre domaine dans l’argument `replacements` :

```php
replacements: [
    'example__documents' => ['locale' => ['fr']],
]
```

Une portée vide désigne toute la table. Incluez les données historiques ou dérivées touchées par cascade, avec les enfants avant les parents. Sans cette déclaration, l’import reste en ajout. Un `guard` facultatif vérifie les états bloquants sans écriture avant le remplacement.

Si le remplacement retire vos notifications, ajoutez `notification_deliveries => ['owner' => ['example']]`. Le moteur prend en charge les notifications natives associées et refuse l’opération si un envoi est en cours.

Les handlers s’exécutent en transaction. N’y modifiez pas le schéma et ne déclenchez aucun paiement, e-mail ou livraison. Les fichiers doivent être signalés pour reprise, sans réutiliser les identifiants de la source.

## Prendre en charge un nouveau format

Pour une source absente, votre paquet peut implémenter `App\Kraft\Migration\Contracts\SourceAdapter`, ou étendre `AbstractSourceAdapter`, et déclarer sa classe dans `imports.adapters.<id>` depuis son fournisseur. L’interface décrit la découverte des comptes, extensions et mappings du format.

Testez les relations manquantes, collisions d’identités, contenus privés et HTML invalide, ainsi que l’arrêt, la reprise et le retour arrière. Indiquez les versions source prises en charge et les données uniquement archivées.
