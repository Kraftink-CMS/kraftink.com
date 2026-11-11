# Connecting voting directories

Install **Vote**, then open **Extensions → Vote → Voting sites**. Get your server credentials from the directories offered for the site’s game.

## Configuring a directory

1. Add its public voting link and requested credentials.
2. If it sends confirmations, save it, then copy the **private URL** into the provider’s settings.
3. Prepare a test reward, vote and check confirmation and delivery.

The private URL contains a secret. Use the public link for players. Replacing the private URL also requires updating it at the directory.

For IP verification, players must keep the same address between voting and verification. For fixed reset times, match the directory’s time zone. A directory missing from the list needs an integration, its link alone cannot verify votes.

## Sending votes to the game with Votifier

If the game offers Votifier, select **Votifier v2** in the directory settings. Select the server or proxy that receives votes, then enter its Votifier port, a service name and a token. Use the same name and token in the receiver configuration. The panel provides an example for the game.

In this mode, the server gives out per-vote rewards. Website points, milestones and goals stay active. If the directory also sends votes directly to the server, turn off direct delivery to avoid duplicates.

## Rewards and retries

Set up the [server connection](games.md) before game commands. `{player}` and `{uuid}` use the game identity. Waiting for a player requires a connection that can verify their presence, such as [KraftLink](kraftlink.md).

[Cron](operations.md#scheduler) handles pending distributions and rankings. Daily and monthly reward periods follow UTC, independently of the directory’s time zone.

Guest voting can grant the configured game commands without a site balance or rank. Minecraft/Hytale commands requiring a UUID or verified presence need an identity linked to an account.

After an interrupted confirmation, open **Votes requiring review** and check the vote at the directory. For an uncertain delivery, check the server log before retrying.
