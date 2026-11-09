# Connecting a server with KraftLink

KraftLink sends a server’s status and online players to KraftInk, then retrieves commands to execute. It supports Bukkit, Spigot, Paper, Folia, Velocity and Hytale. For other connections, see [game servers](games.md).

## Creating the connection in the CMS

1. Enable the matching game in **Games and identities**.
2. In **Servers → Game servers**, add a server using **KraftLink**.
3. Enter the address and port of the server to connect, without `https://`.
4. In **Manage connection → Connection token**, create and copy a token. It is shown once.

Create a record and token per server. The default server receives rewards without an explicit destination. On the [primary server](configuration.md#game-connection-address) record, choose the address and port display shown to players. Its status also supplies the website’s player counter. Other connections remain available for rewards.

On Velocity, commands execute on the proxy. To act on a Paper server, install KraftLink there and target its connection.

### Connect a proxy and its game servers

Create a separate server entry and token for the proxy and for each game server that uses KraftLink. Each installation uses its own data directory. A command or plugin operation intended for a server entry is delivered to that entry's connector.

KraftLink creates the `instance-id` file on its first start. Keep it during restarts and updates and let each new installation generate its own. If two recent installations use the same token with different identifiers, the CMS rejects the second with status `409`. The binding expires after about two hours of inactivity. Rotating the token lets a new installation connect immediately.

In-game sign-in, AuthMe and Bedrock verification continue to use the connection selected for each feature. When in-game sign-in is configured on Velocity, the proxy can offer it to players on its game servers. Plugins on those servers can use their own connections at the same time.

## Installing the connector

Download `KraftLink.jar` from [KraftLink releases](https://github.com/kraftink-cms/KraftLink/releases). You can also choose a dedicated variant:

| Platform | Variant | Installation directory |
| --- | --- | --- |
| Bukkit, Spigot, Paper, Folia | `KraftLink-Bukkit-VERSION.jar` | `plugins/` |
| Velocity | `KraftLink-Velocity-VERSION.jar` | `plugins/` |
| Hytale | `KraftLink-Hytale-VERSION.jar` | `mods/` |

Stop the server, add **one KraftLink JAR per instance**, then restart. The Bukkit variant targets Minecraft 1.8.x from 1.8.8. The Hytale connector targets server 0.7.4. Use the Java version required by your server and check the compatibility stated in the release.

Open `plugins/KraftLink/config.json` on Bukkit, or the generated KraftLink data directory’s `config.json` on Velocity/Hytale. Edit these fields without removing the other settings:

```json
{
    "cms_url": "https://community.example",
    "token": "TOKEN_FROM_THE_SERVER_RECORD",
    "allowed_command_roots": ["say", "give"]
}
```

- `cms_url` is the site’s HTTPS address, including any subdirectory, without `/admin` or `/api/link`.
- `token` is the connection token without a `Bearer` prefix. Account and balance access keys are separate.
- `allowed_command_roots` lists allowed commands without `/` or arguments. An empty list disables command polling. To use `minecraft:give`, add that exact root.

The game server must be able to reach the site over HTTPS. No incoming KraftLink port is required. Run `kraftlink reload` in the console, then check `kraftlink status`: the expected state is `connected`.

## Enable Bedrock verification

Install Floodgate and connect KraftLink on the server or proxy used for Bedrock verification. In the CMS Minecraft settings, select that server, then choose the **Bedrock verification command**.

- `/link` is the default. KraftLink registers it at startup on Velocity and supported versions of Paper and Folia if the name is free.
- Choose `/kraftlink link` if the server does not support the shortcut or another plugin already uses `/link`.

## Set polling intervals

Intervals in `config.json` are in seconds. KraftLink batches operations that are due at the same time.

| Setting | Operation | Default | Range |
| --- | --- | --- | --- |
| `heartbeat_seconds` | Update server status | 30 s | 10 to 3,600 s |
| `poll_seconds` | Claim commands | 5 s | 1 to 300 s |
| `sign_in_poll_seconds` | Poll for in-game sign-in requests | 3 s | 1 to 30 s |

Use `operation_poll_seconds` to override the interval of an operation added by an extension. Set its name to a value between 1 and 300, for example `"operation_poll_seconds": {"example.status": 20}`. [Protocol and extension integration](developpement-kraftlink.md)

## Testing a command

On Bukkit, Paper or Folia, allow `say`, then send `say KraftLink is connected` from **Manage connection → Deferred console**, without a player or online requirement. Check the result in the game and panel history.

For a reward, select the destination server and a test player. `{player}` and `{uuid}` use their game identity. The online requirement keeps the command pending until the player joins that server.

## Failed or uncertain delivery

Check the site address, token, allowed commands and their availability on the platform. If the token is lost, create a new one and replace it in the connector.

A missing acknowledgement may follow an executed command. Check the player’s account and server logs before retrying. Include `commands.jsonl` in connector backups.

`kraftlink uncertain` lists uncertain commands. After checking, `kraftlink resolve IDENTIFIER delivered` confirms an observed execution and `kraftlink resolve IDENTIFIER retry` allows another attempt. Retrying may duplicate a reward already received.
