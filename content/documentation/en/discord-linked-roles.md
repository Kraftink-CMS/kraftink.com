# Configure Discord linked roles

Linked roles let Discord assign a role based on criteria from a KraftInk account. Each member authorizes sharing this information. First configure a Discord application for [external sign-in](oauth.md).

## Prepare Discord and KraftInk

1. Under **External connections → Discord linked roles**, select that application and enter its bot token.
2. Copy the callback URL shown into the Discord portal’s OAuth2 section, then the verification URL into the application’s linked-role settings.
3. Choose the criteria to share, enable the service and click **Publish criteria**.
4. In your Discord server, create the linked role with this application and your chosen conditions.
5. Test with a member account before announcing it to the community.

For rank conditions, use the identifiers supplied by the panel: `role_id` is the main rank and `role_power` its priority. A higher value means a higher rank. Registration date and email verification can also be shared without sending the email address itself. Discord accepts up to five criteria.

## Have members authorize sharing

The member opens **My account → Connections → Discord linked roles**, reviews the criteria, then authorizes sharing in Discord. Signing in to the website with Discord is not enough. If this provider is already linked to their account, the member must authorize the same Discord account.

Changing the criteria may require authorization again. Let affected members know after this change.

## If roles are not updating

Check [scheduled tasks](operations.md): criteria do not update instantly. Then check the role conditions in Discord and the link status in KraftInk. Revoked authorization requires the member to repeat the process. Temporary network errors are retried.

After disabling or removing a link, wait for confirmation that shared information has been removed before considering synchronization complete.
