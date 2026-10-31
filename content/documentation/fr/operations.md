# Sauvegardes et fonctionnement

Ce guide couvre les tâches à préparer avec votre hébergeur, puis les vérifications utiles lorsqu’un service ne fonctionne plus.

## Planificateur

Avec le réglage par défaut `QUEUE_CONNECTION=sync`, KraftInk tente l’envoi des notifications courantes, annonces immédiates, webhooks d’audit, liens de récupération OAuth et commandes de jeu par transport direct après validation de l’opération en base. Ces premiers envois fonctionnent sans cron. Les notifications natives sont créées dans la transaction et disparaissent si elle est annulée.

Les récupérations OAuth sont toutes enregistrées durablement avant le premier envoi. Au plus trois nouvelles demandes sont traitées immédiatement, avec un budget de cinq secondes contrôlé entre les envois. Un envoi commencé garde son propre délai d’exécution. Le surplus et les reprises attendent le cron. Si `DB_QUEUE_CONNECTION` désigne une connexion distincte, ces récupérations restent asynchrones après commit.

Le cron reste vivement conseillé pour publier à une heure programmée, reprendre les envois en échec, actualiser l’état des serveurs et les synchronisations, et nettoyer les données expirées. Une commande de jeu qui attend le retour d’un joueur hors ligne ou une livraison différée ne peut pas être garantie sans traitement ultérieur. Ajoutez cette seule tâche cron avec les chemins de votre hébergement :

