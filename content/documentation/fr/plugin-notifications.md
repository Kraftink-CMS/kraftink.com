# Notifications de plugin

Le registre définit les notifications et les préférences proposées aux membres. Le service de livraison gère les canaux et les reprises. Votre plugin choisit les destinataires et vérifie leurs droits actuels.

## Déclarer un type

Enregistrez le type depuis le fournisseur sans lire ses tables :

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

`owner` identifie le paquet. Le `type` commence par cet identifiant suivi d’un point. `label` est la clé de traduction affichée dans les préférences. `channels` accepte `native` et `email`, avec leurs valeurs initiales dans `defaults`.

`render` renvoie `title`, `body` et l’URL facultative. Le CMS utilise la langue du destinataire et nettoie le HTML. Les limites sont de 160 caractères pour le titre, 50 000 octets pour le corps et 500 caractères pour l’URL.

`visible` relit les droits et l’état de la ressource à chaque livraison. Le canal peut être fourni en troisième argument. Ces callbacks restent en lecture seule, sans appel réseau. Une exception marque l’envoi en échec.

## Envoyer

Appelez `notify()` dans la transaction métier :

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

`key` reste stable pour un événement. La déduplication combine type, destinataire, canal et clé. `data` contient des références à relire au rendu, sans secret ni copie de contenu privé. Limites : 16 384 octets pour les données, 240 pour la clé et 160 pour `resource`.

Sans `channels`, le service utilise ceux du type. `notify()` renvoie l’identifiant natif créé ou existant, sinon `null`. Le natif est immédiat. Avec le pilote `sync`, l’e-mail est tenté après commit. `deferred: true` reporte tous les canaux au traitement de la file.

Les préférences et l’état du compte sont vérifiés à la livraison. L’e-mail exige une adresse vérifiée. Une extension inactive suspend ses livraisons.

## Webhook Discord

Ajoutez un résolveur `webhook` à la définition :

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

`Settings` et `Secrets` sont les services du CMS. Changez `configuration_id` à chaque changement de destination pour annuler les anciens envois. Pour ce canal, `visible` reçoit un utilisateur nul et doit autoriser le partage externe.

```php
app(Notifications::class)->webhook(
    type: 'example.record.updated',
    data: ['record_id' => $record->id],
    key: 'record:'.$record->id.':revision:'.$revision->id,
    configurationId: $configurationId,
    resource: (string) $record->id,
);
```

L’URL reste dans `Secrets`, jamais dans `data`. `Notifications::validWebhook()` valide les URL acceptées. Les mentions automatiques sont désactivées.

## Suivi et reprises

Le planificateur traite les envois en attente. `run($limit, $owner)` traite un lot pour votre paquet et `deliver($id)` un envoi précis. `deliveries($owner)` fournit la requête d’historique à filtrer selon les droits de l’opérateur.

| État | Sens |
| --- | --- |
| `pending` | En attente |
| `sending` | Envoi réservé |
| `delivered` | Notification créée ou envoi accepté |
| `cancelled` | Accès, préférence ou destination indisponible |
| `failed` | Rejet ou échec de rendu |
| `uncertain` | Effet externe non confirmé |

`retry($id, $owner)` remet un échec ou un résultat incertain en attente. Réservez cette action à une interface administrative et vérifiez d’abord le résultat externe pour éviter les doublons.

## Préférences et suppression

```php
use App\Kraft\Notifications\NotificationPreferences;

$preferences = app(NotificationPreferences::class);
$types = $preferences->for($user);
$preferences->save($user, [
    'example.record.updated' => ['native' => true, 'email' => false],
]);
```

`for($user)` donne les types actifs et leurs valeurs. `save()` modifie les seuls choix fournis et refuse les clés inconnues. Les routes `account.notifications.preferences.edit` et `.update` fournissent déjà l’écran membre.

Appelez `dismiss($owner, resource: $id)` pour retirer une notification et annuler les envois en attente en conservant l’historique, ou `forget($owner, resource: $id)` pour une purge. Ces appels se font dans la transaction et refusent si un envoi externe est en cours. Un filtre `user` est aussi disponible.

Le [gestionnaire de confidentialité](privacy-extensions.md) nettoie aussi les webhooks liés aux ressources du membre. Une suppression locale ne retire pas les messages déjà transmis à l’extérieur.
