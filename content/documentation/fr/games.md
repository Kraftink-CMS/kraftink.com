# Jeu, identités et serveurs

Choisissez un jeu dans **Jeux et identités**. Un seul jeu est actif à la fois. En changer conserve les anciennes identités sans les convertir.

## Vérifier les identités

| Jeu | Vérification |
| --- | --- |
| Minecraft Java | La recherche Mojang vérifie l’existence du profil. La preuve de possession demande une application Microsoft et l’association depuis le compte du membre |
| Geyser/Floodgate | Activez la compatibilité et reprenez le `username-prefix` du serveur. La recherche publique confirme l’existence du profil. Le mode vérifié peut demander une confirmation en jeu |
| Jeux Steam | Activez Steam dans les connexions externes. OpenID vérifie le compte, pas la possession du jeu |
| Minecraft Bedrock | Gamertag déclaré ou vérification en jeu sur un serveur Nukkit relié avec KraftLink et l’authentification Xbox |
| FiveM | Cfx.re est utilisé par défaut. Choisissez Steam dans les réglages du jeu si votre serveur identifie les joueurs par Steam |
| Hytale | Profil déclaré. PlayerDB et les avatars Crafthead sont des services tiers facultatifs |

Les avatars externes reçoivent l’identifiant public du joueur et l’IP de son navigateur. Une image envoyée par le membre reste prioritaire lorsqu’elle est autorisée.

### Exiger un compte Minecraft vérifié

