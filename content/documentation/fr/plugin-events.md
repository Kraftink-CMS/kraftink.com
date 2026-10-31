# Événements des plugins

Utilisez `PluginEvents` pour publier un résultat métier ou réagir à celui d’un autre plugin. Les événements sont versionnés et diffusés après validation de la transaction.

## Déclarer et publier

Déclarez l’événement dans `boot()` du fournisseur :

```php
use App\Kraft\Events\PluginEvents;

app(PluginEvents::class)->define('example.completed', 1);
```

Le nom commence par l’identifiant du plugin suivi d’un point. Publiez le résultat dans la transaction métier :

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

Un rollback ne diffuse rien. Sans transaction, la diffusion est immédiate. L’identifiant désigne un résultat métier stable, par exemple une commande ou un remboursement, et reste identique lors d’un rejeu.

## Écouter

```php
use App\Events\PluginEvent;
use App\Kraft\Events\PluginEvents;

app(PluginEvents::class)->listen('example.completed', function (PluginEvent $event): void {
    app(MyProgress::class)->record($event->data['user_id'], $event->id);
}, version: 1, id: 'my-plugin.progress');
```

L’enveloppe `PluginEvent` expose `id`, `name`, `version`, `data` et `occurredAt`. Un abonnement peut précéder la déclaration. Déclarez une dépendance ou une intégration facultative dans le manifeste selon votre besoin.

Les données acceptent des valeurs scalaires, `null` et des tableaux, dans la limite de 64 Kio et seize niveaux. Transmettez les références nécessaires, sans objet, secret ou copie de contenu privé. L’abonné revérifie les droits avant d’exposer une ressource.

Le transport est synchrone et ne rejoue pas un abonné en échec. Une exception n’interrompt pas les autres abonnés ni le résultat métier validé. Pour un traitement durable, enregistrez rapidement une tâche persistante idempotente avec l’identifiant et la version de l’événement.

## Événements disponibles

| Événement | Déclenchement et identifiant | Données |
| --- | --- | --- |
| `shop.order.paid` | Première confirmation d'un paiement validé, `shop.order.paid:{order_id}` | `order_id`, `user_id`, `guest_id`, `amount_minor`, `currency`, `provider`, `requires_review` |
| `shop.refund.succeeded` | Remboursement confirmé, `shop.refund.succeeded:{refund_id}` | `refund_id`, `order_id`, `user_id`, `guest_id`, `amount_minor`, `currency`, `full` |
| `vote.confirmed` | Première preuve de vote acceptée, membre ou invité, `vote.confirmed:{vote_id}` | `vote_id`, `site_id`, `user_id`, `guest_id`, `points`, `game`, `server_id` |
| `forum.topic.published` | Création d'un sujet, `forum.topic.published:{topic_id}` | `topic_id`, `post_id`, `category_id`, `user_id` |
| `forum.post.published` | Création du premier message ou d'une réponse, `forum.post.published:{post_id}` | `topic_id`, `post_id`, `category_id`, `user_id`, `is_topic_start` |
| `support.ticket.created` | Ticket créé, `support.ticket.created:{ticket_event_id}` | `ticket_id`, `ticket_event_id`, `user_id`, `actor_id`, `category_id`, `automatic` |
| `support.ticket.replied` | Réponse visible du propriétaire ou d'un agent, `support.ticket.replied:{ticket_event_id}` | Mêmes champs que `support.ticket.created` |
| `support.ticket.resolved` | Passage à l'état fermé, manuel ou automatique, `support.ticket.resolved:{ticket_event_id}` | Mêmes champs que `support.ticket.created` |

Un paiement ou un vote confirmé ne prouve pas la livraison de ses avantages. Les imports historiques, callbacks déjà traités et notes internes Support ne produisent pas ces événements.
