# Configurer les rôles liés Discord

Les rôles liés permettent à Discord de donner un rôle selon les critères du compte KraftInk. Chaque membre autorise lui-même le partage de ces informations. Configurez d’abord une application Discord pour la [connexion externe](oauth.md).

## Préparer Discord et KraftInk

1. Dans **Connexions externes → Rôles liés Discord**, sélectionnez cette application et renseignez le jeton de son bot.
2. Copiez l’adresse de retour affichée dans la rubrique OAuth2 du portail Discord, puis l’adresse de vérification dans les paramètres des rôles liés de l’application.
3. Choisissez les critères à partager, activez le service et cliquez sur **Publier les critères**.
4. Dans votre serveur Discord, créez le rôle lié avec cette application et les conditions souhaitées.
5. Testez le parcours avec un compte membre avant de l’annoncer à la communauté.

Pour les conditions de rang, utilisez les identifiants fournis par le panneau : `role_id` désigne le rang principal et `role_power` sa priorité. Une valeur plus grande correspond à un rang supérieur. La date d’inscription et la vérification de l’e-mail peuvent aussi être partagées, sans transmettre l’adresse elle-même. Discord accepte cinq critères au maximum.

## Faire autoriser le partage

Le membre ouvre **Mon compte → Connexions → Rôles liés Discord**, consulte les critères, puis autorise le partage dans Discord. Se connecter au site avec Discord ne suffit pas. Si ce fournisseur est déjà associé à son compte, le membre doit autoriser le même compte Discord.

Modifier la liste des critères peut demander une nouvelle autorisation. Prévenez les membres concernés après ce changement.

## Si les rôles ne suivent pas

Vérifiez les [tâches planifiées](operations.md) : les critères ne sont pas actualisés instantanément. Contrôlez ensuite les conditions du rôle côté Discord et l’état de la liaison dans KraftInk. Une autorisation révoquée demande au membre de recommencer le parcours. Une erreur réseau temporaire est réessayée.

Après une désactivation ou un retrait, attendez la confirmation du retrait des informations avant de considérer la synchronisation terminée.
