# Create a game module

A module supplies identification rules and connections for a game. It installs as an independent extension. The core uses its contracts without knowing a concrete game.

## Generate and register the adapter

```shell
php artisan kraft:make game "My game" --id=my-game
```

Complete the package under `extensions/installed/games/my-game/`. Its manifest declares `type: "game"`, namespace, provider and requirements. The provider registers an `App\Kraft\Games\Contracts\GameAdapter` in `GameRegistry` using the manifest identifier. The generated template lists methods for metadata, settings, identities and sign-in requirements.

The generated manifest also references the descriptions in `lang/fr/messages.php` and `lang/en/messages.php` through `market.description`, without copying their texts. Replace this initial presentation with the module’s actual features in its language files. `market.name` supports a translated public name and `market.image` an optional shared or translated image supplied under `resources/market/`. The name, type and version remain defined in the manifest. The [release template](game-release-template/README.md) describes these fields and image formats.

The provider lives in `src/Providers/GameServiceProvider.php`, the adapter in `src/Adapters/GameAdapter.php`. Game services use `src/Services`, with `Services/Profiles` for profile resolvers when that domain is present. Transport contract implementations are grouped under `src/Transports`. Its controllers and middleware use `src/Http`, its views `resources/views`.

The generated provider registers the adapter from its `register()` method:

```php
config(['games.adapters.my-game' => GameAdapter::class]);
```

Keep game-specific rules in the adapter and its flows in package routes and views. The provider must boot before any database is installed. See the [lifecycle](architecture-extensions.md) and [release template](game-release-template/README.md).

## Profiles, avatars and identities

Optional contracts serve distinct purposes:

| Contract | Purpose |
| --- | --- |
| `ResolvesPublicProfiles` | Read-only public profile lookup |
| `PublicProfileAvailability` | Indicate whether lookup is available |
| `ProvidesCommandIdentity` | Supply canonical identifiers for a linked target |
| `ProvidesGuestIdentity` | Validate and normalize an accountless target |

Contracts live under `App\Kraft\Games\Contracts`. `commandIdentity(string $uuid, ?string $username): array` and `guestIdentity(string $input): array` return at least `uuid` and `player`. Public profiles and guest input do not prove account ownership. Values substituted into commands must reject whitespace, control and command characters. Preserve the case of opaque identifiers.

For a provider that builds a URL from a UUID, declare its data in the module provider without adding a class:

```php
app(\App\Kraft\Auth\Avatars\AvatarProviders::class)->registerUrl(
    'my-game',
    'my-provider',
    [
        'name' => 'My provider',
        'description' => 'my-game::avatars.description',
        'website' => 'https://avatars.example.com/',
    ],
    'https://avatars.example.com/avatar/{identity}/128',
    usernamePattern: '/^[A-Za-z0-9_]{3,16}$/D',
);
```

`{identity}` receives the normalized UUID without hyphens. Optional `usernamePattern` allows a validated username when the UUID is missing or invalid. Without it, only valid UUIDs are accepted. The template uses HTTPS with a fixed host. Metadata contains strings, including a name, a translated description key and an optional website. `default: true` sets the default choice for the game without enabling avatars.

For different behavior, such as Steam identifiers, register a dedicated class:

```php
app(\App\Kraft\Auth\Avatars\AvatarProviders::class)->register(
    'my-game',
    'my-provider',
    MyProvider::class,
);
```

The class implements `AvatarProvider` with `id()`, `metadata()` and `url(AvatarIdentity $identity): ?string`. `url()` validates the identity and builds a known HTTPS URL without network calls. Text belongs in package translations. Registration makes the provider available without selecting it automatically.

## Add a transport

Implement `App\Kraft\Games\Transports\Transport` and register its class under `games.transports.{game}.{connection}` from the provider. Metadata declares status and command capabilities, fields, validation rules and translated help.

`execute()` must call the `writing` callback after authentication, immediately before a command could be sent, and stop if it fails. This allows the CMS to durably record the beginning of transmission. An interruption after this point produces an `uncertain` result without automatic execution again.

Optional `ProvidesOnlinePlayers::onlinePlayers(Server $server): array` returns canonical identifiers actually present, obtained through an authenticated interface. A public ping count does not satisfy this contract. Commands marked `requires_online` wait without presence evidence.

External exchanges remain outside SQL transactions and under an [operation guard](architecture-extensions.md#jobs-and-external-operations). Retain identifiers, leases and durable results to prevent resending after an interruption. See [server APIs](developpement-serveurs.md) for exchanges and [KraftLink](developpement-kraftlink.md) for a connector.

Test invalid identities, unavailable services, rejected authentication and interruptions before and after a write becomes possible.
