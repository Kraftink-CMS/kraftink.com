# Gérer les skins et capes Minecraft Java

Sur un site configuré pour Minecraft, installez **Skins** depuis **Plugins**. Les membres doivent associer un profil Minecraft Java vérifié et disposer de la permission **Gérer ses skins et capes**. L’envoi de fichiers demande aussi la permission **Importer des skins et capes**.

## Configurer le site

Ouvrez **Extensions → Skins et capes** dans l’administration. Chaque section s’enregistre séparément.

- Dans **Textures du site**, les skins et les capes personnalisés sont autorisés par défaut. Si vous désactivez l’un des deux, les membres ne peuvent plus importer ni afficher les fichiers de ce type dans leur profil. Ils peuvent toujours retirer les fichiers déjà enregistrés.
- **Publier les nouveaux fichiers** rend les prochains PNG accessibles à toute personne disposant du lien. Les fichiers sont privés par défaut. Activer la publication laisse privés les fichiers déjà enregistrés comme tels. Désactiver cette option suspend aussi l’accès public aux fichiers déjà publiés.
- Dans **Skin par défaut du site**, importez un PNG, choisissez son modèle et activez le skin de repli. Il peut servir pour les avatars et les lanceurs compatibles, même si les skins personnalisés sont désactivés. Dans ce cas, son aperçu reste visible dans l’administration. Pour retirer le PNG, désactivez le repli et cochez **Retirer le skin enregistré** avant d’enregistrer.
- **Application en jeu** est activée au départ. Désactivez-la pour suspendre les échanges et conserver les skins déjà appliqués sur les serveurs. Lorsque les échanges sont actifs, désactiver les skins personnalisés suspend les nouvelles applications. KraftLink retire alors le skin qu’il gère au prochain échange pendant lequel le joueur est connecté.

L’extension PHP GD est nécessaire pour générer les images du visage et du corps. Avec GD, choisissez **Visage du skin publié** (`skins`) dans **Réglages → Avatars** pour utiliser le visage d’un skin public. Le skin par défaut peut fournir le visage quand aucun skin public n’est disponible.

## Configurer un serveur de jeu

1. Activez le serveur Minecraft dans KraftInk et choisissez **KraftLink** comme mode de connexion. Générez un jeton et renseignez-le avec l’URL du site dans le plugin côté serveur. [Configurer KraftLink](kraftlink.md)
2. Installez KraftLink pour Bukkit et SkinsRestorer sur le même serveur compatible Bukkit, puis redémarrez-le.
3. Ouvrez **Compatibilité des serveurs** dans les réglages de Skins. Suivez l’étape indiquée pour le serveur. **En attente de SkinsRestorer** indique que Bukkit a été détecté. **Intégration confirmée** apparaît quand l’intégration a contacté le site.
4. Dans le tableau, autorisez **Application automatique** pour les serveurs choisis. Chaque serveur démarre sans cette autorisation. Le diagnostic de connexion reste visible même quand l’application est désactivée.

SkinsRestorer envoie les PNG de skin à MineSkin pour les signer. Dans la configuration de SkinsRestorer, `api.mineskinSecretSkins: true` demande à MineSkin de ne pas lister les nouveaux skins générés. Les URL des textures signées restent accessibles. [Réglages MineSkin](https://skinsrestorer.net/docs/integrations/mineskin)

## Enregistrer et appliquer des textures

Dans votre **Profil**, ouvrez la section **Skins et capes**. Importez un skin PNG de 64 × 64 ou 64 × 32 pixels et choisissez le modèle classique ou fin. Pour une cape, importez un PNG de 64 × 32 ou 22 × 17 pixels. Chaque fichier est limité à 32 Kio. Vérifiez les textures dans l’aperçu avant d’enregistrer.

Le profil affiche un lien pour les fichiers que vous pouvez partager. La note au bas du formulaire explique les règles de partage du site. Vous pouvez retirer le skin et la cape séparément.

Quand vous enregistrez un nouveau skin ou modifiez son modèle, il s’applique automatiquement si les skins personnalisés sont autorisés et si le serveur participe à la synchronisation. Rejoignez le serveur avec votre profil Java vérifié. Une cape PNG sert sur le site et avec les lanceurs compatibles.

Pour revenir à l’apparence définie par SkinsRestorer sur le serveur, retirez le skin enregistré. Quand vous êtes présent sur le serveur, KraftLink retire sa propre sélection si elle est toujours active. Les réglages de serveur restent dans l’administration.

## Lire les textures publiées

Pour `{player}`, utilisez l’UUID Java, le pseudo Minecraft ou `id-<identifiant du membre dans le CMS>`. Par exemple, utilisez `id-42` pour le membre 42.

| Requête | Réponse |
| --- | --- |
| `GET /api/skins/profiles/{player}` | JSON avec les métadonnées `skin` et `cape`. Les métadonnées du skin disponible incluent le modèle et l’indicateur `default`. |
| `GET /api/skins/profiles/{player}/textures/{kind}.png` | Fichier PNG pour `skin` ou `cape`. |
| `GET /api/skins/profiles/{player}/renders/{view}.png` | Image PNG pour `face`, `body` ou `combo`. Requiert PHP GD. |

Les requêtes publiques utilisent les fichiers partagés des types autorisés. Quand un skin est privé, absent ou désactivé, l’API peut renvoyer le skin par défaut configuré. L’URL d’une cape indisponible renvoie une erreur 404. La requête de profil renvoie 404 quand aucune texture n’est disponible.

## Connecter un lanceur

Dans l’administration, ouvrez **Sécurité et accès → Connexion des applications** et activez la connexion. Une fois le membre connecté, son lanceur peut récupérer son profil Skins avec `GET /api/skins/me/profile`. Envoyez l’en-tête `Authorization: Bearer <jeton>` avec les requêtes ci-dessous. [Authentifier une application](auth-api.md)

| Requête | Droits requis | Réponse |
| --- | --- | --- |
| `GET /api/skins/me/profile` | `skins:read` | UUID Java vérifié et métadonnées des textures du membre, fichiers privés compris. |
| `GET /api/skins/me/textures/{kind}.png` | `skins:read` | PNG `skin` ou `cape` du membre. |
| `POST /api/skins/me/textures/{kind}` | `skins:write` | Enregistre le PNG et renvoie le code 204. |

Envoyez les fichiers en `multipart/form-data`. Utilisez le champ `skin` pour `/textures/skin` ou `cape` pour `/textures/cape`. Pour un skin, vous pouvez aussi envoyer `variant` avec la valeur `classic` ou `slim`. Les dimensions, la taille maximale et le réglage de publication sont les mêmes que sur le site. Pour un type désactivé, l’envoi renvoie 404 et la lecture personnelle masque le fichier du membre. La lecture d’un skin peut renvoyer le skin de repli.
