# Install KraftLink

KraftLink connects Bukkit, Spigot, Paper, Folia, Velocity and Hytale to KraftInk to report their status, identify online players and run reward commands. Create the connection in the site administration, then enter its token on the server or proxy. For other games and RCON, use the [server connection guide](games.md).

## 1. Prepare the site and server

You need access to **Servers → Game servers** in KraftInk, along with your game server’s files and console. The corresponding game must be active in the CMS.

The game server must be able to reach the site’s HTTPS address. KraftLink contacts the CMS from the game server, without an inbound KraftLink port to open. A site available only from your computer will not be reachable from a game hosting provider.

The Bukkit connector targets **Minecraft 1.8.x starting with 1.8.8 and Java 8**. Use the Java version required by your server or proxy, especially for recent platforms. Check the versions announced by the release. The Hytale connector targets server **0.7.4**. On Folia, the plugins whose commands you execute must also support that platform.

## 2. Add the server in KraftInk

1. Open **Servers → Game servers** in the administration.
2. Click **Add a server**.
3. Enter its name and choose **KraftLink** as the connection method. The site’s active game is used automatically.
4. Enter the connection address used by players and the game port. For example, `play.example.org` and `25565` for a Minecraft server. The address does not include `https://`.
5. Keep the connection active. Separately choose whether the server should appear on the website and whether its players should contribute to the public total, then click **Add server**. Its connection management page opens.

This game address is separate from the site address you will enter in KraftLink. To return to the connection page later, open **Manage connection** on this server’s row.

You can connect several servers. Create a separate entry and token for each one, then install KraftLink on each corresponding server. The three options remain independent:

- An active connection allows communication and deliveries.
- Public visibility controls whether the server entry appears on the website.
- Player counting controls whether its players contribute to the displayed total.

A private server can therefore continue receiving rewards without appearing on the website. To avoid duplicate counts across a network, count each player only once. For example, exclude the lobby or a server that already reports a network total when the corresponding game servers contribute to the total.

On Velocity, KraftLink runs commands in the proxy console. For a reward that affects a Spigot, Paper or Folia server, install KraftLink on that server and target its own connection.

## 3. Create the connection token

1. Under **Manage connection → Connection token**, select **Use as the default server** if this server should receive rewards without a selected destination. Rewards targeting a specific server keep their destination.
2. Click **Generate a new token**.
3. In the confirmation window, enter your 2FA code if it is enabled, otherwise your password. Correct any entry error in this window.
4. After confirmation, the window closes and the token appears on the connection page. Copy it immediately to fill in the configuration file’s `token` field.

**The token is shown only once.** It belongs to this server entry and contains 64 hexadecimal characters. Copy only its value, without adding `Bearer`, and keep it private.

If you closed the page before copying it, create a new token in the same place. This immediately invalidates the previous token. Replace the value in KraftLink’s configuration file and reload its configuration.

The keys under **Account and balance access** are different. They do not belong in this connection’s `token` field.

## 4. Install the correct JAR

