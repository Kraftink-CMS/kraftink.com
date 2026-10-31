# Connecting a server with KraftLink

KraftLink sends a server’s status and online players to KraftInk, then retrieves commands to execute. It supports Bukkit, Spigot, Paper, Folia, Velocity and Hytale. For other connections, see [game servers](games.md).

## Creating the connection in the CMS

1. Enable the matching game in **Games and identities**.
2. In **Servers → Game servers**, add a server using **KraftLink**.
3. Enter the address and port used by players, without `https://`.
4. In **Manage connection → Connection token**, create and copy a token. It is shown once.

Create a record and token per server. The default server receives rewards without an explicit destination. Connection activation, public display and player counting are independent. On a network, avoid counting both proxy players and the same players on connected servers.

On Velocity, commands execute on the proxy. To act on a Paper server, install KraftLink there and target its connection.

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
- `allowed_command_roots` lists allowed commands without `/` or arguments. An empty list only allows status updates. To use `minecraft:give`, add that exact root.

The game server must be able to reach the site over HTTPS. No incoming KraftLink port is required. Run `kraftlink reload` in the console, then check `kraftlink status`: the expected state is `connected`.

## Testing a command

On Bukkit, Paper or Folia, allow `say`, then send `say KraftLink is connected` from **Manage connection → Deferred console**, without a player or online requirement. Check the result in the game and panel history.

For a reward, select the destination server and a test player. `{player}` and `{uuid}` use their game identity. The online requirement keeps the command pending until the player joins that server.

## Failed or uncertain delivery

Check the site address, token, allowed commands and their availability on the platform. If the token is lost, create a new one and replace it in the connector.

A missing acknowledgement may follow an executed command. Check the player’s account and server logs before retrying. Include `commands.jsonl` in connector backups.

`kraftlink uncertain` lists uncertain commands. After checking, `kraftlink resolve IDENTIFIER delivered` confirms an observed execution and `kraftlink resolve IDENTIFIER retry` allows another attempt. Retrying may duplicate a reward already received.
