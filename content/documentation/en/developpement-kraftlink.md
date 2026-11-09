# Server connection protocol

KraftLink lets a game plugin exchange data with a site extension through the server connection. Create the token in the server record as described in [KraftLink](kraftlink.md). [Account and balance access](developpement-serveurs.md) uses a separate key.

## Batch poll operations

Send `POST /api/link/poll` with the server token in `Authorization: Bearer SERVER_TOKEN`. Each request contains between 1 and 16 operations and is limited to 1 MiB. Send the operations that are due for this connection.

```json
{
    "protocol": 1,
    "operations": {
        "commands": {"protocol": 1, "players": [], "limit": 20},
        "example.status": {"revision": 12}
    }
}
```

| Operation | Request data | Response data |
| --- | --- | --- |
| `heartbeat` | The same server status as for `POST /api/link/heartbeat` | Server ID, time and available capabilities |
| `commands` | The same request as for `POST /api/link/commands/claim` | `commands` with delivery leases |
| `in_game_sign_in` | `players`, the eligible in-game identities with `uuid`, `username` and `platform` | `requests` for players reported by the selected connector |
| `example.status` | The fields defined by the owning extension | The result defined by the extension |

When more than 2,000 players are online, KraftLink limits identity lists and rotates the players checked for commands and in-game sign-in. The heartbeat can send the total in `players_online` so the site can display the actual count.

Each key in `data.operations` has its own result, such as `{"success":true,"data":{"commands":[]}}` or `{"success":false,"status":422}`. An unknown operation returns status `404` in its result. Other operation results remain available when one fails. Send in-game player responses and delivery acknowledgements to their dedicated routes as soon as the outcome is known.

When a site lacks the batch route, KraftLink uses `/api/link/heartbeat` and `/api/link/commands/claim`. In-game sign-in and plugin operations use the batch route. Use one token per request. A delivery channel with a separate token or custom path keeps its own request.

### Register a CMS poll operation

In your extension's Laravel provider, register a name that starts with the extension identifier, followed by a dot and the operation name.

```php
use App\Kraft\Link\LinkPollRegistry;

app(LinkPollRegistry::class)->register('example.status', StatusPoll::class);
```

`StatusPoll` implements `App\Kraft\Link\Contracts\PollHandler` with the method `poll(Server $server, array $payload): array`. The server comes from the authenticated token. Validate the input fields, check that the feature is allowed for that server, and return the data intended for it. The result is encoded as a JSON object and limited to 64 KiB. A validation exception becomes a `422` error for that operation.

### Poll an operation from a game plugin

