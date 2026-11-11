# Configuring payments

Install the **Shop** plugin and open **Extensions → Shop → Catalog → Payments**. Configure your merchant accounts using the site’s final HTTPS address. Providers must be able to reach the notification URLs shown on this tab.

## Stripe and PayPal

| Provider | Credentials | Notification URL |
| --- | --- | --- |
| Stripe | Secret key and webhook signing secret | `/shop/webhooks/stripe` |
| PayPal | Client ID, secret and webhook ID | `/shop/webhooks/paypal` |

Use credentials and webhooks from the same environment. PayPal starts in Sandbox. Enable the following events in Stripe.

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
customer.updated
customer.deleted
setup_intent.succeeded
invoice.paid
invoice.payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.pending_update_applied
customer.subscription.pending_update_expired
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
refund.created
refund.updated
refund.failed
charge.dispute.created
charge.dispute.updated
charge.dispute.closed
charge.dispute.funds_withdrawn
charge.dispute.funds_reinstated
```

Enable the following events in PayPal.

```text
PAYMENT.CAPTURE.COMPLETED
PAYMENT.SALE.COMPLETED
PAYMENT.CAPTURE.REFUNDED
PAYMENT.REFUND.PENDING
PAYMENT.REFUND.FAILED
PAYMENT.SALE.REFUNDED
PAYMENT.CAPTURE.REVERSED
PAYMENT.SALE.REVERSED
BILLING.SUBSCRIPTION.CREATED
BILLING.SUBSCRIPTION.ACTIVATED
BILLING.SUBSCRIPTION.UPDATED
BILLING.SUBSCRIPTION.EXPIRED
BILLING.SUBSCRIPTION.CANCELLED
BILLING.SUBSCRIPTION.SUSPENDED
BILLING.SUBSCRIPTION.PAYMENT.FAILED
CUSTOMER.DISPUTE.CREATED
CUSTOMER.DISPUTE.UPDATED
CUSTOMER.DISPUTE.RESOLVED
```

## Paysafecard and Paymentwall

Paysafecard uses a REST merchant key starting with `psc_`. The notification address is sent automatically for each order.

For Paymentwall, prepare a **Widget API / Digital Goods** project, its project and secret keys, signature version 3 and the `/shop/webhooks/paymentwall` address displayed by the CMS.

Both methods start in test mode and support one-time purchases. They do not offer subscriptions or refunds initiated from KraftInk.

## Checking before opening

Make a test-environment purchase, then check its confirmation and the benefit received: rank, balance, private file or [game command](kraftlink.md). Also test renewals or refunds if you use them.

Before accepting real payments, use production credentials and configure the corresponding notifications. Turn off test mode for PayPal, Paysafecard or Paymentwall if you use these providers. The browser return alone does not confirm payment.

If payment arrives without delivery, check the order and notifications before using the panel’s retry action. For an uncertain game command, first check its effect on the server.
