# Integrate plugin APIs

Use these contracts to add a currency, pricing strategy or vote provider, or read public Forum data. Declare `plugin:shop` or `plugin:vote` in `requires`, with its version constraint, whenever your extension uses its classes. The currency registry belongs to the core.

To configure existing extensions, see [payments](shop-administration.md), [Vote](vote.md) or [extension installation](extensions-catalogue.md).

## Declare a currency

In your plugin provider’s `register()` method:

```php
$this->app->make(\App\Kraft\Currencies\CurrencyRegistry::class)
    ->register('AUD', 2, 'my-currencies::messages.aud');
```

The code has three uppercase letters. The exponent is required: **only `2` is supported**. Do not register a currency with zero or three decimal places as one with two decimal places.

The optional label is a plugin translation key. Repeating an identical registration is accepted. Changing the label of an existing code is rejected.

The registry provides `get($code)`, which returns an immutable object with `code`, `decimals` and `label()`, or rejects an unknown code. `find($code)` returns `null` when missing. `all()` and `codes()` expose the registry.

Adding a currency does not automatically extend payment methods. A [gateway](passerelles-paiement.md) must implement `KraftInk\Plugins\Shop\Contracts\Payments\SupportsCurrencies` and its `supportsCurrency(Currency $currency): bool` method, using `App\Kraft\Currencies\Currency`. Without it, only EUR, USD, GBP, CAD and CHF are accepted. Amounts remain integer minor units, with no implicit conversion.

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
