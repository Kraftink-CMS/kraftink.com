# Exposing a plugin API

To delegate private reads or actions to an external application, declare an API permission, called a scope. The CMS manages tokens and revocation. Your plugin owns its routes and resource checks.

## Declaring a scope

In the provider’s `boot()` method:

```php
app(\App\Kraft\Auth\ApiScopes::class)->register(
    owner: 'example',
    id: 'example:documents:read',
    label: 'example::api.documents_label',
    description: 'example::api.documents_description',
    permissions: ['example.view'],
);
```

The identifier starts with the package identifier followed by `:`. Labels are translation keys and all listed permissions are required. Add `serviceAccounts: false` if the scope requires a person and should not be offered to service accounts.

Calling `app(ApiScopes::class)->availableTo($user)` lists delegable scopes and `allows($user, $scope)` checks current availability. An inactive extension can no longer authorise its scopes. Keep an existing scope’s meaning fixed and create another identifier for broader operations.

## Protecting the route

Load your API route file from the provider:

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

The controller uses `$request->user()` and filters resources by owner, visibility and publication. A scope never grants another account’s resources. A read scope must not allow writes.

The holder remains a `User` model, including for service accounts. Use `isServiceAccount()` when an operation requires a member and `User::members()` for member lists. Service accounts may have no email, password or game identity.

## Using tokens

Effective rights combine the account’s current permissions, token scopes and plugin availability. Members create tokens in `/account/tokens`. Bots use [service accounts](service-accounts.md). HTTP behaviour and errors are covered by the [authentication API](auth-api.md).

Internal calls to another plugin use its services or events directly. Public pages do not require personal tokens. Payment webhooks and KraftLink access keep their own protocols.
