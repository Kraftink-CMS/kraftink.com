# Read public data

Use this API to display news or server status in an external application. Requests use GET and require no token. Send `Accept: application/json`.

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

## Server status

`GET /api/public/servers` returns `data`, a list of enabled servers for the active game. Each entry exposes `id`, `name`, `game`, `online`, `fresh`, `players_online`, `players_max` and `last_seen_at`.

Status received within 90 seconds gives `fresh=true`. Before the first status, `online=null` means unknown. Stale status gives `online=false` and `null` counters. Responses are cached for 15 seconds.

Internal hosts, secrets and named player lists are not exposed.

## Errors and limits

Routes allow 120 requests per minute and respect site maintenance: JSON 503 responses ask clients to retry later. Unknown languages return 404, and invalid pagination parameters return 422. Handle 429 responses too.

For member authentication, use the [launcher API](auth-api.md). For server accounts and commands, use the [server APIs](developpement-serveurs.md).
