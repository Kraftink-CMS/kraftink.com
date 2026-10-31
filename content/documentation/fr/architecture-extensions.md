# Cycle de vie des extensions

Ce guide concerne les auteurs de plugins, thèmes et modules de jeu. Pour créer un premier paquet, commencez par [un plugin](developpement-plugins.md), [un thème](developpement-themes.md) ou [un jeu](developpement-jeux.md).

## Paquets et manifeste

Les paquets livrés avec le CMS sont dans `extensions/bundled/`, les ajouts indépendants dans `extensions/installed/{plugins,themes,games}/`. Le CMS ne charge pas votre dépôt de développement. Un dossier déposé manuellement reste à installer : le reçu enregistré dans la base courante fait autorité.

Les chemins se règlent dans `config/kraft.php` : `extensions.installed` et `extensions.bundled` définissent chacun les racines absolues `plugins`, `themes` et `games`. Les archives et mises à jour officielles utilisent les emplacements ci-dessus. Conservez-les pour rester compatible avec leur installation.

L’archive contient `manifest.json` à sa racine ou dans un unique dossier principal. Déclarez :

- `id`, identique au dossier installé, `type` et `version`.
- `requires`, un objet associant `cms`, `php` et les références typées des dépendances obligatoires à leurs contraintes Composer.
- `integrations` pour les intégrations facultatives et `conflicts` pour les incompatibilités, avec le format `type:identifiant` comme clé et une contrainte comme valeur.
- `namespace` et `provider` pour un plugin ou un jeu, avec les classes sous `src/`.

Le noyau utilise les mêmes champs de base dans son `manifest.json`, avec `type: "cms"`. Il ajoute l’inventaire `bundled` (`game`, `plugin`, `theme`) et les protections globales `update.protected`. Ces paquets sont livrés et mis à jour avec le CMS. Seuls ceux qui sont déclarés et présents peuvent démarrer avant la fin de l’installation, après vérification de leurs dépendances.

Les reçus et états d’activation restent dans la base du site. Une mise à jour ne réactive pas les paquets désactivés et ne change ni le jeu ni les thèmes sélectionnés.

Les métadonnées du noyau sont accessibles par `config('manifest.*')`, par exemple `config('manifest.version')`. Les réglages d’hébergement restent dans la configuration Laravel.

L’identifiant est unique entre plugins, thèmes et jeux. Il reste fixe lors des mises à jour, comme le type du paquet. Respectez les namespaces réservés au noyau, aux dépendances et aux autres extensions. Les propriétés internes `path`, `valid`, `enabled` et `error` ne se déclarent pas dans le manifeste. Un paquet externe ne peut pas reprendre un identifiant de l’inventaire `bundled`.

Les clés `cms` et `php` sont obligatoires dans `requires`. Pour une extension, `cms` indique la version requise du CMS. Pour le noyau, il indique les versions depuis lesquelles la mise à jour est acceptée. Les références aux extensions prennent la forme `type:identifiant` :

```json
{
    "requires": {
        "cms": ">=0.0.1",
        "php": "^8.4.1",
        "plugin:shop": ">=0.0.1",
        "theme:horizon": ">=0.0.1",
        "game:minecraft": ">=0.0.1"
    },
    "integrations": {
        "plugin:wiki": ">=0.0.1"
    },
    "conflicts": {
        "plugin:incompatible-package": "<2.0"
    }
}
```

Les contraintes suivent la syntaxe Composer. Les paquets fournis utilisent une version minimale sans plafond, comme `>=0.0.1`. Relevez cette borne lorsqu’une extension nécessite une API plus récente.

Une dépendance obligatoire doit être installée dans une version compatible, avec le type déclaré, puis activée avant son consommateur. Elle empêche aussi sa désactivation, son retrait ou une mise à jour incompatible. Les dépendances KraftInk ne sont pas téléchargées automatiquement. Une intégration facultative absente ou incompatible ne bloque pas l’extension, et sa disponibilité apparaît dans le rapport d’intégrations.

