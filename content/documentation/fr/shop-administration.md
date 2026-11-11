# Configurer les paiements

Installez **Boutique** depuis le catalogue. Le plugin apparaît sous le nom **Shop** dans la liste des plugins installés. Ouvrez **Extensions → Boutique → Catalogue → Paiements** pour configurer vos comptes marchands. Utilisez l’adresse HTTPS définitive du site et vérifiez que les prestataires peuvent joindre les URL de notification affichées dans cet onglet.

## Stripe et PayPal

| Prestataire | Identifiants | URL de notification |
| --- | --- | --- |
| Stripe | Clé secrète et secret de signature du webhook | `/shop/webhooks/stripe` |
| PayPal | Client ID, secret et identifiant du webhook | `/shop/webhooks/paypal` |

Utilisez les identifiants et webhooks du même environnement. PayPal démarre en Sandbox. Activez les événements suivants dans Stripe.

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

Activez les événements suivants dans PayPal.

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

## Paysafecard et Paymentwall

Paysafecard utilise la clé marchande REST commençant par `psc_`. L’adresse de notification est transmise automatiquement pour chaque commande.

Pour Paymentwall, préparez un projet **Widget API / Digital Goods**, ses clés de projet et secrète, la signature version 3 et l’adresse `/shop/webhooks/paymentwall` affichée par le CMS.

Ces deux moyens démarrent en test et concernent les achats ponctuels. Ils ne proposent ni abonnement ni remboursement déclenché depuis KraftInk.

## Vérifier avant l’ouverture

Effectuez un achat en environnement d’essai, puis vérifiez sa confirmation et l’avantage reçu : rang, solde, fichier privé ou [commande en jeu](kraftlink.md). Testez aussi les renouvellements ou remboursements si vous les utilisez.

Avant les ventes réelles, utilisez les identifiants de production et configurez les notifications correspondantes. Désactivez le mode de test pour PayPal, Paysafecard ou Paymentwall si vous utilisez ces prestataires. Le retour du navigateur ne confirme pas à lui seul un paiement.

Si un paiement est reçu sans livraison, consultez la commande et ses notifications avant d’utiliser la reprise du panneau. Pour une commande en jeu incertaine, vérifiez d’abord son effet sur le serveur.
