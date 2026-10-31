# Prepare shop payments

Install and enable Shop, then configure your merchant accounts before opening sales. Products and their options are configured directly in the panel. This guide covers payment notifications and delivery.

## Prepare the website

Use the final HTTPS domain, [tested email delivery](configuration.md) and working [scheduled tasks](operations.md). Complete the seller identity and invoicing settings in the panel. Back up the website before changing providers or currency.

Providers must reach notification URLs without a login screen or a proxy/firewall challenge. Use the full URL displayed by KraftInk, especially when installed in a subdirectory.

## Stripe and PayPal

| Provider | Credentials to enter in KraftInk | Notification destination |
| --- | --- | --- |
| Stripe | Secret key and webhook signing secret | `/shop/webhooks/stripe` |
| PayPal | Client ID, secret and application webhook identifier | `/shop/webhooks/paypal` |

Match the credentials and webhook to the same test or production environment. PayPal starts in Sandbox mode. A browser return to the shop does not confirm payment: notifications must work even if the buyer closes the page.

For Stripe, enable these events:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
invoice.paid
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
refund.created
refund.updated
refund.failed
charge.dispute.*
```

`charge.dispute.*` means every event in that family. For PayPal, enable payments, refunds, subscriptions and disputes:

```text
PAYMENT.CAPTURE.COMPLETED
PAYMENT.SALE.COMPLETED
PAYMENT.CAPTURE.REFUNDED
PAYMENT.REFUND.PENDING
PAYMENT.REFUND.FAILED
PAYMENT.SALE.REFUNDED
PAYMENT.CAPTURE.REVERSED
PAYMENT.SALE.REVERSED
BILLING.SUBSCRIPTION.*
CUSTOMER.DISPUTE.CREATED
CUSTOMER.DISPUTE.UPDATED
CUSTOMER.DISPUTE.RESOLVED
```

`BILLING.SUBSCRIPTION.*` means every subscription event. The merchant account must also permit the refund and dispute operations offered by the panel.

## Paysafecard and Paymentwall

Paysafecard uses the REST merchant key starting with `psc_`. KraftInk supplies the provider with a notification address specific to each order. You do not need to invent a generic URL.

For Paymentwall, prepare a **Widget API / Digital Goods** project, its project key and secret key. Configure signature version 3 and the `/shop/webhooks/paymentwall` address displayed by the website.

Both integrations start in test mode and support one-time purchases. They do not offer subscriptions or refunds initiated from KraftInk. Match the site’s mode to the merchant project and validate notification receipt before production.

## Verify a complete purchase

1. Prepare a test product and payment method in its test environment.
2. Complete checkout, then check confirmation in the merchant account and KraftInk.
3. Verify the expected delivery: rank, balance, private download or [in-game command](kraftlink.md).
4. For features you use, also test subscription renewal and refunds.
5. Replace test credentials with production credentials and configure their own notifications before enabling real sales.

For in-game rewards, test the commands on the destination server and its allowlist. Upload a sold file as the product’s private file. Media-library images remain public.

## Payment received, delivery missing

Check the order, its notification and the server log. If the provider has collected payment, do not ask for a second payment to repair a reward. Correct the cause and use the recovery offered by the panel. A command with an uncertain in-game effect must be checked before retrying.

After a refund or dispute, check revoked benefits and operations flagged for review. Restoring the website does not reverse payments or commands already executed externally.
