# Interface integration

Plugins and themes use CMS insertion points and components for menus, forms and content. Layouts load Bootstrap, TinyMCE and AJAX handlers.

## Menus and blocks

Declare links in `manifest.navigation.public`, `admin` or `footer`. An entry provides a translation key `label`, a GET `route` without required parameters and, when needed, a `permission`:

```json
"navigation": {
    "admin": [{
        "label": "example::messages.title",
        "route": "plugins.example.admin.documents.index",
        "permission": "example.manage",
        "icon": "file-earmark"
    }]
}
```

In the panel menu, replace `permission` with `permissions` to show the link with either of two permissions declared by your plugin:

```json
{
    "label": "example::messages.title",
    "route": "plugins.example.admin.documents.index",
    "permissions": ["example.manage", "example.moderate"]
}
```

This list uses an **OR** condition without requiring both permissions. It controls link visibility. Routes and actions retain their own access checks.

`children` groups entries. `parent` targets a panel group: `content` for content, `presentation` for appearance, `members` for members, `servers` for games and servers, or `settings`, `security`, `integrations`, `operations` and `deployment` for administration. Without a `parent` field, entries join the extension tools.

With `parent: null`, the link appears directly in the section chosen by `section`: `site`, `community` or `administration`. `position` sets its order in the group or section. Native entries are spaced by 100, allowing a contribution between two links.

To add a block without overriding a view, register a slot from the provider:

```php
app(\App\Kraft\Extensions\SlotRegistry::class)->add(
    owner: 'example',
    slot: 'admin.dashboard.metrics',
    id: 'summary',
    render: fn (array $context) => view('example::admin.dashboard.partials.summary'),
    permission: 'example.manage',
    priority: 20,
);
```

`owner` is the package identifier. Permissions are checked before rendering. Common slots include `admin.dashboard.metrics`, `admin.dashboard.activity`, `admin.page.before/after`, `site.page.before/after`, `site.home.before/after` and `account.sections`. The account provides `user`, the homepage `news`, and dashboard slots `stats` or `logs` as applicable.

A theme can define a slot with `<x-extensions.slot name="example.area" :context="['record' => $record]">Fallback</x-extensions.slot>`. Modes `before`, `after` and `replace` position contributions relative to the fallback. Rendering failures preserve the rest of the page.

Use [widgets](plugin-widgets.md) for blocks the owner can place, configure and reorder in the panel. Use slots for fixed contributions.

## Configurable icons

