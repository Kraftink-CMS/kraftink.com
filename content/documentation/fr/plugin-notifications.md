# Ajouter des notifications à un plugin

Les services `App\Kraft\Notifications` fournissent les types de notification, les préférences des membres et la file de livraison. Votre plugin choisit les destinataires, textes et canaux, puis vérifie les accès aux ressources concernées.

## Déclarer un type

Déclarez les types dans le fournisseur de l’extension ou son service de notifications, sans lire les tables à cette étape. Les callbacks accèdent aux données lors du rendu et de la livraison :

```php
use App\Kraft\Notifications\NotificationRegistry;
use App\Models\Accounts\User;

app(NotificationRegistry::class)->register(
    owner: 'exemple',
    type: 'exemple.record.updated',
    label: 'exemple::messages.notifications.updated',
    render: fn (array $data, ?User $user): array => [
        'title' => __('exemple::messages.notifications.title'),
        'body' => '<p>'.e(__('exemple::messages.notifications.updated_body')).'</p>',
        'url' => route('plugins.exemple.public.records.show', $data['record_id']),
    ],
    visible: fn (?User $user, array $data, ?string $channel = null): bool =>
        app(RecordAccess::class)->canRead($user, $data['record_id']),
    channels: ['native', 'email'],
    defaults: ['native' => true, 'email' => false],
);
```

Dans cet exemple, `RecordAccess` est un service du plugin qui vérifie l’existence, l’état et les accès actuels de la ressource.

La signature complète est :

```php
public function register(
    string $owner,
    string $type,
    string $label,
    callable $render,
    callable $visible,
    array $channels = ['native', 'email'],
    array $defaults = ['native' => true, 'email' => false],
    ?callable $webhook = null,
): void;
```

`owner` identifie le paquet. Chaque `type` est unique et commence par cet identifiant suivi d’un point. `label` est la clé de traduction affichée dans les préférences. Les canaux membres sont `native` et `email`. `defaults` contient leurs valeurs booléennes initiales, désactivées si elles sont omises.

`render(array $data, ?User $user)` renvoie `title`, `body` et, si nécessaire, `url`. Le noyau nettoie le HTML et utilise la langue du destinataire selon les réglages du site, puis restaure la langue initiale. Les limites sont de 160 caractères pour le titre, 50 000 octets pour le corps et 500 caractères pour l’URL.

L’URL accepte un chemin commençant par `/`, une adresse HTTPS ou une adresse HTTP de même origine que le site. Les identifiants de connexion dans l’URL, antislashs et caractères de contrôle sont refusés. Les chemins relatifs deviennent absolus pour les e-mails et Discord.

`visible(?User $user, array $data, ?string $channel)` vérifie les accès et les réglages du plugin pour le canal demandé à chaque livraison. Tenez compte de l’état actuel de la ressource et de ses permissions. Le noyau contrôle aussi le compte et ses préférences. Une exception de contrôle ou de rendu marque la livraison en échec. Gardez les données privées hors des journaux.

Gardez ces callbacks en lecture seule, sans transaction ni appel réseau. La file gère les réservations et les envois.

Seules les extensions actives et valides peuvent livrer des notifications. La désactivation, la quarantaine ou le mode de secours suspendent leurs livraisons.

## Notifier un membre

```php
use App\Kraft\Notifications\Notifications;

$noticeId = app(Notifications::class)->notify(
    type: 'exemple.record.updated',
    user: $recipient,
    data: ['record_id' => $record->id],
    key: 'record:'.$record->id.':revision:'.$revision->id,
    channels: ['native', 'email'],
    resource: (string) $record->id,
);
```

La signature est :

```php
public function notify(
    string $type,
    User $user,
    array $data,
    string $key,
    ?array $channels = null,
    ?string $resource = null,
    bool $deferred = false,
): ?int;
```

Sans `channels`, les canaux du type sont utilisés. À la livraison, le service vérifie les préférences et l’état du compte. Les comptes bannis, anonymisés ou verrouillés à l’import sont exclus. L’e-mail exige une adresse vérifiée.

Le canal natif est immédiat par défaut. `notify()` renvoie l’identifiant de sa notification créée ou existante, sinon `null`. Avec `QUEUE_CONNECTION=sync`, l’e-mail est tenté après le commit. Un pilote asynchrone laisse les envois externes en attente. `deferred: true` reporte tous les canaux, y compris le natif, jusqu’au traitement de la file.

La déduplication associe le type, le destinataire, le canal et `key`. Choisissez une clé stable par événement et réutilisez-la lors des reprises. Elle ne remplace pas les données déjà enregistrées.

Limitez `data` aux références nécessaires et relisez les informations autorisées au rendu. Excluez secrets, jetons, URL de webhook et copies de contenus privés. Le JSON est limité à 16 384 octets, `key` à 240 octets et `resource` à 160 octets. La clé ne peut pas être vide.

Appelez `notify()` dans la transaction métier : les livraisons et notifications natives sont annulées avec elle en cas de rollback. Les envois externes attendent toujours le commit. En mode `sync`, le premier envoi fonctionne sans cron. Les envois différés et les reprises restent dans la file.

## Webhook Discord administré

Le plugin gère le webhook séparément des préférences individuelles `native` et `email`.

Déclarez un résolveur `webhook` avec le type :

```php
webhook: function (): ?array {
    if (!app(Settings::class)->get('exemple.notifications.discord_enabled', false)) {
        return null;
    }

    return [
        'configuration_id' => app(Settings::class)->get('exemple.notifications.discord_configuration'),
        'url' => app(Secrets::class)->get('exemple.notifications.discord_webhook'),
    ];
},
```

