# Add a payment method

Create a plugin to integrate a provider with Shop. To enable an existing provider, see the [payments guide](shop-administration.md).

## Register the gateway

Add Shop to your [plugin manifest’s](developpement-plugins.md) dependencies:

```json
{
    "requires": {
        "cms": ">=0.0.1",
        "php": "^8.4.1",
        "plugin:shop": ">=0.0.1"
    }
}
```

In its provider’s `boot()` method:

```php
app(\KraftInk\Plugins\Shop\Services\Payments\GatewayRegistry::class)
    ->register('custom', \Vendor\CustomPayment\CustomGateway::class);
```

Use a stable identifier, also returned by `id()`. An identifier already assigned to another class is rejected.

## Implement checkout

Keep the implementation in your plugin’s services. Interfaces are under `KraftInk\Plugins\Shop\Contracts\Payments`, with results under `Data\Payments`.

The class implements `KraftInk\Plugins\Shop\Contracts\Payments\PaymentGateway`:

| Method | Expected result |
| --- | --- |
| `id(): string` | Registered identifier |
| `name(): string` | Translated provider name |
| `capabilities(): array` | Supported capabilities: `one_time`, `subscriptions`, `zero_total` |
| `configurationFields(): array` | Settings schema |
| `configured(): bool` | Required settings available |
| `createCheckout(object $order, User $user): CheckoutSession` | Member’s payment session |

`User` is `App\Models\Accounts\User`. `CheckoutSession`, in `KraftInk\Plugins\Shop\Data\Payments`, takes `($reference, $url)`. The reference contains 1 to 180 characters and an external provider’s checkout URL must use HTTPS.

Use the order’s `reference`, `currency`, `total_minor` and `recurring` supplied by Shop. The amount is an integer in minor units. Do not recalculate it from browser data.

Shop saves the session for retries. Also send the provider an idempotency key derived from the order reference: an interruption can occur after its response and before the local save.

## Declare settings

Example return value for `configurationFields()`:

```php
return [
    'api_key' => ['label' => 'custom-payment::messages.api_key', 'type' => 'secret'],
    'sandbox' => ['label' => 'custom-payment::messages.sandbox', 'type' => 'boolean', 'default' => '1'],
];
```

Types are `secret`, `text`, `textarea`, `number` and `boolean`. `rules` accepts a list of Laravel validation rules. Translations belong to the plugin.

Read an encrypted value with `app(GatewayRegistry::class)->setting('custom', 'api_key')`. Leaving a secret empty preserves its value, and it must not be placed back into HTML. Native saving requires `shop.finance.configure` and sensitive account confirmation.

## Confirm a payment

The plugin owns its webhook route and verifies the signature using the provider’s protocol. `VerifiesWebhooks::verifyWebhook(Request $request): array` can expose that verification. A browser return never confirms a payment.

Match the order reference, remote status, amount and currency before calling:

```php
app(\KraftInk\Plugins\Shop\Services\Orders\OrderService::class)->complete(
    $order->id,
    'custom',
    $verifiedEventId,
    $verifiedAmountMinor,
    $verifiedCurrency,
);
```

Use a stable event identifier. Shop checks the gateway, amount and currency, locks the order and prevents a second grant when an event is replayed.

For subscriptions, the sixth argument is the end of the period actually paid. The next optional arguments are the financial reference and its type. Each renewal needs a separate reconciliation and accounting record. A status notification alone grants no rights.

Every new operation with an external effect must hold `App\Kraft\System\OperationLock::shared()` until its result is recorded. Make requests idempotent and distinguish a refused payment from a result that is still uncertain.

## Add the functions you need

All contracts below are in `KraftInk\Plugins\Shop\Contracts\Payments`. Implement only functions you actually support.

| Contract | Usage |
| --- | --- |
| `SupportsCurrencies` | `supportsCurrency(Currency $currency): bool`, see [currencies](developpement-soldes.md#amounts-and-currency) |
| `DefaultAvailability` | `defaultEnabled(): bool` for initial availability |
| `ProvidesInstructions` | `instructions(): string`, saved with the order |
| `ReservationPolicy` | `reservationSeconds(): int`, bounded between 60 seconds and 7 days |
| `CancelsSubscriptions` | `cancelSubscription(object $subscription): void`, for confirmed cancellation without removing an already paid period |
| `GuestCheckout` | `createGuestCheckout(object $order, object $guest): CheckoutSession` with the guest identity verified by Shop |
| `RefundsPayments` | `payment(object $order): PaymentReference`, `refund(PaymentReference $payment, object $refund): RefundResult`, `getRefund(string $reference): RefundResult` |

`Currency` is `App\Kraft\Currencies\Currency`. `PaymentReference` and `RefundResult` come from `KraftInk\Plugins\Shop\Data\Payments`. Their constructors are `PaymentReference(string $id, string $kind, int $amount, string $currency)` and `RefundResult(string $id, string $paymentReference, int $amount, string $currency, string $status, ?string $requestKey = null)`.

Refunds must preserve idempotency, reconciliation and recovery of uncertain results. Use Shop’s financial services to preserve the split between the provider, wallet and gift card.

Without `SupportsCurrencies`, the gateway accepts EUR, USD, GBP, CAD and CHF. Implement this contract to declare its actual currencies.

Before release, test in the provider’s sandbox: invalid signatures, incorrect amount or currency, repeated events and interruption before saving. Also check secrets and every optional function you advertise.
