# Connect voting directories

Install Vote, then prepare your server’s credentials with each directory. The panel offers services compatible with the site’s game and displays their fields.

## Configure and test a directory

1. Add the directory with its public voting link and required credentials: server number, API key or secret.
2. If the service sends confirmations, save the directory first, then copy its **private URL** into the provider’s settings.
3. Prepare a test reward and destination server, then vote with a test account.
4. Check vote confirmation and reward delivery before announcing the link to players.

The private URL contains a secret: never publish it as the voting link. Renewing it invalidates the old address. Update it at the directory too. The provider must reach it without a proxy challenge or firewall restriction.

The player must keep the same IP address between voting and verification for directories that use it. The date time zone must match the directory, particularly for Serveurs-Minecraft.org. A click or browser redirect is not proof of a vote.

## Prepare rewards

For in-game commands, first configure the [server and transport](games.md), then check the actual command and player identity. `{player}` and `{uuid}` refer to the game identity. A reward requiring the player online needs a connection that verifies presence, such as [KraftLink](kraftlink.md).

[Scheduled tasks](operations.md) process pending distributions and rankings. Check that they run if delayed rewards do not arrive. Daily and monthly reward periods follow UTC. A directory’s own reset time zone is separate.

If you allow voting without an account, test that flow too. It permits the in-game commands configured for guests without granting balance, rank or progress to a site account. For Minecraft/Hytale, commands requiring a UUID or verified presence need an account-linked identity.

## Votes or deliveries needing review

After an interruption during remote confirmation, check **Votes to review** and the proof in your directory account. Confirm or reject only after checking: blindly starting again may leave an already consumed confirmation.

For an uncertain in-game command, check delivery tracking and the server log before retrying. A missing confirmation does not prove the player received nothing.

A directory missing from the list needs a dedicated integration. Its voting link alone does not let KraftInk verify votes. Partner mode also requires the provider to send the expected confirmations.
