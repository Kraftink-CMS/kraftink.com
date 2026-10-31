# Manifeste et données des extensions

Plugins, thèmes et modules de jeu partagent les règles de dépendances et d’installation décrites ici. La structure propre à chaque type figure dans son guide de création.

## Manifeste et dépendances

Le ZIP contient `manifest.json` à sa racine ou dans un unique dossier principal. `id`, `type` et `version` identifient le paquet. L’identifiant reste unique entre les trois types et ne change pas lors des mises à jour. Pour un plugin ou un jeu, `namespace` correspond à `src/` et `provider` désigne son fournisseur Laravel.

```json
{
    "requires": {
        "cms": ">=0.0.1",
        "php": "^8.4.1",
        "plugin:shop": ">=0.0.1"
    },
    "integrations": {"plugin:wiki": ">=0.0.1"},
    "conflicts": {"plugin:incompatible-package": "<2.0"}
}
```

`requires.cms` et `requires.php` sont obligatoires. Les contraintes suivent la syntaxe Composer. Choisissez la version minimale qui fournit les API utilisées. Les autres clés ont le format `plugin:id`, `theme:id` ou `game:id`.

Une dépendance obligatoire doit être installée et active. `integrations` décrit les compatibilités facultatives, dont votre code doit accepter l’absence. `conflicts` bloque les combinaisons incompatibles. Ces déclarations ne téléchargent pas les dépendances.

