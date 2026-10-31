# Exposer une API de plugin

Pour déléguer une lecture privée ou une action à une application extérieure, déclarez une permission API, appelée scope. Le CMS gère les jetons et leur révocation. Votre plugin garde ses routes et contrôles de ressources.

## Déclarer un scope

Dans `boot()` du fournisseur :

```php
app(\App\Kraft\Auth\ApiScopes::class)->register(
    owner: 'example',
    id: 'example:documents:read',
    label: 'example::api.documents_label',
    description: 'example::api.documents_description',
    permissions: ['example.view'],
);
```

L’identifiant commence par celui du paquet suivi de `:`. Les libellés sont des clés de traduction et toutes les permissions indiquées sont exigées. Ajoutez `serviceAccounts: false` si le scope exige une personne et ne doit pas être proposé aux comptes techniques.

`app(ApiScopes::class)->availableTo($user)` donne les scopes délégables et `allows($user, $scope)` leur disponibilité actuelle. Une extension inactive ne peut plus autoriser ses scopes. Un scope existant garde sa portée : créez un nouvel identifiant pour des opérations plus larges.

## Protéger la route

Chargez votre fichier de routes API depuis le fournisseur :

```php
Route::prefix('api/example/documents')
    ->middleware([
        'api',
        \App\Http\Middleware\ApiAvailability::class,
        \App\Http\Middleware\AuthenticateApiToken::class.':example:documents:read',
        'permission:example.view',
        'throttle:60,1',
    ])
    ->get('/', [ApiDocumentController::class, 'index']);
```

Le contrôleur utilise `$request->user()` et filtre les ressources selon leur propriétaire, visibilité et publication. Un scope ne donne jamais les ressources d’un autre compte. Une lecture ne doit pas autoriser une écriture.

Le titulaire reste un modèle `User`, même pour un compte technique. Utilisez `isServiceAccount()` si votre traitement exige un membre, et `User::members()` pour vos listes de membres. Un compte technique peut ne pas avoir d’e-mail, de mot de passe ou d’identité de jeu.

## Utiliser les jetons

Les droits effectifs combinent les permissions actuelles du compte, les scopes du jeton et la disponibilité du plugin. Les membres créent leurs jetons dans `/account/tokens`. Les bots utilisent les [comptes techniques](service-accounts.md). Le protocole HTTP et les erreurs sont décrits dans l’[API d’authentification](auth-api.md).

Un appel interne à un autre plugin utilise directement ses services ou événements. Les pages publiques n’exigent pas de jeton personnel. Les webhooks de paiement et les accès KraftLink conservent leurs protocoles propres.