`requires`, `integrations` et `conflicts` utilisent ce format plat. Hormis `cms` et `php` dans `requires`, chaque clé porte un préfixe `plugin:`, `theme:` ou `game:`. Les sous-sections par type, le champ `dependencies` et le champ `cms` à la racine sont refusés. L’identité de catalogue `auteur/slug` ne sert pas de référence de dépendance. Déclarez les bibliothèques PHP dans `composer.json` et JavaScript dans `package.json` du paquet.

## Organisation des vues et composants

Les vues du noyau sont rangées sous `resources/views` selon leur surface et leur ressource. Les pages, leurs partiels et leurs composants ont des rôles distincts :

| Emplacement | Rôle |
| --- | --- |
| `default/<ressource>/` | Pages publiques |
| `admin/<ressource>/` | Pages du panneau |
| `<surface>/layouts/` | Layouts de la surface |
| `<surface>/<ressource>/partials/` | Fragments propres à cette ressource |
| `<surface>/layouts/partials/` | Fragments du layout, comme la navigation |
| `partials/` | Fragments utilisés par plusieurs surfaces, comme la pagination ou les messages de validation |
| `components/` | Composants Blade génériques réutilisables, appelés avec `<x-…>` |
| `admin/components/` | Composants Blade réservés au panneau, appelés avec `<x-admin::…>` |

Le noyau fournit un rendu autonome. Un thème peut surcharger son layout ou ajouter seulement un habillage CSS. Les extensions utilisent les points d’entrée communs de navigation, de slots et de widgets.

Les pages d’un plugin étendent `default.layouts.layout` ou `admin.layouts.layout`, recherchés dans le thème actif puis dans le noyau. Réutilisez Bootstrap et les styles du CMS. Gardez dans le plugin ses vues métier et les styles dont elles ont besoin. Les e-mails et documents imprimables peuvent conserver une structure autonome.

Intégrez un fragment utilisé une seule fois dans sa vue appelante. Gardez un partiel pour du contenu réutilisé, récursif ou un point de surcharge du layout. Utilisez `@include` pour un partiel et `@props` pour les paramètres d’un composant, qui peut aussi recevoir des slots :

```blade
@include('mon-plugin::admin.documents.partials.fields')
<x-forms.local-datetime name="published_at" :value="$document?->published_at" />
<x-admin::media-picker name="cover" :value="$document?->cover" />
```

Les vues `widgets/` d’un plugin sont les rendus enregistrés dans le [registre de widgets](plugin-widgets.md). Le composant `<x-widgets.zone>` affiche ces contributions dans une zone configurée. Chaque plugin conserve ses vues et partiels métier dans son propre namespace.

## Bibliothèques et compilation

Chaque fichier a son rôle :

| Fichier | Rôle |
| --- | --- |
| `manifest.json` | Identité KraftInk, exigences CMS/PHP, dépendances entre extensions et ressources exposées |
| `composer.json` et `composer.lock` | Bibliothèques PHP de production propres au paquet et versions verrouillées |
| `package.json` et `package-lock.json` | Bibliothèques frontend, outils de compilation et script `build` |

Ajoutez seulement les fichiers nécessaires. Un plugin sans bibliothèque PHP ni compilation frontend peut conserver uniquement son manifeste.

Dans `composer.json`, utilisez la syntaxe Composer habituelle :

```json
{
    "require": {
        "guzzlehttp/guzzle": "^7.8.2 || ^8.0"
    }
}
```

Versionnez `composer.lock`. À la publication, les dépendances de production sont installées dans un dossier temporaire. PHP-Scoper leur attribue un namespace privé et adapte les références du paquet. Le ZIP contient ce `vendor/` préparé, ses licences et son index de chargement. Deux plugins peuvent ainsi utiliser des versions différentes d’une bibliothèque. Le champ `libraries` du manifeste est généré automatiquement.

Le fichier Composer accepte les métadonnées, les exigences et la correspondance PSR-4 entre le namespace du manifeste et `src/`. Les dépôts personnalisés, scripts et configurations actives sont refusés. Les dépendances de développement ne sont pas distribuées et les plugins Composer ne sont pas exécutés. Les contrats `App`, `Illuminate` et `Laravel` restent fournis par le CMS.

