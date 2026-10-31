# Tableaux interactifs

`TableQuery` et les composants Blade du CMS fournissent recherche, tri et pagination avec le JavaScript déjà chargé par les layouts.

## Requête et rendu

Appliquez les droits et filtres métier avant la pagination :

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

`sorts` associe les clés publiques aux colonnes autorisées et `search` définit les colonnes recherchables. Sans tri choisi, l’ordre initial reste utilisé. Pour les données en base, conservez une requête plutôt que de charger toute la collection.

Donnez un identifiant unique à la région AJAX et gardez les contrôles avec le tableau :

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

`data-table-sort` utilise une clé de `sorts`. `<x-tables.controls>` affiche la recherche. `$documents->links()` produit le compteur, le choix du nombre de lignes et la pagination. Affichez-le même avec une seule page ou aucun résultat.

Le choix de taille propose 10, 25, 50 ou 100 lignes. `perPage` change la taille initiale. Les filtres et la recherche reviennent à la première page. Sans JavaScript, les formulaires GET et liens de pagination restent utilisables.

## Formulaires et plusieurs tableaux

La recherche et le choix de taille génèrent des formulaires GET. Si le tableau est déjà dans un formulaire métier, désactivez leurs formulaires imbriqués :

```blade
<x-tables.controls :paginator="$documents" :form="false" />
{{ $documents->links(data: ['tableForm' => false]) }}
```

Ce mode demande JavaScript. Les filtres propres à la page vont dans un formulaire GET de la région, ou dans un formulaire extérieur relié par `data-ajax-pagination-form="example-documents"`.

Chaque tableau possède son identifiant de région et son `pageName`. Pour `documents_page`, les paramètres sont `documents_page`, `documents_page_per_page`, `documents_page_search`, `documents_page_sort` et `documents_page_direction`. Un autre tableau utilise d’autres noms.

## Habillage du thème

Conservez les attributs `data-*`, les noms des filtres et les piles du layout. Les sélecteurs principaux sont `[data-table]`, `.kraft-table-controls`, `.kraft-table-footer`, `[data-table-sort]`, `.table`, `.pagination` et `.page-link`. Les actions des lignes gardent leurs formulaires et permissions Blade.
