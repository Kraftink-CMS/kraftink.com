# Questions fréquentes

## L’assistant affiche « Accès refusé »

Le premier navigateur et la première connexion réservent l’installation. Après un changement, supprimez uniquement le fichier d’accès indiqué sur la page de refus, normalement `storage/app/private/installation/access.json`, puis reprenez l’assistant. Gardez la base, la configuration et les autres fichiers de suivi. Voir [Installer KraftInk](installation.md#reprendre-un-assistant-bloque).

## Faut-il installer un thème ou tous les plugins ?

La présentation native suffit pour ouvrir le site. Installez seulement les fonctions dont vous avez besoin, depuis le catalogue ou une archive de confiance. Voir les [extensions](extensions-catalogue.md).

## Le test d’e-mail réussit, mais un envoi automatique n’arrive pas

Avec `QUEUE_CONNECTION=sync`, les notifications courantes et les récupérations OAuth tentent leur envoi après validation de l’opération, sans attendre le cron. Vérifiez les préférences du membre, son adresse vérifiée, les indésirables et les erreurs du prestataire. Les publications programmées, les reprises après échec et le mode `database` ont besoin d’un traitement ultérieur. Le test d’e-mail ne vérifie pas le [planificateur](operations.md#planificateur).

## Le site peut-il fonctionner sans cron ?

Les actions courantes fonctionnent sans cron avec le réglage `QUEUE_CONNECTION=sync`, notamment les notifications et les annonces publiées immédiatement. Configurez tout de même le cron pour les publications à une heure précise, les reprises, les synchronisations, l’état des serveurs et le nettoyage horaire. Une livraison différée ou une commande destinée à un joueur hors ligne ne peut pas être garantie sans ce traitement. Voir le [planificateur](operations.md#planificateur).

## Peut-on importer un ancien export SQL ?

Restaurez-le dans une base source séparée, puis connectez l’assistant d’import à cette base. Les images et pièces jointes doivent être transférées séparément. Voir [Importer un ancien site](migration.md).

## Une extension est suspendue ou une mise à jour a échoué

Conservez ses données et ses fichiers de suivi. Suivez le diagnostic de l’écran pour réparer l’[extension](extensions-catalogue.md) ou reprendre la [mise à jour](updates.md#reprendre-apres-une-interruption). Ne réinstallez pas le site pour contourner l’erreur.
