# Gérer les skins et capes Minecraft Java

Sur un site configuré pour Minecraft, installez **Skins** depuis **Plugins**. Les membres ayant le droit **Gérer ses skins et capes** peuvent ouvrir **Skins et capes** après avoir associé un profil Minecraft Java vérifié.

Dans l’administration, ouvrez **Extensions → Skins et capes** pour autoriser les capes et le partage public. Les deux options sont activées au départ. Désactiver les capes masque les fichiers et suspend la synchronisation des textures signées qui contiennent une cape. Désactiver le partage public ferme l’accès aux fichiers publiés. Ces réglages conservent les fichiers et les choix de partage.

## Conserver des images sur le site

Importez un skin PNG de 64 × 64 ou 64 × 32 pixels et choisissez le modèle classique ou fin. Pour une cape, importez un PNG de 64 × 32 ou 22 × 17 pixels. Chaque image doit faire au maximum 32 Kio.

Les fichiers sont privés par défaut. Si vous cochez **Publier les fichiers envoyés**, les personnes disposant de l’URL peuvent les consulter. Décochez cette option pour refermer l’accès. Vous pouvez aussi retirer chaque fichier séparément.

## Synchroniser avec le jeu

Installez [KraftLink](kraftlink.md) et SkinsRestorer sur le serveur Bukkit compatible, puis reliez ce serveur au site. Une fois le serveur affiché dans **Textures en jeu**, choisissez une action et rejoignez-le avec votre profil Java vérifié. Une demande reste en attente jusqu’à son traitement ou expire après 24 heures.

- **Lire la texture actuelle en jeu** enregistre la propriété signée du serveur. Elle peut contenir une cape.
- **Appliquer le skin envoyé** transmet votre PNG via la liaison KraftLink. SkinsRestorer demande à son service de génération de signer le skin pour Minecraft. Le délai dépend de ce service.
- **Appliquer les textures signées enregistrées** utilise la dernière propriété signée enregistrée sur le site, avec sa cape éventuelle.
- **Rétablir la texture par défaut en jeu** retire la sélection gérée par KraftLink et laisse SkinsRestorer résoudre le profil du joueur.

Une cape PNG envoyée reste un fichier du site. Minecraft affiche en jeu une cape déjà présente dans une propriété signée. Ce réglage ne change pas les droits de cape du compte Microsoft.
