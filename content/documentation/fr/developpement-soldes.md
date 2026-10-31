# Utiliser le portefeuille

Une extension crédite, débite ou transfère des montants avec `App\Kraft\Wallet\Wallet`. N’écrivez pas directement dans les tables de solde.

## Montants et devise

Les montants sont des unités mineures entières à deux décimales : `Money::parse('12,50')` renvoie `1250`. N’utilisez pas de nombres flottants. Les montants négatifs, la précision excessive et le découvert sont refusés.

Le portefeuille possède une devise unique et n’effectue aucune conversion. Vérifiez sa correspondance avec la devise de votre opération.

Une extension peut ajouter une devise au registre commun, sans dépendre de Shop :

```php
app(\App\Kraft\Currencies\CurrencyRegistry::class)
    ->register('AUD', 2, 'example::messages.aud');
```

Le code comporte trois lettres majuscules. Seul l’exposant `2` est pris en charge. Vous pouvez répéter une inscription identique, mais une définition contradictoire est refusée. Ajouter une devise ne rend pas les passerelles de paiement compatibles avec celle-ci.

## Opérations atomiques

```php
use App\Kraft\Wallet\Money;
use App\Kraft\Wallet\Wallet;

$transaction = app(Wallet::class)->credit(
    user: $member,
    amount: Money::parse('12.50'),
    key: 'example:reward:'.$reward->id,
    reason: 'example::messages.reward_received',
    context: ['reward_id' => $reward->id],
);
```

`credit`, `debit`, `setBalance` et `transfer` verrouillent les comptes et enregistrent le mouvement atomiquement. La clé d’idempotence désigne une opération métier unique : une répétition identique renvoie son résultat. La même clé avec d’autres paramètres est refusée.

`setBalance` reçoit le solde cible et calcule la différence sous verrou. Répéter une demande ancienne ne doit pas remettre ce solde après une autre opération. `WalletChanged` est émis après validation de la transaction.

## Historique et données personnelles

Les écritures conservent devise, montant et soldes avant/après. Gardez le contexte limité aux références utiles, sans secret. Les exports n’exposent pas les clés d’idempotence, les contextes techniques ou l’identité d’un autre membre.

Les remboursements, litiges et attributions relèvent de votre plugin. Le portefeuille ne prélève pas automatiquement une dette sur les futurs revenus. Testez la répétition, un solde insuffisant, une devise incompatible et deux opérations concurrentes.
