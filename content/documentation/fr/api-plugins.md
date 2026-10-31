# Intégrer les API des plugins

Ces contrats servent à ajouter une devise, une tarification ou un fournisseur de vote, ou à lire les données publiques du Forum. Déclarez `plugin:shop` ou `plugin:vote` dans `requires`, avec leur contrainte de version, dès que votre extension utilise leurs classes. Le registre de devises appartient au noyau.

Pour configurer les extensions existantes, consultez [les paiements](shop-administration.md), [Vote](vote.md) ou [l’installation des extensions](extensions-catalogue.md).

## Déclarer une devise

Dans `register()` du fournisseur de votre plugin :

```php
$this->app->make(\App\Kraft\Currencies\CurrencyRegistry::class)
    ->register('AUD', 2, 'my-currencies::messages.aud');
```

Le code contient trois lettres majuscules. L’exposant est obligatoire : **seul `2` est pris en charge**. N’enregistrez pas une devise à zéro ou trois décimales comme une devise à deux décimales.

Le libellé facultatif est une clé de traduction du plugin. Vous pouvez répéter une déclaration identique, mais pas changer le libellé d’un code déjà enregistré.

Le registre fournit `get($code)`, qui retourne un objet immuable avec `code`, `decimals` et `label()`, ou refuse un code inconnu. `find($code)` retourne `null` s’il manque. `all()` et `codes()` exposent le registre.

Une devise ajoutée n’étend pas automatiquement les moyens de paiement. Une [passerelle](passerelles-paiement.md) doit implémenter `KraftInk\Plugins\Shop\Contracts\Payments\SupportsCurrencies` et sa méthode `supportsCurrency(Currency $currency): bool`, avec `App\Kraft\Currencies\Currency`. Sans ce contrat, seules EUR, USD, GBP, CAD et CHF sont acceptées. Les montants restent des unités mineures entières, sans conversion implicite.

## Ajouter une tarification Shop

Depuis le fournisseur de votre plugin dépendant de Shop :

```php
app(\KraftInk\Plugins\Shop\Services\Pricing\PricingRegistry::class)
    ->register('my-pricing', MyUpgradePricing::class);
```

`MyUpgradePricing` implémente `KraftInk\Plugins\Shop\Contracts\UpgradePricing` :

```php
public function id(): string;
public function label(): string;
public function credit(PriceContext $context): int;
```

`id()` doit correspondre à l’identifiant enregistré. `PriceContext`, dans le namespace `KraftInk\Plugins\Shop\Data`, expose `beneficiaryId`, `product`, `targetMinor`, `funding` et `state`.

Le crédit est compris entre zéro, `targetMinor` et la somme des `available_minor` de `funding`. Utilisez ces financements admissibles plutôt que le prix catalogue d’un ancien achat. Une réponse invalide bloque la commande. Shop conserve l’instantané de la réservation. Une évolution de votre stratégie ne doit pas réécrire les anciennes commandes.

## Ajouter un fournisseur Vote

Dans `boot()` du fournisseur de votre plugin dépendant de Vote :

```php
app(\KraftInk\Plugins\Vote\Services\Providers\ProviderRegistry::class)
    ->register('my-provider', MyVoteProvider::class);
```

La classe implémente `KraftInk\Plugins\Vote\Contracts\VoteProvider` :

```php
public function id(): string;
public function name(): string;
public function games(): array;
public function mode(): string;
public function fields(): array;
public function validUrl(string $url): bool;
public function minimumCooldown(): int;
public function prepare(object $site, VoteContext $context): ProviderChallenge;
public function verify(object $site, object $challenge): VoteProof;
```

Les trois objets sont dans `KraftInk\Plugins\Vote\Data`. `VoteContext` fournit `userId`, `player`, `uuid`, `ip` et `nonce`. `ProviderChallenge($url, $token = null, $expiresSeconds = 3600)` décrit le départ vers le service. `VoteProof($eventId, $votedAt = null)` représente un vote réellement vérifié. Son identifiant doit rester stable lors des reprises.

Validez les destinations et la preuve côté serveur. Documentez les données transmises au service et ne confirmez jamais un vote sur le seul retour du navigateur.

## Recevoir un vote HMAC

Le fournisseur personnalisé existant transmet `kraftink_token` et `username` au partenaire. Celui-ci renvoie un `POST /vote/callback/{id}` avec le jeton reçu dans `token` et son identifiant stable dans `event_id` :

```php
$body = json_encode(['token' => $token, 'event_id' => $eventId], JSON_THROW_ON_ERROR);
$timestamp = (string) time();
$signature = hash_hmac('sha256', $timestamp.'.'.$body, $sharedSecret);
```

Envoyez exactement `$body` comme JSON, `$timestamp` dans `X-KraftInk-Timestamp` et la signature hexadécimale dans `X-KraftInk-Signature`. La tolérance est de cinq minutes. `token` contient 64 caractères et `event_id` est limité à 180 caractères. Gardez le même identifiant pour les reprises d’un vote et le secret hors des URL.

## Lire le Forum public

Les routes GET suivantes nécessitent Forum actif et la permission `forum.view`. Elles exposent seulement les contenus lisibles anonymement, même pour un administrateur connecté.

| Route | Réponse |
| --- | --- |
| `/api/forum/categories` | Catégories |
| `/api/forum/topics` | Discussions paginées |
| `/api/forum/categories/{id}/topics` | Discussions d’une catégorie |
| `/api/forum/topics/{id}` | Métadonnées d’une discussion |
| `/api/forum/topics/{id}/posts` | Messages paginés |
| `/api/forum/feeds/{format}` | Trente discussions récentes |
| `/api/forum/categories/{id}/feeds/{format}` | Flux d’une catégorie |

`locale` accepte une langue du site, `page` commence à 1 et `per_page` va de 1 à 50, avec 20 par défaut. Les listes paginées retournent `data.items` et `data.pagination` (`page`, `per_page`, `total`, `last_page`). Un contenu inaccessible retourne 404. Les flux acceptent `rss` ou `atom` et fournissent ETag/Last-Modified.
