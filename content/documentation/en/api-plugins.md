# Integrate plugin APIs

These APIs add Shop pricing or a Vote provider and expose Forum and Support data. Declare the plugin in `requires` or `integrations` depending on whether the dependency is required or optional.

Currencies use the shared registry described in the [wallet](developpement-soldes.md#amounts-and-currency). Payment providers follow the [gateway contract](passerelles-paiement.md).

## Add Shop pricing

From the provider of your plugin depending on Shop:

```php
app(\KraftInk\Plugins\Shop\Services\Pricing\PricingRegistry::class)
    ->register('my-pricing', MyUpgradePricing::class);
```

`MyUpgradePricing` implements `KraftInk\Plugins\Shop\Contracts\UpgradePricing`:

```php
public function id(): string;
public function label(): string;
public function credit(PriceContext $context): int;
```

`id()` must match the registered identifier. `PriceContext`, in `KraftInk\Plugins\Shop\Data`, exposes `beneficiaryId`, `product`, `targetMinor`, `funding` and `state`.

Credit must be between zero, `targetMinor` and the sum of `funding`’s `available_minor` values. Use this eligible funding rather than an old purchase’s catalogue price. An invalid result blocks the order. Shop preserves the reservation snapshot. Changing your strategy must not rewrite old orders.

## Add a Vote provider

In `boot()` of your plugin provider, with Vote declared as a dependency:

```php
app(\KraftInk\Plugins\Vote\Services\Providers\ProviderRegistry::class)
    ->register('my-provider', MyVoteProvider::class);
```

The class implements `KraftInk\Plugins\Vote\Contracts\VoteProvider`:

```php
public function id(): string;
public function name(): string;
public function games(): array;
public function mode(): string;
public function fields(): array;
public function validUrl(string $url): bool;
public function minimumCooldown(): int;
public function prepare(object $site, VoteContext $context): ProviderChallenge;
public function verify(object $site, object $challenge): VoteProof;
```

These three objects are in `KraftInk\Plugins\Vote\Data`. `VoteContext` provides `userId`, `player`, `uuid`, `ip` and `nonce`. `ProviderChallenge($url, $token = null, $expiresSeconds = 3600)` describes the outbound visit. `VoteProof($eventId, $votedAt = null)` represents a verified vote. Its identifier must remain stable across retries.

Validate destinations and evidence on the server. Document the data sent to the service and never confirm a vote based only on a browser return.

## Receive an HMAC vote

The existing custom provider sends `kraftink_token` and `username` to the partner. The partner sends `POST /vote/callback/{id}` with the received token as `token` and its stable identifier as `event_id`:

```php
$body = json_encode(['token' => $token, 'event_id' => $eventId], JSON_THROW_ON_ERROR);
$timestamp = (string) time();
$signature = hash_hmac('sha256', $timestamp.'.'.$body, $sharedSecret);
```

Send exactly `$body` as JSON, `$timestamp` in `X-KraftInk-Timestamp` and the hexadecimal signature in `X-KraftInk-Signature`. The tolerance is five minutes. `token` contains 64 characters. `event_id` is limited to 180 characters. Keep the same identifier when retrying a vote, and keep the secret out of URLs.

## Read the public Forum

The following GET routes require an active Forum plugin and the `forum.view` permission. They expose only anonymously readable content, even for a signed-in administrator.

| Route | Response |
| --- | --- |
| `/api/forum/categories` | Categories |
| `/api/forum/topics` | Paginated topics |
| `/api/forum/categories/{id}/topics` | Topics in a category |
| `/api/forum/topics/{id}` | Topic metadata |
| `/api/forum/topics/{id}/posts` | Paginated posts |
| `/api/forum/feeds/{format}` | Thirty recent topics |
| `/api/forum/categories/{id}/feeds/{format}` | Category feed |

`locale` accepts a site language, `page` starts at 1 and `per_page` ranges from 1 to 50, with 20 by default. Paginated lists return `data.items` and `data.pagination` (`page`, `per_page`, `total`, `last_page`). Inaccessible content returns 404. Feeds accept `rss` or `atom` and provide ETag/Last-Modified.

## Reading Support tickets

`GET /api/support/tickets` and `GET /api/support/tickets/{id}` require a token with `support:tickets:read`, linked to `support.view`. They expose the holder’s tickets and non-internal messages, even for an administrator account. `page` starts at 1 and `per_page` accepts 1 to 50, defaulting to 20.
