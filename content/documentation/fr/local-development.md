# Préparer un environnement de développement

Utilisez une installation dédiée pour créer une extension ou modifier le CMS. Les comptes, fichiers et bases de production ne servent pas de fixtures.

## Installer les sources

Le dépôt du CMS contient directement `artisan`, `app/` et `public/`. Il demande PHP 8.4.1 ou supérieur en 64 bits, Composer et Node 22.12 ou supérieur pour construire les ressources.

Depuis la racine :

```shell
composer install
npm ci
npm run build
```

Exposez uniquement `public/` avec votre serveur local, puis ouvrez le site et suivez l’installateur. Avec Laragon, le [modèle de virtual host](local/kraftink-cms.local.conf) peut servir de point de départ. Adaptez le chemin et le domaine à votre poste.

Réglez `APP_URL` sur cette adresse. Après installation, l’URL du site enregistrée dans le panneau doit correspondre : elle prend la priorité pour les liens. Si vous modifiez l’environnement, lancez `php artisan config:clear`.

## Organiser les fichiers générés

Les fichiers privés de l’application vont dans `storage/app/private/`, les fichiers destinés à être publiés dans `storage/app/public/`, les sessions et caches Laravel dans `storage/framework/` et les journaux dans `storage/logs/`. Le disque Laravel `local` est relatif à `app/private/`. Le disque `public` est relatif à `app/public/`.

Une nouvelle installation regroupe ses fichiers dans `storage/app/private/installation/` :

| Fichier | Rôle |
| --- | --- |
| `installed.json` | Marqueur durable d’une installation terminée, vérifiable sans accès SQL |
| `access.json` | Réservation de l’assistant par IP et empreinte du jeton navigateur |
| `install.lock` | Verrou exclusif empêchant deux installations simultanées |
| `journals/<empreinte-base>.json` | Journal signé de reprise, propre à la base et aux sources installées |

Ces fichiers ont des cycles d’écriture distincts. Le marqueur et les journaux sont publiés atomiquement. Les fichiers d’accès et de verrou conservent leur identité pendant leur utilisation avec `flock`. Ces mécanismes exigent des fichiers locaux, indépendamment du disque de médias choisi. Ils respectent `LARAVEL_STORAGE_PATH`.

Les opérations de mise à jour utilisent `storage/app/updates/` et des verrous partagés avec les workers autonomes pour coordonner leur exécution et permettre leur reprise.

## Travailler sur une extension

Générez le paquet avec `php artisan kraft:make`, puis installez-le depuis le panneau. Les sources indépendantes restent dans leur dépôt. Le CMS ne parcourt que la copie sous `extensions/installed/`.

Pour essayer une mise à jour, utilisez une archive sur une base de test contenant des données. Un remplacement manuel de fichiers ne vérifie pas le cycle d’installation.

## Vérifier une modification

```shell
php artisan test --compact --exclude-group=bundled-extensions
node --test tests/Frontend/*.test.mjs tests/Release/*.test.mjs
```

Ces commandes couvrent le dépôt du noyau autonome. Les tests `bundled-extensions` demandent les projets externes correspondants. Dans le workspace complet, lancez `php artisan test --compact`.

Le [guide des tests](contribuer-tests.md) précise les fixtures et l’isolation. Vérifiez aussi le parcours modifié dans un navigateur. Construisez les ressources après une modification CSS ou JavaScript.

Le site de présentation KraftInk est un projet indépendant. Son propre README décrit sa construction. Il n’est pas nécessaire pour développer une extension du CMS.
