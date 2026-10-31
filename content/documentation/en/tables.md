# Interactive tables

`TableQuery` and CMS Blade components provide search, sorting and pagination using JavaScript already loaded by the layouts.

## Query and rendering

Apply access rules and business filters before pagination:

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

`sorts` maps public keys to allowed columns and `search` defines searchable columns. Without a selected sort, the original order applies. For database data, keep a query instead of loading the entire collection.

Give the AJAX region a unique identifier and keep controls with the table:

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

`data-table-sort` uses a key from `sorts`. `<x-tables.controls>` displays search. `$documents->links()` produces the count, page size choice and pagination. Render it even for a single page or no results.

Page sizes offer 10, 25, 50 or 100 rows. `perPage` changes the initial size. Filters and search return to the first page. Without JavaScript, GET forms and pagination links remain usable.

## Forms and multiple tables

Search and page size controls generate GET forms. If the table is already inside a business form, disable their nested forms:

```blade
<x-tables.controls :paginator="$documents" :form="false" />
{{ $documents->links(data: ['tableForm' => false]) }}
```

This mode requires JavaScript. Put page-specific filters in a GET form inside the region, or connect an external form through `data-ajax-pagination-form="example-documents"`.

Each table has its own region identifier and `pageName`. For `documents_page`, parameters are `documents_page`, `documents_page_per_page`, `documents_page_search`, `documents_page_sort` and `documents_page_direction`. Other tables use different names.

## Theme styling

Keep `data-*` attributes, filter names and layout stacks. Main selectors are `[data-table]`, `.kraft-table-controls`, `.kraft-table-footer`, `[data-table-sort]`, `.table`, `.pagination` and `.page-link`. Row actions keep their Blade forms and permissions.
