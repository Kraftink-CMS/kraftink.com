# Jeu, identités et serveurs

Choisissez un jeu dans **Jeux et identités**. Un seul jeu est actif à la fois. En changer conserve les anciennes identités sans les convertir.

## Vérifier les identités

| Jeu | Vérification |
| --- | --- |
| Minecraft Java | La recherche Mojang vérifie l’existence du profil. La preuve de possession demande une application Microsoft et l’association depuis le compte du membre |
| Geyser/Floodgate | Activez la compatibilité et reprenez le `username-prefix` du serveur. Cette recherche ne prouve pas la possession Xbox |
| Jeux Steam | Activez Steam dans les connexions externes. OpenID vérifie le compte, pas la possession du jeu. FiveM utilise ici l’identité Steam |
| Hytale | Profil déclaré. PlayerDB et les avatars Crafthead sont des services tiers facultatifs |

Les avatars externes reçoivent l’identifiant public du joueur et l’IP de son navigateur. Une image envoyée par le membre reste prioritaire lorsqu’elle est autorisée.

## Connecter un serveur

Pour Minecraft ou Hytale avec le connecteur, suivez [KraftLink](kraftlink.md). Pour les autres modes, activez d’abord le service côté jeu, puis reportez ses accès dans **Serveurs** :

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

Les ports de jeu, de requête et de console peuvent différer. Autorisez les protocoles nécessaires dans le pare-feu. Une console sans chiffrement demande un réseau de confiance ou un tunnel.

Renseignez l’hôte et les ports réels, les enregistrements SRV ne sont pas suivis. Pour une adresse privée, le responsable de l’hébergement doit autoriser le réseau concerné dans `config/games.php`, sous `network.private_cidrs`.

Pour Palworld HTTPS ou Satisfactory avec un certificat privé, déposez son CA `.pem` dans `storage/app/private/game-certificates/` et indiquez son nom dans la fiche du serveur.

## Tester les commandes

Un état public correct ne valide pas les accès à la console. Essayez une commande sans conséquence avant les récompenses et préparez le [cron](operations.md#planificateur) pour les états et livraisons différées.

L’attente d’un joueur nécessite une preuve de présence fournie par KraftLink ou les interfaces authentifiées compatibles de Palworld et ARK: Survival Ascended. Les commandes disponibles dépendent du serveur et de ses plugins. L’API native Palworld ne distribue pas arbitrairement des objets sans intégration supplémentaire.
