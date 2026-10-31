# Ajouter un moyen de paiement

Créez un plugin pour intégrer un prestataire à Shop. Pour activer un prestataire déjà disponible, consultez le [guide des paiements](shop-administration.md).

## Enregistrer la passerelle

Ajoutez Shop aux dépendances du [manifeste de votre plugin](developpement-plugins.md) :

```json
{
    "requires": {
        "cms": ">=0.0.1",
        "php": "^8.4.1",
        "plugin:shop": ">=0.0.1"
    }
}
```

Dans `boot()` de son fournisseur :

```php
app(\KraftInk\Plugins\Shop\Services\Payments\GatewayRegistry::class)
    ->register('custom', \Vendor\CustomPayment\CustomGateway::class);
```

Utilisez un identifiant stable, également retourné par `id()`. Un identifiant déjà lié à une autre classe est refusé.

## Implémenter le paiement

Gardez l’implémentation dans les services de votre plugin. Les interfaces sont sous `KraftInk\Plugins\Shop\Contracts\Payments` et leurs résultats sous `Data\Payments`.

La classe implémente `KraftInk\Plugins\Shop\Contracts\Payments\PaymentGateway` :

| Méthode | Résultat attendu |
| --- | --- |
| `id(): string` | Identifiant enregistré |
| `name(): string` | Nom traduit du prestataire |
| `capabilities(): array` | Capacités prises en charge : `one_time`, `subscriptions`, `zero_total` |
| `configurationFields(): array` | Schéma des réglages |
| `configured(): bool` | Réglages requis disponibles |
| `createCheckout(object $order, User $user): CheckoutSession` | Session de paiement du membre |

`User` désigne `App\Models\Accounts\User`. `CheckoutSession`, dans `KraftInk\Plugins\Shop\Data\Payments`, se construit avec `($reference, $url)`. La référence contient de 1 à 180 caractères et l’URL de paiement doit utiliser HTTPS pour un prestataire externe.

Utilisez `$order->reference`, `currency`, `total_minor` et `recurring` fournis par Shop. Le montant est un entier en unités mineures. Ne le recalculez pas depuis le navigateur.

Shop conserve la session pour les reprises. Envoyez aussi au prestataire une clé d’idempotence dérivée de la référence de commande : une interruption peut survenir après sa réponse et avant la sauvegarde locale.

## Déclarer les réglages

Exemple de retour de `configurationFields()` :

```php
return [
    'api_key' => ['label' => 'custom-payment::messages.api_key', 'type' => 'secret'],
    'sandbox' => ['label' => 'custom-payment::messages.sandbox', 'type' => 'boolean', 'default' => '1'],
];
```

Les types sont `secret`, `text`, `textarea`, `number` et `boolean`. `rules` accepte une liste de règles Laravel. Les traductions appartiennent au plugin.

Lisez une valeur chiffrée avec `app(GatewayRegistry::class)->setting('custom', 'api_key')`. Un secret laissé vide conserve sa valeur et ne doit pas être réinjecté dans le HTML. La sauvegarde native exige `shop.finance.configure` et la confirmation sensible du compte.

## Confirmer un paiement

Le plugin possède sa route de webhook et vérifie la signature avec le protocole du prestataire. `VerifiesWebhooks::verifyWebhook(Request $request): array` peut exposer cette vérification. Un retour navigateur ne confirme jamais un paiement.

Rapprochez la référence de commande, le statut distant, le montant et la devise avant d’appeler :

```php
app(\KraftInk\Plugins\Shop\Services\Orders\OrderService::class)->complete(
    $order->id,
    'custom',
    $verifiedEventId,
    $verifiedAmountMinor,
    $verifiedCurrency,
);
```

L’événement doit avoir un identifiant stable. Shop vérifie la passerelle, le montant et la devise, verrouille la commande et évite une seconde attribution lors d’un rejeu.

Pour les abonnements, le sixième argument est la fin de période réellement payée. Les arguments facultatifs suivants sont la référence financière et son type. Chaque renouvellement nécessite un rapprochement et un historique comptable distincts. Une notification de statut seule ne donne aucun droit.

Toute nouvelle opération ayant un effet externe doit conserver `App\Kraft\System\OperationLock::shared()` jusqu’à la journalisation de son résultat. Rendez les demandes idempotentes et distinguez un paiement refusé d’un résultat encore incertain.

## Ajouter les fonctions nécessaires

Tous les contrats ci-dessous sont dans `KraftInk\Plugins\Shop\Contracts\Payments`. Implémentez uniquement les fonctions réellement prises en charge.

| Contrat | Usage |
| --- | --- |
| `SupportsCurrencies` | `supportsCurrency(Currency $currency): bool`. Voir les [devises](developpement-soldes.md#montants-et-devise) |
| `DefaultAvailability` | `defaultEnabled(): bool` pour l’activation initiale |
| `ProvidesInstructions` | `instructions(): string`, figées avec la commande |
| `ReservationPolicy` | `reservationSeconds(): int`, borné entre 60 secondes et 7 jours |
| `CancelsSubscriptions` | `cancelSubscription(object $subscription): void` pour confirmer la résiliation sans retirer une période déjà payée |
| `GuestCheckout` | `createGuestCheckout(object $order, object $guest): CheckoutSession` avec l’identité invitée vérifiée par Shop |
| `RefundsPayments` | `payment(object $order): PaymentReference`, `refund(PaymentReference $payment, object $refund): RefundResult`, `getRefund(string $reference): RefundResult` |

`Currency` désigne `App\Kraft\Currencies\Currency`. `PaymentReference` et `RefundResult` viennent de `KraftInk\Plugins\Shop\Data\Payments`. Leurs constructeurs sont `PaymentReference(string $id, string $kind, int $amount, string $currency)` et `RefundResult(string $id, string $paymentReference, int $amount, string $currency, string $status, ?string $requestKey = null)`.

Les remboursements doivent conserver l’idempotence, le rapprochement et la reprise d’un résultat incertain. Passez par les services financiers de Shop pour préserver la répartition entre prestataire, portefeuille et carte cadeau.

Sans `SupportsCurrencies`, la passerelle accepte EUR, USD, GBP, CAD et CHF. Implémentez ce contrat pour déclarer ses devises réelles.

Avant livraison, testez en environnement d’essai du prestataire : signatures invalides, montant ou devise incorrects, événement répété et interruption avant sauvegarde. Vérifiez aussi les secrets et les fonctions facultatives que vous annoncez.
