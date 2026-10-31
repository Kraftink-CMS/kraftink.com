# Plugin notifications

The registry defines notifications and member preferences. The delivery service handles channels and retries. Your plugin selects recipients and checks their current access.

## Declaring a type

Register the type from the provider without reading its tables:

```php
use App\Kraft\Notifications\NotificationRegistry;
use App\Models\Accounts\User;

app(NotificationRegistry::class)->register(
    owner: 'example',
    type: 'example.record.updated',
    label: 'example::messages.notifications.updated',
    render: fn (array $data, ?User $user): array => [
        'title' => __('example::messages.notifications.title'),
        'body' => '<p>'.e(__('example::messages.notifications.updated_body')).'</p>',
        'url' => route('plugins.example.public.records.show', $data['record_id']),
    ],
    visible: fn (?User $user, array $data, ?string $channel = null): bool =>
        app(RecordAccess::class)->canRead($user, $data['record_id']),
    channels: ['native', 'email'],
    defaults: ['native' => true, 'email' => false],
);
```

`owner` identifies the package. `type` starts with that identifier followed by a dot. `label` is the translation key shown in preferences. `channels` accepts `native` and `email`, with initial values in `defaults`.

`render` returns `title`, `body` and an optional URL. The CMS uses the recipient’s language and cleans HTML. Limits are 160 characters for titles, 50,000 bytes for bodies and 500 characters for URLs.

`visible` rechecks access and resource state on every delivery. The channel can be passed as a third argument. Keep callbacks read-only without network calls. Exceptions fail the delivery.

## Sending

Call `notify()` inside the business transaction:

```php
use App\Kraft\Notifications\Notifications;

$noticeId = app(Notifications::class)->notify(
    type: 'example.record.updated',
    user: $recipient,
    data: ['record_id' => $record->id],
    key: 'record:'.$record->id.':revision:'.$revision->id,
    channels: ['native', 'email'],
    resource: (string) $record->id,
);
```

Keep `key` stable per event. Deduplication combines type, recipient, channel and key. `data` contains references to reread at render time without secrets or private content copies. Limits are 16,384 bytes for data, 240 for keys and 160 for `resource`.

Without `channels`, the service uses the type’s channels. `notify()` returns the created or existing native identifier, otherwise `null`. Native delivery is immediate. With the `sync` driver, email is attempted after commit. `deferred: true` postpones all channels until queue processing.

Preferences and account state are checked on delivery. Email requires a verified address. An inactive extension suspends its deliveries.

## Discord webhook

Add a `webhook` resolver to the definition:

```php
webhook: function (): ?array {
    if (!app(Settings::class)->get('example.notifications.discord_enabled', false)) {
        return null;
    }

    return [
        'configuration_id' => app(Settings::class)->get('example.notifications.discord_configuration'),
        'url' => app(Secrets::class)->get('example.notifications.discord_webhook'),
    ];
},
```

`Settings` and `Secrets` are CMS services. Change `configuration_id` whenever the destination changes to cancel old deliveries. For this channel, `visible` receives a null user and must allow external sharing.

```php
app(Notifications::class)->webhook(
    type: 'example.record.updated',
    data: ['record_id' => $record->id],
    key: 'record:'.$record->id.':revision:'.$revision->id,
    configurationId: $configurationId,
    resource: (string) $record->id,
);
```

Keep the URL in `Secrets`, never in `data`. `Notifications::validWebhook()` validates accepted URLs. Automatic mentions are disabled.

## Tracking and retries

The scheduler processes pending deliveries. `run($limit, $owner)` handles a batch for your package and `deliver($id)` handles one delivery. `deliveries($owner)` provides a history query to filter by operator access.

| State | Meaning |
| --- | --- |
| `pending` | Waiting |
| `sending` | Reserved for sending |
| `delivered` | Notification created or send accepted |
| `cancelled` | Access, preference or destination unavailable |
| `failed` | Rejection or rendering failure |
| `uncertain` | External effect unconfirmed |

`retry($id, $owner)` puts a failed or uncertain result back into pending. Restrict this action to an administration interface and check the external result first to avoid duplicates.

## Preferences and deletion

```php
use App\Kraft\Notifications\NotificationPreferences;

$preferences = app(NotificationPreferences::class);
$types = $preferences->for($user);
$preferences->save($user, [
    'example.record.updated' => ['native' => true, 'email' => false],
]);
```

`for($user)` lists active types and values. `save()` changes only supplied choices and rejects unknown keys. Routes `account.notifications.preferences.edit` and `.update` already provide the member screen.

Call `dismiss($owner, resource: $id)` to remove a notification and cancel pending deliveries while retaining history, or `forget($owner, resource: $id)` for purging. Call them in the transaction, they refuse while an external send is in progress. A `user` filter is also available.

The [privacy handler](privacy-extensions.md) also cleans up webhooks linked to member resources. Local deletion does not remove messages already sent externally.
