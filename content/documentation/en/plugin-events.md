# Plugin events

Use `PluginEvents` to publish a business result or react to another plugin’s result. Events are versioned and dispatched after transaction commit.

## Declaring and publishing

Declare the event in the provider’s `boot()` method:

```php
use App\Kraft\Events\PluginEvents;

app(PluginEvents::class)->define('example.completed', 1);
```

The name starts with the plugin identifier followed by a dot. Publish the result inside the business transaction:

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

A rollback dispatches nothing. Without a transaction, dispatch is immediate. The identifier represents a stable business result, such as an order or refund, and stays the same on replay.

## Listening

```php
use App\Events\PluginEvent;
use App\Kraft\Events\PluginEvents;

app(PluginEvents::class)->listen('example.completed', function (PluginEvent $event): void {
    app(MyProgress::class)->record($event->data['user_id'], $event->id);
}, version: 1, id: 'my-plugin.progress');
```

The `PluginEvent` envelope exposes `id`, `name`, `version`, `data` and `occurredAt`. Subscriptions may precede declarations. Declare a dependency or optional integration in the manifest as appropriate.

Data accepts scalars, `null` and arrays, up to 64 KiB and sixteen levels. Send required references without objects, secrets or copies of private content. Listeners recheck access before exposing a resource.

The transport is synchronous and does not replay failed listeners. An exception does not interrupt other listeners or undo a committed result. For durable processing, promptly record an idempotent persistent task using the event identifier and version.

## Available events

| Event | Trigger and identifier | Data |
| --- | --- | --- |
| `shop.order.paid` | First confirmed payment, `shop.order.paid:{order_id}` | `order_id`, `user_id`, `guest_id`, `amount_minor`, `currency`, `provider`, `requires_review` |
| `shop.refund.succeeded` | Confirmed refund, `shop.refund.succeeded:{refund_id}` | `refund_id`, `order_id`, `user_id`, `guest_id`, `amount_minor`, `currency`, `full` |
| `vote.confirmed` | First accepted member or guest vote, `vote.confirmed:{vote_id}` | `vote_id`, `site_id`, `user_id`, `guest_id`, `points`, `game`, `server_id` |
| `forum.topic.published` | Topic created, `forum.topic.published:{topic_id}` | `topic_id`, `post_id`, `category_id`, `user_id` |
| `forum.post.published` | First post or reply created, `forum.post.published:{post_id}` | `topic_id`, `post_id`, `category_id`, `user_id`, `is_topic_start` |
| `support.ticket.created` | Ticket created, `support.ticket.created:{ticket_event_id}` | `ticket_id`, `ticket_event_id`, `user_id`, `actor_id`, `category_id`, `automatic` |
| `support.ticket.replied` | Visible owner or agent reply, `support.ticket.replied:{ticket_event_id}` | Same fields as `support.ticket.created` |
| `support.ticket.resolved` | Manual or automatic closure, `support.ticket.resolved:{ticket_event_id}` | Same fields as `support.ticket.created` |

A confirmed payment or vote does not prove benefit delivery. Historical imports, processed callbacks and internal Support notes do not emit these events.
