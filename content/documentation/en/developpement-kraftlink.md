# Develop KraftLink

This guide covers Java connector changes and delivery-protocol clients. To connect an existing server, follow [Install KraftLink](kraftlink.md).

## Build the JARs

Sources compile with **JDK 25 and Maven**, targeting Java 8 bytecode. The project contains `common`, the `bukkit`, `velocity` and `hytale` connectors, and the `all` assembly module. The Bukkit connector uses Minecraft 1.8.8 as its baseline in the 1.8.x series. Each platform keeps its own Java runtime requirements.

```shell
mvn clean package
```

This command builds the three variants and the universal JAR. Maven resolves the public `com.hypixel.hytale:Server:0.7.4` API from the [official Hytale repository](https://maven.hytale.com/release). The dependency stays `provided`, and the manifest targets server version `0.7.4` exactly. No local SDK or download secret is required.

The complete build collects the four JARs in the project root’s `target/` directory, which Git ignores. The build version replaces `VERSION`:

| File | Platform |
| --- | --- |
| `target/KraftLink.jar` | Bukkit, Spigot, Paper, Folia, Velocity and Hytale |
| `target/KraftLink-Bukkit-VERSION.jar` | Bukkit, Spigot, Paper and Folia |
| `target/KraftLink-Velocity-VERSION.jar` | Velocity |
| `target/KraftLink-Hytale-VERSION.jar` | Hytale |

Install one KraftLink JAR per instance, without the `-thin` suffix. Server APIs remain compile-time dependencies. Gson is bundled and relocated. Preserve its license and notice under `META-INF/licenses/gson/`.

Keep network requests and journal writes off game threads. Use the Bukkit server scheduler, region or entity schedulers when available on Paper/Folia, the proxy scheduler on Velocity and world threads on Hytale. Velocity deliveries run commands in the proxy console. Target a game server’s own connection for commands on that server. Check each targeted version and affected plugin commands, especially on Folia.

## Claim a delivery

Clients use HTTPS and `Authorization: Bearer SERVER_TOKEN`, with the token from the server entry. Send `POST /api/link/commands/claim`:

```json
{
    "protocol": 1,
    "players": ["00000000000000000000000000000001"],
    "player_names": ["ExamplePlayer"],
    "limit": 20
}
```

`players` accepts up to 2,000 online UUIDs and may be empty. The optional `player_names` list contains online players’ usernames. `limit` ranges from 1 to 20. JSON responses use `success` to indicate success and `data` for the result. The `data.commands` list provides `id`, `command`, `uuid`, `player`, `channel`, `lease`, `lease_expires_at` and `requires_online` for each delivery. Username targets are provided in `player`, UUID targets in `uuid`.

Leases last five minutes and belong to the requesting server. The budget is shared across core and extension channels. Commands requiring presence are only offered when their UUID appears in `players` or their username in `player_names`. The connector checks their presence on the server again before execution. Without `player_names`, commands targeting usernames and requiring presence stay pending. Treat delivery identifiers as opaque. Their prefixes do not grant access to provider tables.

## Acknowledge without replaying

After processing, send `POST /api/link/commands/{id}/ack` using the full identifier:

```json
{
    "lease": "received-lease",
    "state": "executed",
    "error": null
}
```

| State | Meaning |
| --- | --- |
| `executed` | Execution completed |
| `failed` | Confirmed failure requiring correction |
| `uncertain` | Possible effect requiring verification |
| `deferred` | Thirty-second delay without consuming an attempt |

`error` is optional, limited to 1,000 characters and must contain no secrets. The lease and server must match. Repeated acknowledgements must not create another reward. An accepted acknowledgement returns `{"success":true,"data":{"ok":true}}`.

Durably record identifiers and results before acknowledging. If the CMS offers an executed command again, confirm it with the new lease without replaying it. An interruption before journaling leaves an uncertain result: check its effect before executing again, even after the lease expires.

## Distribute the connector

The single `.github/workflows/release.yml` wrapper calls the shared `Kraftink-CMS/automation` workflow for PR checks targeting `dev` and manual publication. It uses the local `.github/actions/build/action.yml` action, which builds the JARs with Maven. The first release takes the POM version without its development suffix, giving `1.0.0`. Later versions are calculated from tags and Conventional Commits, with patch as the default. The workflow prepares the stable number in the parent POM and module references. Maven builds that version directly.

`master` keeps the published stable version. After verified publication, a commit on `dev` prepares the next patch in the POMs, for example `1.0.1-dev` after `1.0.0`. Newer code changes and higher targets are preserved. Run `git pull` before continuing development. This commit does not publish JARs.

| Trigger | Result |
| --- | --- |
| PR targeting `dev` | Same validations and Maven build as a release, without publishing or uploading artifacts |
| Plain push to `dev` or `master` | No CI compilation |
| **Actions → Release → Run workflow** in the KraftLink repository | Prepare, build, promote and publish the `dev` commit in one run |

The required check for PRs targeting `dev` is **checks / Validate changes**. The **Maintain** and **Admin** roles keep direct push access to `dev` through their configured bypass.

To publish a stable, open **Actions → Release → Run workflow** in the KraftLink repository. Keep `bump=auto` or choose `patch`, `minor` or `major`. The request captures the current `dev` commit, even when the form stays on `master`. The same run prepares the version and opens its PR into `master` before the build, builds the files, then waits for the authorized merge before publishing. PRs targeting `dev` and releases run the same `mvn clean package` validations through the build hook. After a successful build and source verification, the workflow emits the required **Release validated source** status.

A build failure leaves the PR open. A new **Run workflow** request is then refused with its link. For a temporary error on the same SHA, use **Re-run failed jobs**. To fix code before merging, push the correction to `dev`, then choose **Re-run all jobs** in that same run to prepare the source again and rebuild every JAR with the chosen version. Changing the target requires closing the PR and starting a new **Release**.

The KraftLink workflow uses its temporary `GITHUB_TOKEN` to publish `KraftLink.jar`, the three variants and `SHA256SUMS`. KraftLink publishes stable releases only. An interrupted publication after merging must resume before the next one, using its prepared files. Temporary artifacts expire after seven days. Published files remain immutable. No `release-policy.json` file is required.

The same form provides `notes_mode` (`auto`, `append` or `replace`) and the Markdown `notes` field. The [shared release-note options](extensions-publication.md#release-notes) also apply to KraftLink JARs, using real commits since the previous stable version.

The release runs `mvn clean package`, attaches all four JARs and calculates `SHA256SUMS`. A Maven error prevents publication. The Hytale API is used for compilation and stays out of the distributed JARs.

Before distribution, verify interruption recovery, repeated acknowledgements, expired leases and prevention of duplicate execution. Account/balance access and other-game transports are described in [server APIs](developpement-serveurs.md).
