# Relier les annuaires de vote

Installez Vote et préparez les identifiants de votre serveur chez les annuaires proposés pour le jeu du site.

## Configurer un annuaire

1. Ajoutez son lien public de vote et les identifiants demandés.
2. S’il envoie une confirmation, enregistrez puis copiez l’**URL privée** dans ses paramètres chez le fournisseur.
3. Préparez une récompense d’essai, votez et vérifiez sa confirmation puis son attribution.

L’URL privée contient un secret. Utilisez le lien public pour les joueurs. Renouveler l’URL privée demande aussi de la remplacer chez l’annuaire.

Pour une vérification par IP, le joueur doit garder la même adresse entre le vote et sa vérification. Pour une remise à zéro à heure fixe, faites correspondre le fuseau à celui de l’annuaire. Un annuaire absent du choix demande une intégration, son lien seul ne permet pas de vérifier les votes.

## Récompenses et reprises

Configurez la [connexion du serveur](games.md) avant les commandes en jeu. `{player}` et `{uuid}` utilisent l’identité de jeu. L’attente d’un joueur exige une liaison capable de vérifier sa présence, comme [KraftLink](kraftlink.md).

Le [cron](operations.md#planificateur) traite les distributions en attente et les classements. Les périodes quotidiennes et mensuelles des récompenses suivent UTC, indépendamment du fuseau de l’annuaire.

Le vote invité peut donner les commandes en jeu prévues, sans solde ni rang sur le site. Les commandes Minecraft/Hytale qui exigent un UUID ou une présence vérifiée demandent une identité liée à un compte.

En cas de confirmation interrompue, consultez **Votes à vérifier** et la preuve chez l’annuaire. Pour une livraison incertaine, contrôlez le journal du serveur avant relance.
