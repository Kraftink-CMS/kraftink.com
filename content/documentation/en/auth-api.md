# Authenticating an application

This API signs a member into a launcher or application. The owner enables **Application connections** in `/admin/settings/api`. Use HTTPS, JSON and `Authorization: Bearer <token>` for authenticated requests.

## Obtaining a personal token

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

`login` accepts a username or email. `name`, `scopes` and `lifetime` are optional. Duration is 15 to 43,200 minutes within the site’s chosen limit. If sign-in requires a CAPTCHA, send its proof in `captcha_response` or the provider field.

A 200 response contains `data.access_token`, `token_type: "Bearer"`, `expires_at`, `scopes` and `user`, with `success: true` and `data.status: "success"`. Store the secret privately, it is shown only at creation or rotation.

With 2FA, the first response is 202 with `data.status: "pending"`, `reason: "2fa"`, `challenge` and `expires_in: 300`. Then send `POST /api/auth/challenge` with the returned challenge and the member’s code:

```json
{
    "challenge": "RETURNED_CHALLENGE",
    "code": "123456"
}
```

`code` accepts a TOTP or recovery code. The challenge lasts five minutes with up to five attempts. Successful validation returns a token as for sign-in without 2FA.

## Using and revoking

| Request | Permission | Result |
| --- | --- | --- |
| `GET /api/auth/me` | `profile:read` | Profile and expiry |
| `GET /api/auth/token` | Valid token | Identity, effective scopes and expiry |
| `POST /api/auth/verify` | `profile:read` | Server-side verification |
| `GET /api/auth/games` | `games:read` | Game identities |
| `POST /api/auth/rotate` | Personal token | New secret, previous one revoked |
| `POST /api/auth/logout` | Valid token | Revocation, 204 response |

`email:read` adds the email address to the profile. Plugins can declare additional [scopes](plugin-api-scopes.md). Each call rechecks current account and resource permissions. Game servers must verify the token with the CMS before trusting the launcher.

Members can also create tokens in `/account/tokens`. These accesses require local sign-in to be allowed. OAuth-only sign-in cannot create them. Rotation keeps the expiry and only scopes still authorised.

## Service tokens

[Service accounts](service-accounts.md) use tokens issued by administration. They call neither `/authenticate` nor `/challenge`. `GET /api/auth/token` describes their identity without requiring `profile:read`. Rotation is managed in the panel.

For news and server status with a service token, see the [site data routes](api-publique.md#authenticated-access).

## Errors

Handle 401 for invalid tokens, 403 for a disabled API or missing permission, 422 for invalid input, 426 for remote connections without HTTPS and 429 for rate limiting. Revocation, expiry and account security changes invalidate the affected accesses.
