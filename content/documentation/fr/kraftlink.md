# Installer KraftLink

KraftLink relie Bukkit, Spigot, Paper, Folia, Velocity et Hytale à KraftInk pour remonter leur état, connaître les joueurs présents et exécuter les commandes des récompenses. La liaison se crée dans l’administration du site, puis son jeton se renseigne sur le serveur ou le proxy. Pour les autres jeux et RCON, utilisez le [guide des connexions serveur](games.md).

## 1. Préparer le site et le serveur

Vous devez pouvoir gérer **Serveurs → Serveurs de jeux** dans KraftInk et accéder aux fichiers ainsi qu’à la console de votre serveur de jeu. Le jeu correspondant doit être actif dans le CMS.

Le serveur de jeu doit pouvoir joindre l’adresse HTTPS du site. KraftLink contacte le CMS depuis le jeu, sans port KraftLink à ouvrir en entrée. Un site accessible seulement depuis votre ordinateur ne sera pas joignable depuis un hébergeur de jeu.

Le connecteur Bukkit cible **Minecraft 1.8.x à partir de 1.8.8 et Java 8**. Utilisez la version de Java requise par votre serveur ou votre proxy, notamment pour les plateformes récentes. Vérifiez les versions annoncées par la publication. Le connecteur Hytale cible le serveur **0.7.4**. Sur Folia, les plugins dont vous exécutez les commandes doivent aussi être compatibles avec cette plateforme.

## 2. Ajouter le serveur dans KraftInk

1. Ouvrez **Serveurs → Serveurs de jeux** dans l’administration.
2. Cliquez sur **Ajouter un serveur**.
3. Renseignez son nom puis choisissez **KraftLink** comme mode de liaison. Le jeu actif du site est utilisé automatiquement.
4. Renseignez l’adresse de connexion utilisée par les joueurs et le port du jeu. Par exemple, `play.example.org` et `25565` pour un serveur Minecraft. L’adresse ne contient pas `https://`.
5. Gardez la liaison active. Choisissez séparément si le serveur doit être affiché sur le site et si ses joueurs doivent entrer dans le total public, puis cliquez sur **Ajouter le serveur**. La page de gestion de sa liaison s’ouvre.

Cette adresse de jeu est distincte de l’adresse du site à renseigner ensuite dans KraftLink. Pour retrouver la page de liaison plus tard, ouvrez **Gérer la liaison** sur la ligne de ce serveur.

Vous pouvez relier plusieurs serveurs. Créez une fiche et un jeton distincts pour chacun, puis installez KraftLink sur chaque serveur concerné. Les trois options restent indépendantes :

- La liaison active permet les communications et les livraisons.
- L’affichage public décide si la fiche apparaît sur le site.
- Le comptage décide si ses joueurs entrent dans le total affiché.

Un serveur privé peut donc continuer à recevoir des récompenses sans apparaître sur le site. Pour éviter les doubles comptes sur un réseau, ne comptez chaque joueur qu’une fois. Excluez par exemple le lobby ou un serveur qui remonte déjà un total de réseau lorsque les serveurs de jeu correspondants participent au total.

Sur Velocity, KraftLink exécute les commandes dans la console du proxy. Pour une récompense qui agit sur un serveur Spigot, Paper ou Folia, installez KraftLink sur ce serveur et ciblez sa propre liaison.

## 3. Créer le jeton de liaison

1. Dans **Gérer la liaison → Jeton de liaison**, cochez **Utiliser comme serveur par défaut** si ce serveur doit recevoir les récompenses sans destination choisie. Les récompenses qui ciblent un serveur précis conservent leur destination.
2. Cliquez sur **Créer un nouveau jeton**.
3. Dans la fenêtre de confirmation, saisissez votre code 2FA si elle est activée, sinon votre mot de passe. Une erreur de saisie se corrige dans cette fenêtre.
4. Après validation, la fenêtre se ferme et le jeton s’affiche sur la page de liaison. Copiez-le immédiatement pour remplir le champ `token` du fichier de configuration.

**Le jeton n’est affiché qu’une fois.** Il est propre à cette fiche serveur et contient 64 caractères hexadécimaux. Copiez uniquement sa valeur, sans ajouter `Bearer`, et conservez-la privée.

Si vous avez fermé la page sans le copier, créez un nouveau jeton au même endroit. Cette opération invalide immédiatement le précédent. Remplacez alors la valeur dans le fichier de KraftLink et rechargez sa configuration.

Les clés de **Accès aux comptes et soldes** sont différentes. Elles ne servent pas à remplir le champ `token` de cette liaison.

## 4. Installer le bon JAR

