# Relier un serveur avec KraftLink

KraftLink transmet l’état et les joueurs présents d’un serveur à KraftInk, puis récupère les commandes à exécuter. Il relie les serveurs Minecraft Java, les serveurs Bedrock sous Nukkit et les serveurs Hytale. Pour les autres connexions, consultez les [serveurs de jeu](games.md).

## Créer la liaison dans le CMS

1. Activez le jeu correspondant dans **Jeux et identités**.
2. Dans **Serveurs → Serveurs de jeux**, ajoutez un serveur avec le mode **KraftLink**.
3. Renseignez l’adresse et le port du serveur à relier, sans `https://`.
4. Dans **Gérer la liaison → Jeton de liaison**, créez un jeton et copiez-le. Il n’est affiché qu’une fois.

Créez une fiche et un jeton par serveur. Le choix du serveur par défaut sert aux récompenses sans destination explicite. Sur la fiche du [serveur principal](configuration.md#adresse-de-connexion-au-jeu), choisissez l’adresse et l’affichage du port à présenter aux joueurs. Son état fournit aussi le compteur du site. Les autres liaisons restent disponibles pour les récompenses.

Sur Velocity, les commandes s’exécutent sur le proxy. Pour agir sur un serveur Paper, installez KraftLink sur ce serveur et ciblez sa liaison.

### Relier un proxy et ses serveurs

Créez une fiche et un jeton distincts pour le proxy et pour chaque serveur de jeu qui utilise KraftLink. Chaque installation utilise son propre dossier de données. Une commande ou une opération de plugin destinée à une fiche est remise au connecteur de cette fiche.

KraftLink génère le fichier `instance-id` au premier démarrage. Conservez-le lors d’un redémarrage ou d’une mise à jour et laissez chaque nouvelle installation générer le sien. Si deux installations récentes utilisent le même jeton avec des identifiants différents, le CMS refuse la seconde avec le statut `409`. L’association expire après environ deux heures d’inactivité. La rotation du jeton permet de relier une nouvelle installation immédiatement.

La connexion rapide en jeu et AuthMe utilisent chacun la liaison choisie dans leurs réglages. Quand la connexion rapide est configurée sur Velocity, le proxy peut la proposer aux joueurs de ses serveurs. Les plugins installés sur ces serveurs peuvent utiliser leurs propres liaisons en parallèle.

## Installer le connecteur

Téléchargez le fichier universel `KraftLink.jar` ou la variante de votre plateforme depuis les [publications KraftLink](https://github.com/kraftink-cms/KraftLink/releases). À partir de KraftLink 1.4.1, le JAR universel couvre toutes les plateformes du tableau.

| Plateforme | Variante | Dossier d’installation |
| --- | --- | --- |
| Bukkit, Spigot, Paper, Folia | `KraftLink-Bukkit-VERSION.jar` | `plugins/` |
| Velocity | `KraftLink-Velocity-VERSION.jar` | `plugins/` |
| Hytale | `KraftLink-Hytale-VERSION.jar` | `mods/` |
| Fabric | `KraftLink-Fabric-VERSION.jar` | `mods/` |
| Forge | `KraftLink-Forge-VERSION.jar` | `mods/` |
| NeoForge | `KraftLink-NeoForge-VERSION.jar` | `mods/` |
| Sponge | `KraftLink-Sponge-VERSION.jar` | `mods/plugins/` |
| Cloudburst Nukkit | `KraftLink-Nukkit-VERSION.jar` | `plugins/` |

Arrêtez le serveur, déposez **un seul JAR KraftLink par instance**, puis redémarrez. La variante Bukkit cible Minecraft depuis la version 1.8.8. Le connecteur Hytale cible le serveur 0.7.4. Fabric, Forge et NeoForge ciblent Minecraft Java 26.1.2 et Java 25. Utilisez au minimum Fabric Loader 0.19.3 avec Fabric API 0.146.1, Forge 64.1.5 ou NeoForge 26.1.2.126 selon votre serveur. Sponge cible SpongeAPI 17 sur Minecraft Java 1.21.10 et Java 21.

Sur SpongeVanilla et SpongeForge, placez l’un des deux JAR dans `mods/plugins/`. Sur SpongeNeo, utilisez la variante Sponge pour que le chargeur NeoForge détecte KraftLink comme plugin Sponge.

Sur Nukkit, le JAR universel charge le plugin et peut signaler un avertissement en cherchant un pack de ressources Bedrock dans le manifeste Hytale. La variante Nukkit évite cet avertissement.

Pour un serveur Cloudburst Nukkit, choisissez **Minecraft Bedrock** dans **Jeux et identités** et installez la variante Nukkit. Elle requiert Nukkit API 1.1. Pour un serveur Bedrock Dedicated Server de Mojang, choisissez le mode **Ping** pour afficher son état. Le JAR Nukkit est un plugin pour Cloudburst Nukkit.

Ouvrez le `config.json` généré dans le dossier de données du connecteur. Sur Bukkit et Nukkit, il est dans `plugins/KraftLink/`. Sur Fabric, Forge, NeoForge et Sponge, il est dans `config/kraftlink/`. Modifiez ces champs sans retirer les autres réglages.

```json
{
    "cms_url": "https://communaute.example",
    "token": "JETON_DE_LA_FICHE_SERVEUR",
    "allowed_command_roots": ["say", "give"]
}
```

- `cms_url` est l’adresse HTTPS du site, avec son éventuel sous-dossier, sans `/admin` ni `/api/link`.
- `token` est le jeton de liaison, sans préfixe `Bearer`. Les clés d’accès aux comptes et soldes sont distinctes.
- `allowed_command_roots` contient les commandes autorisées, sans `/` ni arguments. Une liste vide désactive la récupération des commandes. Pour `minecraft:give`, ajoutez cette racine exacte.

Le serveur de jeu doit pouvoir joindre le site en HTTPS. Aucun port entrant KraftLink n’est à ouvrir. Rechargez avec `kraftlink reload` dans la console, puis vérifiez `kraftlink status` : l’état attendu est `connected`.

## Activer la vérification Bedrock

Les joueurs Bedrock qui rejoignent un serveur Minecraft Java via Geyser peuvent vérifier leur compte sur Bukkit, Paper, Folia ou Velocity avec KraftLink et Floodgate. Sur un réseau Velocity, vous pouvez installer les deux plugins sur le proxy pour que les joueurs puissent valider depuis les serveurs du réseau. Le préfixe Floodgate doit correspondre à celui renseigné dans le CMS.

Choisissez la **Commande de vérification Bedrock** dans les réglages Minecraft du CMS.

- `/link` est proposée par défaut. KraftLink l’enregistre au démarrage sur Velocity et les versions compatibles de Paper et Folia, si le nom est libre.
- `/kraftlink link` convient si le serveur ne prend pas en charge le raccourci ou si un autre plugin utilise déjà `/link`.

## Vérifier les comptes sur Minecraft Bedrock

Activez l’authentification Xbox sur votre serveur Cloudburst Nukkit et reliez-le au site avec KraftLink. Une fois le serveur connecté, ouvrez **Jeux et identités**, activez **Vérification en jeu** dans les réglages **Minecraft Bedrock** et sélectionnez-le dans **Serveur de vérification**.

Pour associer son profil, le membre rejoint ce serveur avec son compte Xbox et exécute `/kraftlink link CODE` avec le code affiché sur le site. Le site lui demande ensuite de confirmer le gamertag détecté. Le mode **Ping** du Bedrock Dedicated Server affiche l’état du serveur.

Mettez à jour KraftLink sur chaque serveur Nukkit qui doit recevoir des commandes destinées à un profil vérifié. Ces commandes restent en attente tant que le connecteur ne peut pas contrôler le XUID du joueur.

## Synchroniser les skins Minecraft Java

Installez SkinsRestorer 15.12.6 ou une version compatible de la branche 15 sur un serveur Bukkit, Paper ou Folia qui dispose de KraftLink. Dans **Extensions → Skins et capes**, vérifiez l’intégration et autorisez l’application automatique pour ce serveur. Les membres enregistrent leur skin dans leur profil, puis rejoignent le serveur avec leur compte Minecraft Java vérifié. [Utiliser les skins et capes](skins.md)

## Régler les intervalles

Les intervalles de `config.json` sont exprimés en secondes. KraftLink regroupe les opérations qui arrivent à échéance ensemble.

| Réglage | Opération | Par défaut | Plage |
| --- | --- | --- | --- |
| `heartbeat_seconds` | Mise à jour de l’état du serveur | 30 s | 10 à 3 600 s |
| `poll_seconds` | Récupération des commandes | 5 s | 1 à 300 s |
| `sign_in_poll_seconds` | Récupération des demandes de connexion rapide en jeu | 3 s | 1 à 30 s |

`operation_poll_seconds` permet de remplacer l’intervalle d’une opération ajoutée par une extension. Indiquez son nom et une valeur entre 1 et 300, par exemple `"operation_poll_seconds": {"example.status": 20}`. [Protocole et intégration des extensions](developpement-kraftlink.md)

## Tester une commande

Sur un serveur Minecraft relié par KraftLink, autorisez `say`, puis envoyez `say KraftLink est connecté` depuis **Gérer la liaison → Console différée**, sans joueur ni attente de connexion. Vérifiez le résultat dans le jeu et l’historique du panneau.

Pour une récompense, choisissez le serveur destinataire et un joueur de test. `{player}` et `{uuid}` utilisent son identité de jeu. L’option d’attente conserve la commande jusqu’à sa présence sur ce serveur.

## Livraison en échec ou incertaine

Vérifiez l’adresse du site, le jeton, la liste des commandes autorisées et leur disponibilité sur la plateforme. Si le jeton est perdu, créez-en un nouveau puis remplacez-le dans le connecteur.

Une confirmation manquante peut suivre une commande déjà exécutée. Vérifiez le compte du joueur et les journaux avant relance. Conservez `commands.jsonl` dans les sauvegardes du connecteur.

`kraftlink uncertain` liste les commandes incertaines. Après vérification, `kraftlink resolve IDENTIFIANT delivered` confirme une exécution constatée et `kraftlink resolve IDENTIFIANT retry` autorise un nouvel essai. Une relance peut doubler une récompense déjà reçue.