Download `KraftLink.jar` from the [KraftLink releases](https://github.com/kraftink-cms/KraftLink/releases). This universal file contains the Bukkit, Velocity and Hytale connectors. The Bukkit variant covers Bukkit, Spigot, Paper and Folia. Choose the universal JAR or one of the three variants below, then download the `.jar` file, not “Source code”.

| Platform | Dedicated variant | Directory |
| --- | --- | --- |
| Bukkit, Spigot, Paper and Folia | `KraftLink-Bukkit-VERSION.jar` | `plugins/` |
| Velocity | `KraftLink-Velocity-VERSION.jar` | `plugins/` |
| Hytale | `KraftLink-Hytale-VERSION.jar` | `mods/` |

Stop the server or proxy, place **one KraftLink JAR per instance** in the appropriate directory, then restart it. This first startup generates the configuration.

On Paper, Spigot and Folia, open `plugins/KraftLink/config.json`. On Velocity, open `config.json` in KraftLink’s data directory under `plugins/`. On Hytale, open `config.json` in the data directory generated for the KraftLink mod. The path to this directory depends on the server installation.

## 5. Fill in the configuration

In the generated file, edit the following fields while keeping the other settings, including `channels` and API paths:

```json
{
    "cms_url": "https://community.example",
    "token": "PASTE_THE_TOKEN_FROM_THE_SERVER_ENTRY_HERE",
    "allowed_command_roots": ["say", "give"]
}
```

- `cms_url` is the site’s base address. If KraftInk is installed at `https://example.org/community`, use that full address. Do not append `/admin` or `/api/link`.
- `token` contains the token created for this server in step 3.
- `allowed_command_roots` contains the exact command names the site may execute, without `/` or arguments. The example authorizes `say` and `give` on Spigot, Paper and Folia. Adapt the list to the commands your platform actually needs.

An empty `allowed_command_roots` list allows status reporting only. To allow a prefixed command such as `minecraft:give`, add that exact root as well. The site cannot extend this list remotely.

Use HTTPS with a certificate trusted by the game server. HTTP is accepted only for testing through `localhost` or a loopback address. In that case, `localhost` refers to the game server’s machine.

Save the file, then run `/kraftlink reload` in the game, or `kraftlink reload` in the console. These commands require the `kraftlink.admin` permission when used in the game.

## 6. Check the connection

Run `/kraftlink status`, or `kraftlink status` from the console. After the first exchange, the state should be `connected`. `waiting` means the connector is still waiting for a usable configuration, while `disconnected` means an exchange failed.

Return to **Manage connection** and refresh the page. The last communication should be recent. By default, KraftLink reports its status every 30 seconds. The player count under **Game servers** also updates after refreshing.

If no status arrives, check that the server is active in the CMS and matches the site’s active game, the site URL is reachable from the game server and the token has not been replaced since you copied it.

## 7. Test a command, then a reward

On Spigot, Paper or Folia, start with a test that grants no reward:

1. Keep `say` in `allowed_command_roots` and reload the configuration if you just added it.
2. Under **Manage connection → Queued console**, enter `say KraftLink is connected` in **Console command**, without `/`.
3. Leave the player field empty and the option to wait for the player unchecked, then click **Send to server**.
4. Check the message in the game or its console and the result in the panel’s history. Commands are fetched every five seconds by default.

In the queued console, you can enter a username or UUID, even if the player is offline or not yet known to the site. Select **Wait for this player to connect** to wait for their presence on this server. Otherwise, the command is sent without waiting for them to connect. With a username, the wait targets the entered name. With a UUID, it targets that identifier.

On Velocity, choose a command registered on the proxy or by a Velocity plugin and authorize its root in the configuration. On Hytale, use a test command supported by your server and authorize its root as well.

Next, prepare a test reward with the correct server and a test player. `{player}` and `{uuid}` use their game identity, not a free-form name. Check the result in the game and under **Servers → In-game deliveries** before opening purchases or votes.

Without an explicit destination, only the default server receives the reward. Requiring player presence leaves the command pending when they are offline.

## Connection or command failures

Check the base URL, the token from the correct server entry, the JAR version and HTTPS access from the game server. If the connection works but a command is refused, check `allowed_command_roots`, command syntax and compatibility of the plugin executing it.

A missing acknowledgement does not prove that a reward was not received. Check server logs and the player’s account before retrying. The connector confirms command acceptance, without guaranteeing the effect of every plugin.

KraftLink records commands in `commands.jsonl` in its data directory. **Include this file in backups and do not delete it to unblock a delivery.** After restoration, reconcile recent deliveries with server logs.

If `/kraftlink uncertain` lists an uncertain command, an authorized administrator can use `/kraftlink resolve IDENTIFIER delivered` to confirm an effect already observed, or `/kraftlink resolve IDENTIFIER retry` to allow another execution after checking. Resume the delivery in the panel if still required. `retry` can duplicate a reward already received.

Custom integrations use the [developer protocol](developpement-kraftlink.md). [Account and balance APIs](developpement-serveurs.md) require separate keys: installing KraftLink does not grant access automatically.
