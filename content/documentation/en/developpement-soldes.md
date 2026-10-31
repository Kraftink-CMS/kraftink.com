# Use the wallet

An extension credits, debits or transfers money through `App\Kraft\Wallet\Wallet`. Do not write directly to balance tables.

## Amounts and currency

Amounts use integer minor units with two decimals: `Money::parse('12,50')` returns `1250`. Do not use floating-point arithmetic. Negative amounts, excessive precision and overdrafts are rejected.

The wallet uses one currency and performs no conversion. Check that it matches your operation’s currency.

An extension can add a currency to the shared registry without depending on Shop:

```php
app(\App\Kraft\Currencies\CurrencyRegistry::class)
    ->register('AUD', 2, 'example::messages.aud');
```

Codes contain three uppercase letters. Only exponent `2` is supported. Identical registration can be repeated, but conflicting definitions are rejected. Adding a currency does not make payment gateways support it.

## Atomic operations

```php
use App\Kraft\Wallet\Money;
use App\Kraft\Wallet\Wallet;

$transaction = app(Wallet::class)->credit(
    user: $member,
    amount: Money::parse('12.50'),
    key: 'example:reward:'.$reward->id,
    reason: 'example::messages.reward_received',
    context: ['reward_id' => $reward->id],
);
```

`credit`, `debit`, `setBalance` and `transfer` lock accounts and atomically record transactions. An idempotency key identifies one business operation: identical retries return its result, while the same key with different parameters is rejected.

`setBalance` takes a target balance and calculates the difference under lock. Repeating an old request must not restore that balance after another operation. `WalletChanged` is emitted after transaction commit.

## History and personal data

Entries retain the currency, amount and before/after balances. Limit context to useful references without secrets. Exports do not expose idempotency keys, technical context or another member’s identity.

Refunds, disputes and entitlements belong to your plugin. The wallet does not automatically collect debt from future income. Test retries, insufficient funds, incompatible currencies and concurrent operations.
