# Server connection protocol

Use this delivery protocol to write a compatible connector. Create the token in the server record as described in [KraftLink](kraftlink.md). [Account and balance access](developpement-serveurs.md) uses a separate key.

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
