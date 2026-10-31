# External sign-in and Discord

To offer Google, Discord or another sign-in service, create an application with that provider. **External connections** displays its console link and the callback address to register.

## Connecting an application

1. Copy the callback address shown in KraftInk.
2. Create a web application with the provider and register that exact address.
3. Enter the client ID and secret in KraftInk, then enable the service.
4. Test registration and linking to an existing account in a private browser window.

| Service | Setup required |
| --- | --- |
| Google | Google Cloud web application and consent screen |
| Discord | Discord application, OAuth2 section. Sign-in alone does not require a bot |
| Microsoft | Entra web application, secret and allowed account types |
| Facebook | Meta application with Facebook Login for the Web |
| Twitch | Application in the Twitch developer console |
| X | OAuth 2.0 web application |
| Steam, depending on the game | OpenID sign-in. An optional Web API key provides public profiles |

For Microsoft, match the directory to the allowed accounts: `common`, `consumers`, `organizations` or your organisation identifier. [Minecraft verification](games.md#verifying-identities) also requires linking the game profile.

An existing member signs into the site first, then links the provider from their account. Matching email addresses do not merge accounts. If the provider does not supply a usable address, the member enters and verifies it in KraftInk.

## Removing a sign-in method

Before disabling a service, review affected members in the preview and check that [email delivery](configuration.md#email) works for account recovery. The panel tracks these requests. [Cron](operations.md#scheduler) handles deferred sends and retries.

Keep your owner session open during testing and check your own recovery option before changing the sign-in mode.

## Discord linked roles

Linked roles assign a Discord role based on KraftInk account criteria. They require member consent separate from site sign-in.

1. In **External connections → Discord linked roles**, select the Discord application and enter its bot token.
2. Register the callback address in OAuth2 and the verification address in the application’s linked-role settings.
3. Choose the criteria, enable the service and click **Publish criteria**.
4. In your Discord server, create a linked role with this application and its conditions.

The panel provides `role_id` for the main rank and `role_power` for its priority. A larger value means a higher rank. Registration date and email verification can also be criteria without sharing the address. Discord accepts up to five criteria.

Members consent in **My account → Connections → Discord linked roles**, using the same Discord account if already linked. Scheduled tasks refresh the criteria. If roles do not update, check cron, role conditions and consent status.
