# Réagir aux événements des plugins

Les plugins peuvent publier des événements métier versionnés et écouter ceux des autres extensions. Le noyau fournit le transport générique ; chaque plugin reste propriétaire de ses événements et de ses données.

## Déclarer et publier

Depuis `boot()` du fournisseur du plugin, déclarez les versions prises en charge. Plusieurs déclarations peuvent être regroupées dans une méthode privée du fournisseur :

```php
use App\Kraft\Events\PluginEvents;

app(PluginEvents::class)->define('example.completed', 1);
```

Le nom commence par l'identifiant du plugin, suivi d'au moins un segment séparé par un point. La déclaration d'une même version est idempotente. Le registre expose `definitions()` sous la forme `['example.completed' => [1]]`.

Publiez l'événement dans la transaction qui valide le résultat :

```php
DB::transaction(function () use ($record) {
    DB::table('example__records')->where('id', $record->id)->update(['completed' => true]);
    app(PluginEvents::class)->publish(
        'example.completed',
        ['record_id' => $record->id, 'user_id' => $record->user_id],
        'example.completed:'.$record->id,
        version: 1,
    );
});
```

Les abonnés sont appelés uniquement après validation de la transaction externe. Une transaction annulée, y compris après validation d'une transaction imbriquée, ne diffuse rien. Sans transaction ouverte, la diffusion est immédiate. Le transport suit la connexion de base par défaut du CMS.

L'identifiant représente le résultat métier, pas la requête HTTP ou le callback d'un prestataire. Lorsqu'un résultat peut être reçu plusieurs fois, le plugin vérifie d'abord sa transition ou sa preuve déjà enregistrée. Un remboursement partiel possède son propre identifiant, distinct de celui de la commande.

## Écouter un événement

```php
use App\Events\PluginEvent;
use App\Kraft\Events\PluginEvents;

app(PluginEvents::class)->listen('example.completed', function (PluginEvent $event): void {
    app(MyProgress::class)->record($event->data['user_id'], $event->id);
}, version: 1, id: 'my-plugin.progress');
```

Un abonnement peut être enregistré avant la déclaration de l'événement. Déclarez la dépendance obligatoire dans le manifeste lorsqu'elle est nécessaire ; une intégration facultative doit tolérer l'absence de son fournisseur. Un identifiant d'abonné explicite permet un enregistrement idempotent et rend les erreurs identifiables.

`listen('*', $listener, version: 1)` écoute tous les événements de cette version. Une nouvelle version nécessite un abonnement explicite. L'enveloppe immuable `PluginEvent` expose `id`, `name`, `version`, `data` et `occurredAt`, une date ISO 8601. Elle est sérialisable en JSON avec la clé `occurred_at`.

Les données acceptent uniquement des valeurs scalaires, `null` et des tableaux, dans une limite de 64 Kio et de seize niveaux d'imbrication. Transmettez des identifiants et les valeurs nécessaires au résultat. Ne transmettez ni modèle mutable, service, secret, adresse IP, corps de message privé ni objet de requête.

L'événement ne donne aucun droit de lecture supplémentaire. Un abonné qui expose une discussion, un ticket ou une commande doit vérifier les droits actuels de son destinataire, même si la ressource était lisible lors de l'émission.

## Erreurs et garanties

Une exception d'abonné est isolée : les autres abonnés continuent et la transaction métier déjà validée conserve son résultat. Un journal technique contient le nom de l'événement, son identifiant, sa version, l'abonné et la classe d'exception, sans sa charge utile. `PluginEvents::failures()` expose les cent derniers échecs du processus courant.

Ce transport est synchrone après validation et n'est pas une file persistante. Il ne rejoue pas automatiquement un abonné en échec et ne garantit pas la diffusion en cas d'arrêt du processus entre le commit et son callback. Pour une tâche longue ou un envoi externe, l'abonné doit rapidement enregistrer une tâche persistante idempotente. Utilisez l'identifiant de l'événement et sa version comme clé de déduplication. Les envois financiers et les livraisons métier conservent leurs propres mécanismes de reprise.

## Événements fournis, version 1

| Événement | Déclenchement et identifiant | Données |
| --- | --- | --- |
| `shop.order.paid` | Première confirmation d'un paiement validé ; `shop.order.paid:{order_id}` | `order_id`, `user_id`, `guest_id`, `amount_minor`, `currency`, `provider`, `requires_review` |
| `shop.refund.succeeded` | Remboursement confirmé ; `shop.refund.succeeded:{refund_id}` | `refund_id`, `order_id`, `user_id`, `guest_id`, `amount_minor`, `currency`, `full` |
| `vote.confirmed` | Première preuve de vote acceptée, membre ou invité ; `vote.confirmed:{vote_id}` | `vote_id`, `site_id`, `user_id`, `guest_id`, `points`, `game`, `server_id` |
| `forum.topic.published` | Création d'un sujet ; `forum.topic.published:{topic_id}` | `topic_id`, `post_id`, `category_id`, `user_id` |
| `forum.post.published` | Création du premier message ou d'une réponse ; `forum.post.published:{post_id}` | `topic_id`, `post_id`, `category_id`, `user_id`, `is_topic_start` |
| `support.ticket.created` | Ticket créé ; `support.ticket.created:{ticket_event_id}` | `ticket_id`, `ticket_event_id`, `user_id`, `actor_id`, `category_id`, `automatic` |
| `support.ticket.replied` | Réponse visible du propriétaire ou d'un agent ; `support.ticket.replied:{ticket_event_id}` | Mêmes champs que `support.ticket.created` |
| `support.ticket.resolved` | Passage à l'état fermé, manuel ou automatique ; `support.ticket.resolved:{ticket_event_id}` | Mêmes champs que `support.ticket.created` |

Un paiement confirmé peut encore nécessiter une revue ou une livraison : `shop.order.paid` ne confirme pas l'attribution d'avantages. `amount_minor` correspond à la confirmation du prestataire, tandis que le montant du remboursement comprend ses sources de financement. Un vote confirmé ne prouve pas la livraison de ses commandes. Les notes internes Support, les changements d'état fermé vers fermé, les imports historiques et les callbacks déjà traités ne produisent pas ces événements.
