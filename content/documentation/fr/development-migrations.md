# Créer un adaptateur d’import

Ce guide concerne les auteurs d’adaptateurs ou de convertisseurs. Pour transférer un site depuis le panneau, consultez [Importer des données](migration.md).

## Déclarer une source

Créez un adaptateur dans `App\Kraft\Migration\Adapters\VotreSource`, puis inscrivez son identifiant dans `config/imports.php`. Étendez `App\Kraft\Migration\AbstractSourceAdapter` ou implémentez directement `Contracts\SourceAdapter`. Le moteur, le contrôleur, l’inventaire des extensions et le catalogue utilisent ce contrat. Ils ne contiennent aucune sélection par nom de CMS et n’ont pas à être modifiés pour ajouter une source.

Chaque source possède ses classes de lecture et de conversion. Les adaptateurs fournis sont organisés dans `Adapters/KraftInk/`, `Adapters/Azuriom/` et `Adapters/MineWeb/`. Les règles de schéma, les formats de configuration, les restrictions et les anciennes URL appartiennent à ces dossiers. Le dossier `Adapters/` contient uniquement ces sources. Les outils communs comme `CoreMappings`, `SettingsMappings` et `NavigationMappings` restent dans `App\Kraft\Migration`, sans identifier le CMS.

| Méthode | Responsabilité |
| --- | --- |
| `id()` | Identifiant déclaré dans le registre. |
| `requirements()` | Tables et colonnes nécessaires à l’analyse. |
| `userTable()` | Table des comptes source, ou `null` si la source n’en importe pas. Le moteur ne suppose pas un nom `users`. |
| `user($row)` | Compte normalisé pour vérifier les identités et les soldes. |
| `roleTable()` et `newsTable()` | Tables de relations utilisées par les helpers de conversion. |
| `sourceLocale($connection, $tables)` | Langue trouvée dans le schéma source, ou `null` pour le repli configuré. |
| `extensionNames($connection, $tables)` | Noms des extensions source sous la forme `['plugin' => [...], 'theme' => [...]]`. Le premier thème est le thème actif. |
| `registerMappings($registry, $core)` | Conversions et dépendances propres à la source. |
| `afterMapping($row, $context, $table)` | Complément exécuté dans la transaction de la ligne, par exemple un inventaire de fichiers à reporter. |

`AbstractSourceAdapter` fournit une table de comptes `users`, une langue indéterminée, un inventaire vide et un complément sans action. Redéfinissez seulement les valeurs adaptées à votre source. `tests/Fixtures/SourceAdapters/ExampleAdapter.php` montre une source dont les tables sont `members`, `teams`, `articles`, `preferences` et `packages`. Son test couvre analyse, collisions, conversion, découverte d’extensions et reprise sans modification du moteur.

Les mappings appartiennent au noyau pour ses domaines ou au plugin pour ses données métier. Un mapping reçoit une ligne source et un `ImportContext`, écrit sur la destination et renvoie `target_table` et `target_id` :

```php
$registry->register(
    'example',
    'articles',
    fn (array $row, ImportContext $context) => [
        'target_table' => 'content_entries',
        'target_id' => $context->insert('content_entries', [
            'kind' => 'page',
            'locale' => 'fr',
            'slug' => 'legacy-'.$row['id'],
            'title' => $row['title'],
            'body' => Html::clean($row['body']),
        ]),
    ],
    priority: 30,
);
```

Les priorités placent les parents avant leurs enfants. `required()` exige une correspondance. `mapped()` accepte une relation optionnelle. `metadata()` conserve un petit contexte non sensible. L’identité source est `id` par défaut. `identity` permet une autre clé.

Les helpers `CoreMappings` écrivent les domaines natifs à partir de données normalisées. Ils ne lisent pas le nom du CMS pour choisir une règle. Le helper de contenu exige notamment des conditions d’accès explicites fournies par le convertisseur. Une autre source peut écrire directement avec `ImportContext` si ces helpers ne conviennent pas à son format.