Testez la bibliothèque après préparation, surtout les noms de classes dynamiques, la réflexion et les références dans les vues. Si nécessaire, ajoutez des `patchers` PHP-Scoper dans `scoper.inc.php`. Le CMS charge les bibliothèques privées : ne chargez pas `vendor/autoload.php` depuis votre fournisseur.

Le `vendor/` suit les fichiers du paquet : une désinstallation le conserve pour réinstallation, une suppression des fichiers le retire, un retrait l’archive et une restauration le rétablit. Aucune de ces opérations ne relance Composer sur le serveur.

Pour le frontend, déclarez les bibliothèques dans `dependencies`, les outils dans `devDependencies`, et la commande de compilation dans `scripts.build`. Par exemple :

```json
{
    "private": true,
    "scripts": {
        "build": "sass resources/scss/theme.scss public/theme.css --style=compressed --no-source-map"
    },
    "devDependencies": {
        "sass": "1.106.1"
    }
}
```

Versionnez `package-lock.json`. La publication exécute `npm ci` puis `build` dans une copie temporaire du commit et récupère les sorties de `public/`. Les hooks d’installation, `prebuild` et `postbuild` ne sont pas exécutés. Un verrou absent ou incohérent bloque la publication.

Un thème peut aussi déclarer ses entrées avec `build.scss` dans le manifeste, en utilisant les dépendances Sass verrouillées du `package.json`. Un script `build` explicite prend la priorité.

Le ZIP contient les ressources compilées, sans `node_modules`. Le serveur installe cette archive prête à l’emploi, sans Composer, PHP-Scoper ni Node.js.

## Installation, démarrage et mise à jour

L’installation vérifie le paquet, sauvegarde l’état concerné, exécute ses migrations puis contrôle son démarrage dans un processus PHP séparé. Le fournisseur doit pouvoir enregistrer services, routes et événements avant la création de ses tables. Évitez toute requête SQL ou tout appel réseau au démarrage du fournisseur.

Une nouvelle installation active automatiquement le plugin après validation. Un thème installé reste disponible jusqu’à sa sélection explicite pour sa cible `site` ou `admin`. Un module de jeu installé doit inscrire un `GameAdapter` portant le même identifiant que son manifeste. Il devient disponible sans changer le jeu choisi pour le site.

Une incompatibilité, un schéma incomplet ou une erreur de démarrage suspend le chargement sans supprimer les données. `KRAFT_SAFE_MODE=true` suspend tous les fournisseurs pour permettre un diagnostic. Les gestionnaires de confidentialité ont un chargement indépendant, décrit dans [Confidentialité](privacy-extensions.md).

Les mises à jour du CMS remplacent ses paquets intégrés et laissent les extensions indépendantes à leur propre cycle. Une mise à jour d’extension peut remplacer le code de tous ses dossiers, `vendor/` compris, dans les limites du paquet.

Placez les données variables dans le stockage privé ou les réglages. Les protections permanentes `update.protected` du manifeste du CMS s’appliquent aussi aux extensions. Elles couvrent les données locales, les fichiers d’environnement et les configurations `config/local.php` et `config/custom.php`. Elles ne ciblent pas les classes de `src/Cache` ou les bibliothèques comme `vendor/psr/cache`. Le modèle `.env.example` reste distribuable.

Pour initialiser d’autres fichiers locaux puis les conserver, déclarez :

```json
"update": {
    "preserve": ["config/site.php", "resources/private-data"]
}
```

Ces chemins sont des préfixes de fichiers ou de dossiers du paquet, sans joker. Ils ne peuvent pas couvrir `manifest.json`, quelle que soit la casse. Seule la liste de la version cible s’applique, y compris aux paquets intégrés :

- Un fichier absent est créé avec la valeur du paquet.
- Un fichier ou lien existant, même cassé, est conservé et ne peut pas être supprimé.
- Retirer une règle autorise à nouveau le remplacement ou la suppression. Migrez le contenu à conserver avant ce retrait, même si le site saute des versions.

Les protections permanentes restent prioritaires et interdisent aussi de créer les fichiers absents qu’elles couvrent.

Le moteur vérifie les chemins, sauvegarde les données et peut revenir en arrière. Il revérifie l’absence des fichiers à initialiser sous verrou, avant modification. Si l’opération échoue, la restauration retire aussi les fichiers qu’elle a créés.