Compile your plugin with `fr.nivcoo.kraftink:KraftLink-API:VERSION` as `provided` or `compileOnly`. The API JAR is available with [KraftLink releases](https://github.com/kraftink-cms/KraftLink/releases). It is a compile-time dependency. The installed KraftLink JAR supplies the classes at runtime.

From source, `mvn -pl api -am install` installs the dependency in the local Maven repository. If you download the JAR, import it into your dependency repository or reference it as a local file with Gradle.

Implement `fr.nivcoo.kraftlink.api.LinkPollOperation` and register it with `api.registerPollOperation(operation)`. Close the returned registration when your plugin is disabled. `name()` matches the operation registered in the CMS. `intervalSeconds()` defaults to 5 and can be overridden in `operation_poll_seconds`.

`request()` returns the operation fields as a `Map<String, Object>`, or `null` to skip the cycle. `receive(data)` handles the result and `rejected(status)` receives the status of an error reported by the CMS. These methods run on the connector's poll worker. Keep them short and use your platform's scheduler for work that needs to run on the game thread. KraftLink accepts up to 13 registered plugin operations per instance.

### Call the CMS on demand

Register a direct operation in your Laravel provider.

```php
use App\Kraft\Link\LinkRequestRegistry;

app(LinkRequestRegistry::class)->register('example.acknowledge', AcknowledgeWork::class);
```

`AcknowledgeWork` implements `App\Kraft\Link\Contracts\RequestHandler` and its `handle(Server $server, array $payload): array` method. Check permissions and look up data within the authenticated server's scope.

The Java plugin calls `api.request("example.acknowledge", Collections.singletonMap("id", id))` and receives a `CompletableFuture<Map<String, Object>>`. A failure produces a `KraftLinkRequestException` with the HTTP status and any available field errors. Status `0` means a transport failure or invalid response. Handle completion asynchronously. KraftLink sends each call once. Retrying after a connection failure can have an ambiguous outcome, so use a stable identifier for mutations that must support retries.

For third-party HTTP connectors, the same operation uses `POST /api/link/request` with the server token. Requests and responses are limited to 64 KiB each.

```json
{"protocol":1,"operation":"example.acknowledge","payload":{"id":"job-42"}}
```

### Exchange work between plugins

1. The site plugin creates a task with a stable identifier and the destination server ID.
2. Its poll operation returns pending tasks for that server. The Java companion processes them in `receive(data)`.
3. The companion sends `example.acknowledge` after processing. The site plugin validates the destination and records the result. It retains tasks and acknowledgements according to its own rules.

The companion can send events to the site with `request()`, register periodic polling, or use both.

`api.instanceId()` identifies the local installation and `api.platform()` gives its platform. `api.serverId()` becomes available after the first successful heartbeat and refers to the authenticated KraftInk server entry. A third-party HTTP connector can also send `X-KraftLink-Instance` with a persistent version 4 UUID and `X-KraftLink-Platform` with `bukkit`, `velocity` or `hytale`.

### Find the API

Add `fr.nivcoo.kraftink:KraftLink-API` as a compile-time dependency with Maven scope `provided` or Gradle `compileOnly`. `KraftLinkApi` and `KraftLinkProvider` are in the `fr.nivcoo.kraftlink.api` package. The KraftLink instance installed on your server provides these classes at runtime. Keep the API JAR out of your plugin JAR and the server's plugin directory.

**Bukkit, Spigot, Paper and Folia.** Add `depend: [KraftLink]` to `plugin.yml` and load the service in `onEnable()`.

```java
KraftLinkApi api = getServer().getServicesManager().load(KraftLinkApi.class);
```

If your plugin uses `paper-plugin.yml`, declare `dependencies.server.KraftLink` with `load: BEFORE`, `required: true` and `join-classpath: true`. The service lookup returns `null` if KraftLink failed to start.

**Velocity.** Add `@Dependency(id = "kraftlink")` to `@Plugin`, or the equivalent `{"id":"kraftlink","optional":false}` to the dependencies in `velocity-plugin.json`. Look up the provider in a `ProxyInitializeEvent` listener at the default priority.

```java
Optional<KraftLinkApi> api = proxy.getPluginManager().getPlugin("kraftlink")
        .flatMap(PluginContainer::getInstance)
        .filter(KraftLinkProvider.class::isInstance)
        .map(KraftLinkProvider.class::cast)
        .flatMap(KraftLinkProvider::api);
```

**Hytale.** Add `"fr.nivcoo.kraftink:KraftLink": "*"` to `Dependencies` in `manifest.json`. Look up the provider in `start()`.

```java
PluginIdentifier id = new PluginIdentifier("fr.nivcoo.kraftink", "KraftLink");
Optional<KraftLinkApi> api = Optional.ofNullable(PluginManager.get().getPlugin(id))
        .filter(KraftLinkProvider.class::isInstance)
        .map(KraftLinkProvider.class::cast)
        .flatMap(KraftLinkProvider::api);
```

On Velocity and Hytale, an empty result means KraftLink has not started or has stopped.

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

## Supply commands from a plugin

If your plugin keeps its own deliveries, use `DeliveryQueue` to hand them to the connector. In the plugin provider, listen for the claim and acknowledgement events.

```php
use App\Events\AcknowledgingLinkCommand;
use App\Events\CollectingLinkCommands;
use App\Kraft\Link\DeliveryQueue;
use Illuminate\Support\Facades\Event;

Event::listen(CollectingLinkCommands::class, function (CollectingLinkCommands $event): void {
    app(DeliveryQueue::class)->collect($event, 'example', Delivery::query()->eligible());
});

Event::listen(AcknowledgingLinkCommand::class, function (AcknowledgingLinkCommand $event): void {
    app(DeliveryQueue::class)->acknowledge($event, 'example', Delivery::query());
});
```

Use your extension identifier as the channel. `Delivery` and `eligible()` belong to your plugin. Apply your business rules to claims. Include previously processed deliveries in the acknowledgement query so it can handle duplicates.

The model provides a stable primary key, the target (`game`, `server_id`, `player_uuid`, `player_name`, `requires_online`) and the `command` text. Set `server_id` to `null` to use the default delivery server. Commands that require a player to be online use `player_uuid`.

Create each delivery with `status` set to `pending` and `attempts` set to zero. Include `status`, `attempts`, `link_server_id`, `lease_token`, `last_error` and the cast date fields `available_at`, `lease_expires_at`, `created_at` and `delivered_at`. The queue handles leases and acknowledgements. Your plugin decides when to create a delivery and who can receive it.
