# Configurer le jeu et les serveurs

Choisissez le jeu de la communauté dans **Jeux et identités**, puis ajoutez ses serveurs dans **Serveurs**. L’installation d’un module le rend disponible sans changer le jeu utilisé. Un seul jeu est utilisé à la fois. Changer de jeu conserve les anciennes identités et connexions, sans les convertir vers le nouveau jeu.

## Choisir la vérification des joueurs

Un profil déclaré ou trouvé dans un annuaire public ne prouve pas sa possession. Avant d’exiger une identité vérifiée pour accéder au site, vérifiez votre propre compte et testez le parcours avec un membre.

Pour **Minecraft**, la vérification d’existence d’un profil Mojang et la preuve de possession avec Microsoft sont deux règles différentes. La seconde demande une [application Microsoft configurée](oauth.md), puis l’association du profil depuis le compte du membre. Une connexion Microsoft générique ne suffit pas à prouver la possession du jeu.

Pour les joueurs **Geyser/Floodgate**, activez cette compatibilité et reprenez exactement le `username-prefix` de Floodgate : point, plus ou tiret. Un nom Bedrock utilise ce préfixe et ses espaces deviennent des traits de soulignement. Cette recherche publique ne prouve pas la possession d’un compte Xbox et ne remplace pas la vérification Minecraft Java. Avec Global Linking, utilisez le profil effectivement présenté au serveur.

Pour les jeux compatibles **Steam**, activez le fournisseur dans **Connexions externes**. OpenID vérifie le compte sans clé d’application. Une clé Web API facultative permet de récupérer le nom public et les avatars. Steam ne transmet pas l’e-mail et sa connexion ne prouve pas la possession du jeu. FiveM utilise ici l’identité Steam. Les identifiants Cfx.re ou Rockstar demandent une intégration dédiée.

Pour **Hytale**, le profil reste déclaré. La recherche PlayerDB et les avatars Crafthead sont des services tiers facultatifs, à activer séparément. Les autres jeux demandent l’identifiant de plateforme indiqué dans le formulaire. Un nom de personnage RP ou un nom d’affichage libre ne remplace pas cet identifiant.

Les fournisseurs d’avatars sont facultatifs. Ils reçoivent l’identifiant public du joueur et l’adresse IP du navigateur. Une image envoyée par le membre reste prioritaire lorsqu’elle est autorisée.

## Préparer la connexion du serveur

Le module du site n’active pas la console distante du serveur de jeu. Configurez-la d’abord chez l’hébergeur, puis reportez ses ports et identifiants dans KraftInk.

| Serveur | À préparer côté jeu |
| --- | --- |
| Minecraft Java | Port de jeu pour l’état, avec `enable-rcon`, `rcon.port` et `rcon.password` pour RCON, ou [KraftLink](kraftlink.md) pour les livraisons avec présence du joueur |
| Garry’s Mod, CS2, TF2, ARK: Survival Evolved, Project Zomboid | Port de requête A2S UDP et console Source RCON TCP activée |
| Unturned | Port A2S et composant serveur compatible Source RCON |
| Rust | Port A2S et WebRCON avec `rcon.web 1` |
| DayZ | Port A2S et console BattlEye RCON UDP |
| 7 Days to Die | Port A2S et console Telnet protégée par mot de passe |
| FiveM, RedM | Port FXServer pour `dynamic.json` et `rcon_password` pour les commandes |
| ARK: Survival Ascended | `RCONEnabled`, `RCONPort` et `ServerAdminPassword` dans `GameUserSettings.ini` |
| Conan Exiles | Port de requête et section `[RconPlugin]` avec RCON activé, port et mot de passe |
| Palworld | `RESTAPIEnabled`, port REST et mot de passe administrateur |
| Satisfactory | API HTTPS et jeton généré par `server.GenerateAPIToken` |
| Hytale | [KraftLink](kraftlink.md), avec une version de serveur compatible |

Les ports de jeu, de requête et de console peuvent être différents. Autorisez les protocoles nécessaires dans le pare-feu, idéalement seulement depuis l’hébergement du site. Les consoles sans chiffrement doivent passer par un réseau de confiance ou un tunnel.

Renseignez le nom d’hôte et les ports réels : les enregistrements SRV ne sont pas suivis. Une adresse privée est refusée par défaut. Pour un réseau interne, faites ajouter seulement l’adresse ou le CIDR nécessaire dans `config/games.php`, clé `network.private_cidrs`.

Pour Palworld HTTPS et Satisfactory, un certificat privé peut être approuvé en déposant son CA `.pem` dans `storage/app/private/game-certificates/`, puis en indiquant son nom dans la fiche du serveur. Le certificat doit correspondre au nom d’hôte. Ne désactivez pas la vérification TLS.

## Tester avant de proposer des récompenses

Vérifiez l’état du serveur, puis une commande sans conséquence avec votre configuration. Un état public correct ne valide pas le mot de passe de la console. Les [tâches planifiées](operations.md) doivent fonctionner pour actualiser les états et traiter les commandes.

Une commande exigeant la présence d’un joueur nécessite une connexion capable de la confirmer : KraftLink pour Minecraft/Hytale, ou les interfaces authentifiées compatibles de Palworld et ARK: Survival Ascended. Un compteur de joueurs ou une réponse RCON ordinaire ne suffit pas.

Adaptez les récompenses aux commandes réellement disponibles. Par exemple, l’API native Palworld ne permet pas de distribuer arbitrairement des objets : cela demande un mod ou connecteur adapté. Sur les serveurs RP, vérifiez aussi que la commande cible le bon compte ou personnage.

Si une commande reste à vérifier après une interruption réseau, consultez les journaux du jeu avant de la relancer : elle a peut-être déjà produit son effet.
