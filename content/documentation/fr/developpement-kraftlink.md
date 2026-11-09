# Protocole de liaison des serveurs

KraftLink permet à un plugin de jeu d’échanger des données avec une extension du site par la liaison du serveur. Le jeton se crée dans la fiche du serveur, comme décrit dans [KraftLink](kraftlink.md). Les [accès aux comptes et soldes](developpement-serveurs.md) utilisent une clé distincte.

## Regrouper les opérations

Envoyez `POST /api/link/poll` avec le jeton du serveur dans `Authorization: Bearer JETON_SERVEUR`. Une requête contient de 1 à 16 opérations et sa taille est limitée à 1 Mio. Envoyez uniquement les opérations dues pour cette liaison.

```json
{
    "protocol": 1,
    "operations": {
        "commands": {"protocol": 1, "players": [], "limit": 20},
        "example.status": {"revision": 12}
    }
}
```

| Opération | Données envoyées | Données reçues |
| --- | --- | --- |
| `heartbeat` | Le même état de serveur que pour `POST /api/link/heartbeat` | L’identifiant du serveur, l’heure et les fonctionnalités disponibles |
| `commands` | La même demande que pour `POST /api/link/commands/claim` | `commands`, avec les baux de livraison |
| `in_game_sign_in` | `players`, les identités éligibles en jeu avec `uuid`, `username` et `platform` | `requests`, les demandes destinées aux joueurs déclarés par le connecteur sélectionné |
| `example.status` | Les champs définis par l’extension propriétaire | Le résultat défini par l’extension |

Si plus de 2 000 joueurs sont présents, KraftLink limite les listes d’identités et alterne les joueurs examinés pour les commandes et la connexion rapide. Le heartbeat peut envoyer le total dans `players_online`, ce qui permet au site d’afficher le nombre réel.

Chaque clé de `data.operations` contient son propre résultat, par exemple `{"success":true,"data":{"commands":[]}}` ou `{"success":false,"status":422}`. Une opération inconnue renvoie le statut `404` dans son résultat. Une erreur sur une opération laisse les résultats des autres disponibles. Les réponses du joueur à une demande en jeu et les accusés de livraison utilisent leurs routes dédiées dès qu’un résultat est connu.

Sur un site dépourvu de la route groupée, KraftLink utilise `/api/link/heartbeat` et `/api/link/commands/claim`. La connexion rapide et les opérations de plugins utilisent le poll groupé. Chaque échange utilise un seul jeton. Un canal de livraison doté d’un autre jeton ou d’une route personnalisée conserve sa propre requête.

### Enregistrer une opération côté CMS

Dans le fournisseur Laravel de votre extension, enregistrez un nom commençant par son identifiant, suivi d’un point et du nom de l’opération.

```php
use App\Kraft\Link\LinkPollRegistry;

app(LinkPollRegistry::class)->register('example.status', StatusPoll::class);
```

`StatusPoll` implémente `App\Kraft\Link\Contracts\PollHandler` avec la méthode `poll(Server $server, array $payload): array`. Le serveur provient du jeton authentifié. Validez les champs reçus, vérifiez que la fonctionnalité est autorisée pour ce serveur et retournez les données destinées à ce serveur. Le résultat est encodé en objet JSON et limité à 64 Kio. Une exception de validation devient une erreur `422` pour cette opération.

### Récupérer une opération depuis un plugin de jeu

