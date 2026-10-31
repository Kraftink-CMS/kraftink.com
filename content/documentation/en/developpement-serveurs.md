# Integrate accounts and balances from a server

This API lets a connector manage accounts and balances from the game. It complements the [delivery protocol](developpement-kraftlink.md) with a separate key and permissions.

## Obtain dedicated access

An administrator creates a key under **Servers → Manage link → Account and balance access**, granting only the required operations. The server must use KraftLink, be enabled and belong to the active game. The complete key is shown once. Keep it in the connector’s private configuration. It is separate from delivery tokens and [launcher](auth-api.md) sessions.

The creator’s permissions are checked on every call. Revocation, expiry, changes to the creator’s security state or loss of required permissions invalidate access. Owner, administrator, banned, anonymized, import-locked and mandatory-password-reset accounts cannot be targets of this API.

## HTTP requests

Prefix: `/api/link/accounts`. Use HTTPS, `Authorization: Bearer IDENTIFIER|SECRET`, `Accept: application/json` and `Content-Type: application/json` for writes. Never log secrets, passwords or codes. `{uuid}` is the identifier normalized by the game module, not necessarily a Minecraft-format UUID.

| Method and path | Scope |
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

JSON responses use `success` to indicate success and `data` for the result. The profile returns the account number, name and game identity inside `data`. Balance returns `data.balance_minor` and `data.currency`. Responses are private and uncached. Respect `Retry-After` on `429` and interruptions during maintenance, updates or imports.

## Registration and credential changes

Read `/policy`, present the terms and any CAPTCHA, then send `name`, `email`, `password`, `password_confirmation`, `terms: true`, `terms_version` and `identity: {uuid, username}`. `name` is the website account name, and `identity.username` is the game name. Changed terms must be presented again.

A `201` response creates no session and proves neither the email address nor profile ownership. Follow `data.email_verification_required`, `data.game_verification_required` and `data.continue_url` to finish on the website. Registration and local sign-in must be allowed. The connector cannot supply ranks or privileges.

To change email, send `email` and `current_password`. For a password change, send `password`, `password_confirmation` and `current_password`. Add `code` when the member has an active second factor: a TOTP or single-use recovery code. A changed email needs verification again. These operations revoke affected old access. They do not reset a forgotten password or bypass an external-only account.

## Wallet operations

The body for a credit, debit or balance adjustment contains:

```json
{
    "amount_minor": 1250,
    "currency": "EUR",
    "request_id": "c9d7106b-4c14-4227-aac1-5507291ee149"
}
```

Amounts are integers in the smallest currency unit: `1250` means `12.50 EUR`. Credit and debit require a positive amount, while `set` accepts zero. A debit cannot exceed available balance, and no implicit currency conversion occurs.

Keep the same `request_id` if a response is lost. An identical replay for the same server returns the original result without reapplying the operation, even after key replacement. Reusing the identifier with a different account, amount, operation or currency produces `409`. New operations must use the current site currency.

The response provides `data.operation_id`, `data.transaction_id`, `data.balance_before_minor`, `data.balance_after_minor` and `data.currency`. These balances describe the historical operation. Read `/balance` again for the current balance. These calls create no debt or automatic collection after a refund.

## Verify your integration

Test with trial accounts and funds: insufficient scope, revoked key, second-factor proof, identity from another game, invalid amount and identical or conflicting replays. Simulate a lost response after a committed operation to check that the connector preserves its request identifier.
