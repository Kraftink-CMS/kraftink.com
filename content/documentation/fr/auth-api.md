# Authentifier une application

Cette API connecte un membre depuis un launcher ou une application. Le propriétaire active **Connexion des applications** dans `/admin/settings/api`. Utilisez HTTPS, JSON et `Authorization: Bearer <jeton>` pour les requêtes authentifiées.

## Obtenir un jeton personnel

Envoyez `POST /api/auth/authenticate` :

```json
{
    "login": "player.one",
    "password": "mot-de-passe-du-membre",
    "name": "My launcher",
    "scopes": ["profile:read", "games:read"],
    "lifetime": 1440
}
```

`login` accepte un pseudo ou un e-mail. `name`, `scopes` et `lifetime` sont facultatifs. La durée va de 15 à 43 200 minutes, dans la limite choisie par le site. Si la connexion exige un CAPTCHA, envoyez sa preuve dans `captcha_response` ou le champ du fournisseur.

Une réponse 200 contient `data.access_token`, `token_type: "Bearer"`, `expires_at`, `scopes` et `user`, avec `success: true` et `data.status: "success"`. Stockez le secret en privé, il n’est affiché qu’à sa création ou rotation.

Avec la 2FA, la première réponse est 202 avec `data.status: "pending"`, `reason: "2fa"`, `challenge` et `expires_in: 300`. Envoyez ensuite `POST /api/auth/challenge` avec le challenge reçu et le code du membre :

```json
{
    "challenge": "CHALLENGE_RECU",
    "code": "123456"
}
```

`code` accepte un TOTP ou un code de récupération. Le challenge dure cinq minutes, avec cinq essais au maximum. Une validation réussie renvoie le jeton comme lors d’une connexion sans 2FA.

## Utiliser et révoquer

| Requête | Droit | Résultat |
| --- | --- | --- |
| `GET /api/auth/me` | `profile:read` | Profil et échéance |
| `GET /api/auth/token` | Jeton valide | Identité, scopes effectifs et échéance |
| `POST /api/auth/verify` | `profile:read` | Vérification côté serveur |
| `GET /api/auth/games` | `games:read` | Identités de jeu |
| `POST /api/auth/rotate` | Jeton personnel | Nouveau secret, ancien révoqué |
| `POST /api/auth/logout` | Jeton valide | Révocation, réponse 204 |

`email:read` ajoute l’adresse e-mail au profil. Les plugins peuvent déclarer d’autres [scopes](plugin-api-scopes.md). Chaque appel revérifie les droits actuels du compte et de la ressource. Un serveur de jeu doit vérifier le jeton auprès du CMS avant de faire confiance au launcher.

Le membre peut aussi créer un jeton dans `/account/tokens`. Ces accès demandent une connexion locale autorisée. Une connexion OAuth seule ne permet pas leur création. La rotation conserve l’échéance et les seuls scopes encore autorisés.

## Jetons de service

Les [comptes techniques](service-accounts.md) utilisent un jeton émis par l’administration. Ils n’appellent ni `/authenticate` ni `/challenge`. `GET /api/auth/token` décrit leur identité sans exiger `profile:read`. Leur rotation se fait dans le panneau.

Pour les actualités et états de serveurs avec un jeton de service, consultez les [routes de données du site](api-publique.md#acces-authentifie).

## Erreurs

Traitez 401 pour un jeton invalide, 403 pour une API désactivée ou un droit absent, 422 pour une saisie incorrecte, 426 pour une connexion distante sans HTTPS et 429 pour la limitation de débit. La révocation, l’expiration et les changements de sécurité du compte invalident les accès concernés.
