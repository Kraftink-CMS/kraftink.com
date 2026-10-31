# Créer un module de jeu

Un module fournit les règles d’identification et les connexions propres à un jeu. Il s’installe comme une extension indépendante. Le noyau utilise ses contrats sans connaître le jeu concret.

## Générer et enregistrer l’adaptateur

```shell
php artisan kraft:make game "Mon jeu" --id=mon-jeu
```

Complétez le paquet créé sous `extensions/installed/games/mon-jeu/`. Son manifeste déclare `type: "game"`, son namespace, son fournisseur et ses exigences. Le fournisseur inscrit un adaptateur `App\Kraft\Games\Contracts\GameAdapter` dans `GameRegistry` avec le même identifiant que le manifeste. Le modèle généré indique les méthodes à compléter : métadonnées, réglages, identités et conditions de connexion.

Le manifeste généré référence aussi les descriptions de `lang/fr/messages.php` et `lang/en/messages.php` avec `market.description`, sans recopier leurs textes. Remplacez cette présentation initiale par les fonctions réelles du module dans ses fichiers de langue. `market.name` permet un nom public traduit et `market.image` une image facultative, commune ou par langue, fournie dans `resources/market/`. Le nom, le type et la version restent définis dans le manifeste. Le [modèle de publication](game-release-template/README.md) détaille ces champs et les formats d’image.

Le fournisseur est dans `src/Providers/GameServiceProvider.php`, l'adaptateur dans `src/Adapters/GameAdapter.php`. Les services du jeu utilisent `src/Services`, avec `Services/Profiles` pour ses résolveurs de profils lorsque ce domaine est présent. Les implémentations des contrats de transport sont regroupées sous `src/Transports`. Ses contrôleurs et middleware utilisent `src/Http`, ses vues `resources/views`.

Le fournisseur généré inscrit l’adaptateur dans sa méthode `register()` :

```php
config(['games.adapters.mon-jeu' => GameAdapter::class]);
```

Gardez les règles de votre jeu dans l’adaptateur, et ses parcours spécifiques dans les routes et vues du paquet. Le fournisseur doit démarrer avant toute base installée. Voir le [cycle de vie](architecture-extensions.md) et le [modèle de publication](game-release-template/README.md).

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
    'mon-jeu',
    'mon-fournisseur',
    [
        'name' => 'Mon fournisseur',
        'description' => 'mon-jeu::avatars.description',
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
    'mon-jeu',
    'mon-fournisseur',
    MonFournisseur::class,
);
```

La classe implémente `AvatarProvider` avec `id()`, `metadata()` et `url(AvatarIdentity $identity): ?string`. `url()` valide l’identité et construit une URL HTTPS connue sans appel réseau. Les textes restent dans les traductions du paquet. L’inscription rend le fournisseur disponible sans le sélectionner automatiquement.

## Ajouter un transport

Implémentez `App\Kraft\Games\Transports\Transport` et enregistrez sa classe sous `games.transports.{game}.{connection}` dans le fournisseur. Ses métadonnées déclarent les capacités d’état et de commande, les champs, leurs règles de validation et l’aide traduite.

`execute()` doit appeler le rappel `writing` après authentification, immédiatement avant toute possibilité d’envoi de commande, et s’arrêter si ce rappel échoue. Le CMS peut ainsi enregistrer durablement le début d’envoi. Une interruption après ce point produit un résultat `uncertain`, sans réexécution automatique.

Le contrat facultatif `ProvidesOnlinePlayers::onlinePlayers(Server $server): array` fournit uniquement les identifiants canoniques réellement présents, obtenus par une interface authentifiée. Un compteur de ping public ne remplit pas ce contrat. Sans preuve de présence, les commandes `requires_online` restent en attente.

Les échanges externes restent hors des transactions SQL et sous la [garde d’opération](architecture-extensions.md#taches-et-operations-externes). Conservez identifiants, baux et résultats durables pour éviter un renvoi après une coupure. Voir les [API serveur](developpement-serveurs.md) pour les échanges et [KraftLink](developpement-kraftlink.md) pour un connecteur.

Testez les identifiants invalides, l’absence de service distant, la mauvaise authentification et les coupures avant puis après la possibilité d’écriture.
