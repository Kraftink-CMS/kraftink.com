# Importer un ancien site

L’assistant d’**Administration → Imports** peut lire une source KraftInk, Azuriom ou MineWeb historique. Son rapport indique ce qui peut réellement être repris sur votre site. Un nom de CMS ou de plugin ne garantit pas une reprise complète.

Pour connaître les conversions de chaque plugin et les emplacements des fichiers source, consultez [Migrer MineWeb ou Azuriom](migration-mineweb-azuriom.md).

## Préparer le transfert

1. Sauvegardez la base **et les fichiers** de l’ancien site. Faites un premier essai sur une copie.
2. Préparez un accès en lecture seule à sa base MySQL/MariaDB, PostgreSQL ou à son fichier SQLite. La source doit être distincte de la base de KraftInk.
3. Si vous avez seulement un export `.sql`, restaurez-le dans une base source séparée. Le panneau n’accepte pas directement les dumps SQL.
4. Laissez l’assistant installer et activer les extensions KraftInk correspondantes disponibles, ou installez-les au préalable. Les équivalents gratuits du catalogue suivent les contrôles habituels de compatibilité et d’intégrité. Un thème correspondant peut aussi être sélectionné. Les extensions indisponibles sont indiquées.
5. Placez l’ancien site en maintenance pour le transfert final, afin d’éviter de nouveaux achats, messages ou inscriptions pendant la copie.

## Lire le rapport avant de confirmer

L’analyse ne convertit pas encore les données. Si l’installation automatique est cochée, elle prépare aussi les extensions correspondantes. Contrôlez les décomptes, les dépendances entre données et les éléments non convertibles. Si la source change après l’analyse, recommencez celle-ci.

Après conversion, ouvrez **Consulter le rapport** dans les derniers imports. Il distingue les lignes converties des éléments uniquement archivés et liste les fichiers ou règles à reprendre avec leur table et leur identifiant source. Le rapport JSON est téléchargeable. Un convertisseur disponible ne garantit pas que chaque colonne possède un équivalent.

**Ajouter aux contenus existants** conserve les contenus de destination et ajoute les éléments convertis. **Remplacer les contenus convertibles** sauvegarde puis remplace les domaines sélectionnés dans l’aperçu. Ce remplacement conserve les comptes locaux et les réglages d’installation. Les historiques financiers de Shop et les données de Vote restent en fusion.

En cas de compte déjà présent, vérifiez les correspondances par e-mail ou identité de jeu et choisissez la conservation de ses accès locaux. Une correspondance ambiguë doit être corrigée avant de poursuivre.

## Reprendre les éléments manquants

Les fichiers ne sont pas transférés par la lecture de la base. Conservez les images, avatars, fichiers vendus et pièces jointes de l’ancien hébergement. Renvoyez-les dans KraftInk et rattachez-les aux bons contenus, en utilisant les emplacements privés pour les fichiers réservés.

Les secrets, connexions externes et protections à deux facteurs ne deviennent pas automatiquement utilisables. Certains comptes importés devront réinitialiser leur mot de passe. Un compte protégé ou verrouillé exige une vérification de son titulaire avant déverrouillage.

Les anciennes récompenses et livraisons ne sont pas rejouées. Reprenez séparément les services de paiement, abonnements, livraisons en cours et réglages non convertis.

## Vérifier et ouvrir

Comparez les comptes, montants et décomptes au site d’origine. Testez les liens, images, connexions et droits avec un visiteur puis un membre. Reconfigurez les accès aux espaces privés avant de les publier.

Un import interrompu se reprend depuis le panneau. Conservez `.env`, sa clé et les archives privées de `storage/app/private/imports/` jusqu’à validation. Elles peuvent contenir des données personnelles et ne doivent pas être rendues publiques. La sauvegarde complète de l’ancien site reste nécessaire, même après un import réussi.
