# Configurer les paiements

Installez **Boutique** depuis le catalogue. Le plugin apparaît sous le nom **Shop** dans la liste des plugins installés. Ouvrez **Extensions → Boutique → Catalogue → Paiements** pour configurer vos comptes marchands. Utilisez l’adresse HTTPS définitive du site et vérifiez que les prestataires peuvent joindre les URL de notification affichées dans cet onglet.

Chaque moyen de paiement a un interrupteur **Proposer ce moyen de paiement**. Activez-le ou désactivez-le, puis cliquez sur **Enregistrer les réglages de paiement** en bas de l’onglet. Pour être disponible aux acheteurs, le moyen de paiement doit aussi être configuré.

## Stripe et PayPal

Ouvrez la section du prestataire dans l’onglet **Paiements**.

### 1. Identifiants du prestataire

- Pour **Stripe**, renseignez votre clé API secrète ou une clé restreinte. La clé détermine l’environnement. Pour la configuration automatique, une clé restreinte doit aussi donner accès en lecture et en écriture à **Webhook Endpoints**.
- Pour **PayPal**, renseignez l’identifiant client et le secret de votre application REST, puis choisissez l’environnement correspondant, **Sandbox (test)** par défaut ou **Production**. L’adresse HTTPS doit utiliser le port 443.

Cliquez sur **Enregistrer les identifiants**. La boutique les vérifie auprès du prestataire avant d’ouvrir l’étape **Webhook**.

### 2. Webhook

Cliquez sur **Configurer automatiquement** pour enregistrer l’adresse HTTPS affichée avec les événements nécessaires. La boutique récupère et enregistre le secret de signature Stripe ou l’identifiant du webhook PayPal. Si l’application PayPal a déjà un webhook pour cette adresse, la boutique le réutilise et ajoute les événements manquants en conservant ceux déjà sélectionnés.

La boutique applique les nouveaux identifiants une fois leur webhook enregistré. Si la configuration du webhook échoue, les réglages actifs restent en service et vous pouvez réessayer ou utiliser la configuration manuelle.

#### Configuration manuelle

Dans l’étape **Webhook**, ouvrez **Configuration manuelle** et copiez l’adresse HTTPS affichée. Chez le prestataire, créez le webhook avec cette adresse ou ouvrez celui qui existe déjà. Vérifiez qu’il est actif et qu’il reçoit les événements ci-dessous. Pour Stripe, révélez le secret de signature `whsec_` dans **Workbench**. Pour PayPal, copiez l’identifiant du webhook dans l’application REST et l’environnement correspondants. Renseignez la valeur dans la boutique et cliquez sur **Enregistrer le webhook**.

Si vous renouvelez le secret de signature dans Stripe Workbench, enregistrez le nouveau secret dans **Configuration manuelle**.

Activez les événements suivants dans Stripe.

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

Avant les ventes réelles, utilisez les identifiants de production et configurez les notifications correspondantes. Pour PayPal, sélectionnez **Production**. Pour Paysafecard ou Paymentwall, désactivez le mode de test. Le retour du navigateur ne confirme pas à lui seul un paiement.

Si un paiement est reçu sans livraison, consultez la commande et ses notifications avant d’utiliser la reprise du panneau. Pour une commande en jeu incertaine, vérifiez d’abord son effet sur le serveur.
