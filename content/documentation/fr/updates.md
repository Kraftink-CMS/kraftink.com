# Mettre à jour KraftInk

Ouvrez **Administration → Mises à jour** pour installer une version du CMS. Les plugins et thèmes ajoutés séparément se mettent à jour depuis leurs propres pages.

## Appliquer une mise à jour

1. Consultez les changements et les prérequis de la version proposée.
2. Gardez une [sauvegarde complète](operations.md#sauvegardes) hors de l’hébergement.
3. Lancez la préparation et corrigez les problèmes signalés, puis confirmez le récapitulatif.
4. Attendez la fin de l’opération avant de vérifier les pages et services du site.

Le panneau télécharge la version ou accepte son archive officielle de **mise à jour**. L’archive d’installation et les sources GitHub ne conviennent pas à cette opération.

Gardez le canal **Stable** sur un site public. Alpha et Bêta sont des versions d’essai. Revenir au canal Stable attend une version compatible et ne remet pas le site dans un état antérieur.

L’hébergement doit permettre de sauvegarder et restaurer la base. Avec MySQL, il faut `mysqldump` et `mysql`. Avec MariaDB, il faut `mariadb-dump` et `mariadb`.

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
