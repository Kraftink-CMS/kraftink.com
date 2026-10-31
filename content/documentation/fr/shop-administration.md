# Préparer les paiements de la boutique

Installez et activez Shop, puis configurez vos comptes marchands avant d’ouvrir les ventes. Les produits et leurs options se règlent directement dans le panneau.


## Préparer le site

Utilisez le domaine HTTPS définitif, une [messagerie testée](configuration.md) et des [tâches planifiées fonctionnelles](operations.md). Complétez l’identité du vendeur et les réglages de facturation dans le panneau. Sauvegardez le site avant un changement de prestataire ou de devise.

Les prestataires doivent pouvoir joindre les adresses de notification sans écran de connexion ni challenge du proxy ou du pare-feu. Reprenez l’URL complète affichée par KraftInk, surtout si le site est installé dans un sous-dossier.

## Stripe et PayPal

| Prestataire | Identifiants à reporter dans KraftInk | Destination des notifications |
| --- | --- | --- |
| Stripe | Clé secrète et secret de signature du webhook | `/shop/webhooks/stripe` |
| PayPal | Client ID, secret et identifiant du webhook de l’application | `/shop/webhooks/paypal` |

Faites correspondre les identifiants et le webhook au même environnement de test ou de production. PayPal démarre en mode Sandbox. Un retour du navigateur vers la boutique ne suffit pas à confirmer un paiement : les notifications doivent fonctionner même si l’acheteur ferme la page.

Pour Stripe, activez les événements suivants :

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

`charge.dispute.*` désigne tous les événements de cette famille. Pour PayPal, activez les paiements, les remboursements, les abonnements et les litiges :

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

`BILLING.SUBSCRIPTION.*` désigne tous les événements d’abonnement. Le compte marchand doit aussi autoriser les opérations de remboursement et de litige proposées par le panneau.

## Paysafecard et Paymentwall

Paysafecard utilise la clé marchande REST commençant par `psc_`. KraftInk transmet au prestataire une adresse de notification propre à la commande. Vous n’avez pas à inventer une URL générique.

Pour Paymentwall, préparez un projet **Widget API / Digital Goods**, sa clé de projet et sa clé secrète. Configurez la signature version 3 et l’adresse `/shop/webhooks/paymentwall` affichée par le site.

Ces deux intégrations démarrent en mode test et concernent les achats ponctuels. Elles ne proposent pas les abonnements ni un remboursement déclenché depuis KraftInk. Faites correspondre le mode du site à celui du projet marchand et validez la réception des notifications avant de passer en production.

## Vérifier un achat complet

1. Préparez un produit de test et le moyen de paiement dans son environnement d’essai.
2. Effectuez le parcours d’achat, puis contrôlez sa confirmation dans le compte marchand et KraftInk.
3. Vérifiez l’attribution attendue : rang, solde, téléchargement privé ou [commande en jeu](kraftlink.md).
4. Pour les fonctions utilisées, testez aussi le renouvellement d’abonnement et le remboursement.
5. Remplacez les identifiants de test par ceux de production et configurez leurs propres notifications avant d’activer les ventes réelles.

Pour une récompense en jeu, testez les commandes sur le serveur destinataire et sa liste d’autorisations. Un fichier vendu se charge comme fichier privé du produit. Une image de médiathèque reste publique.

## Paiement reçu, livraison absente

Consultez la commande, sa notification et le journal du serveur. Si le prestataire a encaissé, ne demandez pas un second règlement pour réparer une attribution. Corrigez la cause et utilisez la reprise proposée par le panneau. Une commande dont l’effet en jeu est incertain doit être vérifiée avant relance.

Après un remboursement ou un litige, contrôlez les avantages retirés et les opérations signalées à vérifier. Une restauration du site n’annule pas les paiements ni les commandes déjà exécutés à l’extérieur.
