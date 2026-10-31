# Mettre à jour KraftInk

Utilisez **Administration → Mises à jour** pour préparer et appliquer une version du CMS. Les [plugins et thèmes](extensions-catalogue.md) se mettent à jour depuis leurs propres pages.

## Préparer l’intervention

1. Consultez les changements et les prérequis de la version proposée.
2. Conservez une [sauvegarde complète](operations.md#sauvegardes) hors de l’hébergement.
3. Vérifiez l’espace disque, les droits d’écriture et la possibilité de sauvegarder **et restaurer** la base.
4. Choisissez une période calme et arrêtez les applications externes qui écrivent directement dans cette base.
5. Préparez la mise à jour dans le panneau, vérifiez le récapitulatif puis confirmez.

L’hébergement doit fournir `mysqldump` et `mysql` pour MySQL, ou `mariadb-dump` et `mariadb` pour MariaDB. Les mises à jour exigent aussi `proc_open`. Si un contrôle échoue, faites corriger la configuration par l’hébergeur avant de continuer.

## Choisir la version

Gardez **Stable** sur un site public. Les canaux Bêta et Alpha donnent accès aux versions d’essai. Repasser sur Stable ne réinstalle pas un ancien contenu : le CMS attend une stable compatible qui conserve ou dépasse le contenu déjà installé.

Le canal Alpha conserve les changements les plus récents : une stable issue d’une alpha plus ancienne ne les remplace pas.

Le panneau peut télécharger le paquet ou recevoir son archive officielle de **mise à jour**. Utilisez ce paquet plutôt que l’archive d’installation ou les sources GitHub. Les contrôles d’origine et d’intégrité restent obligatoires.

Vous pouvez sauter plusieurs versions si la version proposée est compatible avec votre installation et votre version de PHP. Le paquet contient le code complet, applique les migrations manquantes dans l’ordre et retire les fichiers devenus obsolètes.

## Fichiers remplacés et données conservées

Le paquet signé précise les fichiers à ajouter, remplacer ou supprimer. Le code officiel et sa configuration peuvent être remplacés dans tous leurs dossiers. Les dépendances dans `vendor`, les ressources compilées dans `public/build` et les bibliothèques publiques dans `public/vendor` sont synchronisés avec le paquet : leurs anciens fichiers absents de la nouvelle version sont retirés. Gardez vos personnalisations dans un thème ou une extension.

Avant la sauvegarde des fichiers concernés, KraftInk compare les dossiers déclarés avec le contenu vérifié du paquet et ajoute les fichiers obsolètes aux suppressions. Cette comparaison couvre aussi le dossier de chaque paquet intégré déclaré par la nouvelle version. Les données protégées et les fichiers conservés par une règle `preserve` restent exclus des suppressions.

Vos données locales restent protégées : `.env` et ses variantes locales, stockage, uploads, caches, bases SQLite, journaux, configuration privée et métadonnées d’installation. Cette protection couvre aussi les emplacements personnalisés configurés pour le stockage, les disques de fichiers et la base.

Le modèle `.env.example` peut évoluer sans remplacer votre `.env`. Les fichiers `config/local.php` et `config/custom.php` sont également conservés.

Le fichier `manifest.json` à la racine du CMS définit sa version et les règles de mise à jour :

- `update.protected` interdit tout ajout, remplacement ou suppression sur les chemins protégés, même si le fichier est absent. Les protections de l’installation et de la nouvelle version s’appliquent ensemble.
- `update.preserve` permet de livrer un fichier avec des valeurs initiales. Le CMS le crée s’il est absent, puis conserve sa version locale tant que la règle est présente.
- `update.sync` liste les dossiers du noyau à synchroniser avec le paquet signé. Cette liste permet aussi de retirer les anciens fichiers générés qui ne sont pas suivis dans Git.

Les règles `preserve` sont celles de la version proposée. Retirer une règle autorise donc le remplacement ou la suppression du fichier concerné. Les données protégées de façon permanente, comme `.env` et le stockage, gardent leur protection.

KraftInk vérifie l’ensemble de l’archive avant d’appliquer ces règles. Une opération visant des données protégées est ignorée. Une signature invalide, un chemin dangereux ou l’absence de métadonnées indispensables bloque la mise à jour.

Les jeux, plugins et thèmes intégrés suivent les mises à jour du noyau avec leurs propres règles de conservation. Les extensions installées séparément dans `extensions/installed` se mettent à jour depuis leurs pages et restent hors du périmètre du noyau. Lors de leur mise à jour, leur dossier est comparé au nouveau paquet pour retirer les anciens fichiers, en respectant les règles de protection et de conservation.

## Pendant la mise à jour

Le site passe en maintenance. KraftInk sauvegarde la base et les fichiers concernés, puis affiche la progression. Conservez les sauvegardes et les fichiers de suivi jusqu’à la fin.

La mise à jour utilise une copie temporaire de son moteur pour pouvoir terminer ou restaurer les sauvegardes même si son propre code est remplacé. Ce processus PHP démarre automatiquement, sans worker de queue permanent ni Horizon.

Une extension devenue incompatible peut être suspendue sans perte de ses données. Installez sa version compatible avant de la réactiver. Après réussite, vérifiez les pages principales, les connexions et les services utilisés sur votre site.

## Reprendre après une interruption

En cas d’échec, KraftInk tente de restaurer ensemble la base et les fichiers. Si une récupération est demandée, laissez la maintenance active et transmettez l’identifiant de l’opération à votre responsable technique.

Depuis le dossier contenant `artisan`, il peut reprendre avec :

```shell
php artisan kraft:update --recover=IDENTIFIANT
```

Ne supprimez pas les fichiers de suivi pour débloquer le site et ne remplacez pas ses fichiers à la main. Corrigez la cause indiquée, terminez la récupération puis vérifiez le résultat avant de rouvrir.
