# Configurer les connexions externes

Pour proposer une connexion Google, Discord ou un autre service, créez d’abord une application chez ce fournisseur. KraftInk affiche les liens de sa console et l’adresse de retour à utiliser dans **Connexions externes**.

## Relier une application

1. Ouvrez la configuration du service dans KraftInk et copiez son adresse de retour.
2. Dans la console du fournisseur, créez une application Web et enregistrez exactement cette adresse, avec le même domaine, protocole et éventuel sous-dossier.
3. Reportez l’identifiant client et le secret dans KraftInk, puis activez le service.
4. Testez une connexion dans une fenêtre privée avant de modifier le mode de connexion du site.

| Service | À préparer chez le fournisseur |
| --- | --- |
| Google | Application Web Google Cloud et écran de consentement |
| Discord | Application Discord, rubrique OAuth2. Aucun bot n’est nécessaire pour la connexion |
| Microsoft | Application Web Entra, valeur du secret et types de comptes autorisés |
| Facebook | Application Meta avec connexion Facebook pour le Web |
| Twitch | Application de la console développeur Twitch |
| X | Application Web OAuth 2.0 et identifiants correspondants |
| Steam, pour les jeux compatibles | Connexion OpenID. Aucune clé n’est nécessaire pour prouver l’identité. La clé Web API facultative sert aux profils publics |

Pour Microsoft, faites correspondre l’annuaire aux types de comptes autorisés dans Entra : `common` pour personnels et professionnels, `consumers` pour personnels, `organizations` pour professionnels, ou l’identifiant de votre organisation. Pour vérifier la possession de Minecraft, consultez aussi les [réglages du jeu](games.md).

Une erreur d’adresse de retour se corrige chez le fournisseur ou dans l’[adresse du site](configuration.md). Ne remplacez pas le secret d’une application déjà utilisée pour résoudre une simple erreur d’URL. Un champ secret laissé vide conserve sa valeur enregistrée.

## Vérifier l’accès des membres

Gardez votre session de propriétaire ouverte pendant les essais. Vérifiez l’inscription d’un nouveau membre et l’association à un compte existant. Un membre déjà inscrit doit d’abord se connecter à KraftInk, puis associer le service depuis son compte : une même adresse e-mail ne fusionne pas automatiquement les comptes.

Si le fournisseur ne transmet pas d’adresse exploitable, le membre la renseigne et la confirme sur le site. Testez donc la [messagerie](configuration.md) avant d’imposer une connexion externe.

## Désactiver ou remplacer un service

Avant de retirer un moyen de connexion, consultez l’aperçu des membres concernés et vérifiez qu’ils pourront récupérer leur accès. Les liens pour choisir un mot de passe nécessitent une messagerie fonctionnelle. Toutes les demandes sont enregistrées avant le premier envoi. Avec `QUEUE_CONNECTION=sync`, un petit lot est tenté après validation du changement, sans cron. Le surplus, les échecs et les envois explicitement différés nécessitent les [tâches planifiées](operations.md).

Le panneau conserve les associations et propose le suivi des récupérations. Vérifiez les échecs d’envoi avant de relancer les demandes. Pour remplacer une application utilisée, ajoutez la nouvelle, faites associer les comptes, puis désactivez l’ancienne. KraftInk bloque un changement qui retirerait le dernier accès d’un responsable sans solution de récupération.

Les [rôles liés Discord](discord-linked-roles.md) utilisent une autorisation séparée de la connexion au site.
