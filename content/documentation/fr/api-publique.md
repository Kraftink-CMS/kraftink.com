# Lire les données publiques

Cette API permet d’afficher les actualités ou l’état des serveurs dans une application externe. Les requêtes utilisent GET et ne nécessitent aucun jeton. Envoyez `Accept: application/json`.

## Actualités

| Route | Résultat |
| --- | --- |
| `/api/public/news` | Liste paginée |
| `/api/public/news/{id}` | Détail avec le champ HTML `body` |

Paramètres : `locale` parmi les langues du site, `page` à partir de 1 et `per_page` de 1 à 50, avec 15 par défaut. Sans `locale`, la langue principale est utilisée.

```text
GET /api/public/news?locale=fr&page=1&per_page=10
```

Les réponses JSON utilisent `success` pour indiquer la réussite et `data` pour le résultat. La liste renvoie `data.items` et `data.pagination`, qui contient `page`, `per_page`, `total` et `last_page`. Chaque actualité expose `id`, `locale`, `slug`, `title`, `summary`, `url`, `author`, `cover`, `published_at` et `updated_at`. `author` est un nom public ou `null`. `cover` est `null` ou un objet `url/alt/width/height`.

Seuls les contenus publiés accessibles aux visiteurs sont présents. Un compte connecté n’élargit pas la réponse. Une actualité privée, supprimée, future ou dans une autre langue renvoie 404. Les réponses annoncent un cache public de 60 secondes.

## État des serveurs

`GET /api/public/servers` renvoie `data`, une liste des serveurs activés du jeu actif. Chaque entrée expose `id`, `name`, `game`, `online`, `fresh`, `players_online`, `players_max` et `last_seen_at`.

Un état reçu depuis 90 secondes au plus donne `fresh=true`. Avant le premier état, `online=null` signifie inconnu. Un état ancien donne `online=false` et des compteurs `null`. La réponse est mise en cache pendant 15 secondes.

Les hôtes internes, secrets et listes nominatives des joueurs ne sont pas exposés.

## Erreurs et limites

Les routes sont limitées à 120 requêtes par minute et respectent la maintenance du site : une réponse JSON 503 invite à réessayer plus tard. Une langue inconnue renvoie 404. Des paramètres de pagination invalides renvoient 422. Gérez aussi les réponses 429.

Pour authentifier un membre, utilisez l’[API des launchers](auth-api.md). Pour les comptes et commandes d’un serveur, utilisez les [API serveur](developpement-serveurs.md).