Les bibliothèques PHP et frontend se déclarent dans les fichiers Composer et npm du paquet. Leur préparation est décrite dans [Distribuer une extension](extensions-publication.md#bibliotheques-et-ressources).

## Installation et mises à jour

Un dossier sous `extensions/installed/` doit encore être installé depuis le panneau. Le CMS exécute ses migrations puis vérifie son démarrage. Le fournisseur doit donc pouvoir enregistrer ses services sans lire de tables ou contacter un service distant.

Le plugin est activé après installation. Un thème ou un jeu devient disponible jusqu’à sa sélection. Une mise à jour conserve ces choix et l’état d’activation. Une erreur de démarrage ou un schéma incomplet peut suspendre le paquet sans effacer ses données.

Les fichiers du paquet peuvent être remplacés ou retirés pendant une mise à jour. Placez les données variables dans les réglages ou le stockage du CMS. Pour fournir un fichier initial sans écraser ensuite sa copie locale :

```json
"update": {
    "preserve": ["config/site.php", "resources/private-data"]
}
```

Les chemins sont relatifs au paquet, sans joker. Un fichier absent est créé et un fichier existant est conservé. Seules les règles de la version cible s’appliquent. Si vous retirez une règle, prévoyez la migration des données auparavant protégées. `manifest.json` ne peut pas être conservé par cette option.

## Migrations et désinstallation

Placez les migrations Laravel dans `database/migrations/` et préfixez les tables par `id__`. Conservez les migrations distribuées et ajoutez les évolutions nécessaires pour mettre à jour les anciennes versions compatibles. Elles doivent fonctionner avec le code cible sans dépendre de modèles métier intermédiaires.

La désactivation conserve les données. À la désinstallation, les méthodes `down()` retirent uniquement les tables du paquet. Déclarez les autres ressources possédées dans le manifeste :

```json
"uninstall": {
    "settings": ["example.", "secret.example."],
    "storage": ["example/files"],
    "notices": ["example__notice_receipts"]
}
```

`settings` contient les préfixes des réglages. `storage` vise des dossiers privés sous votre identifiant ou `editor-images/<id>`. `notices` désigne les tables de liaison possédant `notice_id`. Gardez les médias communs et les données des autres extensions.

## Corbeille

Inscrivez une `TrashSource` dans `TrashRegistry` depuis le fournisseur pour afficher vos contenus supprimés dans la corbeille commune :

```php
use App\Kraft\Trash\TrashRegistry;
use App\Kraft\Trash\TrashSource;
use App\Models\Accounts\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use KraftInk\Plugins\Example\Services\DocumentTrash;

app(TrashRegistry::class)->register(new TrashSource(
    key: 'example.documents',
    label: 'example::messages.trash.documents',
    permissions: ['example.manage'],
    restorePermissions: ['example.restore'],
    query: fn (User $actor): Builder => DB::table('example__documents')
        ->where('owner_id', $actor->id)
        ->whereNotNull('deleted_at')
        ->select(['id', 'title', 'deleted_at'])
        ->selectRaw('NULL AS restore_reason'),
    restore: function (User $actor, int|string $id): void {
        app(DocumentTrash::class)->restore($actor, $id);
    },
    keyType: 'integer',
    purgePermissions: ['example.purge'],
    purge: function (User $actor, int|string $id): void {
        app(DocumentTrash::class)->purge($actor, $id);
    },
));
```

`key` est stable et préfixée par votre identifiant. `query` renvoie un `Illuminate\Database\Query\Builder` sélectionnant `id`, `title`, `deleted_at` et `restore_reason`, filtré selon les droits de l’opérateur. `restore_reason` contient une clé de traduction si la restauration est bloquée, sinon `null`.

`permissions` protège la consultation, `restorePermissions` la restauration et `purgePermissions` la purge. Les droits de chaque liste sont tous exigés. `authorize` accepte un callback facultatif `(User $actor): bool` pour une règle complémentaire. `keyType` vaut `integer` ou `string` pour un identifiant opaque.

Les callbacks revérifient l’état, les parents et les droits dans une transaction. `purge` est facultatif et ne doit accepter que des éléments supprimés. Retirez les enfants et références possédés, puis les fichiers après commit. Les sources d’un plugin désactivé deviennent indisponibles en conservant leurs données.

Pour reprendre un effacement de fichier en échec, utilisez `FileDeletionQueue::schedule($path, $prefix, $references)` sur une instance de `App\Kraft\Media\FileDeletionQueue`, dans la transaction supprimant ses métadonnées. `$references` associe vos tables aux colonnes de chemin. Pour les images d’éditeur, fournissez aussi les usages des anciennes versions via le callback `history` d’`EditorImageScope`.

## Conservation et confidentialité

Un plugin actif peut participer au nettoyage horaire avec `PruningData` :

```php
use App\Events\PruningData;
use Illuminate\Support\Facades\Event;

Event::listen(PruningData::class, function (PruningData $event): void {
    $count = app(TemporaryDataCleanup::class)->prune($event->dryRun);
    $event->add('example.temporary', $count);
});
```

Lisez les durées avec `App\Kraft\System\RetentionPolicy` : `days('history')`, `days('temporary')`, `days('technical')` et `historyLimit()`. Votre service limite le nettoyage à ses propres données. En simulation, il compte sans écrire ni effacer de fichier.

Conservez les contenus actuels, brouillons, fichiers utilisés, historiques financiers et opérations récupérables. Les identifiants de déduplication ne doivent pas expirer avec les traces techniques. L’export et l’anonymisation des comptes utilisent le [contrat de confidentialité](privacy-extensions.md).

## Tâches et opérations externes

Le fournisseur peut inscrire ses tâches métier au planificateur Laravel. Le cron du CMS les exécute avec celles du site. Un envoi externe attend la validation de la transaction, avec un identifiant stable pour les reprises.

Les requêtes HTTP sont déjà coordonnées avec les opérations du CMS. Pour une nouvelle commande CLI réalisant une livraison, gardez la garde partagée jusqu’à l’écriture du résultat :

```php
use App\Kraft\System\OperationLock;

return app(OperationLock::class)->shared(function () use ($service) {
    return $service->sendAndRecordResult();
});
```

En cas de verrou indisponible, laissez l’opération en attente. Bornez les appels réseau et traitez séparément un refus confirmé et un résultat incertain. Une restauration locale n’annule pas un effet externe.
