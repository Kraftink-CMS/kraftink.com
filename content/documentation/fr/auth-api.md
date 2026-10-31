# Authentifier un launcher

Cette API connecte un membre depuis un launcher ou une application. Le propriétaire doit l’activer dans **Connexion des applications** (`/admin/settings/api`).

Utilisez HTTPS, JSON et un stockage sécurisé pour les jetons. Les accès ne doivent pas apparaître dans les URL ou les journaux.

## Obtenir un jeton

Envoyez `POST /api/auth/authenticate` :

```json
{
    "login": "player.one",
    "password": "mot-de-passe-du-membre",
    "name": "Mon launcher",
    "scopes": ["profile:read", "games:read"],
    "lifetime": 1440
}
```

`login` accepte un pseudo ou un e-mail, avec `email` comme alias. `name`, `scopes` et `lifetime` sont facultatifs. La durée est exprimée en minutes, de 15 à 43 200. Le mode de connexion du compte et les protections de connexion du site s’appliquent aussi à cette API.

Si un CAPTCHA protège la connexion, joignez sa preuve dans `captcha_response` ou dans le champ propre au fournisseur. Une application doit gérer ce parcours avant de soumettre les identifiants.

Les réponses JSON utilisent `success` pour indiquer la réussite et `data` pour le résultat. Une réponse 200 contient `data.status: "success"`, `data.access_token`, `data.token_type: "Bearer"`, `data.expires_at`, `data.scopes` et `data.user`. Le secret n’est montré qu’à sa création ou rotation.

Avec la 2FA, la réponse initiale est 202 avec `success: true`, `data.status: "pending"`, `data.reason: "2fa"`, `data.challenge` et `data.expires_in: 300`. Aucun jeton n’est encore créé. Envoyez `POST /api/auth/challenge` avec :

```json
{
    "challenge": "valeur-opaque-recue",
    "code": "123456"
}
```

Le code peut être un TOTP ou un code de récupération. Le challenge est utilisable une seule fois, pendant cinq minutes et avec cinq essais au maximum. Un client peut aussi envoyer `code` avec les identifiants sur `/authenticate`.

## Utiliser et révoquer le jeton

Ajoutez `Authorization: Bearer <access_token>`.

| Requête | Droit | Résultat |
| --- | --- | --- |
| `GET /api/auth/me` | `profile:read` | Profil et échéance |
| `GET /api/auth/token` | Jeton valide | Identité du titulaire, scopes effectifs et échéance |
| `POST /api/auth/verify` | `profile:read` | Vérification côté serveur |
| `GET /api/auth/games` | `games:read` | Identités de jeu |
| `POST /api/auth/rotate` | Jeton personnel valide | Nouveau secret, ancien révoqué |
| `POST /api/auth/logout` | Jeton valide | Révocation, réponse 204 |

Les POST de vérification, rotation et révocation acceptent aussi `access_token` dans le corps JSON. La rotation conserve l’échéance et les droits.

Les scopes natifs sont `profile:read`, `games:read` et `email:read`. Les deux premiers sont demandés par défaut, tandis que l’e-mail exige le troisième. Les plugins peuvent ajouter leurs propres scopes, affichés dans **Mes accès API** et dans les réglages de connexion des applications. Une demande ne peut contenir que des scopes d’extensions actives que le compte est actuellement autorisé à utiliser.

Le noyau fournit aussi `site:news:read` et `site:servers:read`, disponibles pour les comptes techniques et les membres autorisés. Les routes `GET /api/site/news`, `GET /api/site/news/{id}` et `GET /api/site/servers` réutilisent les mêmes données publiques que l’API publique, avec un contrôle de jeton et de scope. Le premier droit exige `content.manage`, le second `servers.manage`. Ils ne donnent accès ni aux brouillons et contenus réservés, ni aux secrets et commandes serveur.

Le serveur de jeu doit vérifier le jeton auprès du CMS avant de faire confiance à l’identité transmise par le launcher. Le membre peut également créer un jeton directement depuis `/account/tokens`, choisir ses scopes et sa durée puis confirmer son mot de passe et sa 2FA. Le secret s’affiche une seule fois, sans être enregistré en session.

Un jeton réduit les droits du compte : chaque requête revérifie les permissions actuelles, la disponibilité du plugin et les droits propres à la ressource. Par exemple, `support:tickets:read` permet de lire ses propres tickets et leurs messages publics sur `/api/support/tickets`, sans donner accès aux tickets des autres membres ni aux notes internes. Consultez [les permissions API des plugins](plugin-api-scopes.md) pour les déclarer et choisir les droits d’une application ou d’un bot.

## Expiration et erreurs

Les suspensions, révocations et exigences du compte ou du jeu sont vérifiées à chaque utilisation. Les jetons personnels exigent une connexion locale autorisée sur le site et sur le compte. Une connexion OAuth seule ne suffit pas à en créer. Un changement d’identifiants ou de protection 2FA invalide les anciens accès. Le membre peut les révoquer depuis `/account/tokens`, y compris après désactivation de l’API tant qu’il possède des accès actifs. Une rotation conserve l’échéance et ne reprend que les scopes encore autorisés.

Pour un bot ou un service indépendant des membres, créez un [compte technique](service-accounts.md) depuis l’administration. Son gestionnaire émet et remplace ses jetons sans se connecter au nom du bot. Ces identités ne possèdent ni mot de passe humain, ni e-mail, ni rang. Elles n’utilisent pas `/authenticate` ou `/challenge`. Leur état et leurs scopes approuvés sont contrôlés à chaque requête. `GET /api/auth/token` décrit leur identité technique sans exiger `profile:read`, et leur rotation reste réservée à l’administration.

Traitez les statuts 401 pour un accès invalide, 403 pour une API désactivée ou un droit absent, 422 pour une saisie ou un code incorrect, 426 pour une connexion distante non chiffrée et 429 pour la limitation de débit. Ne transformez pas un refus du CMS en validation locale.