## Schéma et nettoyage

Chaque plugin possède ses migrations et ses tables préfixées par son identifiant suivi de `__`, par exemple `example__documents`. Le noyau ne crée pas les tables métier de votre extension. Les noms des tables source d’un import restent ceux de cette source.

Définissez le schéma avec la façade Laravel `Schema` dans `database/migrations`. La migration initiale décrit une installation neuve complète. Utilisez des méthodes privées pour les étapes longues.

Un push ajoute au maximum une migration par dépôt, séparément pour le CMS et chaque plugin. Tant que le lot n’est pas poussé, complétez sa migration existante. Après le push, elle devient immuable.

Conservez les migrations distribuées pour permettre une mise à jour directe depuis toute version compatible. Elles doivent fonctionner avec le code cible, sans démarrer les versions intermédiaires ni dépendre de modèles métier susceptibles de changer.

Vérifiez la création, la conservation des données et le retour arrière, en supprimant les enfants avant leurs parents. Une migration enregistrée ne se rejoue pas lors d’une synchronisation de fichiers. Corrigez une ancienne base de développement manuellement après sauvegarde, sans ajouter ces réparations locales au paquet.

La désactivation conserve les données. Pour la désinstallation, les méthodes `down()` ne doivent toucher qu’aux tables du paquet. Le manifeste déclare les ressources supplémentaires qu’il possède :

```json
"uninstall": {
    "settings": ["example.", "secret.example."],
    "storage": ["example/files"],
    "notices": ["example__notice_receipts"]
}
```

`storage` désigne des dossiers sous `storage/app/private`, limités à votre identifiant ou à `editor-images/<id>`. `notices` désigne vos tables de liaison avec une colonne `notice_id`. Aucun nettoyage ne doit supprimer un média commun ou une donnée d’une autre extension.

## Corbeille commune

Un plugin actif peut ajouter ses contenus supprimés à `/admin/trash` avec `App\Kraft\Trash\TrashRegistry` et `TrashSource`. Les données restent dans ses tables. Regroupez l’inscription des sources, la restauration et la purge dans un service sous `Services`, appelé depuis le fournisseur.

Exemple pour des documents appartenant à un membre :

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

Chaque source définit les éléments suivants :

| Propriété | Contrat |
| --- | --- |
| `key` | Clé stable et unique, préfixée par le plugin |
| `label` | Clé de traduction du paquet |
| `permissions` | Droits nécessaires à la consultation, tous exigés |
| `restorePermissions` | Droits supplémentaires pour restaurer |
| `authorize` | Callback facultatif `(User $actor): bool`, commun à la consultation, la restauration et la purge |
| `query` | `Illuminate\Database\Query\Builder` sélectionnant `id`, `title`, `deleted_at` et `restore_reason` |
| `restore` | Callback `(User $actor, int\|string $id): void` appelant le service métier |
| `keyType` | `integer` par défaut, ou `string` pour les UUID et autres identifiants textuels |

Le registre rejette les clés, libellés, permissions, types et requêtes invalides avec une `InvalidArgumentException`. Le contrat de requête s’applique même à une source vide. Pour des droits alternatifs, laissez les listes de permissions concernées vides et exprimez l’alternative dans `authorize`. Les droits supplémentaires de purge restent exigés.

La requête filtre les éléments supprimés selon les règles du plugin, notamment leur propriétaire et leurs données personnelles. Gardez les éléments consultables mais non restaurables : `restore_reason` contient alors la clé de traduction expliquant le refus, sinon `null`. `canRestoreItem($actor, $row)` combine cette valeur et les droits. Le service métier revérifie l’état sous transaction et verrou avant toute modification.

Un identifiant `integer` est un entier décimal positif dans les bornes de PHP, sans signe ni zéro initial. Un identifiant `string` contient de 1 à 255 octets, sans espace, barre oblique ni caractère de contrôle. Il est transmis sans conversion. Validez aussi le format propre au domaine, comme celui d’un UUID.

Les méthodes principales sont :

| Méthode | Résultat |
| --- | --- |
| `sources($actor)` | Sources consultables |
| `source($key, $actor)` | Source accessible ou `null` |
| `query($actor, $source, $search)` | Liste commune avec filtres facultatifs |
| `restore($actor, $source, $id)` | Contrôle des droits et de l’identifiant, puis appel au restaurateur |

