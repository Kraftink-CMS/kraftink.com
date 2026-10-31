# Déclarer des permissions API

Un plugin peut déclarer les données et actions qu’un membre pourra déléguer à une application. Le noyau gère les jetons, leur durée, la révocation et les contrôles du compte ; le plugin conserve ses routes et ses règles métier.

## Quand faut-il une permission API ?

Une page publique, une recherche publique ou un classement public n’a pas besoin d’un jeton personnel. Un plugin exécuté dans KraftInk appelle directement les services et événements disponibles ; il ne crée pas un jeton pour communiquer avec un autre plugin.

Une application extérieure a besoin d’une permission API lorsqu’elle consulte des données privées ou agit pour un compte : launcher lisant ses identités de jeu, application affichant ses tickets, bot consultant les données d’un compte dédié. Les identifiants des prestataires de paiement, les webhooks signés et les accès KraftLink restent des protocoles distincts.

Les droits effectifs sont l’intersection de trois ensembles : **les permissions actuelles du compte, les scopes sélectionnés sur le jeton, et les fonctionnalités des extensions actives**. Un scope ne crée jamais un rôle administrateur et n’autorise pas à consulter une ressource appartenant à un autre membre.

## Déclarer un scope

Depuis `boot()` du fournisseur du plugin :

```php
app(\App\Kraft\Auth\ApiScopes::class)->register(
    owner: 'example',
    id: 'example:documents:read',
    label: 'example::api.documents_label',
    description: 'example::api.documents_description',
    permissions: ['example.view'],
);
```

Le nom commence par l’identifiant propriétaire suivi de `:`. Les déclarations utilisent des clés de traduction du plugin et au moins une permission du compte. Si plusieurs permissions sont indiquées, elles sont toutes exigées. Deux déclarations identiques sont acceptées ; une déclaration différente ne peut pas remplacer le même identifiant.

Le registre est partagé dans le processus mais ne mémorise aucun utilisateur ni décision d’autorisation. `all()` fournit les déclarations des paquets actifs, `availableTo($user)` les scopes que le compte peut déléguer, `allows($user, $scope)` leur disponibilité actuelle. Une extension absente, désactivée, incompatible, en quarantaine ou suspendue par le mode sûr ne peut plus autoriser son scope.

Un scope de plugin est utilisable par les comptes techniques sauf si sa déclaration précise `serviceAccounts: false`. Réservez cette option aux opérations qui exigent réellement une identité humaine. Les trois scopes natifs de profil, d’e-mail et d’identités de jeu restent personnels. Les comptes techniques vérifient leur propre identité avec `GET /api/auth/token`.

Les scopes natifs `site:news:read` et `site:servers:read` permettent déjà de connecter un bot d’annonces ou un outil de supervision sans plugin supplémentaire. Leurs routes `/api/site/news` et `/api/site/servers` conservent la sélection publique et les filtres des API publiques existantes.

Le compte technique conserve uniquement sa liste de scopes approuvés. Le noyau déduit leurs permissions métier depuis le même registre, sans créer de rang ou une seconde liste d’autorisations. Le jeton restreint encore cette enveloppe et les contrôleurs gardent leurs règles de propriété et de visibilité. Si deux scopes partagent une permission, l’approbation du premier ne rend pas le second disponible.

`$request->user()` reste un modèle `User`, y compris pour une identité technique. Utilisez `isServiceAccount()` lorsqu’une opération exige une personne et `User::members()` dans les annuaires et sélecteurs de membres. Une identité technique peut ne posséder ni e-mail, ni mot de passe, ni profil de jeu. Ses requêtes API ne lui ouvrent aucune session sur le site.

Ne changez pas la portée métier d’un scope existant pour ajouter des opérations plus larges. Déclarez un nouvel identifiant et faites approuver ce droit explicitement.

## Protéger une route

Le plugin charge son propre fichier de routes API depuis son fournisseur. Son groupe doit inclure les middlewares `api`, `ApiAvailability`, `AuthenticateApiToken` avec le scope exact, sa permission métier et une limitation de débit :

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

Le contrôleur utilise `$request->user()` et applique ses règles de propriété, visibilité, langue et publication. Une permission `read` ne doit pas couvrir une écriture. Déclarer un scope ne génère pas d’endpoint.

Les jetons personnels continuent de respecter les règles de connexion locale, de vérification d’e-mail, de suspension et du jeu choisi. Les comptes sans connexion locale autorisée ne peuvent pas créer ces accès personnels. Les identités techniques suivent leur propre état administré et leur enveloppe de scopes, avec le même stockage de jetons et les mêmes protections de révocation et d’expiration.

## Exemple fourni : Support

Support déclare `support:tickets:read`, lié à `support.view`, et fournit :

| Route | Contenu |
| --- | --- |
| `GET /api/support/tickets` | Tickets du titulaire du jeton |
| `GET /api/support/tickets/{id}` | Ticket personnel et ses messages non internes |

`page` commence à 1 et `per_page` accepte de 1 à 50, avec 20 par défaut. Même un compte administrateur utilisant ce scope personnel ne peut pas lire les tickets d’un autre membre. Les notes internes, contenus supprimés et chemins des pièces jointes sont exclus. Aucun droit d’écriture ou de gestion du support n’est délégué par ce scope.

## Accorder un accès à une application

1. Le propriétaire active **Connexion des applications** dans `/admin/settings/api` et fixe la durée maximale.
2. Pour une application agissant au nom d’un membre, il attribue au compte les permissions métier nécessaires via les rangs. Pour un bot indépendant, il crée un [compte technique](service-accounts.md) et choisit directement ses scopes depuis l’administration.
3. Le titulaire ouvre `/account/tokens`, choisit un nom, les seuls scopes nécessaires et une durée, puis confirme son mot de passe et sa 2FA lorsqu’elle est active.
4. Il copie le secret affiché une seule fois dans le stockage privé de l’application. La réponse contenant le secret n’est pas mise en cache et le secret n’est pas conservé en clair dans la base ou la session.
5. L’application envoie `Authorization: Bearer <jeton>` sous HTTPS. Elle traite les refus sans réutiliser une autorisation locale périmée.

Le compte peut révoquer un jeton précis ou tous ses jetons, sans ressaisir ses identifiants. Retirer une permission au compte bloque immédiatement les endpoints correspondants. Une rotation conserve l’échéance et retire les scopes devenus indisponibles ; elle n’ajoute jamais de droits.

Une application disposant de son propre écran de connexion peut aussi obtenir un jeton via [l’API d’authentification](auth-api.md). Ce parcours exige les identifiants du membre et sa 2FA ; aucun flux de consentement OAuth2 ou jeton sans compte n’est implicite.