Compilez votre plugin avec `fr.nivcoo.kraftink:KraftLink-API:VERSION` en `provided` ou `compileOnly`. Le JAR d’API est disponible avec les [publications KraftLink](https://github.com/kraftink-cms/KraftLink/releases). Il sert à compiler le plugin. Le JAR KraftLink installé sur le serveur fournit les classes au démarrage.

Depuis les sources, `mvn -pl api -am install` installe la dépendance dans le dépôt Maven local. Avec le JAR téléchargé, importez-le dans votre dépôt de dépendances ou référencez-le comme fichier local avec Gradle.

Implémentez `fr.nivcoo.kraftlink.api.LinkPollOperation` et enregistrez-la avec `api.registerPollOperation(operation)`. Fermez l’inscription renvoyée à la désactivation du plugin. `name()` correspond au nom enregistré dans le CMS. `intervalSeconds()` vaut 5 par défaut et peut être remplacé dans `operation_poll_seconds`.

`request()` retourne les champs de l’opération sous forme de `Map<String, Object>`, ou `null` pour passer ce cycle. `receive(data)` reçoit le résultat et `rejected(status)` reçoit le statut d’une erreur déclarée par le CMS. Ces méthodes s’exécutent dans la boucle du connecteur. Gardez-les courtes et utilisez le planificateur de votre plateforme pour les opérations qui doivent s’exécuter sur le thread du jeu. KraftLink accepte jusqu’à 13 opérations de plugins enregistrées par instance.

### Appeler le CMS à la demande

Dans le fournisseur Laravel, enregistrez une opération directe.

```php
use App\Kraft\Link\LinkRequestRegistry;

app(LinkRequestRegistry::class)->register('example.acknowledge', AcknowledgeWork::class);
```

`AcknowledgeWork` implémente `App\Kraft\Link\Contracts\RequestHandler` et sa méthode `handle(Server $server, array $payload): array`. Vérifiez les permissions et recherchez les données dans le périmètre du serveur authentifié.

Le plugin Java appelle `api.request("example.acknowledge", Collections.singletonMap("id", id))` et reçoit un `CompletableFuture<Map<String, Object>>`. Une erreur est signalée par `KraftLinkRequestException` avec le statut HTTP et, si disponibles, les erreurs par champ. Le statut `0` indique un échec de transport ou une réponse invalide. Traitez le résultat sans attendre sur le thread du jeu. KraftLink envoie chaque appel une fois. Une relance après une coupure peut être ambiguë, alors utilisez un identifiant stable pour les mutations qui doivent supporter les répétitions.

Pour un connecteur HTTP tiers, la même opération passe par `POST /api/link/request` avec le jeton du serveur. La taille est limitée à 64 Kio par requête et par réponse.

```json
{"protocol":1,"operation":"example.acknowledge","payload":{"id":"job-42"}}
```

### Échanger des tâches entre les deux plugins

1. Le plugin du site crée une tâche avec un identifiant stable et l’identifiant du serveur destinataire.
2. Son opération de collecte retourne les tâches en attente de ce serveur. Le compagnon Java les traite dans `receive(data)`.
3. Le compagnon envoie `example.acknowledge` après traitement. Le plugin du site valide la cible et enregistre le résultat. Il conserve les tâches et les confirmations aussi longtemps que ses règles métier l’exigent.

Le même compagnon peut envoyer des événements au site par `request()`, s’inscrire à une collecte périodique ou utiliser les deux.

`api.instanceId()` identifie l’installation locale et `api.platform()` indique sa plateforme. `api.serverId()` est disponible après le premier heartbeat réussi et correspond à la fiche KraftInk authentifiée. Un connecteur HTTP tiers peut également envoyer `X-KraftLink-Instance` avec un UUID v4 persistant et `X-KraftLink-Platform` avec `bukkit`, `velocity` ou `hytale`.

### Trouver l’API

Ajoutez `fr.nivcoo.kraftink:KraftLink-API` aux dépendances de compilation de votre plugin, avec la portée `provided` pour Maven ou `compileOnly` pour Gradle. `KraftLinkApi` et `KraftLinkProvider` appartiennent au paquet `fr.nivcoo.kraftlink.api`. L’instance de KraftLink installée sur le serveur fournit ces classes au démarrage. Gardez le JAR de l’API hors du JAR de votre plugin et du dossier des plugins du serveur.

**Bukkit, Spigot, Paper et Folia.** Ajoutez `depend: [KraftLink]` dans `plugin.yml` et récupérez le service dans `onEnable()`.

```java
KraftLinkApi api = getServer().getServicesManager().load(KraftLinkApi.class);
```

Si votre plugin utilise `paper-plugin.yml`, déclarez la dépendance `dependencies.server.KraftLink` avec `load: BEFORE`, `required: true` et `join-classpath: true`. Le service renvoie `null` si KraftLink n’a pas pu démarrer.

**Velocity.** Ajoutez `@Dependency(id = "kraftlink")` à `@Plugin`, ou l’équivalent `{"id":"kraftlink","optional":false}` dans les dépendances de `velocity-plugin.json`. Faites la recherche dans un gestionnaire de `ProxyInitializeEvent` à la priorité par défaut.

```java
Optional<KraftLinkApi> api = proxy.getPluginManager().getPlugin("kraftlink")
        .flatMap(PluginContainer::getInstance)
        .filter(KraftLinkProvider.class::isInstance)
        .map(KraftLinkProvider.class::cast)
        .flatMap(KraftLinkProvider::api);
```

**Hytale.** Ajoutez `"fr.nivcoo.kraftink:KraftLink": "*"` dans `Dependencies` du fichier `manifest.json`. Faites la recherche dans `start()`.

```java
PluginIdentifier id = new PluginIdentifier("fr.nivcoo.kraftink", "KraftLink");
Optional<KraftLinkApi> api = Optional.ofNullable(PluginManager.get().getPlugin(id))
        .filter(KraftLinkProvider.class::isInstance)
        .map(KraftLinkProvider.class::cast)
        .flatMap(KraftLinkProvider::api);
```

Sur Velocity et Hytale, un résultat vide indique que KraftLink n’a pas démarré ou s’est arrêté.

## Récupérer une livraison

Le client utilise HTTPS et `Authorization: Bearer JETON_SERVEUR`, avec le jeton de la fiche du serveur. Envoyez `POST /api/link/commands/claim` :

```json
{
    "protocol": 1,
    "players": ["00000000000000000000000000000001"],
    "player_names": ["ExamplePlayer"],
    "limit": 20
}
```

`players` contient au plus 2 000 UUID présents et peut être vide. La liste facultative `player_names` contient les pseudos des joueurs présents. `limit` va de 1 à 20. Les réponses JSON utilisent `success` pour indiquer la réussite et `data` pour le résultat. La liste `data.commands` fournit pour chaque livraison `id`, `command`, `uuid`, `player`, `channel`, `lease`, `lease_expires_at` et `requires_online`. Une cible par pseudo est fournie dans `player`, une cible par UUID dans `uuid`.

Le bail dure cinq minutes et appartient au serveur demandeur. Le budget est partagé entre les canaux du noyau et des extensions. Une commande exigeant un joueur présent n’est proposée que si son UUID figure dans `players` ou son pseudo dans `player_names`. Le connecteur vérifie à nouveau sa présence sur le serveur avant l’exécution. Sans `player_names`, les commandes ciblées par pseudo avec présence requise restent en attente. Traitez les identifiants de livraison comme opaques. Leur préfixe ne donne aucun accès aux tables du fournisseur.

## Confirmer sans rejouer

Après traitement, envoyez `POST /api/link/commands/{id}/ack` avec l’identifiant complet :

```json
{
    "lease": "bail-recu",
    "state": "executed",
    "error": null
}
```

| État | Usage |
| --- | --- |
| `executed` | Exécution terminée |
| `failed` | Échec confirmé à corriger |
| `uncertain` | Effet possible nécessitant une vérification |
| `deferred` | Report de trente secondes sans consommer la tentative |

`error` est facultatif, limité à 1 000 caractères et sans secret. Le bail et le serveur doivent correspondre. Une répétition d’accusé ne doit pas produire une seconde récompense. Un accusé accepté renvoie `{"success":true,"data":{"ok":true}}`.

Enregistrez durablement l’identifiant et le résultat avant l’accusé. Si le CMS repropose une commande exécutée, confirmez-la avec le nouveau bail sans la rejouer. Une coupure avant journalisation laisse un résultat incertain : vérifiez son effet avant toute nouvelle exécution, même après expiration du bail.

## Fournir des commandes depuis un plugin

Si votre plugin conserve ses propres livraisons, utilisez `DeliveryQueue` pour les remettre au connecteur. Dans le fournisseur du plugin, écoutez les événements de collecte et de confirmation.

```php
use App\Events\AcknowledgingLinkCommand;
use App\Events\CollectingLinkCommands;
use App\Kraft\Link\DeliveryQueue;
use Illuminate\Support\Facades\Event;

Event::listen(CollectingLinkCommands::class, function (CollectingLinkCommands $event): void {
    app(DeliveryQueue::class)->collect($event, 'example', Delivery::query()->eligible());
});

Event::listen(AcknowledgingLinkCommand::class, function (AcknowledgingLinkCommand $event): void {
    app(DeliveryQueue::class)->acknowledge($event, 'example', Delivery::query());
});
```

Utilisez l’identifiant de votre extension comme canal. `Delivery` et `eligible()` appartiennent à votre plugin. Appliquez vos règles métier à la collecte. Incluez les livraisons déjà traitées dans la requête de confirmation pour accepter les répétitions.

Le modèle fournit une clé primaire stable, la cible (`game`, `server_id`, `player_uuid`, `player_name`, `requires_online`) et le texte `command`. Laissez `server_id` à `null` pour le serveur de livraison par défaut. Une commande qui exige la présence du joueur utilise `player_uuid`.

Créez chaque livraison en état `pending`, avec `attempts` à zéro. Prévoyez `status`, `attempts`, `link_server_id`, `lease_token`, `last_error` et les champs de date `available_at`, `lease_expires_at`, `created_at` et `delivered_at` avec leurs casts. La file gère les baux et les confirmations. Votre plugin décide quand créer une livraison et qui peut la recevoir.
