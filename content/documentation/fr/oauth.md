# Connexions externes et Discord

Pour proposer la connexion avec Google, Discord ou un autre service, créez une application chez ce fournisseur. **Connexions externes** affiche le lien de sa console et l’adresse de retour à enregistrer.

## Relier une application

1. Copiez l’adresse de retour affichée dans KraftInk.
2. Créez une application Web chez le fournisseur et enregistrez exactement cette adresse.
3. Reportez l’identifiant client et le secret dans KraftInk, puis activez le service.
4. Testez une inscription et l’association à un compte existant dans une fenêtre privée.

| Service | Configuration à préparer |
| --- | --- |
| Google | Application Web Google Cloud et écran de consentement |
| Discord | Application Discord, rubrique OAuth2. La connexion seule ne demande pas de bot |
| Microsoft | Application Web Entra, secret et types de comptes autorisés |
| Facebook | Application Meta avec connexion Facebook pour le Web |
| Twitch | Application dans la console développeur Twitch |
| X | Application Web OAuth 2.0 |
| Steam, selon le jeu | Connexion OpenID. La clé Web API facultative sert aux profils publics |

Pour Microsoft, faites correspondre l’annuaire aux comptes autorisés : `common`, `consumers`, `organizations` ou l’identifiant de votre organisation. La [vérification Minecraft](games.md#verifier-les-identites) demande aussi l’association du profil de jeu.

Un membre existant se connecte d’abord au site, puis associe le fournisseur depuis son compte. Une même adresse e-mail ne fusionne pas les comptes. Si le service ne fournit pas d’adresse exploitable, le membre doit la renseigner et la confirmer dans KraftInk.

## Retirer un moyen de connexion

Avant de désactiver un service, consultez les membres concernés dans l’aperçu et assurez-vous que la [messagerie](configuration.md#e-mails) fonctionne pour leur récupération d’accès. Le panneau permet de suivre ces demandes. Le [cron](operations.md#planificateur) prend en charge les envois différés et leurs reprises.

Gardez votre session de propriétaire ouverte pendant les essais et vérifiez votre propre solution de récupération avant de changer le mode de connexion.

## Rôles liés Discord

Les rôles liés attribuent un rôle Discord selon les critères du compte KraftInk. Ils demandent une autorisation du membre distincte de la connexion au site.

1. Dans **Connexions externes → Rôles liés Discord**, sélectionnez l’application Discord et renseignez le jeton de son bot.
2. Enregistrez l’adresse de retour dans OAuth2 et l’adresse de vérification dans les paramètres des rôles liés de l’application.
3. Choisissez les critères, activez le service et cliquez sur **Publier les critères**.
4. Dans le serveur Discord, créez le rôle lié avec cette application et ses conditions.

Le panneau fournit `role_id` pour le rang principal et `role_power` pour sa priorité. Une valeur plus grande représente un rang supérieur. La date d’inscription et la vérification de l’e-mail peuvent aussi servir de critères, sans transmettre l’adresse. Discord accepte cinq critères au maximum.

Le membre autorise le partage dans **Mon compte → Connexions → Rôles liés Discord**, avec le même compte Discord que celui déjà associé. Les critères sont actualisés par les tâches planifiées. Si les rôles ne suivent pas, vérifiez le cron, les conditions du rôle et l’état de l’autorisation.
