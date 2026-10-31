# Créer un module de jeu

Un module de jeu fournit ses règles d’identité, avatars et connexions serveur. Son code reste dans un paquet indépendant, organisé comme un plugin.

## Générer et enregistrer l’adaptateur

```shell
php artisan kraft:make game "My game" --id=my-game
```

Complétez le paquet créé sous `extensions/installed/games/my-game/`. Son manifeste déclare `type: "game"`, son namespace, son fournisseur et ses exigences. L’adaptateur implémente `App\Kraft\Games\Contracts\GameAdapter` avec le même identifiant que le manifeste. Le modèle généré indique les méthodes à compléter : métadonnées, réglages, identités et conditions de connexion.

Renseignez la présentation et les traductions du manifeste comme pour les autres [extensions distribuées](extensions-publication.md).

Le fournisseur est dans `src/Providers/GameServiceProvider.php`, l'adaptateur dans `src/Adapters/GameAdapter.php`. Les services du jeu utilisent `src/Services`, avec `Services/Profiles` pour ses résolveurs de profils lorsque ce domaine est présent. Les implémentations des contrats de transport sont regroupées sous `src/Transports`. Ses contrôleurs et middleware utilisent `src/Http`, ses vues `resources/views`.

Le fournisseur généré inscrit l’adaptateur dans sa méthode `register()` :

```php
config(['games.adapters.my-game' => GameAdapter::class]);
```

Gardez les règles de votre jeu dans l’adaptateur, et ses parcours spécifiques dans les routes et vues du paquet. Le fournisseur doit démarrer avant toute base installée. Les dépendances et migrations suivent le [contrat commun](architecture-extensions.md).

## Profils, avatars et identités

Les contrats facultatifs répondent à des besoins distincts :

| Contrat | Usage |
| --- | --- |
| `ResolvesPublicProfiles` | Rechercher un profil public en lecture seule |
| `PublicProfileAvailability` | Indiquer si cette recherche est utilisable |
| `ProvidesCommandIdentity` | Fournir les identifiants canoniques d’une cible liée |
| `ProvidesGuestIdentity` | Valider et normaliser une cible sans compte |

Les contrats se trouvent sous `App\Kraft\Games\Contracts`. `commandIdentity(string $uuid, ?string $username): array` et `guestIdentity(string $input): array` renvoient au minimum `uuid` et `player`. Un profil public ou une saisie invitée ne prouve pas la possession d’un compte. Les valeurs substituées dans une commande doivent refuser espaces, contrôles et caractères de commande. Préservez la casse d’un identifiant opaque.

Pour un fournisseur qui construit une URL à partir d’un UUID, déclarez ses données dans le fournisseur du module sans créer une classe supplémentaire :

```php
app(\App\Kraft\Auth\Avatars\AvatarProviders::class)->registerUrl(
    'my-game',
    'my-provider',
    [
        'name' => 'My provider',
        'description' => 'my-game::avatars.description',
        'website' => 'https://avatars.example.com/',
    ],
    'https://avatars.example.com/avatar/{identity}/128',
    usernamePattern: '/^[A-Za-z0-9_]{3,16}$/D',
);
```

`{identity}` reçoit l’UUID normalisé sans tirets. `usernamePattern` est facultatif et autorise un pseudo validé lorsque l’UUID manque ou est invalide. Sans ce paramètre, seul un UUID valide est accepté. Le modèle utilise HTTPS et garde un hôte fixe. Les métadonnées contiennent des chaînes, avec un nom, une clé de description traduite et un site facultatif. `default: true` désigne le choix par défaut du jeu sans activer les avatars.

Pour une logique différente, comme les identifiants Steam, inscrivez une classe dédiée :

```php
app(\App\Kraft\Auth\Avatars\AvatarProviders::class)->register(
    'my-game',
    'my-provider',
    MyAvatarProvider::class,
);
```

La classe implémente `AvatarProvider` avec `id()`, `metadata()` et `url(AvatarIdentity $identity): ?string`. `url()` valide l’identité et construit une URL HTTPS connue sans appel réseau. Les textes restent dans les traductions du paquet. L’inscription rend le fournisseur disponible sans le sélectionner automatiquement.

## Ajouter un transport

Implémentez `App\Kraft\Games\Transports\Transport` et enregistrez sa classe sous `games.transports.{game}.{connection}` dans le fournisseur. Ses métadonnées déclarent les capacités d’état et de commande, les champs, leurs règles de validation et l’aide traduite.

`execute()` doit appeler le rappel `writing` après authentification, immédiatement avant toute possibilité d’envoi de commande, et s’arrêter si ce rappel échoue. Le CMS peut ainsi enregistrer durablement le début d’envoi. Une interruption après ce point produit un résultat `uncertain`, sans réexécution automatique.

Le contrat facultatif `ProvidesOnlinePlayers::onlinePlayers(Server $server): array` fournit uniquement les identifiants canoniques réellement présents, obtenus par une interface authentifiée. Un compteur de ping public ne remplit pas ce contrat. Sans preuve de présence, les commandes `requires_online` restent en attente.

Les échanges externes restent hors des transactions SQL et sous la [garde d’opération](architecture-extensions.md#taches-et-operations-externes). Conservez identifiants, baux et résultats durables pour éviter un renvoi après une coupure. Le [protocole de liaison](developpement-kraftlink.md) permet de créer un connecteur qui récupère ses commandes depuis le jeu.

Testez les identifiants invalides, l’absence de service distant, la mauvaise authentification et les coupures avant puis après la possibilité d’écriture.