Téléchargez `KraftLink.jar` dans les [publications KraftLink](https://github.com/kraftink-cms/KraftLink/releases). Ce fichier universel contient les connecteurs Bukkit, Velocity et Hytale. La variante Bukkit couvre Bukkit, Spigot, Paper et Folia. Choisissez l’universel ou une des trois variantes ci-dessous, puis téléchargez le fichier `.jar`, pas « Source code ».

| Plateforme | Variante dédiée | Dossier |
| --- | --- | --- |
| Bukkit, Spigot, Paper et Folia | `KraftLink-Bukkit-VERSION.jar` | `plugins/` |
| Velocity | `KraftLink-Velocity-VERSION.jar` | `plugins/` |
| Hytale | `KraftLink-Hytale-VERSION.jar` | `mods/` |

Arrêtez le serveur ou le proxy, déposez **un seul JAR KraftLink par instance** dans le dossier indiqué, puis redémarrez-le. Ce premier démarrage génère la configuration.

Sur Paper, Spigot et Folia, ouvrez `plugins/KraftLink/config.json`. Sur Velocity, ouvrez `config.json` dans le dossier de données KraftLink sous `plugins/`. Sur Hytale, ouvrez le `config.json` du dossier de données généré pour le mod KraftLink. Le chemin de ce dossier dépend de l’installation du serveur.

## 5. Renseigner la configuration

Dans le fichier généré, modifiez les champs suivants en conservant les autres réglages, notamment `channels` et les chemins d’API :

```json
{
    "cms_url": "https://communaute.example",
    "token": "COLLEZ_ICI_LE_JETON_DE_LA_FICHE_SERVEUR",
    "allowed_command_roots": ["say", "give"]
}
```

- `cms_url` est l’adresse de base du site. Si KraftInk est installé dans `https://example.org/communaute`, utilisez cette adresse complète. N’ajoutez ni `/admin` ni `/api/link`.
- `token` contient le jeton créé à l’étape 3 pour ce serveur.
- `allowed_command_roots` contient les noms exacts des commandes que le site pourra exécuter, sans `/` ni arguments. L’exemple autorise `say` et `give` sur Spigot, Paper et Folia. Adaptez la liste aux commandes réellement nécessaires sur votre plateforme.

Une liste `allowed_command_roots` vide autorise seulement la remontée d’état. Pour autoriser une commande préfixée comme `minecraft:give`, ajoutez aussi cette racine exacte. Le site ne peut pas étendre cette liste à distance.

Utilisez HTTPS avec un certificat reconnu par le serveur de jeu. HTTP est accepté seulement pour les essais via `localhost` ou une adresse de boucle locale. Dans ce cas, `localhost` désigne la machine du serveur de jeu.

Enregistrez le fichier, puis exécutez `/kraftlink reload` dans le jeu, ou `kraftlink reload` dans la console. Ces commandes demandent la permission `kraftlink.admin` lorsque vous les utilisez en jeu.

## 6. Vérifier la connexion

Exécutez `/kraftlink status`, ou `kraftlink status` depuis la console. Après le premier échange, l’état doit être `connected`. `waiting` indique que le connecteur attend encore une configuration exploitable et `disconnected` qu’un échange a échoué.

Retournez dans **Gérer la liaison**, puis actualisez la page. La dernière communication doit être récente. Par défaut, KraftLink envoie son état toutes les 30 secondes. Dans **Serveurs de jeux**, le nombre de joueurs se met aussi à jour après actualisation.

Si rien ne remonte, vérifiez que le serveur est actif dans le CMS, qu’il correspond au jeu actif du site, que l’URL est joignable depuis le serveur de jeu et que le jeton n’a pas été remplacé depuis sa copie.

## 7. Tester une commande puis une récompense

Sur Spigot, Paper ou Folia, vous pouvez commencer par un test sans récompense :

1. Gardez `say` dans `allowed_command_roots` et rechargez la configuration si vous venez de l’ajouter.
2. Dans **Gérer la liaison → Console différée**, saisissez `say KraftLink est connecté` dans **Commande console**, sans `/`.
3. Laissez le champ du joueur vide et l’attente du joueur décochée, puis cliquez sur **Envoyer au serveur**.
4. Vérifiez le message dans le jeu ou sa console et le résultat dans l’historique du panneau. Par défaut, les commandes sont récupérées toutes les cinq secondes.

Dans la console différée, vous pouvez renseigner un pseudo ou un UUID, même si le joueur est hors ligne ou encore inconnu du site. Cochez **Attendre que ce joueur soit connecté** pour attendre sa présence sur ce serveur. Sinon, la commande est transmise sans attendre sa connexion. Avec un pseudo, l’attente cible le nom saisi. Avec un UUID, elle cible cet identifiant.

Sur Velocity, choisissez une commande enregistrée sur le proxy ou par un plugin Velocity et autorisez sa racine dans la configuration. Sur Hytale, utilisez une commande de test prise en charge par votre serveur et autorisez aussi sa racine.

Préparez ensuite une récompense d’essai avec le bon serveur et un joueur de test. `{player}` et `{uuid}` utilisent son identité de jeu, pas un nom libre. Vérifiez le résultat dans le jeu et dans **Serveurs → Livraisons en jeu** avant d’ouvrir les achats ou les votes.

Sans destination explicite, seul le serveur par défaut récupère la récompense. L’option demandant la présence du joueur laisse la commande en attente lorsqu’il est absent.

## Connexion ou commande en échec

Vérifiez l’URL de base, le jeton de la bonne fiche serveur, la version du JAR et l’accès HTTPS depuis le jeu. Si la connexion fonctionne mais qu’une commande est refusée, vérifiez `allowed_command_roots`, sa syntaxe et la compatibilité du plugin qui doit l’exécuter.

Une confirmation manquante ne prouve pas l’absence de récompense. Consultez les journaux du serveur et le compte du joueur avant toute relance. Le connecteur confirme l’acceptation de la commande, sans pouvoir garantir l’effet produit par chaque plugin.

KraftLink conserve les commandes dans `commands.jsonl`, dans son dossier de données. **Gardez ce fichier dans les sauvegardes et ne le supprimez pas pour débloquer une livraison.** Après une restauration, rapprochez les livraisons récentes des journaux du serveur.

Si `/kraftlink uncertain` signale une commande incertaine, un responsable autorisé peut utiliser `/kraftlink resolve IDENTIFIANT delivered` pour confirmer son effet déjà constaté, ou `/kraftlink resolve IDENTIFIANT retry` pour autoriser une nouvelle exécution après vérification. Reprenez ensuite la livraison dans le panneau si elle l’exige encore. `retry` peut doubler une récompense déjà reçue.

Les intégrations personnalisées utilisent le [protocole développeur](developpement-kraftlink.md). Les [API de comptes et soldes](developpement-serveurs.md) demandent des clés distinctes : installer KraftLink ne leur donne aucun accès automatique.
