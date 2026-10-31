# Configure external sign-in

To offer Google, Discord or another sign-in service, first create an application with that provider. KraftInk shows the console links and callback URL to use under **External connections**.

## Connect an application

1. Open the service configuration in KraftInk and copy its callback URL.
2. Create a Web application in the provider’s console and register that exact address, including its domain, protocol and any subdirectory.
3. Enter the client identifier and secret in KraftInk, then enable the service.
4. Test sign-in in a private window before changing the site’s sign-in mode.

| Service | Prepare with the provider |
| --- | --- |
| Google | Google Cloud Web application and consent screen |
| Discord | Discord application, OAuth2 section. Sign-in does not need a bot |
| Microsoft | Entra Web application, secret value and supported account types |
| Facebook | Meta application with Facebook Login for the Web |
| Twitch | Application in the Twitch developer console |
| X | Web OAuth 2.0 application and its corresponding credentials |
| Steam, for compatible games | OpenID sign-in without a key to verify identity. The optional Web API key serves public profiles |

For Microsoft, match the tenant to the account types allowed in Entra: `common` for personal and work accounts, `consumers` for personal accounts, `organizations` for work accounts, or your organization’s identifier. For Minecraft ownership checks, also read the [game settings](games.md).

Fix callback errors with the provider or in the [site address](configuration.md). Do not replace the secret of an application already in use to solve a simple URL error. Leaving a secret field empty preserves the saved value.

## Check member access

Keep your owner session open during testing. Check registration for a new member and linking for an existing account. An existing member must first sign in to KraftInk, then link the service from their account: matching email addresses do not automatically merge accounts.

If the provider does not return a usable email address, the member enters and verifies one on the website. Test [email delivery](configuration.md) before requiring external sign-in.

## Disable or replace a service

Before removing a sign-in method, review the affected members and check that they can recover access. Links to choose a password require working email. All requests are stored before the first delivery. With `QUEUE_CONNECTION=sync`, a small batch is attempted after the change commits without cron. Remaining requests, failures and explicitly deferred sending need [scheduled tasks](operations.md).

The panel preserves links and tracks recovery requests. Check delivery failures before retrying. To replace an application already in use, add the new one, have accounts linked, then disable the old one. KraftInk blocks a change that would remove an administrator’s last access without a recovery option.

[Discord linked roles](discord-linked-roles.md) use authorization separate from website sign-in.
