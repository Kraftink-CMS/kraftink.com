# Protocole de liaison des serveurs

Pour écrire un connecteur compatible, utilisez le protocole de livraison ci-dessous. Le jeton se crée dans la fiche du serveur, comme décrit dans [KraftLink](kraftlink.md). Les [accès aux comptes et soldes](developpement-serveurs.md) utilisent une clé distincte.

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
