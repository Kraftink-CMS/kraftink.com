# Configuring payments

Install the **Shop** plugin and open **Extensions → Shop → Catalog → Payments**. Configure your merchant accounts using the site’s final HTTPS address. Providers must be able to reach the notification URLs shown on this tab.

Each payment method has an **Offer this payment method** switch. Turn it on or off, then click **Save payment settings** at the bottom of the tab. The payment method must also be configured before buyers can use it.

## Stripe and PayPal

Open the provider’s section on the **Payments** tab.

### 1. Provider credentials

- For **Stripe**, enter your secret API key or a restricted key. The key determines the environment. For automatic setup, a restricted key also needs read and write access to **Webhook Endpoints**.
- For **PayPal**, enter your REST app’s client ID and secret, then select the matching environment, **Sandbox (test)** by default or **Production**. The HTTPS address must use port 443.

Click **Save credentials**. Shop verifies them with the provider before opening the **Webhook** step.

### 2. Webhook

Click **Configure automatically** to register the displayed HTTPS address with the required events. Shop retrieves and saves the Stripe signing secret or PayPal webhook ID. If the PayPal app already has a webhook for that address, Shop reuses it and adds any missing events while keeping its existing events.

Shop applies the new credentials after saving their webhook. If webhook setup fails, the active settings stay in use and you can retry or use manual setup.

#### Manual setup

In the **Webhook** step, open **Manual setup** and copy the HTTPS address shown there. In your provider’s dashboard, create a webhook with that address or open the existing one. Check that it is enabled and receives the events below. For Stripe, reveal the `whsec_` signing secret in **Workbench**. For PayPal, copy the webhook ID from the matching REST app and environment. Enter the value in Shop and click **Save webhook**.

If you rotate the signing secret in Stripe Workbench, save the new secret in **Manual setup**.

Enable the following events in Stripe.

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

Before accepting real payments, use production credentials and configure the corresponding notifications. For PayPal, select **Production**. For Paysafecard or Paymentwall, turn off test mode. The browser return alone does not confirm payment.

If payment arrives without delivery, check the order and notifications before using the panel’s retry action. For an uncertain game command, first check its effect on the server.
