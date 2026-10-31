# Migrer MineWeb ou Azuriom

Le [parcours d’import](migration.md) convertit les données reconnues de MineWeb historique et d’Azuriom vers les domaines de KraftInk. Les schémas de référence vérifiés sont MineWeb 1.15.2 et Azuriom 1.2.13, avec leurs plugins officiels. Un fork, un plugin tiers ou une autre version peut demander une adaptation. La réécriture NewMinewebCMS utilise un format différent.

## Données reprises

| Domaine | Conversion et limites |
| --- | --- |
| Comptes | Pseudos, e-mails, rangs, identités de jeu, dates, soldes représentables et mots de passe bcrypt ou Argon2. Les autres empreintes exigent une réinitialisation. Bannissements actifs et protections 2FA maintiennent les comptes verrouillés, même si leurs tables ne sont pas sélectionnées pour conversion. Les comptes locaux conservés gardent leurs accès, soldes et profils. |
| Site | Nom, description, langue, fuseau horaire et réglages publics compatibles. Les conditions d’utilisation, menus et sous-menus, liens sociaux et textes du slider sont repris lorsqu’ils sont présents en base. Le référencement MineWeb est rattaché aux pages reconnues. Les fichiers du slider, logos et couvertures restent à rattacher. |
| Wiki et FAQ | Catégories, hiérarchie, pages, questions, réponses et ordre. Les restrictions de catégories Wiki Azuriom sont associées aux rangs convertis. Une restriction non comprise reste fermée pour vérification. |
| Staff | Les fiches MineWeb deviennent des membres du répertoire KraftInk, avec rang, ordre et liens sociaux représentables. Il n’existe pas de plugin Staff officiel Azuriom dans le périmètre vérifié. Un plugin tiers nécessite son propre convertisseur. |
| Support | Catégories, tickets, messages, états ouvert ou fermé, affectations et champs compatibles. Les réponses ordinaires MineWeb restent visibles au membre du ticket. Le Markdown Azuriom est converti. Les champs sans équivalent et les pièces jointes sont signalés. |
| Forum | Catégories et sous-forums, discussions, messages, textes Markdown ou BBCode, accès représentables, groupes MineWeb, profils, tags, réactions positives et signalements. Les sondages Azuriom et leurs votes sont repris. Les messages privés MineWeb, sanctions et fonctions sans domaine équivalent restent archivés. |
| Vote | Sites, délais, options publiques compatibles, votes membres et invités MineWeb, récompenses et classements mensuels représentables. Les historiques restent traités ou annulés et ne déclenchent aucune nouvelle récompense. Les choix de serveur et modes de distribution sans équivalent exact sont signalés. |
| Boutique | Catégories, sections, hiérarchie, produits, prix, devises, variables compatibles, commandes et rangs représentables. Coupons, périmètres et usages historiques, cartes cadeaux et historique financier fiable sont repris. Les commandes source sans montant réellement payé restent archivées. Les abonnements nécessitent un rapprochement avec leur prestataire. |

Les réglages des plugins restent dans leurs convertisseurs. Une option sans équivalent actif est indiquée dans le rapport, avec sa référence source. Les données originales des tables converties restent aussi dans l’archive privée.

## Vérification avant activation

Les contenus arrivent en brouillon. Les menus, liens sociaux, produits, coupons, cartes cadeaux, sites et récompenses restent désactivés jusqu’à leur contrôle. Les forums et leurs messages restent masqués pour vérification. Les rangs ne reçoivent pas automatiquement les privilèges administratifs de l’ancien CMS. Contrôlez leurs permissions dans KraftInk.

Les conditions d’accès compatibles sont conservées sans élargir les espaces privés. Si une relation de rang n’est pas sélectionnée ou ne peut pas être comprise, elle reste restrictive. Vérifiez aussi le résultat avec un compte qui ne doit pas accéder à l’espace.

Les paiements historiques conservent leur devise et leurs montants connus, sans nouveau débit, remboursement, crédit de portefeuille ou livraison. Les points MineWeb et la monnaie interne Azuriom ne constituent pas automatiquement une devise réelle. Vérifiez leur unité avant de réactiver des achats ou récompenses. Une commande sans preuve du montant payé n’est pas reconstruite au prix actuel du catalogue.

Les secrets OAuth, SMTP, callbacks, prestataires et ponts de jeu ne sont pas activés depuis la source. Les paramètres SMTP publics compatibles peuvent être préparés sur une destination sans configuration de messagerie existante, avec l’envoi désactivé. Reconnectez puis testez les services depuis la destination. Les connexions, clés et URL propres à l’installation KraftInk restent celles de la destination.

## Installer les équivalents disponibles

L’assistant détecte les plugins par leurs tables et les déclarations d’import des paquets. Il peut installer ou activer les paquets locaux compatibles et les équivalents gratuits du catalogue. Les achats, paquets nécessitant une acquisition manuelle, versions incompatibles et correspondances ambiguës ne sont pas installés automatiquement. Le rapport indique les éléments indisponibles.

Un thème source peut être remplacé par son équivalent KraftInk disponible. L’installation d’un thème ne transforme pas le PHP, les fichiers CSS ou les réglages arbitraires de l’ancien thème. Reprenez les options qui n’ont pas d’équivalent dans sa configuration KraftInk. Les données d’un plugin inconnu restent archivées, elles ne deviennent pas actives simplement parce qu’un paquet porte un nom proche.

## Sauvegarder et rattacher les fichiers

| Source | Emplacements usuels à sauvegarder |
| --- | --- |
| MineWeb historique | `app/webroot/img/uploads/`, dont `slider/` et `favicons/`. Conservez `app/webroot/files/` s’il est utilisé. Les skins et capes peuvent se trouver dans `app/webroot/skins/` et `app/webroot/skins/capes/`, ou dans des emplacements personnalisés. Les miniatures Wiki et images Boutique peuvent être des URL vers un autre hébergement. |
| Azuriom | Tout `storage/app/public/`, notamment les images et pièces jointes des plugins. `public/storage` est normalement un lien vers ce dossier. Les fichiers vendus par Shop sont stockés séparément, par défaut dans `storage/app/shop/packages/`, et doivent rester privés. |

Ces emplacements sont décrits dans les sources officielles [MineWeb](https://github.com/MineWeb/MineWebCMS/tree/95e801819672475c4b7d7aa4cde818489ea5fe92/app/webroot), [Azuriom](https://github.com/Azuriom/Azuriom/blob/v1.2.13/config/filesystems.php) et [Shop Azuriom](https://github.com/Azuriom/Plugin-Shop/blob/master/src/Models/Concerns/ManageFiles.php). Pour un stockage S3, distant ou personnalisé, sauvegardez les fichiers réels du disque configuré. Conservez aussi les dossiers propres aux extensions tierces.

Le rapport donne les références de fichiers présentes dans les données reconnues. Il ne constitue pas un inventaire du disque source. Renvoyez les images publiques dans la médiathèque, les images confidentielles dans l’éditeur du contenu concerné et les pièces jointes dans leur espace privé. Réassociez couvertures, avatars, produits et contenus depuis leurs formulaires.

Copier un dossier au même chemin ne crée pas les relations ni les protections de KraftInk. Les anciennes références locales sont neutralisées pour éviter de viser des identifiants appartenant à une autre ressource de destination. Les liens externes conservés peuvent encore dépendre de l’ancien hébergement. Vérifiez les liens internes, les redirections et les fichiers avant de fermer l’ancien site.