Une source inconnue ou inaccessible, ou un identifiant invalide, produit une réponse 404. Une restauration sans droit produit une réponse 403. Le restaurateur reçoit l’utilisateur et l’identifiant, puis applique toutes les règles du domaine : droits, parents, fichiers et données personnelles. Il ne rétablit pas automatiquement un parent supprimé ou des données anonymisées. Une erreur doit laisser les données intactes.

La désactivation d’un contenu ne le place pas en corbeille. Les brouillons n’y expirent pas et aucune purge automatique n’est lancée. Les sources des plugins désactivés ou en quarantaine deviennent inaccessibles sans effacer leurs données ni démarrer leur fournisseur.

### Suppression définitive

Le callback facultatif `purge` active la suppression définitive. `purgePermissions` ajoute ses droits à ceux de consultation, indépendamment du droit de restauration. Sans callback, `canPurge($actor)` renvoie `false`. `purge($actor, $source, $id)` contrôle la source, les droits et l’identifiant avant d’appeler le service métier.

Ce service verrouille la ressource supprimée dans une transaction et refuse les éléments actifs. Il retire les enfants, versions et références dont il est propriétaire. Avant les cascades, il collecte les fichiers et vérifie leurs chemins et usages, y compris dans les contenus, brouillons, corbeilles et versions conservées, même si des liaisons historiques manquent. Les médias de la bibliothèque et les fichiers externes restent protégés. Les fichiers physiques sont supprimés après le commit.

`purgeableSources($actor)` et `purgeableQuery($actor)` exposent les sources et éléments supprimables. `empty($actor)` fige les candidats autorisés dans une transaction de lecture à mémoire bornée, terminée avant les purges. Les éléments ajoutés ensuite à la corbeille restent exclus. Chaque candidat passe par son callback, sans transaction globale entre sources.

Le résultat `TrashPurgeResult` expose `purged`, `skipped` et `failed`. Un élément restauré ou disparu entre-temps est ignoré. Si le service refuse une purge, il annule sa transaction. Les autres erreurs sont comptées sans interrompre les candidats suivants. Une nouvelle tentative peut traiter les éléments restants.

Les routes `DELETE /admin/trash/{source}/{item}` et `DELETE /admin/trash` vérifient les droits, demandent une confirmation et utilisent `SensitiveAction`, avec le second facteur s’il est actif. Comme `POST /admin/trash/{source}/{item}/restore`, elles utilisent `throttle:sensitive`. Prévoyez aussi une confirmation pour les appels internes irréversibles. Le vidage concerne toutes les sources autorisées, quels que soient les filtres affichés.

### Nettoyage des fichiers privés

Dans la transaction qui retire les métadonnées, appelez `schedule($path, $prefix, $references)` sur une instance de `App\Kraft\Media\FileDeletionQueue`. Le préfixe limite les chemins au répertoire privé de l’origine. Les références associent les tables aux colonnes contenant les chemins, par exemple `['example__files' => 'path']`, avec un tableau pour plusieurs colonnes.

La demande est enregistrée avec la suppression des métadonnées, puis tentée après le commit. En cas d’échec disque, `kraft:maintenance` la reprend à son échéance, même si le plugin est désactivé. Une référence existante annule l’effacement. Une table de référence absente le bloque pour un fichier encore présent. Les demandes terminées sont retirées.

Une purge peut donc supprimer le contenu tout en signalant des fichiers en attente de nettoyage. Le plugin reste responsable des droits et des usages historiques. La file revérifie les chemins et références avant chaque tentative.

Avec `PrivateEditorImages`, fournissez à `EditorImageScope` un callback `history` sélectionnant `resource_id` et `body`. Ce contrôle sert à la purge, à la maintenance et à l’anonymisation. La rétention répare les liaisons manquantes avec `active=false`, sans rendre les anciennes images publiques.

## Conservation des données

