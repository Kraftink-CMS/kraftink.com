# Authenticate a launcher

This API signs a member into a launcher or application. The site owner must enable it in **Application sign-in** (`/admin/settings/api`).

Use HTTPS, JSON and secure token storage. Credentials and tokens must stay out of URLs and logs.

## Obtain a token

Send `POST /api/auth/authenticate`:

```json
{
    "login": "player.one",
    "password": "member-password",
    "name": "My launcher",
    "scopes": ["profile:read", "games:read"],
    "lifetime": 1440
}
```

`login` accepts a username or email. `email` is an alias. `name`, `scopes` and `lifetime` are optional. Lifetime is in minutes, from 15 to 43,200. Account sign-in modes and site login protections also apply to this API.

When login is CAPTCHA-protected, include its proof in `captcha_response` or the provider-specific field. Applications must handle this flow before submitting credentials.

JSON responses use `success` to indicate success and `data` for the result. A 200 response contains `data.status: "success"`, `data.access_token`, `data.token_type: "Bearer"`, `data.expires_at`, `data.scopes` and `data.user`. The secret is shown only upon creation or rotation.

With 2FA, the initial response is 202 with `success: true`, `data.status: "pending"`, `data.reason: "2fa"`, `data.challenge` and `data.expires_in: 300`. No token is created yet. Send `POST /api/auth/challenge` with:

```json
{
    "challenge": "received-opaque-value",
    "code": "123456"
}
```

The code can be TOTP or a recovery code. Challenges are single-use, last five minutes and allow at most five attempts. A client can also send `code` with credentials to `/authenticate`.

## Use and revoke a token

Add `Authorization: Bearer <access_token>`.

| Request | Scope | Result |
| --- | --- | --- |
| `GET /api/auth/me` | `profile:read` | Profile and expiry |
| `POST /api/auth/verify` | `profile:read` | Server-side verification |
| `GET /api/auth/games` | `games:read` | Game identities |
| `POST /api/auth/rotate` | Valid token | New secret, old token revoked |
| `POST /api/auth/logout` | Valid token | Revocation, 204 response |

Verification, rotation and revocation POST requests also accept `access_token` in JSON. Rotation preserves the expiry and scopes.

Available scopes are `profile:read`, `games:read` and `email:read`. The first two are requested by default. Email requires the third. Game servers must verify tokens with the CMS before trusting identities supplied by a launcher.

## Expiry and errors

Suspensions, revocation and account/game requirements are checked on every use. Credential or 2FA changes invalidate previous access. Members can revoke tokens at `/account/tokens`.

Handle 401 for invalid access, 403 for disabled APIs or missing scopes, 422 for invalid input or codes, 426 for unencrypted remote connections and 429 for rate limits. Never turn a CMS refusal into local validation.
