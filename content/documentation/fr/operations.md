# Tâches automatiques et sauvegardes

Préparez une tâche cron avec votre hébergeur pour les actions programmées, puis des sauvegardes régulières hors du site.

## Planificateur

Ajoutez cette tâche **chaque minute**, avec les chemins de votre hébergement :

```cron
* * * * * cd /var/www/kraftink && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

Le dossier est celui qui contient `artisan`, pas `public/`. PHP CLI doit respecter les [prérequis du CMS](installation.md#hebergement-requis). Si l’interface de l’hébergeur sépare la fréquence et la commande, copiez uniquement la partie à partir de `cd`.

Avec Docker Compose, ajoutez la tâche cron sur la machine qui héberge les conteneurs. Adaptez le chemin du dossier contenant `compose.yaml`.

```cron
* * * * * cd /var/www/kraftink && /usr/bin/docker compose exec -T --user www-data kraftink php artisan schedule:run >> /dev/null 2>&1
```

Ce cron traite les publications programmées, les reprises d’envoi, les synchronisations, le suivi des serveurs et le nettoyage. Aucun worker permanent n’est nécessaire avec la configuration par défaut. Vérifiez son fonctionnement avec une publication programmée.

Sans cron, les actions courantes tentent leur envoi immédiat avec le réglage par défaut `QUEUE_CONNECTION=sync`. Les actions différées et les reprises après échec restent en attente. Un test SMTP réussi ne vérifie donc pas le planificateur.

## Sauvegardes

Sauvegardez ensemble **la base, tous les fichiers du site et `.env`**, y compris les fichiers cachés. Sa clé d’application permet de relire les données chiffrées. Incluez aussi les fichiers conservés sur un stockage externe.

Gardez une copie protégée hors de l’hébergement et testez sa restauration sur une installation séparée. Demandez à l’hébergeur une copie cohérente de la base, notamment pour SQLite pendant des écritures.

Les sauvegardes automatiques de mise à jour couvrent cette opération et ne remplacent pas les copies régulières. Une restauration n’annule ni un paiement ni une commande déjà exécutée en jeu.

## Corbeille et conservation

**Contenus → Corbeille** permet de restaurer les éléments supprimés. Restaurez un sujet ou un ticket avant ses messages. **Vider la corbeille** concerne tous les éléments que vous pouvez supprimer, même si la liste est filtrée.

Dans **Fonctionnement → Conservation des données**, choisissez la durée des anciennes versions, des données temporaires et des traces techniques. Le nettoyage s’applique au passage horaire suivant. Les valeurs initiales sont de 90 jours et 50 versions par contenu pour l’historique, 2 jours pour les données temporaires et 90 jours pour les traces techniques.

Les contenus enregistrés, y compris les brouillons, et la corbeille manuelle ne sont pas supprimés par ces réglages. Les fichiers encore utilisés et les données financières sont conservés. Réglez la durée de conservation de l’audit dans **Fonctionnement → Journal des actions**.

## Changer d’hébergement

Placez le site en maintenance, transférez une sauvegarde complète vers un hébergement compatible et conservez la clé d’application. Rétablissez la racine web `public/`, les accès à la base, les droits d’écriture, HTTPS et le cron. Si le domaine change, adaptez aussi la [configuration du site](configuration.md#domaine-et-proxy).

## Créer un administrateur depuis le terminal

Depuis le dossier du site installé, exécutez `php artisan kraft:admin:create <pseudo> <email>`. Saisissez deux fois le nouveau mot de passe à l’invite. La commande crée un membre avec le rang Administrateur. Utilisez une adresse que vous contrôlez si le site exige la validation de l’e-mail. La connexion par mot de passe doit être activée.

## Dépannage

| Problème | À vérifier |
| --- | --- |
| Pages internes en 404 | Racine web `public/` et réécriture du serveur web |
| Erreur 500 ou page blanche | Droits d’écriture, espace disque et `storage/logs/` |
| E-mails absents | Test SMTP, indésirables, journaux du prestataire puis cron pour les envois différés |
| Publications ou livraisons en attente | Cron chaque minute et accès au service distant |
| Mauvais domaine ou liens HTTP | Adresse du site et mode du proxy |

Pour une opération interrompue, suivez le guide des [mises à jour](updates.md#reprendre-apres-un-echec) ou le diagnostic de l’[extension](extensions-catalogue.md#mettre-a-jour-ou-retirer).
