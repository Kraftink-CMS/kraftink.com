# Installer KraftInk

Téléchargez l’archive d’installation `KraftInk-VERSION.zip`. Elle contient les dépendances et les ressources prêtes à l’emploi. Composer et Node.js ne sont pas nécessaires sur votre hébergement.

## Hébergement requis

Prévoyez PHP **8.4.1 ou supérieur en 64 bits**, HTTPS et une base SQLite, MySQL ou MariaDB. L’assistant vérifie les extensions PHP et les droits d’écriture.

Avec SQLite, le CMS crée sa base pendant l’installation. Pour MySQL ou MariaDB, créez une base vide et conservez ses identifiants.

L’hébergement doit autoriser `proc_open` et fournir PHP en ligne de commande dans la même version que le site. Si cet exécutable n’est pas détecté, renseignez son chemin dans `KRAFT_PHP_BINARY` dans `.env` avec l’aide de l’hébergeur. Prévoyez aussi un accès aux tâches cron pour les [automatismes](operations.md#planificateur).

## Installation

1. Extrayez l’archive dans le dossier du site, par exemple `/var/www/kraftink`.
2. Faites pointer le domaine vers **`/var/www/kraftink/public`**. Les autres dossiers doivent rester inaccessibles depuis le Web.
3. Autorisez PHP à écrire dans `storage/`, `bootstrap/cache/`, `.env` et son dossier parent. Avec SQLite, rendez aussi `database/` accessible en écriture.
4. Activez HTTPS, ouvrez le domaine et suivez l’assistant.

Sur Apache, activez la réécriture et autorisez le `.htaccess` fourni. Sur Nginx, dirigez les adresses sans fichier correspondant vers `public/index.php` et autorisez `public/update-status.php` pour le suivi des mises à jour.

Les plugins et thèmes proposés sont facultatifs. À la fin, votre compte propriétaire est connecté au panneau. Continuez avec la [configuration du site](configuration.md).

## Installation interrompue ou accès refusé

Après une interruption, rouvrez le site depuis le même navigateur pour reprendre. Conservez la base, `.env` et les fichiers de suivi.

Le premier navigateur et la première connexion réservent l’assistant. Si un changement de navigateur, de connexion ou de cookies provoque un refus, supprimez uniquement `storage/app/private/installation/access.json`, puis recommencez l’accès. Avec un stockage personnalisé, utilisez le chemin indiqué sur la page de refus.