`Settings` et `Secrets` désignent `App\Kraft\Settings` et `App\Kraft\Secrets`. Le résolveur fournit la destination actuelle à la livraison. Changez `configuration_id`, limité à 80 octets, à chaque modification de destination : les envois liés à l’ancienne configuration seront annulés.

Pour ce canal, `visible` reçoit un utilisateur `null`. Vérifiez que la ressource peut être transmise au service externe et prévoyez un rendu sans membre.

```php
app(Notifications::class)->webhook(
    type: 'exemple.record.updated',
    data: ['record_id' => $record->id],
    key: 'record:'.$record->id.':revision:'.$revision->id,
    configurationId: $configurationId,
    resource: (string) $record->id,
);
```

Conservez l’URL dans `Secrets`, jamais dans `data`. Le service accepte les URL reconnues par `Notifications::validWebhook()`, vérifie la destination réseau et désactive les mentions automatiques. En mode `sync`, `webhook()` tente l’envoi après commit, sans cron. Chaque tentative revérifie la configuration et la visibilité.

## Traitement et reprises

Le planificateur du CMS traite les envois différés et les reprises chaque minute. Vous pouvez aussi lancer un lot manuellement :

```shell
php artisan notifications:deliver --limit=100
```

Depuis le code, `run(int $limit = 100, ?string $owner = null): int` traite de 1 à 500 livraisons, éventuellement limitées à votre paquet. `deliver(string $id): bool` traite un envoi précis. Tous les contrôles de livraison sont réappliqués.

| État | Signification |
| --- | --- |
| `pending` | En attente du traitement ou du délai de reprise |
| `sending` | Envoi externe réservé par un traitement |
| `delivered` | Notification native créée ou envoi externe accepté |
| `cancelled` | Compte, accès, préférence, extension ou destination indisponible |
| `failed` | Échec de rendu ou rejet explicite de l’envoi |
| `uncertain` | Le résultat externe ne peut pas être confirmé |

Discord `429` peut déclencher une reprise bornée. Une erreur réseau ou serveur ambiguë, ou un état `sending` dépassant dix minutes, conduit à `uncertain`, sans reprise automatique.

`retry(string $id, string $owner): void` remet un envoi `failed` ou `uncertain` en attente. Réservez cette action à une interface administrative avec permissions et confirmation. Vérifiez d’abord le résultat externe : une reprise SMTP ou HTTP peut produire un doublon.

`deliveries(?string $owner = null)` fournit la requête d’historique. Filtrez sur votre paquet et les droits de l’opérateur, sans exposer les données brutes ni les secrets.

## Préférences du membre

```php
use App\Kraft\Notifications\NotificationPreferences;

$preferences = app(NotificationPreferences::class);
$types = $preferences->for($user);
$preferences->save($user, [
    'exemple.record.updated' => ['native' => true, 'email' => false],
]);
```

`for(User $user): array` retourne les types actifs, leurs définitions et leurs `values` par canal. `enabled(User $user, array $type, string $channel): bool` utilise la préférence enregistrée, puis la valeur initiale du type.

`save(User $user, array $values): void` modifie uniquement les valeurs fournies. Les clés doivent désigner des types actifs et leurs canaux déclarés. Les valeurs suivent la validation booléenne Laravel. Les clés inconnues sont refusées.

L’interface native utilise une liste d’entrées pour préserver les identifiants contenant des points dans les formulaires :

```text
preferences[0][type] = exemple.record.updated
preferences[0][channels][native] = 1
preferences[0][channels][email] = 0
```

Les routes `account.notifications.preferences.edit` et `account.notifications.preferences.update` gèrent ces choix pour le membre connecté, dans les limites des réglages et accès du plugin.

## Nettoyage et confidentialité

Associez les livraisons à un `resource` stable pour nettoyer les notifications lors d’une suppression ou d’une anonymisation métier :

```php
app(Notifications::class)->forget('exemple', resource: (string) $record->id);
```

`forget(string $owner, ?string $resource = null, ?int $user = null): void` supprime les livraisons et notifications natives selon les filtres fournis, qui se cumulent. Appelez-la dans la transaction de suppression de la ressource : un envoi externe en cours provoque un HTTP 409 et conserve ainsi l’ensemble.

`dismiss(string $owner, ?string $resource = null, ?int $user = null): void` retire les notifications natives et annule les livraisons `pending`, avec le même refus si un envoi est en cours. L’historique reste conservé. Utilisez cette méthode pour la corbeille ou le retrait d’une mention, afin qu’une restauration ne réémette pas les anciens événements. Réservez `forget()` aux purges et suppressions de données personnelles.

`busy(string $owner, ?string $resource = null, ?int $user = null): bool` permet d’afficher un envoi en cours. Il ne remplace pas le contrôle de `forget()`.

Le noyau exporte les préférences et métadonnées de livraison du membre. L’anonymisation retire ses préférences, livraisons liées à `user_id` et notifications natives, même pour un paquet désactivé. Les webhooks étant sans destinataire membre, votre [gestionnaire de confidentialité](privacy-extensions.md) doit nettoyer les ressources concernées avec `forget(owner, resource: ...)`.

La suppression locale ne retire pas les e-mails ou messages déjà transmis. Documentez les données partagées avec les services externes et leur conservation.

La maintenance horaire nettoie les données `delivered` et `cancelled` après le délai configuré, de 90 jours par défaut, et retire leurs notifications natives expirées. Un envoi en attente expire après 90 jours, quel que soit ce réglage. Les identifiants et métadonnées restent conservés pour la déduplication. Les états `failed` et `uncertain` gardent leurs références pour une reprise. Prévisualisez ce nettoyage avec `kraft:maintenance --dry-run`. Les purges et anonymisations passent toujours par `forget()`.
