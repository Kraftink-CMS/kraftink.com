# Installer KraftInk

L’archive d’installation est prête à déposer sur votre hébergement. Vous n’avez pas besoin de Composer ou de Node.js pour l’utiliser.

## Préparer l’hébergement

Prévoyez PHP **8.4.1 ou supérieur, en 64 bits**, HTTPS et une base SQLite, MySQL ou MariaDB. L’assistant vérifiera les extensions PHP et les droits nécessaires.

- **SQLite** : aucun compte de base à créer. KraftInk crée son fichier pendant l’installation.
- **MySQL ou MariaDB** : créez une base vide et un utilisateur autorisé à la gérer, puis gardez leurs identifiants.

La fonction PHP `proc_open` et PHP CLI de même version doivent être disponibles dès l’installation pour vérifier les modules intégrés dans des processus isolés. Si PHP CLI n’est pas détecté automatiquement, indiquez le chemin de son exécutable dans `KRAFT_PHP_BINARY` dans le fichier `.env`.

Les actions courantes fonctionnent sans cron avec le réglage par défaut `QUEUE_CONNECTION=sync`. Un accès cron reste vivement conseillé pour les publications programmées, les reprises après échec, les synchronisations, le suivi des serveurs et le nettoyage automatique. Prévoyez une seule tâche `schedule:run` chaque minute, décrite dans le [guide d’exploitation](operations.md#planificateur).

## Déposer les fichiers

1. Téléchargez **`KraftInk-VERSION.zip`** depuis les téléchargements officiels. Choisissez l’archive d’installation, pas les sources proposées par GitHub.
2. Extrayez-la dans le dossier du site, par exemple `/var/www/kraftink`.
3. Faites pointer le domaine vers **`/var/www/kraftink/public`**. Seul ce sous-dossier doit être accessible depuis le Web.
4. Autorisez PHP à écrire dans `storage/`, `bootstrap/cache/`, le fichier `.env` et son dossier parent. Avec SQLite, `database/` doit aussi être accessible en écriture.
5. Activez HTTPS puis ouvrez votre domaine.

Sur Apache, activez la réécriture et autorisez le `.htaccess` fourni. Sur Nginx, dirigez les adresses sans fichier correspondant vers `public/index.php` et autorisez aussi le script `public/update-status.php` pour le suivi des mises à jour. Si vous ne pouvez pas choisir la racine web, faites adapter l’hébergement avant de continuer.

Le fichier `.zip.sha256` de la publication permet de contrôler le téléchargement : comparez sa valeur à `Get-FileHash .\KraftInk-VERSION.zip -Algorithm SHA256` sous PowerShell, ou lancez `sha256sum -c KraftInk-VERSION.zip.sha256` sous Linux.

## Terminer l’installation

Suivez l’assistant et corrigez les prérequis signalés avant de confirmer. Utilisez l’adresse HTTPS définitive du site. Les plugins et thèmes proposés sont facultatifs. La présentation native fonctionne déjà sans thème.

À la fin, vous êtes connecté avec votre compte propriétaire. Continuez avec la [configuration](configuration.md), puis préparez les [tâches automatiques et les sauvegardes](operations.md).

## Reprendre un assistant bloqué

L’installation est réservée à la connexion et au navigateur du premier accès. Après un changement de navigateur, de connexion ou de cookies, un **403 Accès refusé** peut apparaître. Pour reprendre, supprimez uniquement `storage/app/private/installation/access.json`, puis ouvrez l’assistant depuis le navigateur souhaité.

Après une interruption, rouvrez le même site pour reprendre les étapes. Conservez la base, `.env` et les fichiers de suivi dans `storage/app/private/installation/`. Le marqueur `installed.json` signale une installation terminée et les fichiers de `journals/` permettent de vérifier une reprise. Ne les supprimez pas pour relancer l’assistant.

Si l’hébergeur utilise `LARAVEL_STORAGE_PATH`, les chemins ci-dessus sont relatifs à ce dossier de stockage plutôt qu’au dossier `storage/` du site.
