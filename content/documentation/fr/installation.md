# Installer KraftInk

Téléchargez l’archive d’installation `KraftInk-VERSION.zip`. Elle contient les dépendances et les ressources prêtes à l’emploi. Composer et Node.js ne sont pas nécessaires sur votre hébergement.

## Hébergement requis

Prévoyez PHP **8.4.1 ou supérieur en 64 bits**, HTTPS et une base SQLite, MySQL, MariaDB ou PostgreSQL. L’assistant vérifie les extensions PHP et les droits d’écriture.

Avec SQLite, le CMS crée sa base pendant l’installation. Pour MySQL, MariaDB ou PostgreSQL, créez une base vide et conservez ses identifiants. Avec PostgreSQL, utilisez la version 14 ou supérieure et activez `pdo_pgsql`. Le compte de connexion de KraftInk doit être propriétaire de la base et de son schéma `public`.

L’hébergement doit autoriser `proc_open` et fournir PHP en ligne de commande dans la même version que le site. Si cet exécutable n’est pas détecté, renseignez son chemin dans `KRAFT_PHP_BINARY` dans `.env` avec l’aide de l’hébergeur. Prévoyez aussi un accès aux tâches cron pour les [automatismes](operations.md#planificateur).

## Installation

1. Extrayez l’archive dans le dossier du site, par exemple `/var/www/kraftink`.
2. Faites pointer le domaine vers **`/var/www/kraftink/public`**. Les autres dossiers doivent rester inaccessibles depuis le Web.
3. Autorisez PHP à écrire dans `storage/`, `bootstrap/cache/`, `.env` et son dossier parent. Avec SQLite, rendez aussi `database/` accessible en écriture.
4. Activez HTTPS, ouvrez le domaine et suivez l’assistant.

Sur Apache, activez la réécriture et autorisez le `.htaccess` fourni. Sur Nginx, dirigez les adresses sans fichier correspondant vers `public/index.php` et autorisez `public/update-status.php` pour le suivi des mises à jour.

Les plugins et thèmes proposés sont facultatifs. À la fin, votre compte propriétaire est connecté au panneau. Continuez avec la [configuration du site](configuration.md).

## Docker Compose

Depuis l’archive d’installation extraite, lancez `docker compose up -d --build` pour utiliser SQLite ou une base existante. Ouvrez [http://localhost:8080](http://localhost:8080) pour terminer l’installation. Pour changer le port Web, définissez `KRAFTINK_HTTP_PORT` avant de démarrer Compose.

Pour utiliser le service MariaDB fourni, définissez un mot de passe fort dans `KRAFTINK_DB_PASSWORD`, dans un fichier `.env` à côté de `compose.yaml`. Lancez `docker compose --profile mariadb up --build --wait`. Dans l’assistant, choisissez **MySQL / MariaDB**, saisissez `db` comme hôte et `3306` comme port. Utilisez `kraftink` comme nom de base et comme utilisateur, puis saisissez le mot de passe choisi.

Compose conserve KraftInk et les données MariaDB dans deux volumes séparés. Sauvegardez les deux si vous utilisez le service MariaDB. Le port Web fourni écoute uniquement sur votre machine. Pour héberger un site public, configurez HTTPS devant le service Web.

## Installation interrompue ou accès refusé

Après une interruption, rouvrez le site depuis le même navigateur pour reprendre. Conservez la base, `.env` et les fichiers de suivi.

Le premier navigateur et la première connexion réservent l’assistant. Si un changement de navigateur, de connexion ou de cookies provoque un refus, supprimez uniquement `storage/app/private/installation/access.json`, puis recommencez l’accès. Avec un stockage personnalisé, utilisez le chemin indiqué sur la page de refus.
