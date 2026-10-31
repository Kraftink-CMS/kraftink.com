# Relier un serveur avec KraftLink

KraftLink transmet l’état et les joueurs présents d’un serveur à KraftInk, puis récupère les commandes à exécuter. Il fonctionne sur Bukkit, Spigot, Paper, Folia, Velocity et Hytale. Pour les autres connexions, consultez les [serveurs de jeu](games.md).

## Créer la liaison dans le CMS

1. Activez le jeu correspondant dans **Jeux et identités**.
2. Dans **Serveurs → Serveurs de jeux**, ajoutez un serveur avec le mode **KraftLink**.
3. Renseignez l’adresse et le port utilisés par les joueurs, sans `https://`.
4. Dans **Gérer la liaison → Jeton de liaison**, créez un jeton et copiez-le. Il n’est affiché qu’une fois.

Créez une fiche et un jeton par serveur. Le choix du serveur par défaut sert aux récompenses sans destination explicite. L’activation de la liaison, l’affichage public et le comptage des joueurs sont indépendants. Sur un réseau, évitez de compter à la fois les joueurs du proxy et ceux des serveurs reliés.

Sur Velocity, les commandes s’exécutent sur le proxy. Pour agir sur un serveur Paper, installez KraftLink sur ce serveur et ciblez sa liaison.

## Installer le connecteur

Téléchargez `KraftLink.jar` depuis les [publications KraftLink](https://github.com/kraftink-cms/KraftLink/releases). Vous pouvez aussi choisir une variante :

| Plateforme | Variante | Dossier d’installation |
| --- | --- | --- |
| Bukkit, Spigot, Paper, Folia | `KraftLink-Bukkit-VERSION.jar` | `plugins/` |
| Velocity | `KraftLink-Velocity-VERSION.jar` | `plugins/` |
| Hytale | `KraftLink-Hytale-VERSION.jar` | `mods/` |

Arrêtez le serveur, déposez **un seul JAR KraftLink par instance**, puis redémarrez. La variante Bukkit cible Minecraft 1.8.x à partir de 1.8.8. Le connecteur Hytale cible le serveur 0.7.4. Respectez la version Java requise par votre serveur et les compatibilités annoncées dans la publication.

Ouvrez `plugins/KraftLink/config.json` sur Bukkit, ou le `config.json` du dossier de données KraftLink généré sur Velocity/Hytale. Modifiez ces champs sans retirer les autres réglages :

```json
{
    "cms_url": "https://communaute.example",
    "token": "JETON_DE_LA_FICHE_SERVEUR",
    "allowed_command_roots": ["say", "give"]
}
```

- `cms_url` est l’adresse HTTPS du site, avec son éventuel sous-dossier, sans `/admin` ni `/api/link`.
- `token` est le jeton de liaison, sans préfixe `Bearer`. Les clés d’accès aux comptes et soldes sont distinctes.
- `allowed_command_roots` contient les commandes autorisées, sans `/` ni arguments. Une liste vide autorise seulement l’état. Pour `minecraft:give`, ajoutez cette racine exacte.

Le serveur de jeu doit pouvoir joindre le site en HTTPS. Aucun port entrant KraftLink n’est à ouvrir. Rechargez avec `kraftlink reload` dans la console, puis vérifiez `kraftlink status` : l’état attendu est `connected`.

## Tester une commande

Sur Bukkit, Paper ou Folia, autorisez `say`, puis envoyez `say KraftLink est connecté` depuis **Gérer la liaison → Console différée**, sans joueur ni attente de connexion. Vérifiez le résultat dans le jeu et l’historique du panneau.

Pour une récompense, choisissez le serveur destinataire et un joueur de test. `{player}` et `{uuid}` utilisent son identité de jeu. L’option d’attente conserve la commande jusqu’à sa présence sur ce serveur.

## Livraison en échec ou incertaine

Vérifiez l’adresse du site, le jeton, la liste des commandes autorisées et leur disponibilité sur la plateforme. Si le jeton est perdu, créez-en un nouveau puis remplacez-le dans le connecteur.

Une confirmation manquante peut suivre une commande déjà exécutée. Vérifiez le compte du joueur et les journaux avant relance. Conservez `commands.jsonl` dans les sauvegardes du connecteur.

`kraftlink uncertain` liste les commandes incertaines. Après vérification, `kraftlink resolve IDENTIFIANT delivered` confirme une exécution constatée et `kraftlink resolve IDENTIFIANT retry` autorise un nouvel essai. Une relance peut doubler une récompense déjà reçue.
