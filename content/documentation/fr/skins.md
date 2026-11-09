# Gérer les skins et capes Minecraft Java

Sur un site configuré pour Minecraft, installez **Skins** depuis **Plugins**. Les membres doivent associer un profil Minecraft Java vérifié et disposer de la permission **Gérer ses skins et capes**. L’envoi de fichiers demande aussi la permission **Importer des skins et capes**.

## Configurer le site

Ouvrez **Extensions → Skins et capes** dans l’administration. Chaque section s’enregistre séparément.

- **Textures du site** contrôle les capes et la publication des nouveaux PNG. Les capes sont autorisées au départ et les nouveaux fichiers sont privés. Activez la publication si un lanceur ou un site tiers doit pouvoir lire les PNG sans connexion. Seuls les fichiers envoyés pendant que l’option est active sont publiés. Désactiver la publication coupe l’accès public à ces fichiers tant que l’option reste désactivée.
- **Skin par défaut du site** permet d’envoyer un PNG, de choisir son modèle et d’activer le repli. Les requêtes publiques portant sur un skin absent ou privé utilisent alors ce skin par défaut. Pour retirer le PNG enregistré, désactivez le repli et cochez **Retirer le skin enregistré** avant d’enregistrer.
- **Application en jeu** contrôle la synchronisation séparément. Elle est activée au départ. La désactiver suspend les échanges en jeu. Les membres peuvent toujours gérer leurs fichiers sur le site et les serveurs conservent les textures déjà appliquées.

L’extension PHP GD est nécessaire pour générer les images du visage et du corps. Avec GD, choisissez **Visage du skin publié** (`skins`) dans **Réglages → Avatars** pour utiliser le visage d’un skin public. Le skin par défaut peut fournir le visage quand aucun skin public n’est disponible.

## Configurer un serveur de jeu

1. Activez le serveur Minecraft dans KraftInk et choisissez **KraftLink** comme mode de connexion. Générez un jeton et renseignez-le avec l’URL du site dans le plugin côté serveur. [Configurer KraftLink](kraftlink.md)
2. Installez KraftLink pour Bukkit et SkinsRestorer sur le même serveur compatible Bukkit, puis redémarrez-le.
3. Ouvrez **Compatibilité des serveurs** dans les réglages de Skins. Suivez l’étape indiquée pour le serveur. **En attente de SkinsRestorer** indique que Bukkit a été détecté. **Intégration confirmée** apparaît quand l’intégration a contacté le site.
4. Dans le tableau, autorisez **Application automatique** pour les serveurs choisis. Chaque serveur démarre sans cette autorisation. Le diagnostic de connexion reste visible même quand l’application est désactivée.

SkinsRestorer envoie les PNG de skin à MineSkin pour les signer. Dans la configuration de SkinsRestorer, `api.mineskinSecretSkins: true` retire les skins générés de la galerie MineSkin. Les URL des textures signées restent accessibles. [Réglages MineSkin](https://skinsrestorer.net/docs/integrations/mineskin)

## Enregistrer et appliquer des textures

Dans votre **Profil**, ouvrez la section **Skins et capes**. Importez un skin PNG de 64 × 64 ou 64 × 32 pixels et choisissez le modèle classique ou fin. Pour une cape, importez un PNG de 64 × 32 ou 22 × 17 pixels. Chaque fichier est limité à 32 Kio. Vérifiez les textures dans l’aperçu avant d’enregistrer.

Le formulaire indique si les nouveaux fichiers restent privés ou sont publiés selon les réglages du site. Sous chaque fichier enregistré, le profil affiche son état et donne son lien si le fichier est public. Toute personne disposant de ce lien peut ouvrir l’image. Vous pouvez retirer chaque fichier séparément.

Quand vous enregistrez un nouveau skin ou modifiez son modèle, il s’applique automatiquement sur les serveurs autorisés par l’administration. Rejoignez le serveur avec votre profil Java vérifié. Une cape PNG sert sur le site et avec les lanceurs compatibles.

Pour revenir à l’apparence définie par SkinsRestorer sur le serveur, retirez le skin enregistré. Quand vous êtes présent sur le serveur, KraftLink retire sa propre sélection si elle est toujours active. Les réglages de serveur restent dans l’administration.

## Lire les textures publiées

Pour `{player}`, utilisez l’UUID Java, le pseudo Minecraft ou `id-<identifiant du membre dans le CMS>`. Par exemple, utilisez `id-42` pour le membre 42.

| Requête | Réponse |
| --- | --- |
| `GET /api/skins/profiles/{player}` | JSON avec les métadonnées `skin` et `cape`. Les métadonnées du skin disponible incluent le modèle et l’indicateur `default`. |
| `GET /api/skins/profiles/{player}/textures/{kind}.png` | Fichier PNG pour `skin` ou `cape`. |
| `GET /api/skins/profiles/{player}/renders/{view}.png` | Image PNG pour `face`, `body` ou `combo`. Requiert PHP GD. |

Les requêtes publiques utilisent les fichiers partagés. Quand un skin est privé ou absent, l’API peut renvoyer le skin par défaut configuré. L’URL d’une cape absente renvoie une erreur 404. La requête de profil renvoie 404 quand aucune texture n’est disponible.

## Connecter un lanceur

Activez **Connexion des applications** dans KraftInk et utilisez un CMS à jour. Envoyez l’en-tête `Authorization: Bearer <jeton>` d’un membre avec ces requêtes. [Authentifier une application](auth-api.md)

| Requête | Droits requis | Réponse |
| --- | --- | --- |
| `GET /api/skins/me/profile` | `skins:read` | UUID Java vérifié et métadonnées des textures du membre, fichiers privés compris. |
| `GET /api/skins/me/textures/{kind}.png` | `skins:read` | PNG `skin` ou `cape` du membre. |
| `POST /api/skins/me/textures/{kind}` | `skins:write` | Enregistre le PNG et renvoie le code 204. |
| `GET /api/auth/me` | `profile:read` et `skins:read` | Inclut les métadonnées de Skins dans `data.user.extensions.skins` pour les membres avec un profil Java vérifié et la permission d’utiliser Skins. |

Envoyez les fichiers en `multipart/form-data`. Utilisez le champ `skin` pour `/textures/skin` ou `cape` pour `/textures/cape`. Pour un skin, vous pouvez aussi envoyer `variant` avec la valeur `classic` ou `slim`. Les dimensions, la taille maximale et le réglage de publication sont les mêmes que sur le site.
