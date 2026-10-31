# Intégrer les comptes et soldes depuis un serveur

Cette API permet à un connecteur de gérer les comptes et soldes depuis le jeu. Elle complète le [protocole de livraison](developpement-kraftlink.md) avec une clé et des permissions distinctes.

## Obtenir un accès dédié

Le responsable crée une clé dans **Serveurs → Gérer la liaison → Accès aux comptes et soldes**, avec les seules opérations nécessaires. Le serveur doit utiliser KraftLink, être activé et appartenir au jeu actif. La clé complète apparaît une fois. Gardez-la dans la configuration privée du connecteur. Elle est distincte des jetons de livraison et des sessions [launcher](auth-api.md).

Les droits de son créateur sont revérifiés à chaque appel. Une révocation, une expiration, un changement de sécurité du créateur ou la perte des permissions nécessaires invalide l’accès. Les comptes propriétaires, administrateurs, bannis, anonymisés, verrouillés à l’import ou soumis au renouvellement du mot de passe ne sont pas des cibles de cette API.

## Requêtes HTTP

Préfixe : `/api/link/accounts`. Utilisez HTTPS, `Authorization: Bearer IDENTIFIANT|SECRET`, `Accept: application/json` et `Content-Type: application/json` pour les écritures. Ne journalisez jamais les secrets, mots de passe ou codes. `{uuid}` désigne l’identifiant normalisé par le module du jeu, pas nécessairement un UUID au format Minecraft.

| Méthode et chemin | Portée |
| --- | --- |
| `GET /policy` | `account:create` |
| `POST /register` | `account:create` |
| `GET /players/{uuid}` | `profile:read` |
| `GET /players/{uuid}/balance` | `wallet:read` |
| `POST /players/{uuid}/email` | `account:email` |
| `POST /players/{uuid}/password` | `account:password` |
| `POST /players/{uuid}/balance/credit` | `wallet:credit` |
| `POST /players/{uuid}/balance/debit` | `wallet:debit` |
| `POST /players/{uuid}/balance/set` | `wallet:set` |

Les réponses JSON utilisent `success` pour indiquer la réussite et `data` pour le résultat. Le profil renvoie dans `data` le numéro du compte, son pseudo et son identité de jeu. Le solde renvoie `data.balance_minor` et `data.currency`. Les réponses sont privées et sans cache. Respectez `Retry-After` sur `429`, ainsi que les interruptions pendant une maintenance, une mise à jour ou un import.

## Inscription et modification d’identifiants

Lisez `/policy`, présentez les conditions et le CAPTCHA éventuel, puis envoyez `name`, `email`, `password`, `password_confirmation`, `terms: true`, `terms_version` et `identity: {uuid, username}`. `name` est le pseudo du compte du site et `identity.username` celui du jeu. Une modification des conditions impose leur présentation à nouveau.

La réponse `201` ne crée aucune session et ne prouve ni l’e-mail ni la possession du profil. Suivez `data.email_verification_required`, `data.game_verification_required` et `data.continue_url` pour terminer sur le site. L’inscription et la connexion locale doivent être autorisées. Aucun rang ou privilège ne peut être fourni par le connecteur.

Pour modifier l’e-mail, envoyez `email` et `current_password`. Pour le mot de passe, envoyez `password`, `password_confirmation` et `current_password`. Ajoutez `code` si le second facteur du membre est actif : TOTP ou code de récupération à usage unique. Une adresse changée doit être vérifiée à nouveau. Ces opérations révoquent les anciens accès concernés. Elles ne servent pas à réinitialiser un mot de passe oublié ou à contourner un compte uniquement externe.

## Opérations de portefeuille

Le corps d’un crédit, débit ou réglage contient :

```json
{
    "amount_minor": 1250,
    "currency": "EUR",
    "request_id": "c9d7106b-4c14-4227-aac1-5507291ee149"
}
```

Le montant est entier et exprimé dans la plus petite unité : `1250` signifie `12,50 EUR`. Crédit et débit exigent un montant positif, tandis que `set` accepte zéro. Un débit ne peut pas dépasser le solde disponible et aucune conversion implicite n’est faite.

Conservez le même `request_id` si une réponse est perdue. Son rejeu strict, pour le même serveur, renvoie le résultat initial sans réappliquer l’opération, même après remplacement de la clé. Réutiliser cet identifiant avec un autre compte, montant, type ou devise produit `409`. Une nouvelle opération doit utiliser la devise actuelle du site.

La réponse fournit `data.operation_id`, `data.transaction_id`, `data.balance_before_minor`, `data.balance_after_minor` et `data.currency`. Ces soldes décrivent l’opération historique. Relisez `/balance` pour connaître le solde courant. Ces appels ne créent ni dette ni recouvrement automatique après remboursement.

## Vérifier votre intégration

Testez avec des comptes et fonds d’essai : portée insuffisante, clé révoquée, preuve de second facteur, identité d’un autre jeu, montant invalide et rejeu identique ou divergent. Simulez une réponse perdue après validation pour vérifier que le connecteur conserve son identifiant de requête.
