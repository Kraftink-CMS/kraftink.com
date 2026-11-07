# Read public data

Use these GET routes to show news or server status in an application. `/api/public/` routes do not require a token. Send `Accept: application/json`.

## News

| Route | Result |
| --- | --- |
| `/api/public/news` | Paginated list |
| `/api/public/news/{id}` | Detail including HTML `body` |

Parameters are `locale` from the site’s enabled languages, `page` starting at 1 and `per_page` from 1 to 50, defaulting to 15. Omitting `locale` uses the primary language.

```text
GET /api/public/news?locale=en&page=1&per_page=10
```

JSON responses use `success` to indicate success and `data` for the result. Lists return `data.items` and `data.pagination`, which contains `page`, `per_page`, `total` and `last_page`. Each news entry exposes `id`, `locale`, `slug`, `title`, `summary`, `url`, `author`, `cover`, `published_at` and `updated_at`. `author` is a public name or `null`. `cover` is `null` or an object with `url/alt/width/height`.

Only published content accessible to visitors is included. A signed-in account does not broaden the response. Private, deleted, future or other-language entries return 404. Responses advertise a 60-second public cache.

## Game connection and online players

`GET /api/public/servers` returns a `data` object with `address`, the connection address of the active game’s primary server, and `players_online` and `players_max`, its counters. The `address` field respects the port display setting saved on that server. Without a primary server, all three values stay `null`.

The counters use only the primary server’s status received within 90 seconds. If their public display is disabled on the server record, they stay `null`. A disabled connection or an unavailable measurement also gives `null` counters while keeping the server address. Other servers are never added to the count. The response advertises a 15-second HTTP cache.

The names, addresses and status of other linked servers, secrets and named player lists are not exposed.

## Errors and limits

Routes allow 120 requests per minute and respect site maintenance: JSON 503 responses ask clients to retry later. Unknown languages return 404, and invalid pagination parameters return 422. Handle 429 responses too.

For member authentication, use the [launcher API](auth-api.md). For server accounts and commands, use the [server APIs](developpement-serveurs.md).

## Authenticated access

The same data is available with a personal or [service account](service-accounts.md) token:

| Routes | Scope | Account permission |
| --- | --- | --- |
| `/api/site/news`, `/api/site/news/{id}` | `site:news:read` | `content.manage` |
| `/api/site/servers` | `site:servers:read` | `servers.manage` |

These routes allow 90 requests per minute. Their scopes do not expand content visibility. Token behaviour is covered in [authentication](auth-api.md).