On versions of KraftInk that support [theme icon libraries](developpement-themes.md#icon-library), use the panel picker in your forms.

```blade
<x-admin::icon-picker id="category-icon" name="icon"
    :label="__('example::messages.icon')" :value="old('icon', $category?->icon)" />
```

Validate the key with `App\Kraft\ContentIcons::validName()`. It starts with a lowercase letter or digit and accepts lowercase letters, digits and hyphens, up to 60 characters. Keep saved keys when the active theme’s catalogue changes. Render the icon with `<x-content-icon :name="$category->icon" />` to use the same catalogue and Bootstrap Icons fallback.

## AJAX forms

Add `data-ajax="true"` to a POST form while retaining its Laravel action and CSRF token:

```blade
<form method="post" action="{{ route('plugins.example.admin.settings.update') }}" data-ajax="true">
    @csrf
    <div data-ajax-messages hidden></div>
    <input class="form-control" name="title" required>
    <button class="btn btn-primary" type="submit">{{ __('common.actions.save') }}</button>
</form>
```

The handler synchronizes editors, sends files using `FormData` and displays validation errors beside fields. The form still works without JavaScript.

| Attribute | Effect |
| --- | --- |
| `data-redirect-url="response"` | Follow the response destination |
| `data-redirect-url="/account"` | Navigate to this same-origin URL |
| `data-redirect-url="false"` | Remain on the page, the default |
| `data-success-callback="example.saved"` | Call a global function after success |
| `data-reset="true"` | Reset fields and editors |
| `data-message-target="#feedback"` | Choose a feedback container |
| `data-success-message="false"` | Hide success messages, including after a redirect, while keeping errors and warnings |

Use `data-success-message="false"` when the new state already confirms the result, such as a read notification, reaction, follow or move. Success events, callbacks and navigation remain active.

Middleware adapts ordinary Laravel redirects and flash messages. Explicit JSON uses `{"success": true, "data": {"message": "...", "redirect_url": "..."}}`. Failures retain their HTTP status and include `data.errors`. A callback receives `(data, form, submitter)` and can return `false` to cancel navigation. Events `ajax:success`, `ajax:error` and `ajax:complete` are available.

Use `KraftForms.submit(form, submitter)` for programmatic submission. Navigate after creation/deletion or when a page must display a newly generated secret. External payments, OAuth, downloads and operations with dedicated progress handling retain their own flows.

In an admin form, add `data-option-filter="locale"` to a select that depends on a field named `locale` in the same form. Give each option its matching value with `data-option-group`, for example `data-option-group="en"`. The select keeps the empty option, hides incompatible options and clears an incompatible selection. Validate the choice on the server as well.

## AJAX tables

Use `App\Kraft\System\TableQuery`, `<x-tables.controls>` and a `data-ajax-pagination data-table` region for search, sorting and pagination. The [table guide](tables.md) covers filters, page size and multiple tables, using the theme's styles and shared JavaScript.

## Image API

For images your plugin stores itself, pass the request’s `UploadedFile` to `App\Kraft\Media\Images::prepareUpload()` before saving it. The service checks the format and applies metadata cleaning when available. Use `validateUpload()` first to apply your own limits. `maxBytes` is expressed in bytes and `maxPixels` limits the total number of pixels.

```php
$file = $request->validate(['image' => ['required', 'file']])['image'];
$images = app(\App\Kraft\Media\Images::class);
$inspection = $images->validateUpload($file, maxBytes: 2 * 1024 * 1024, field: 'image');
$image = $images->prepareUpload($file, $inspection, field: 'image');
```

The returned `ImageFile` describes the cleaned file with `mime`, `extension`, `width`, `height` and `size`. Copy the file from `path` to your plugin’s storage before the request ends. To deduplicate files, calculate their hash with `sha256()` after preparation. Your plugin defines permissions and chooses where to store its files.

`inspect()` describes an existing or temporary file without changing it and returns `null` if the format is unknown or the image cannot be read. `supportedMimeTypes()` lists the types the service accepts.

To add an image to the public media library, call `App\Kraft\Media\MediaLibrary::store($file, $ownerId)` directly. For restricted content, follow the [private image workflow](#editors-and-private-images). These services already prepare uploads.

## Editors and private images

`data-editor="tinymce"` enables the rich editor. Clean HTML with `App\Kraft\Html::clean`. Restricted content must supply a private upload route through `data-editor-upload-url`. The shared media library creates public files.

`App\Kraft\Media\PrivateEditorImages` receives an `EditorImageScope` defined by your package. Supply `id`, Eloquent classes `imageModel`, `usageModel` and `resourceModel`, then `route`, `permission` and the `visible` callback. The scope derives tables from the models. `visible` returns an Eloquent query for resources accessible to the member.

The package owns these tables and migrations. Images retain UUID `id`, nullable `uploader_id`, `path`, `hash`, `original_name`, `mime`, `size`, `width`, `height` and timestamps. Usages associate `resource_id`, `image_id` and `active`, with a unique pair and foreign keys. The visibility query must apply your language, publication and permission rules.

Integration follows this lifecycle:

1. Validate `file`, authentication, permission and rate limits, then call `store($user, $file)`. Return `location` using `url($image)`.
2. After cleaning HTML, call `attach($resourceId, $body, $actor)` inside the transaction saving the content and its revision.
3. Serve reads using `response($id, $user)`, which checks usages and the supplied access query.
4. Schedule `cleanup()` and call `anonymizeUser($id)` from the privacy handler.

Preserve historical usages for revision restores. Restoration fails if a required file is missing. Private paths must never become public URLs.

## Local dates

Store dates in UTC. Use the component for local input and normalize before validation:

```blade
<x-forms.local-datetime name="published_at" :value="$entry?->published_at" />
```

```php
app(\App\Kraft\SiteDates::class)->normalize($request, ['published_at']);
```

The component handles the site timezone and the `earlier/later` choice for ambiguous times. The normalizer only converts declared fields accompanied by its marker. `format()` displays local time, while `iso()` retains machine-readable UTC. Do not convert API dates already in UTC again.

## Page metadata

Register destinations in `boot()` through `App\Events\CollectingSeoPages` to offer their patterns in the panel:

```php
Event::listen(CollectingSeoPages::class, function (CollectingSeoPages $event): void {
    $event->add(
        'plugins.example.public.products.show',
        __('example::messages.seo.product'),
        ['product_name' => __('example::messages.seo.product_name')],
        defaults: ['title' => '{product_name}'],
    );
});
```

Import the event and `Illuminate\Support\Facades\Event`. `add()` takes the route, label, variables, optional alternative routes and defaults. Register lists and details separately. Routes are public and accept GET.

Supply rendering data from the controller:

```php
return view('example::default.products.show', [
    'product' => $product,
    'seo' => [
        'title' => $product->name,
        'excerpt' => $product->description,
    ],
    'seoVariables' => [
        'product_name' => $product->name,
    ],
]);
```

Pass raw values. Use `excerpt` for a summary or `description` for the full description. Declare variables to shorten with the `excerptVariables` argument to `add()`. Set `seo['page_parameter']` when pagination uses a parameter other than `page`. Pages with multiple paginated lists can pass their parameter names as an array.

Use the same visibility rule for the controller, language links and `CollectingSitemapEntries`. Use `App\Http\Middleware\NoIndex` for a route that is always excluded. For restricted content on a public route, pass `App\Kraft\Site\Seo::NO_INDEX` in `seo['robots']`. The CMS renders public URLs from `seo['alternates']`, keyed by locale, and structured data from the `seo['structured_data']` PHP array.
