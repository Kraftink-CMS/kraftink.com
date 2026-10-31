# Importer un ancien site

**Administration → Imports** reprend les données reconnues d’une source KraftInk, Azuriom ou MineWeb historique. Le rapport de l’assistant indique les conversions disponibles et ce qui restera seulement archivé.

## Préparer et lancer l’import

1. Sauvegardez la base et les fichiers de l’ancien site. Faites un essai sur une copie avant le transfert final.
2. Préparez un accès en lecture seule à sa base ou à son fichier SQLite, distinct de la destination. Si vous avez un export `.sql`, restaurez-le dans une base séparée.
3. Lancez l’analyse. L’assistant peut installer les extensions KraftInk correspondantes disponibles et compatibles.
4. Vérifiez les décomptes, les correspondances de comptes et les éléments non convertibles avant de confirmer.

**Ajouter aux contenus existants** conserve la destination. **Remplacer les contenus convertibles** sauvegarde puis remplace les domaines sélectionnés. Les comptes locaux et réglages d’installation sont conservés. Shop et Vote gardent leurs historiques en fusion.

Pour le transfert final, placez l’ancien site en maintenance afin d’éviter des inscriptions, achats ou messages pendant la copie. Recommencez l’analyse si la source a changé.

## Données de MineWeb et Azuriom

Les formats de référence sont MineWeb **1.15.2** et Azuriom **1.2.13**, avec leurs plugins officiels. Les forks, extensions tierces et NewMinewebCMS peuvent nécessiter un convertisseur adapté.

| Domaine | Reprise prévue |
| --- | --- |
| Comptes | Pseudos, e-mails, rangs, identités, dates, soldes représentables et mots de passe bcrypt ou Argon2 |
| Site | Réglages publics compatibles, pages, actualités, menus et liens sociaux |
| Wiki, FAQ et Staff | Catégories, contenus, ordre et restrictions compatibles. Staff concerne MineWeb |
| Support | Tickets, messages, catégories, affectations et états compatibles |
| Forum | Catégories, discussions, messages et accès représentables, sondages Azuriom. Les messages privés MineWeb restent archivés |
| Vote | Annuaires, votes, récompenses et classements représentables, sans nouvelle distribution |
| Shop | Catalogue, coupons, cartes cadeaux et historique financier justifié. Les abonnements demandent un rapprochement avec le prestataire |

Les contenus arrivent en brouillon, masqués ou désactivés pour vérification. Les rangs ne reçoivent pas automatiquement les anciens privilèges d’administration. Les données sans équivalent restent dans l’archive privée.

## Fichiers et accès à reprendre

La lecture de la base ne transfère pas les fichiers. Conservez notamment :

| Source | Dossiers usuels |
| --- | --- |
| MineWeb | `app/webroot/img/uploads/`, `app/webroot/files/` et les dossiers de skins ou capes utilisés |
| Azuriom | `storage/app/public/` et, pour les fichiers vendus, `storage/app/shop/packages/` |

Incluez les stockages externes ou personnalisés. Renvoyez les images publiques dans la médiathèque et les fichiers réservés dans leur espace privé, puis rattachez-les aux contenus. Copier un ancien dossier ne recrée pas ces associations.

Les secrets SMTP, OAuth, paiements et connexions de jeu sont à reconfigurer. Certains membres devront réinitialiser leur mot de passe. Les comptes protégés ou verrouillés demandent une vérification avant réouverture.

## Vérifier le résultat

Ouvrez **Consulter le rapport** pour retrouver les éléments à reprendre et télécharger le bilan JSON. Contrôlez les comptes, permissions, montants, liens et images avant de publier les contenus. Les anciennes commandes, récompenses et paiements ne sont pas rejoués.

Un import interrompu se reprend depuis le panneau. Conservez `.env` et les archives privées de `storage/app/private/imports/` jusqu’à validation du transfert.
