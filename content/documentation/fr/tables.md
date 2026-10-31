# Tableaux interactifs

La bibliothèque `tables.js`, chargée par `resources/js/app.js`, ajoute recherche, tri et pagination AJAX aux tableaux Blade du CMS et des plugins. Vous pouvez l’utiliser sans script propre à la page ni dépendance jQuery.

Le serveur fournit les lignes de la page courante avec leur rendu Blade, leurs permissions et leurs formulaires. Réservez ces contrôles aux listes qui en ont besoin : un résumé, un reçu ou une liste hiérarchique peut garder une présentation simple.

## Préparer la requête

Dans le contrôleur, appliquez d’abord les règles d’accès, les filtres métier et l’ordre par défaut, puis appelez `TableQuery::paginate()` :

```php
use App\Kraft\System\TableQuery;

$documents = TableQuery::paginate(
    Document::query()
        ->where('owner_id', $request->user()->id)
        ->latest(),
    sorts: ['title' => 'title', 'updated' => 'updated_at'],
    pageName: 'documents_page',
    search: ['title'],
);

return view('example::admin.documents.index', compact('documents'));
```

`sorts` associe les clés de tri publiques aux colonnes autorisées. La forme `['title', 'updated_at']` utilise les mêmes noms pour les clés et les colonnes. Seules les colonnes déclarées sont triables. Sans choix du visiteur, l’ordre initial de la requête s’applique.

`search` déclare les colonnes recherchables. Laissez la liste vide pour désactiver la recherche et excluez tout champ confidentiel. La recherche respecte le périmètre de la requête et traite `%` et `_` comme du texte. Vous pouvez la compléter avec les filtres propres à la page.

Le helper accepte une requête, une relation Eloquent, une collection ou un tableau. Pour une collection, les colonnes désignent les propriétés ou leurs chemins imbriqués. Le tri et la recherche précèdent la pagination. Pour des données en base, conservez une requête jusqu’à cet appel afin de limiter le chargement.

La taille initiale est de 10 lignes. Passez par exemple `perPage: 50` pour la modifier sur un tableau.

Le visiteur peut choisir 10, 25, 50 ou 100 lignes, ainsi que la taille initiale si elle diffère, dans la limite de 100. Une valeur invalide conserve la taille initiale. Après filtrage, une page inexistante revient à la dernière page disponible.

## Déclarer le tableau

Donnez un identifiant unique à la région AJAX. Placez la recherche et les filtres au-dessus des lignes, puis les contrôles de pagination dans le pied de la même carte. Le choix du nombre de lignes et le compteur s’affichent à gauche, la navigation à droite, avec une disposition adaptée aux petits écrans.

Le composant de recherche et les liens du paginator appartiennent à cette même région :

```blade
<div id="example-documents" data-ajax-pagination data-table tabindex="-1" class="vstack gap-4">
    <section class="card">
        @if (\App\Kraft\System\TableQuery::options($documents)['searchable'])
            <div class="card-body">
                <x-tables.controls :paginator="$documents" />
            </div>
        @endif
        <div class="card-body p-0 table-responsive">
            <table class="table align-middle mb-0">
                <thead class="text-nowrap">
                    <tr>
                        <th scope="col" data-table-sort="title">{{ __('example::messages.documents.title') }}</th>
                        <th scope="col" data-table-sort="updated">{{ __('example::messages.documents.updated') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($documents as $document)
                        <tr>
                            <td>{{ $document->title }}</td>
                            <td>{{ app(\App\Kraft\SiteDates::class)->format($document->updated_at) }}</td>
                        </tr>
                    @empty
                        <x-tables.empty colspan="2" :message="__('example::messages.documents.empty')" />
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="card-footer">
            {{ $documents->links() }}
        </div>
    </section>
</div>
```

`data-table-sort` active le tri d’un en-tête avec une clé déclarée dans `sorts` et un état accessible. Gardez les colonnes d’actions sans cet attribut et conservez les routes et protections habituelles du plugin.

`x-tables.controls` affiche la recherche si des colonnes sont déclarées. La condition de l’exemple évite alors un corps de carte vide. Conservez ce corps s’il contient aussi des filtres métier.

`$documents->links()` génère les contrôles des paginators `TableQuery`. Placez cet appel dans le `card-footer`, après le conteneur de défilement, sans condition `hasPages()` : le compteur et le choix de taille restent utiles avec une seule page ou aucun résultat. Pour une table de référence déjà intégrée dans un corps de carte, gardez les contrôles dans ce contexte sans ajouter de pied imbriqué.

La recherche et le choix de taille utilisent chacun un formulaire GET. Placez-les hors de tout autre formulaire. Si la région appartient déjà à un formulaire de modification, désactivez ces deux formulaires :

```blade
<x-tables.controls :paginator="$documents" :form="false" />
{{ $documents->links(data: ['tableForm' => false]) }}
```

Les contrôles sont alors actionnés en JavaScript sans soumettre le formulaire métier ni lui ajouter les paramètres du tableau.

Placez les filtres métier dans un formulaire GET de la région, ou reliez un formulaire extérieur avec `data-ajax-pagination-form="example-documents"`. La recherche et le choix de taille reviennent à la première page. Les formulaires POST, protections CSRF, modales et confirmations de suppression gardent leur fonctionnement.

Les champs texte actualisent les résultats après un court délai de saisie. Les listes, dates et cases à cocher agissent dès leur modification. Pour un filtre personnalisé, placez le bouton GET dans `noscript` afin de le proposer uniquement sans JavaScript.

Sans JavaScript, les formulaires GET, leurs boutons de secours et les liens de pagination restent utilisables. Les contrôles de tri automatiques et le mode `form="false"` nécessitent JavaScript.

## Plusieurs tableaux sur une page

Donnez à chaque paginator un nom différent et à chaque région son propre identifiant. Pour `pageName: 'documents_page'`, les paramètres sont :

| Paramètre | Valeur |
| --- | --- |
| `documents_page` | Numéro de page |
| `documents_page_per_page` | Nombre de lignes |
| `documents_page_search` | Recherche commune |
| `documents_page_sort` | Clé publique de tri |
| `documents_page_direction` | `asc` ou `desc` |

Les autres paramètres sont conservés : `history_page` reste indépendant de `documents_page`, y compris dans un autre onglet. Gardez les liens dans leur région et les mêmes noms lors d’une surcharge de thème.

## Personnaliser un thème

Chargez `resources/js/app.js` et conservez les piles `head` et `scripts`. Personnalisez les styles Bootstrap en gardant les filtres au-dessus des lignes et la pagination dans le pied commun. Les sélecteurs disponibles sont `[data-table]`, `.kraft-table-controls`, `.kraft-table-search`, `.kraft-table-footer`, `[data-table-sort]`, `.table`, `.pagination` et `.page-link`.

```scss
.theme-example [data-table] {
    .table {
        --bs-table-bg: var(--surface);
        --bs-table-color: var(--ink);
        --bs-table-border-color: var(--line);
        --bs-table-hover-bg: var(--soft);
    }

    .page-link {
        --bs-pagination-active-bg: var(--accent);
        --bs-pagination-active-border-color: var(--accent);
        --bs-pagination-active-color: var(--accent-ink);
    }
}
```

Une surcharge de vue conserve les attributs `data-*`, l’identifiant de région, les noms des filtres, les contrôles et les liens du paginator. Les actions restent rendues par Blade avec leurs permissions.
