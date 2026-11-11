# Mettre à jour KraftInk

Ouvrez **Mises à jour et imports → Mises à jour** pour installer une version du CMS. Les plugins et thèmes ajoutés séparément se mettent à jour depuis leurs propres pages.

## Appliquer une mise à jour

1. Consultez les changements et les prérequis de la version proposée.
2. Gardez une [sauvegarde complète](operations.md#sauvegardes) hors de l’hébergement.
3. Lancez la préparation et corrigez les problèmes signalés, puis confirmez le récapitulatif.
4. Attendez la fin de l’opération avant de vérifier les pages et services du site.

Le panneau télécharge la version ou accepte son archive officielle de **mise à jour**. L’archive d’installation et les sources GitHub ne conviennent pas à cette opération.

Le canal **Stable** est sélectionné par défaut. Si vous testez une version alpha, sélectionnez **Alpha** dans **Préférences de mise à jour**, enregistrez votre choix puis cliquez sur **Rechercher une mise à jour**. Repasser sur **Stable** laisse votre version en place jusqu’à la disponibilité d’une mise à jour stable compatible.

L’hébergement doit permettre de sauvegarder et restaurer la base. Avec MySQL, il faut `mysqldump` et `mysql`. Avec MariaDB, il faut `mariadb-dump` et `mariadb`. Avec PostgreSQL, il faut `pg_dump` et `psql` de la même version majeure que le serveur. L’image Docker inclut les outils de MariaDB et de PostgreSQL 17. Ajoutez les outils adaptés à l’image si votre base en a besoin.

## Données et personnalisations

Le site passe en maintenance pendant l’installation. Vos comptes, contenus, fichiers envoyés et `.env` sont conservés. Le code officiel peut être remplacé : placez vos personnalisations dans un thème ou un plugin.

Les extensions intégrées suivent la version du CMS. Une extension devenue incompatible peut être suspendue en conservant ses données, jusqu’à l’installation d’une version compatible.

## Reprendre après un échec

KraftInk tente de restaurer la base et les fichiers concernés. Si l’écran demande une récupération, conservez la maintenance et les fichiers de suivi. Transmettez l’identifiant de l’opération au responsable de l’hébergement.

Il peut reprendre depuis le dossier contenant `artisan` :

```shell
php artisan kraft:update --recover=IDENTIFIANT
```

Corrigez la cause indiquée avant de rouvrir le site. Supprimer le suivi ou remplacer des fichiers à la main peut empêcher la récupération.
