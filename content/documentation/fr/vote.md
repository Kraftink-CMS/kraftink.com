# Relier les annuaires de vote

Installez Vote, puis préparez les identifiants de votre serveur chez chaque annuaire. Le panneau propose les services compatibles avec le jeu du site et affiche leurs champs.

## Configurer et tester un annuaire

1. Ajoutez l’annuaire avec son lien public de vote et les identifiants demandés : numéro du serveur, clé API ou secret.
2. Si le service envoie une confirmation, enregistrez d’abord l’annuaire puis copiez **l’URL privée** dans ses paramètres chez le fournisseur.
3. Préparez une récompense d’essai et son serveur destinataire, puis votez avec un compte de test.
4. Vérifiez la confirmation du vote et son attribution avant d’annoncer le lien aux joueurs.

L’URL privée contient un secret : ne la publiez pas comme lien de vote. Son renouvellement invalide l’ancienne. Remplacez-la aussi chez l’annuaire. Le fournisseur doit pouvoir la joindre sans challenge du proxy ni restriction du pare-feu.

Le joueur garde la même adresse IP entre le vote et sa vérification pour les annuaires qui l’utilisent. Le fuseau des dates doit correspondre à celui de l’annuaire, notamment pour Serveurs-Minecraft.org. Un clic ou une redirection de navigateur ne constitue pas une preuve de vote.

## Préparer les récompenses

Pour les commandes en jeu, configurez d’abord le [serveur et son transport](games.md), puis vérifiez la commande réelle et l’identité du joueur. `{player}` et `{uuid}` désignent l’identité de jeu. Une récompense exigeant la présence du joueur doit utiliser une liaison capable de la vérifier, comme [KraftLink](kraftlink.md).

Les [tâches planifiées](operations.md) traitent les distributions en attente et les classements. Vérifiez leur exécution si les récompenses différées n’arrivent pas. Les périodes quotidiennes et mensuelles des récompenses suivent UTC. Le fuseau de remise à zéro propre à un annuaire est indépendant.

Si vous autorisez le vote sans compte, essayez aussi ce parcours. Il permet les commandes en jeu prévues pour les invités, sans attribuer de solde, de rang ou de progression à un compte du site. Pour Minecraft/Hytale, les commandes nécessitant un UUID ou une présence vérifiée demandent une identité liée au compte.

## Vote ou livraison à vérifier

Après une interruption lors de la confirmation distante, consultez **Votes à vérifier** et la preuve dans votre espace chez l’annuaire. Confirmez ou refusez seulement après cette vérification : recommencer aveuglément peut laisser une confirmation déjà consommée.

Pour une commande en jeu incertaine, consultez le suivi des livraisons et le journal du serveur avant toute relance. Une confirmation absente ne prouve pas que le joueur n’a rien reçu.

Un annuaire absent du choix nécessite une intégration dédiée. Son simple lien de vote ne permet pas à KraftInk de vérifier les votes. Le mode partenaire exige aussi que le fournisseur sache envoyer les confirmations attendues.