Activez la connexion **Minecraft Java (Microsoft)** et vérifiez votre profil. Dans **Sécurité et accès → Connexion et inscription → Réglages généraux**, choisissez ensuite **Compte Minecraft vérifié** dans les réglages Minecraft. En **Java uniquement**, les joueurs associent leur compte avec Microsoft. En **Java et Bedrock vérifiés**, activez aussi **Joueurs Geyser et Floodgate**, indiquez le préfixe configuré en jeu et choisissez la commande de vérification. [Configurer la vérification Bedrock](kraftlink.md#activer-la-verification-bedrock)

Le joueur Bedrock copie la commande à usage unique affichée sur le site, l’exécute en jeu, puis confirme le pseudo détecté sur le site. Si Floodgate utilise déjà son identité Java à la suite d’une liaison, il choisit **Minecraft Java (Microsoft)**.

### Vérifier un compte sur Minecraft Bedrock

Sur un site configuré pour **Minecraft Bedrock**, activez **Vérification en jeu** et choisissez le [serveur de vérification Nukkit](kraftlink.md#verifier-les-comptes-sur-minecraft-bedrock) dans **Jeux et identités**. Les membres génèrent un code à usage unique depuis **Mes profils de jeu**, exécutent `/kraftlink link CODE` en jeu, puis confirment sur le site le gamertag renvoyé par le serveur. Cette étape associe le profil du joueur à son compte Xbox authentifié en jeu.

Le réglage **Recherche publique des gamertags** est facultatif et désactivé par défaut. Si vous l’activez, KraftInk interroge le service public de Geyser lors de la déclaration d’un gamertag pour vérifier son existence. Le profil reste déclaré jusqu’à la fin de la vérification.

### Connexion rapide en jeu

Le joueur saisit son pseudo sur le site, puis sélectionne en jeu le numéro affiché dans son navigateur. Le site affiche uniquement l’étape en cours dans la page ou la fenêtre modale déjà ouverte. Si l’inscription demande une adresse e-mail, le champ s’affiche au même endroit après la confirmation. La connexion via Microsoft revient sur une page du site après l’authentification chez le fournisseur.

### Choisir le fournisseur d’identité de FiveM

Sélectionnez **FiveM** dans les réglages du jeu, puis choisissez **Cfx.re** ou **Steam** dans **Identité des joueurs**. Activez la connexion correspondante dans **Sécurité et accès → Connexion et inscription → Connexions externes**. Cfx.re demande un site en HTTPS et ne demande pas de secret client. Associez votre propre compte avant d’exiger un compte de jeu vérifié. Pour changer de fournisseur si la vérification est obligatoire, ouvrez d’abord l’accès, sélectionnez le nouveau fournisseur, associez votre compte puis réactivez la vérification. Les membres doivent associer leur profil au nouveau fournisseur.

## Connecter un serveur

Pour Minecraft ou Hytale avec le connecteur, suivez [KraftLink](kraftlink.md). Pour les autres modes, activez d’abord le service côté jeu. Dans **Serveurs de jeux**, choisissez le mode et enregistrez l’adresse du serveur. Pour RCON et les autres consoles, poursuivez dans **Gérer la liaison** pour renseigner les paramètres et les accès. Ping se configure directement dans la fiche.

| Serveur | À préparer côté jeu |
| --- | --- |
| Minecraft Java | Port de jeu pour l’état, avec `enable-rcon`, `rcon.port` et `rcon.password` pour RCON, ou [KraftLink](kraftlink.md) pour les livraisons avec présence du joueur |
| Garry’s Mod, CS2, TF2, ARK: Survival Evolved, Project Zomboid | Port de requête A2S UDP et console Source RCON TCP activée |
| Unturned | Port A2S et composant serveur compatible Source RCON |
| Rust | Port A2S et RCON activé avec `rcon.web 1` |
| DayZ | Port A2S et console BattlEye RCON UDP |
| 7 Days to Die | Port A2S et console Telnet protégée par mot de passe |
| FiveM, RedM | Port FXServer pour `dynamic.json` et `rcon_password` pour les commandes |
| ARK: Survival Ascended | `RCONEnabled`, `RCONPort` et `ServerAdminPassword` dans `GameUserSettings.ini` |
| Conan Exiles | Port de requête et section `[RconPlugin]` avec RCON activé, port et mot de passe |
| Palworld | `RESTAPIEnabled`, port REST et mot de passe administrateur |
| Satisfactory | API HTTPS et jeton généré par `server.GenerateAPIToken` |
| Hytale | [KraftLink](kraftlink.md), avec une version de serveur compatible |
| Minecraft Bedrock | Port de jeu UDP (généralement `19132`) pour l’état, ou [KraftLink sur Nukkit](kraftlink.md) pour l’état, la présence et les commandes |

### Serveurs Minecraft Bedrock

Choisissez **Minecraft Bedrock** comme jeu du site. Pour un Bedrock Dedicated Server, renseignez l’hôte et le port UDP du jeu afin d’afficher son état. Sur Nukkit, choisissez **KraftLink** pour envoyer des commandes et attendre la présence des joueurs. Utilisez `{player}` pour cibler le gamertag du joueur, y compris s’il contient des espaces.

Les ports de jeu, de requête et de console peuvent différer. Autorisez les protocoles nécessaires dans le pare-feu. Une console sans chiffrement demande un réseau de confiance ou un tunnel.

Renseignez l’hôte et les ports réels, les enregistrements SRV ne sont pas suivis. Pour une adresse privée, le responsable de l’hébergement doit autoriser le réseau concerné dans `config/games.php`, sous `network.private_cidrs`.

### RCON pour Rust

Sélectionnez **RCON** sur la fiche du serveur Rust. Dans **Gérer la liaison**, le **Chiffrement RCON** est réglé sur **Sans chiffrement** par défaut. Choisissez **Avec TLS** si le serveur ou son proxy fournit un accès chiffré (`wss://`), puis renseignez le port de cet accès.

Laissez **Hôte RCON** vide pour utiliser l’adresse du serveur de jeu. Si la console a sa propre adresse, indiquez son nom d’hôte seul, par exemple `rcon.example.org`. KraftInk utilise l’hôte de la fiche serveur pour l’adresse affichée aux joueurs et les requêtes A2S.

Le certificat TLS doit correspondre au nom d’hôte de la console et être reconnu par l’hébergement de KraftInk. Un certificat public valide est vérifié automatiquement. En cas d’échec TLS, KraftInk signale l’erreur et interrompt la connexion avant d’envoyer le mot de passe ou une commande.

### API de Palworld et de Satisfactory

Dans **Gérer la liaison**, choisissez **Avec TLS** dans **Chiffrement de l’API** si votre installation Palworld fournit un accès HTTPS. Le champ du certificat apparaît avec ce réglage. L’API de Satisfactory utilise toujours HTTPS. Renseignez le **Jeton d’API** généré côté jeu.

Si l’API HTTPS de l’un de ces jeux utilise un certificat privé, déposez le certificat de son autorité au format `.pem` dans `storage/app/private/game-certificates/`. Saisissez son nom dans **Nom du fichier du certificat**.

## Tester les commandes

Un état public correct ne valide pas les accès à la console. Essayez une commande sans conséquence avant les récompenses et préparez le [cron](operations.md#planificateur) pour les états et livraisons différées.

L’attente d’un joueur nécessite une preuve de présence fournie par KraftLink ou les interfaces authentifiées compatibles de Palworld et ARK: Survival Ascended. Les commandes disponibles dépendent du serveur et de ses plugins. L’API native Palworld ne distribue pas arbitrairement des objets sans intégration supplémentaire.