La commande horaire `kraft:maintenance` nettoie les historiques, données temporaires, fichiers abandonnés et exports expirés pris en charge. Utilisez `App\Kraft\System\RetentionPolicy` pour lire `days('history')`, `days('temporary')`, `days('technical')` et `historyLimit()`. Les valeurs par défaut viennent de `config/retention.php`, les réglages du site de `retention.*`. L’audit et les exports privés gardent leurs durées propres.

Un plugin actif peut participer depuis son fournisseur avec l’événement synchrone `App\Events\PruningData` :

```php
use App\Events\PruningData;
use Illuminate\Support\Facades\Event;

Event::listen(PruningData::class, function (PruningData $event): void {
    $count = app(TemporaryDataCleanup::class)->prune($event->dryRun);
    $event->add('example.temporary', $count);
});
```

`TemporaryDataCleanup` représente votre service. Vérifiez ses tables avant les requêtes et limitez-le aux ressources du plugin. En `dryRun`, comptez sans écrire, supprimer de fichier ou appeler un service externe. Préfixez les compteurs par l’identifiant du plugin, y compris en simulation.

Supprimez seulement les versions dépassant la durée ou le nombre maximal. Conservez les contenus actuels, les tickets fermés et les brouillons enregistrés. Les sauvegardes temporaires de formulaires peuvent expirer séparément.

Préservez les données financières, droits acquis, récompenses, opérations récupérables et références d’idempotence. Un état `failed` ou `uncertain` ne suffit pas à autoriser le nettoyage. Gardez les fichiers encore utilisés par un contenu ou une version conservée. Pour les fichiers à supprimer, vérifiez leurs chemins et retirez-les après commit.

Les fournisseurs désactivés ou en quarantaine ne participent pas au nettoyage. Les gestionnaires de confidentialité gardent leur cycle propre. Vérifiez `kraft:maintenance --dry-run`, les limites des lots et la concurrence avec l’édition.

## Tâches et opérations externes

Le planning natif est centralisé dans `routes/console.php` du CMS. Les fournisseurs des plugins inscrivent uniquement les tâches propres à leur domaine. `php artisan schedule:list` donne l’inventaire effectif, extensions actives comprises. L’hébergeur lance une seule entrée `php artisan schedule:run` chaque minute.

Avec le pilote de file par défaut `sync`, les notifications externes, les annonces immédiates, les webhooks d’audit et les récupérations OAuth tentent leur envoi après le commit de la transaction métier. Un rollback ne doit émettre aucun appel externe. Un pilote asynchrone choisi explicitement conserve le report. Pour les [notifications de plugin](plugin-notifications.md), `deferred: true` demande également ce report explicite.

Conservez les événements dans une file persistante avant l’essai et réutilisez leurs identifiants lors des reprises. Un verrou indisponible ou un délai de reprise doit laisser l’opération en attente. Le cron reste nécessaire pour les publications programmées, les reprises différées, les synchronisations, le suivi des serveurs et la maintenance. `kraft:tasks-run` traite la file Laravel `database` avec au plus 25 tâches et une limite de 40 secondes contrôlée entre deux tâches. Les files métier restent traitées par leurs commandes dédiées.

Les requêtes HTTP ordinaires sont déjà protégées par la coordination du CMS. Une nouvelle entrée CLI ou un service exécutant une livraison doit conserver une garde partagée depuis la réservation jusqu’à l’écriture du résultat :

```php
use App\Kraft\System\OperationLock;

return app(OperationLock::class)->shared(function () use ($service) {
    return $service->sendAndRecordResult();
});
```

Une opération qui sauvegarde puis modifie un schéma ou restaure une base garde l’exclusivité pendant toute la séquence : snapshot, mutation, validation et éventuel rollback. `DatabaseSnapshots::make()` seul ne conserve pas un verrou après son retour. Une garde partagée ne s’élève pas implicitement en garde exclusive.

Les processus doivent partager le même stockage et des verrous de fichiers compatibles. Une acquisition refusée doit laisser l’opération intacte et permettre une nouvelle tentative. Gardez les appels réseau bornés et les opérations externes idempotentes : une restauration locale n’annule pas une commande ou un paiement déjà exécuté.

Avant livraison, testez l’installation indépendante, les dépendances manquantes, une erreur de démarrage, une mise à jour interrompue et les accès concurrents sur des données isolées.
