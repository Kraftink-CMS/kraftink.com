# Configuring payments

Install Shop, then configure your merchant accounts using the site’s final HTTPS address. Providers must be able to reach the notification URLs displayed in the panel.

## Stripe and PayPal

| Provider | Credentials | Notification URL |
| --- | --- | --- |
| Stripe | Secret key and webhook signing secret | `/shop/webhooks/stripe` |
| PayPal | Client ID, secret and webhook ID | `/shop/webhooks/paypal` |

Use credentials and webhooks from the same environment. PayPal starts in Sandbox. In Stripe, enable:

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

In PayPal, enable:

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

`charge.dispute.*` and `BILLING.SUBSCRIPTION.*` mean all events in those families.

## Paysafecard and Paymentwall

Paysafecard uses a REST merchant key starting with `psc_`. The notification address is sent automatically for each order.

For Paymentwall, prepare a **Widget API / Digital Goods** project, its project and secret keys, signature version 3 and the `/shop/webhooks/paymentwall` address displayed by the CMS.

Both methods start in test mode and support one-time purchases. They do not offer subscriptions or refunds initiated from KraftInk.

## Checking before opening

Make a test-environment purchase, then check its confirmation and the benefit received: rank, balance, private file or [game command](kraftlink.md). Also test renewals or refunds if you use them.

Before real sales, replace test credentials with production credentials and configure their notifications. The browser return alone does not confirm payment.

If payment arrives without delivery, check the order and notifications before using the panel’s retry action. For an uncertain game command, first check its effect on the server.
