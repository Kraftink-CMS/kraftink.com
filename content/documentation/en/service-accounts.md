# Connecting a bot or service

A service account gives an application its own API access without using a member’s personal account. Manage it in **Service accounts** after enabling **Application connections** in settings.

## Creating access

1. Add a service account with a name and intended use.
2. Approve only the API permissions requested by the application. You can only delegate your own rights.
3. Open its details and create a named token with a duration and the required permissions.
4. Copy the secret shown once into the application’s private configuration.

Use a token per installation so you can disconnect one machine without affecting the others. Both the account and token must allow the permission in use.

## Choosing permissions

Two uses are available without additional plugins:

| Use | API permission | Manager permission required |
| --- | --- | --- |
| News announcement bot | `site:news:read` | `content.manage` |
| Server status monitoring | `site:servers:read` | `servers.manage` |

These permissions read public data only. They do not allow publishing or server commands. Extensions may offer additional permissions.

A service account owns its own resources. Access to personal tickets does not grant access to all site tickets. Member-only profile and game identity scopes are not offered to these accounts.

## Revoking or replacing access

The account page lists tokens, expiry dates and last use. Revoke one token for an installation, or disable the account to block them all.

**Replace token** invalidates the old secret while keeping the same expiry and permission limits. After importing a site, recreate these accesses on the destination.

To use tokens in an application, see the [authentication API](auth-api.md#service-tokens).