```cron
* * * * * cd /var/www/kraftink && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

`/var/www/kraftink` désigne le dossier contenant `artisan`, pas `public/`. L’exécutable PHP CLI doit être en version 8.4.1 ou supérieure.

Si le panneau d’hébergement sépare fréquence et commande, choisissez **chaque minute** et copiez seulement la commande à partir de `cd`. Sans accès aux tâches cron, transmettez cette ligne à l’hébergeur.

Ce seul cron lance les tâches arrivées à échéance. Les envois et reprises sont vérifiés chaque minute, tandis que `kraft:maintenance` nettoie les données expirées chaque heure. Aucun worker permanent n’est nécessaire. Vérifiez une vraie action programmée : l’e-mail de test des réglages est immédiat et ne prouve pas que le cron fonctionne.

Pour afficher l’inventaire et les prochaines échéances :

```shell
php artisan schedule:list
```

Les notifications des plugins conservent leurs règles de destinataires, de regroupement et de préférences. En mode `sync`, leurs e-mails et envois Discord sont tentés après commit, sans attendre le cron. Les envois en attente, les délais imposés par un service externe et les échecs récupérables restent suivis pour une reprise. Un résultat externe incertain peut demander une vérification manuelle avant un nouvel essai, afin de limiter les doublons.

## Envois différés

Le fonctionnement par défaut, `QUEUE_CONNECTION=sync`, évite de dépendre du cron pour les actions courantes. Sur un site à fort volume, un responsable technique peut choisir `QUEUE_CONNECTION=database` dans `.env` pour reporter les envois, puis exécuter depuis la racine du CMS :

```shell
php artisan config:clear
```

Le cron prend alors en charge les envois différés. `kraft:tasks-run` traite la file `database` par passes d’au plus 25 tâches, avec une limite de traitement de 40 secondes vérifiée entre deux tâches. Cette commande sert aussi aux reprises conservées après un échec d’envoi en mode `sync`. Une tâche déjà commencée reste soumise à son propre délai d’exécution.

Pour traiter la file Laravel en continu, un worker facultatif peut être géré et relancé automatiquement par l’hébergement :

```shell
php artisan queue:work database --tries=3
```

Conservez le cron même avec ce worker. Il traite aussi les échéances métier et les files de livraison propres aux services. Après une mise à jour ou une restauration, l’ancien worker s’arrête et doit être relancé par le gestionnaire de processus.

## Corbeille

Depuis **Contenus → Corbeille**, retrouvez les éléments supprimés que vos droits permettent de restaurer. La recherche et le choix du type de contenu s’appliquent à cette liste commune. Utilisez **Restaurer** pour remettre un élément en place. Si un sujet ou un ticket a été supprimé, restaurez-le avant de récupérer ses messages.

**Supprimer définitivement** efface un élément et ses contenus associés. **Vider la corbeille** traite tous les éléments que vous êtes autorisé à supprimer, même si la liste est filtrée. Ces actions demandent une confirmation, votre mot de passe si vous utilisez la connexion locale et votre second facteur s’il est activé. Les images et fichiers encore utilisés ailleurs sont conservés. Un élément utilisé par une opération en cours peut rester dans la corbeille, avec un bilan indiquant les suppressions qui n’ont pas abouti.

Les listes Pages et Actualités affichent les contenus actifs, avec des filtres **Brouillons**, **Programmés** et **Publiés**. Un brouillon enregistré reste conservé jusqu’à une suppression volontaire.

## Conservation des données

Si un fichier ne peut pas être effacé pendant une suppression, une demande de nettoyage est conservée et retentée par la maintenance horaire. L’administration signale ce nettoyage en attente. Les demandes réussies sont retirées automatiquement.

Depuis **Opérations → Conservation des données**, choisissez les durées appliquées au nettoyage horaire. Les valeurs par défaut sont :

| Données | Conservation par défaut |
| --- | --- |
| Anciennes versions | 90 jours, avec au maximum 50 versions par contenu |
| Données temporaires, dont les images sans référence et restées inchangées | 2 jours |
| Traces techniques non critiques d’opérations terminées | 90 jours |

Les anciennes versions dépassant la durée **ou** le nombre maximal sont supprimées. Le contenu actuel reste intact. Les contenus enregistrés, y compris les brouillons de pages, d’actualités, du Wiki, de la FAQ et du Staff, sont conservés sans limite d’inactivité jusqu’à leur suppression volontaire. Le nettoyage de l’historique ne supprime aucune image encore utilisée par un contenu courant, un brouillon ou une version conservée. La corbeille manuelle n’est pas purgée par cette politique. Les contenus importés restent également conservés pendant leur révision.

Certaines fonctionnalités possèdent une expiration propre, indépendante des réglages globaux :

| Données | Expiration ou nettoyage |
| --- | --- |
| Sauvegardes temporaires automatiques Forum et Support | 24 heures après la dernière sauvegarde, sans concerner les contenus enregistrés |
| Fichiers Forum et Support envoyés sans rattachement | 2 heures |
| Challenges Vote expirés | Après 2 jours sans réclamation et après 30 jours dans tous les cas |
| Sessions de connexion en base | Durée d’inactivité du site, 120 minutes par défaut |
| Liens de récupération du mot de passe | 60 minutes par défaut |
| Cache et verrous de cache en base | Selon leur expiration enregistrée |
| Exports privés | 24 heures par défaut |
| Notifications encore en attente | Expiration fonctionnelle de 90 jours, indépendante des traces terminées |
| Webhooks d’audit terminés | 7 jours |

Le délai global des données temporaires s’applique aux images d’éditeur sans référence et aux accès invités Shop après leur expiration. Une image peut devenir inutilisée après une modification, l’expiration de sa dernière ancienne version ou la suppression définitive d’un contenu. Le nettoyage conserve toute image encore utilisée par un contenu enregistré, y compris un brouillon, ou par une version conservée. Le plugin Vote sécurise ses validations par des transactions et des verrous natifs Laravel, sans table de verrous ni purge propres au plugin. Le délai technique s’applique aux détails des notifications et annonces terminées, aux notifications expirées et aux lots de tâches terminés sans erreur. Les identifiants qui empêchent les doublons restent conservés. Les révisions liées à des signalements Forum ouverts ou à des tickets Support non clos restent protégées.

Les réglages s’appliquent uniquement aux données explicitement prises en charge par le noyau et par les plugins actifs qui participent au nettoyage. Les fichiers encore référencés, les données financières, les opérations encore récupérables et les identifiants nécessaires à la déduplication sont conservés. Un plugin désactivé ou en quarantaine n’exécute pas de nettoyage. Le journal d’audit garde son propre réglage dans **Historique → Journal d’audit**. Les exports privés conservent aussi leur expiration courte, indépendante de ces durées.

Une réduction de durée ou de nombre de versions prend effet au prochain passage horaire. Enregistrer le formulaire ne purge aucune donnée immédiatement. Avec un accès technique à l’hébergement, vous pouvez examiner les données concernées sans les supprimer :

```shell
php artisan kraft:maintenance --dry-run
```

Le nettoyage réel utilise `php artisan kraft:maintenance`. Le cron habituel le lance automatiquement chaque heure. Cette commande regroupe le journal d’audit, les historiques, les données temporaires, les exports privés expirés et les fichiers abandonnés pris en charge. Les durées restent réglables et les exclusions financières ou protégées restent appliquées. Sauvegardez la base et les fichiers avant une modification importante de la politique, puis vérifiez la simulation. Le nettoyage ne remplace pas les sauvegardes et les données effacées ne peuvent plus être restaurées depuis l’historique du site.

## Sauvegardes

Sauvegardez ensemble **la base, les fichiers du site et `.env`**, en conservant les fichiers cachés. La clé de `.env` est indispensable pour relire certaines données protégées. Copiez aussi les fichiers hébergés sur un stockage externe si vous en utilisez un.

Gardez une copie protégée hors de l’hébergement et testez sa restauration sur un emplacement séparé. Demandez à l’hébergeur une sauvegarde cohérente de la base. Une simple copie d’un fichier SQLite pendant des écritures peut être incomplète.

La sauvegarde automatique d’une mise à jour couvre son opération. Elle ne remplace pas vos copies régulières et ne permet pas d’annuler une action déjà exécutée sur un serveur de jeu ou un service de paiement.

## Changer d’hébergement

Placez le site en maintenance et suspendez les écritures externes. Transférez la sauvegarde complète vers un hébergement compatible, faites pointer sa racine web vers `public/`, puis adaptez les identifiants de base si nécessaire. Conservez la clé d’application d’origine.

Rétablissez les droits d’écriture, HTTPS et le cron. Si le domaine change, suivez aussi la [configuration de l’URL et des services externes](configuration.md#domaine-https-et-proxy). Vérifiez la copie avant de basculer le domaine et gardez l’ancien hébergement jusqu’à validation.

## Dépannage

| Symptôme | Premier contrôle |
| --- | --- |
| Pages internes en 404 | Racine web `public/`, réécriture Apache ou configuration Nginx |
| Erreur 500 ou page blanche | Droits d’écriture, espace disque et journaux dans `storage/logs/` |
| E-mails absents | Test SMTP, journaux du prestataire, puis cron si l’envoi est différé |
| Annonces ou livraisons bloquées | Cron chaque minute, bonne version de PHP CLI et connectivité du service |
| Liens HTTP ou mauvais domaine | URL publique et configuration du proxy |
| Modification de configuration invisible | Cache de configuration, puis cache du navigateur |

Conservez les messages utiles et l’heure de l’incident avant de contacter l’hébergeur. Les journaux, exports et sauvegardes peuvent contenir des informations privées : partagez uniquement les extraits nécessaires, après retrait des secrets. Gardez `APP_DEBUG=false` sur un site public.
