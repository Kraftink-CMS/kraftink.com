# Configurer les paiements

Installez Shop, puis configurez vos comptes marchands avec l’adresse HTTPS définitive du site. Les prestataires doivent pouvoir joindre les URL de notification affichées dans le panneau.

## Stripe et PayPal

| Prestataire | Identifiants | URL de notification |
| --- | --- | --- |
| Stripe | Clé secrète et secret de signature du webhook | `/shop/webhooks/stripe` |
| PayPal | Client ID, secret et identifiant du webhook | `/shop/webhooks/paypal` |

Utilisez les identifiants et webhooks du même environnement. PayPal démarre en Sandbox. Dans Stripe, activez :

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

Dans PayPal, activez :

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

`charge.dispute.*` et `BILLING.SUBSCRIPTION.*` désignent tous les événements de ces familles.

## Paysafecard et Paymentwall

Paysafecard utilise la clé marchande REST commençant par `psc_`. L’adresse de notification est transmise automatiquement pour chaque commande.

Pour Paymentwall, préparez un projet **Widget API / Digital Goods**, ses clés de projet et secrète, la signature version 3 et l’adresse `/shop/webhooks/paymentwall` affichée par le CMS.

Ces deux moyens démarrent en test et concernent les achats ponctuels. Ils ne proposent ni abonnement ni remboursement déclenché depuis KraftInk.

## Vérifier avant l’ouverture

Effectuez un achat en environnement d’essai, puis vérifiez sa confirmation et l’avantage reçu : rang, solde, fichier privé ou [commande en jeu](kraftlink.md). Testez aussi les renouvellements ou remboursements si vous les utilisez.

Avant les ventes réelles, remplacez les identifiants de test par ceux de production et configurez leurs notifications. Le retour du navigateur ne confirme pas à lui seul un paiement.

Si un paiement est reçu sans livraison, consultez la commande et ses notifications avant d’utiliser la reprise du panneau. Pour une commande en jeu incertaine, vérifiez d’abord son effet sur le serveur.