## Convertisseur d’un plugin

Enregistrez vos mappings depuis le fournisseur avec `app(ImportMappings::class)->register(app(MappingRegistry::class))`. Déclarez les préfixes source reconnus dans votre manifeste :

Pour un plugin qui propose des imports, `Services/Imports/ImportMappings` sert de point d’entrée aux convertisseurs. Placez les conversions dans `Services/Imports/KraftInk/`, `Services/Imports/Azuriom/` ou `Services/Imports/MineWeb/` selon les sources prises en charge. Cette entrée peut aussi être appelée par l’import autonome, sans démarrer le fournisseur. Un outil partagé reçoit des valeurs déjà normalisées et ne branche pas son comportement sur l’identité du CMS.

```json
"imports": {
    "azuriom": ["example_"],
    "mineweb": ["example__"]
}
```

Ces préfixes permettent une suggestion. Seules les conversions effectivement enregistrées sont sélectionnables. Ajoutez `plugin: 'example'` et les `dependencies` source obligatoires au mapping.

Pour contribuer à la conversion des réglages partagés d’une source, utilisez `MappingRegistry::settings($source, $handler, $plugin)`. Le callback reçoit `['key' => ..., 'value' => ...]` et le contexte. Il doit lire uniquement les clés reconnues et écrire les équivalents avec `$context->setting($key, $value)`. Il ne copie ni identifiants de médias ni secrets. Les contributions d’un plugin désélectionné ou inactif ne sont pas appliquées.

`$context->report($kind, $details)` conserve une intervention avec sa table, son identifiant, son champ et éventuellement son chemin source. Utilisez des codes de raison stables et des métadonnées non sensibles. Les chemins de médias sont nettoyés de leurs identifiants et paramètres d’URL. Le rapport doit expliquer les règles sans équivalent et le transfert des fichiers, jamais exposer des clés ou des mots de passe.

## Remplacement et reprise

`replacements` déclare vos seules tables cible et les lignes à remplacer :

```php
replacements: [
    'example__documents' => ['locale' => ['fr']],
]
```

Une portée vide signifie toute la table. Déclarez aussi les tables historiques ou dérivées touchées par cascade. Les enfants précèdent les parents. Sans déclaration, le domaine reste en ajout.

Si votre remplacement retire des ressources ayant des notifications, ajoutez `notification_deliveries => ['owner' => ['example']]` à vos portées. Le moteur sauvegarde et retire aussi les notifications natives associées et leurs lectures, sans toucher à celles des autres extensions. Un envoi externe en cours bloque le remplacement. Les notifications et tâches importées restent historiques et ne doivent pas être remises en attente.

Le moteur sauvegarde avant suppression et annule la transaction si la conversion échoue. N’exécutez ni DDL ni action externe irréversible dans un handler. Un historique importé ne doit rejouer aucun paiement, courrier, vote ou livraison.

La préanalyse inclut une empreinte des valeurs de chaque table, vérifiée à la création de l’archive. La reprise utilise ensuite cette archive chiffrée. Les bases doivent être réellement distinctes, y compris lorsqu’un alias d’hôte ou un autre chemin désigne la même destination. Limitez les inventaires SQL au schéma courant de la connexion.

Un `guard` facultatif vérifie sans écriture les états bloquant le remplacement. Il s’exécute dans l’aperçu puis sous transaction avant suppression. Utilisez le jeu validé de `$context->options['game']` pour les données liées au jeu.

## Vérifier l’adaptateur

Utilisez des fixtures synthétiques pour l’analyse sans écriture, les colonnes manquantes, collisions d’identités, dépendances, HTML hostile et relations absentes. Vérifiez l’import répété, l’arrêt puis la reprise, le rollback d’un remplacement et l’absence d’effets externes rejoués. Documentez les versions source couvertes et les données uniquement archivées.
